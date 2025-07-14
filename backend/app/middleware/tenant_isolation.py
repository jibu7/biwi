from typing import Optional, Callable
from fastapi import Request, HTTPException, status
from sqlalchemy.orm import Session, Query
from sqlalchemy import event
from app.database.database import SessionLocal
from app.models import User, UserType, Company
import contextvars
import logging

logger = logging.getLogger(__name__)

# Context variable to store current tenant
current_tenant_id: contextvars.ContextVar[Optional[int]] = contextvars.ContextVar('current_tenant_id', default=None)

class TenantIsolationMiddleware:
    """Middleware to enforce tenant isolation"""
    
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            request = Request(scope, receive)
            
            # Extract tenant context from request
            tenant_id = await self._extract_tenant_context(request)
            if tenant_id:
                current_tenant_id.set(tenant_id)
            
            # Continue with the request
            await self.app(scope, receive, send)
        else:
            await self.app(scope, receive, send)
    
    async def _extract_tenant_context(self, request: Request) -> Optional[int]:
        """Extract tenant ID from request context"""
        try:
            # Skip tenant isolation for platform admin endpoints
            if request.url.path.startswith("/api/v1/platform"):
                return None
            
            # Skip for auth endpoints
            if request.url.path.startswith("/api/v1/auth"):
                return None
            
            # Try to get tenant ID from various sources
            tenant_id = None
            
            # 1. From X-Company-ID header
            if "X-Company-ID" in request.headers:
                tenant_id = int(request.headers["X-Company-ID"])
            
            # 2. From authorization token (if available)
            if not tenant_id and "authorization" in request.headers:
                tenant_id = await self._extract_tenant_from_token(request.headers["authorization"])
            
            # 3. Validate tenant exists and is active
            if tenant_id:
                db = SessionLocal()
                try:
                    company = db.query(Company).filter(
                        Company.id == tenant_id,
                        Company.is_active == True,
                        Company.is_deleted == False
                    ).first()
                    
                    if not company:
                        logger.warning(f"Invalid or inactive tenant ID: {tenant_id}")
                        return None
                    
                    return tenant_id
                finally:
                    db.close()
            
            return None
            
        except Exception as e:
            logger.error(f"Error extracting tenant context: {str(e)}")
            return None
    
    async def _extract_tenant_from_token(self, auth_header: str) -> Optional[int]:
        """Extract tenant ID from JWT token"""
        try:
            from app.core.security import decode_access_token
            
            token = auth_header.replace("Bearer ", "")
            payload = decode_access_token(token)
            
            # Check if it's an impersonation token
            if payload.get("is_impersonation"):
                return payload.get("company_id")
            
            # Regular token - get user's company
            user_id = payload.get("user_id")
            if user_id:
                db = SessionLocal()
                try:
                    user = db.query(User).filter(User.id == user_id).first()
                    if user and user.user_type != UserType.PLATFORM_ADMIN:
                        return user.company_id
                finally:
                    db.close()
            
            return None
            
        except Exception as e:
            logger.error(f"Error extracting tenant from token: {str(e)}")
            return None

def apply_tenant_filter(query: Query, model_class) -> Query:
    """Automatically apply tenant filter to queries"""
    tenant_id = current_tenant_id.get()
    
    if tenant_id and hasattr(model_class, 'company_id'):
        return query.filter(model_class.company_id == tenant_id)
    
    return query

def validate_tenant_access(obj, tenant_id: int):
    """Validate that an object belongs to the current tenant"""
    current_tenant = current_tenant_id.get()
    
    if current_tenant is None:
        # No tenant context - allow access (for platform admins)
        return True
    
    if hasattr(obj, 'company_id'):
        if obj.company_id != current_tenant:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Resource belongs to different tenant"
            )
    
    return True

# SQLAlchemy event listeners for automatic filtering
@event.listens_for(Session, "after_begin")
def receive_after_begin(session, transaction, connection):
    """Set session-level tenant context"""
    tenant_id = current_tenant_id.get()
    if tenant_id:
        # Set a session-level variable for tenant filtering
        connection.execute(f"SET LOCAL app.current_tenant_id = '{tenant_id}'")

class TenantQueryMixin:
    """Mixin to add tenant filtering to SQLAlchemy queries"""
    
    @classmethod
    def query_for_tenant(cls, db: Session, tenant_id: Optional[int] = None):
        """Get query filtered by tenant"""
        if tenant_id is None:
            tenant_id = current_tenant_id.get()
        
        query = db.query(cls)
        
        if tenant_id and hasattr(cls, 'company_id'):
            query = query.filter(cls.company_id == tenant_id)
        
        return query
    
    @classmethod
    def get_by_id_for_tenant(cls, db: Session, obj_id: int, tenant_id: Optional[int] = None):
        """Get object by ID with tenant filtering"""
        if tenant_id is None:
            tenant_id = current_tenant_id.get()
        
        query = db.query(cls).filter(cls.id == obj_id)
        
        if tenant_id and hasattr(cls, 'company_id'):
            query = query.filter(cls.company_id == tenant_id)
        
        return query.first()
    
    def validate_tenant_access(self, tenant_id: Optional[int] = None):
        """Validate that this object belongs to the current tenant"""
        if tenant_id is None:
            tenant_id = current_tenant_id.get()
        
        if tenant_id and hasattr(self, 'company_id'):
            if self.company_id != tenant_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied: Resource belongs to different tenant"
                )
        
        return True

