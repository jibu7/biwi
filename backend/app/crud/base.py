from typing import Any, Dict, Generic, List, Optional, Type, TypeVar, Union
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from app.database.database import Base
from app.core.tenant_context import get_current_tenant_id
from app.core.platform_context import is_in_platform_admin_context, get_target_company

ModelType = TypeVar("ModelType", bound=Base)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)

class CRUDBase(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    def __init__(self, model: Type[ModelType]):
        """
        CRUD object with tenant isolation.
        
        Args:
            model: The SQLAlchemy model class
        """
        self.model = model
        self.has_company_id = hasattr(model, "company_id")
    
    def _get_effective_company_id(self) -> Optional[int]:
        """Get the effective company ID for queries."""
        if is_in_platform_admin_context():
            # Platform admin can specify target company
            target_company = get_target_company()
            if target_company:
                return target_company
            # If no target company specified, platform admin can see all
            return None
        else:
            # Regular users can only see their company's data
            return get_current_tenant_id()
    
    def _apply_tenant_filter(self, query):
        """Apply tenant filtering to a query."""
        if not self.has_company_id:
            return query
        
        company_id = self._get_effective_company_id()
        if company_id is not None:
            query = query.filter(self.model.company_id == company_id)
        
        return query
    
    def get(self, db: Session, id: Any) -> Optional[ModelType]:
        """Get a record by ID, respecting tenant isolation."""
        query = db.query(self.model).filter(self.model.id == id)
        query = self._apply_tenant_filter(query)
        return query.first()
    
    def get_multi(
        self, db: Session, *, skip: int = 0, limit: int = 100
    ) -> List[ModelType]:
        """Get multiple records, respecting tenant isolation."""
        query = db.query(self.model)
        query = self._apply_tenant_filter(query)
        return query.offset(skip).limit(limit).all()
    
    def create(self, db: Session, *, obj_in: CreateSchemaType) -> ModelType:
        """Create new record with tenant ID."""
        obj_in_data = jsonable_encoder(obj_in)
        db_obj = self.model(**obj_in_data)
        
        # Add company_id if model has it and it's not already set
        if self.has_company_id and not getattr(db_obj, "company_id", None):
            tenant_id = get_current_tenant_id()
            if is_in_platform_admin_context():
                # Platform admin must specify target company for creation
                target_company = get_target_company()
                if not target_company:
                    raise ValueError("Platform admin must specify target company for creation")
                tenant_id = target_company
            
            if tenant_id:
                db_obj.company_id = tenant_id
            else:
                raise ValueError("No tenant context available for record creation")
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def update(
        self,
        db: Session,
        *,
        db_obj: ModelType,
        obj_in: Union[UpdateSchemaType, Dict[str, Any]]
    ) -> ModelType:
        """Update a record, ensuring it belongs to accessible tenant."""
        # Check tenant isolation
        if self.has_company_id:
            effective_company_id = self._get_effective_company_id()
            
            # If platform admin without target company, they can update any record
            # Otherwise, ensure record belongs to accessible tenant
            if effective_company_id is not None and db_obj.company_id != effective_company_id:
                raise ValueError("Cannot update object from different tenant")
        
        # Update object
        obj_data = jsonable_encoder(db_obj)
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.dict(exclude_unset=True)
        
        # Prevent company_id modification to different tenant
        if "company_id" in update_data and self.has_company_id:
            new_company_id = update_data["company_id"]
            effective_company_id = self._get_effective_company_id()
            
            if effective_company_id is not None and new_company_id != effective_company_id:
                raise ValueError("Cannot change company_id to different tenant")
        
        # Apply updates
        for field in obj_data:
            if field in update_data:
                setattr(db_obj, field, update_data[field])
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def remove(self, db: Session, *, id: int) -> Optional[ModelType]:
        """Delete a record, ensuring it belongs to accessible tenant."""
        obj = self.get(db, id=id)
        if not obj:
            return None
        
        # Check tenant isolation for deletion
        if self.has_company_id:
            effective_company_id = self._get_effective_company_id()
            
            if effective_company_id is not None and obj.company_id != effective_company_id:
                raise ValueError("Cannot delete object from different tenant")
        
        db.delete(obj)
        db.commit()
        return obj
    
    def exists(self, db: Session, *, id: int) -> bool:
        """Check if a record exists, respecting tenant isolation."""
        query = db.query(self.model).filter(self.model.id == id)
        query = self._apply_tenant_filter(query)
        return db.query(query.exists()).scalar()
    
    def count(self, db: Session) -> int:
        """Count records, respecting tenant isolation."""
        query = db.query(self.model)
        query = self._apply_tenant_filter(query)
        return query.count()
    
    def get_by_field(
        self, db: Session, *, field: str, value: Any
    ) -> Optional[ModelType]:
        """Get record by arbitrary field, respecting tenant isolation."""
        query = db.query(self.model).filter(getattr(self.model, field) == value)
        query = self._apply_tenant_filter(query)
        return query.first()
    
    def get_multi_by_filter(
        self, db: Session, *, filters: Dict[str, Any], skip: int = 0, limit: int = 100
    ) -> List[ModelType]:
        """Get records by multiple filters, respecting tenant isolation."""
        query = db.query(self.model)
        
        # Apply provided filters
        for field, value in filters.items():
            if hasattr(self.model, field):
                query = query.filter(getattr(self.model, field) == value)
        
        # Apply tenant filtering
        query = self._apply_tenant_filter(query)
        
        return query.offset(skip).limit(limit).all()
    
    def get_by_company(
        self, db: Session, *, company_id: int, skip: int = 0, limit: int = 100
    ) -> List[ModelType]:
        """Get records for a specific company (platform admin only)."""
        if not is_in_platform_admin_context():
            raise ValueError("Only platform admins can query by specific company")
        
        if not self.has_company_id:
            raise ValueError("Model does not support company filtering")
        
        query = db.query(self.model).filter(self.model.company_id == company_id)
        return query.offset(skip).limit(limit).all()
