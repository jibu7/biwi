from typing import TypeVar, Generic, Type, List, Optional, Any
from sqlalchemy.orm import Session
from sqlalchemy.ext.declarative import DeclarativeMeta
from app.core.tenant_context import get_current_tenant_id, require_tenant
from fastapi import HTTPException

ModelType = TypeVar("ModelType", bound=DeclarativeMeta)

class TenantAwareRepository(Generic[ModelType]):
    """Base repository class that enforces tenant isolation"""
    
    model: Type[ModelType] = None
    
    def __init__(self, db: Session):
        self.db = db
        if self.model is None:
            raise ValueError("Model must be defined in repository class")
    
    def _get_tenant_id(self) -> int:
        """Get current tenant ID, raising exception if not set"""
        return require_tenant()
    
    def _apply_tenant_filter(self, query):
        """Apply tenant filter to query if model has company_id"""
        if hasattr(self.model, 'company_id'):
            tenant_id = self._get_tenant_id()
            return query.filter(self.model.company_id == tenant_id)
        return query
    
    def get_all(self, skip: int = 0, limit: int = 100) -> List[ModelType]:
        """Get all records for current tenant"""
        query = self.db.query(self.model)
        query = self._apply_tenant_filter(query)
        return query.offset(skip).limit(limit).all()
    
    def get_by_id(self, id: Any) -> Optional[ModelType]:
        """Get record by ID for current tenant"""
        query = self.db.query(self.model).filter(self.model.id == id)
        query = self._apply_tenant_filter(query)
        return query.first()
    
    def create(self, obj_data: dict) -> ModelType:
        """Create new record with tenant isolation"""
        # Add company_id if model supports it
        if hasattr(self.model, 'company_id'):
            obj_data['company_id'] = self._get_tenant_id()
        
        db_obj = self.model(**obj_data)
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj
    
    def update(self, id: Any, update_data: dict) -> Optional[ModelType]:
        """Update record by ID for current tenant"""
        db_obj = self.get_by_id(id)
        if not db_obj:
            return None
        
        for field, value in update_data.items():
            if hasattr(db_obj, field):
                setattr(db_obj, field, value)
        
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj
    
    def delete(self, id: Any) -> bool:
        """Delete record by ID for current tenant"""
        db_obj = self.get_by_id(id)
        if not db_obj:
            return False
        
        self.db.delete(db_obj)
        self.db.commit()
        return True
    
    def count(self) -> int:
        """Count records for current tenant"""
        query = self.db.query(self.model)
        query = self._apply_tenant_filter(query)
        return query.count()