class TenantAwareQuery:
    """Helper class for tenant-aware database queries"""
    
    def __init__(self, db: Session):
        self.db = db
        self.tenant_id = current_tenant_id.get()
    
    def query(self, model_class):
        """Create a tenant-aware query"""
        query = self.db.query(model_class)
        
        if self.tenant_id and hasattr(model_class, 'company_id'):
            query = query.filter(model_class.company_id == self.tenant_id)
        
        return query
    
    def get_by_id(self, model_class, obj_id: int):
        """Get object by ID with tenant filtering"""
        query = self.db.query(model_class).filter(model_class.id == obj_id)
        
        if self.tenant_id and hasattr(model_class, 'company_id'):
            query = query.filter(model_class.company_id == self.tenant_id)
        
        return query.first()
    
    def create(self, model_class, **kwargs):
        """Create object with tenant ID automatically set"""
        if self.tenant_id and hasattr(model_class, 'company_id'):
            kwargs['company_id'] = self.tenant_id
        
        obj = model_class(**kwargs)
        self.db.add(obj)
        return obj
    
    def bulk_create(self, model_class, objects_data: list):
        """Create multiple objects with tenant ID automatically set"""
        objects = []
        for obj_data in objects_data:
            if self.tenant_id and hasattr(model_class, 'company_id'):
                obj_data['company_id'] = self.tenant_id
            
            obj = model_class(**obj_data)
            objects.append(obj)
        
        self.db.add_all(objects)
        return objects

def get_tenant_aware_query(db: Session) -> TenantAwareQuery:
    """Get a tenant-aware query helper"""
    return TenantAwareQuery(db)

def require_tenant_context():
    """Decorator to require tenant context for endpoint"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            tenant_id = current_tenant_id.get()
            if tenant_id is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Tenant context required"
                )
            return func(*args, **kwargs)
        return wrapper
    return decorator

def bypass_tenant_isolation():
    """Context manager to temporarily bypass tenant isolation"""
    class TenantBypass:
        def __enter__(self):
            self.original_tenant = current_tenant_id.get()
            current_tenant_id.set(None)
            return self
        
        def __exit__(self, exc_type, exc_val, exc_tb):
            current_tenant_id.set(self.original_tenant)
    
    return TenantBypass()

# Database security policies (to be applied at database level)
def generate_rls_policies():
    """Generate Row Level Security policies for PostgreSQL"""
    return """
    -- Enable RLS on all tenant tables
    ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
    ALTER TABLE users ENABLE ROW LEVEL SECURITY;
    ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
    ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
    ALTER TABLE accounting_periods ENABLE ROW LEVEL SECURITY;
    
    -- Create security policies
    CREATE POLICY tenant_isolation_policy ON companies
        FOR ALL
        TO authenticated
        USING (
            id = COALESCE(
                NULLIF(current_setting('app.current_tenant_id', true), ''),
                id::text
            )::int
        );
    
    CREATE POLICY tenant_isolation_policy ON users
        FOR ALL
        TO authenticated
        USING (
            company_id = COALESCE(
                NULLIF(current_setting('app.current_tenant_id', true), ''),
                company_id::text
            )::int
            OR user_type = 'platform_admin'
        );
    
    CREATE POLICY tenant_isolation_policy ON roles
        FOR ALL
        TO authenticated
        USING (
            company_id = COALESCE(
                NULLIF(current_setting('app.current_tenant_id', true), ''),
                company_id::text
            )::int
        );
    
    CREATE POLICY tenant_isolation_policy ON user_roles
        FOR ALL
        TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM roles r 
                WHERE r.id = role_id 
                AND r.company_id = COALESCE(
                    NULLIF(current_setting('app.current_tenant_id', true), ''),
                    r.company_id::text
                )::int
            )
        );
    
    CREATE POLICY tenant_isolation_policy ON accounting_periods
        FOR ALL
        TO authenticated
        USING (
            company_id = COALESCE(
                NULLIF(current_setting('app.current_tenant_id', true), ''),
                company_id::text
            )::int
        );
    
    -- Function to validate foreign key references
    CREATE OR REPLACE FUNCTION validate_same_tenant_reference()
    RETURNS TRIGGER AS $$
    BEGIN
        -- Implementation depends on specific table relationships
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    
    -- Add triggers to validate references
    -- These would be added to tables with foreign key relationships
    """
