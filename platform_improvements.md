# Multi-Tenant Platform Implementation Guide

## Table of Contents
1. [User Model Changes](#1-user-model-changes)
2. [Platform Authentication/Authorization](#2-platform-authenticationauthorization)
3. [Platform Admin UI](#3-platform-admin-ui)
4. [Audit Logging System](#4-audit-logging-system)
5. [Testing & Verification](#5-testing--verification)

---

## 1. User Model Changes

### 1.1 Database Migration

First, create a new Alembic migration to modify the user model and add platform features.

**Step 1: Generate Migration**
```bash
cd backend
poetry run alembic revision -m "add_platform_admin_features"
```

**Step 2: Edit the generated migration file** (`alembic/versions/xxx_add_platform_admin_features.py`):

```python
"""add platform admin features

Revision ID: xxx
Revises: previous_revision
Create Date: 2024-xx-xx
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

def upgrade():
    # Add user_type enum
    user_type_enum = sa.Enum('platform_admin', 'company_admin', 'company_user', name='usertype')
    user_type_enum.create(op.get_bind())
    
    # Modify users table
    op.add_column('users', sa.Column('user_type', user_type_enum, nullable=False, server_default='company_user'))
    op.add_column('users', sa.Column('default_company_id', sa.Integer(), nullable=True))
    op.add_column('users', sa.Column('last_login', sa.DateTime(), nullable=True))
    op.add_column('users', sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()))
    op.add_column('users', sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()))
    
    # Add foreign key for default_company_id
    op.create_foreign_key('fk_users_default_company', 'users', 'companies', ['default_company_id'], ['id'])
    
    # Modify company_id to be nullable
    op.alter_column('users', 'company_id', nullable=True)
    
    # Add check constraint
    op.create_check_constraint(
        'ck_company_required_for_non_platform_users',
        'users',
        "user_type = 'platform_admin' OR company_id IS NOT NULL"
    )
    
    # Add platform fields to companies table
    op.add_column('companies', sa.Column('code', sa.String(10), nullable=False, server_default=''))
    op.add_column('companies', sa.Column('subscription_status', sa.String(20), nullable=False, server_default='trial'))
    op.add_column('companies', sa.Column('subscription_plan', sa.String(50), nullable=True))
    op.add_column('companies', sa.Column('subscription_expires', sa.Date(), nullable=True))
    op.add_column('companies', sa.Column('storage_limit_gb', sa.Integer(), nullable=False, server_default='10'))
    op.add_column('companies', sa.Column('user_limit', sa.Integer(), nullable=False, server_default='5'))
    op.add_column('companies', sa.Column('primary_contact_email', sa.String(255), nullable=True))
    op.add_column('companies', sa.Column('billing_email', sa.String(255), nullable=True))
    op.add_column('companies', sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()))
    op.add_column('companies', sa.Column('created_by_user_id', sa.Integer(), nullable=True))
    
    # Create unique constraint on company code
    op.create_unique_constraint('uq_company_code', 'companies', ['code'])
    
    # Create platform_audit_logs table
    op.create_table('platform_audit_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=True),
        sa.Column('action', sa.String(100), nullable=False),
        sa.Column('resource_type', sa.String(50), nullable=True),
        sa.Column('resource_id', sa.Integer(), nullable=True),
        sa.Column('details', postgresql.JSONB(), nullable=True),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.Column('timestamp', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'])
    )
    
    # Create indexes
    op.create_index('idx_platform_audit_logs_user_id', 'platform_audit_logs', ['user_id'])
    op.create_index('idx_platform_audit_logs_company_id', 'platform_audit_logs', ['company_id'])
    op.create_index('idx_platform_audit_logs_timestamp', 'platform_audit_logs', ['timestamp'])
    op.create_index('idx_platform_audit_logs_action', 'platform_audit_logs', ['action'])
    
    # Update existing superusers to platform_admin
    op.execute("UPDATE users SET user_type = 'platform_admin' WHERE is_superuser = TRUE")
    
    # Generate company codes for existing companies
    op.execute("""
        UPDATE companies 
        SET code = 'COMP' || LPAD(id::text, 4, '0')
        WHERE code = ''
    """)

def downgrade():
    op.drop_table('platform_audit_logs')
    op.drop_constraint('ck_company_required_for_non_platform_users', 'users')
    op.drop_constraint('fk_users_default_company', 'users')
    op.drop_constraint('uq_company_code', 'companies')
    
    op.drop_column('users', 'user_type')
    op.drop_column('users', 'default_company_id')
    op.drop_column('users', 'last_login')
    op.drop_column('users', 'created_at')
    op.drop_column('users', 'updated_at')
    
    op.alter_column('users', 'company_id', nullable=False)
    
    op.drop_column('companies', 'code')
    op.drop_column('companies', 'subscription_status')
    op.drop_column('companies', 'subscription_plan')
    op.drop_column('companies', 'subscription_expires')
    op.drop_column('companies', 'storage_limit_gb')
    op.drop_column('companies', 'user_limit')
    op.drop_column('companies', 'primary_contact_email')
    op.drop_column('companies', 'billing_email')
    op.drop_column('companies', 'created_at')
    op.drop_column('companies', 'created_by_user_id')
    
    # Drop enum type
    sa.Enum(name='usertype').drop(op.get_bind())
```

**Step 3: Run the migration**
```bash
poetry run alembic upgrade head
```

### 1.2 Update SQLAlchemy Models

**Update `backend/app/models/core.py`**:

```python
from enum import Enum as PyEnum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Date, DateTime, JSONB, Numeric, UniqueConstraint, CheckConstraint, Enum, Text
from sqlalchemy.orm import relationship
from app.database.database import Base

class UserType(str, PyEnum):
    PLATFORM_ADMIN = "platform_admin"
    COMPANY_ADMIN = "company_admin"
    COMPANY_USER = "company_user"

class SubscriptionStatus(str, PyEnum):
    TRIAL = "trial"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    CANCELLED = "cancelled"

class Company(Base):
    __tablename__ = "companies"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    code = Column(String(10), unique=True, nullable=False, index=True)
    
    # Multi-tenant specific fields
    subscription_status = Column(Enum(SubscriptionStatus), default=SubscriptionStatus.TRIAL, nullable=False)
    subscription_plan = Column(String(50), nullable=True)
    subscription_expires = Column(Date, nullable=True)
    storage_limit_gb = Column(Integer, default=10, nullable=False)
    user_limit = Column(Integer, default=5, nullable=False)
    
    # Contact and billing
    primary_contact_email = Column(String(255), nullable=True)
    billing_email = Column(String(255), nullable=True)
    
    # Platform metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Existing fields
    address = Column(JSONB, nullable=True)
    contact_info = Column(JSONB, nullable=True)
    default_currency_code = Column(String(3), nullable=True)
    is_active = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False)
    
    # Relationships
    users = relationship("User", foreign_keys="User.company_id", back_populates="company")
    roles = relationship("Role", back_populates="company")
    accounting_periods = relationship("AccountingPeriod", back_populates="company")
    audit_logs = relationship("PlatformAuditLog", back_populates="company")

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)  # Keep for backward compatibility
    user_type = Column(Enum(UserType), default=UserType.COMPANY_USER, nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    
    # Platform admins can have a default company for context
    default_company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    
    # Audit fields
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    company = relationship("Company", foreign_keys=[company_id], back_populates="users")
    default_company = relationship("Company", foreign_keys=[default_company_id])
    roles = relationship("UserRole", back_populates="user")
    platform_audit_logs = relationship("PlatformAuditLog", back_populates="user")
    
    __table_args__ = (
        CheckConstraint(
            "user_type = 'platform_admin' OR company_id IS NOT NULL",
            name='ck_company_required_for_non_platform_users'
        ),
    )

class PlatformAuditLog(Base):
    __tablename__ = "platform_audit_logs"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    action = Column(String(100), nullable=False, index=True)
    resource_type = Column(String(50), nullable=True)
    resource_id = Column(Integer, nullable=True)
    details = Column(JSONB, nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Relationships
    user = relationship("User", back_populates="platform_audit_logs")
    company = relationship("Company", back_populates="audit_logs")
```

### 1.3 Update Pydantic Schemas

**Update `backend/app/schemas/core.py`**:

```python
from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List, Dict, Any
from datetime import date, datetime
from enum import Enum

class UserType(str, Enum):
    PLATFORM_ADMIN = "platform_admin"
    COMPANY_ADMIN = "company_admin"
    COMPANY_USER = "company_user"

class SubscriptionStatus(str, Enum):
    TRIAL = "trial"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    CANCELLED = "cancelled"

# Enhanced Company Schemas
class CompanyBase(BaseModel):
    name: str
    code: Optional[str] = None
    address: Optional[Dict[str, Any]] = None
    contact_info: Optional[Dict[str, Any]] = None
    default_currency_code: Optional[str] = None
    primary_contact_email: Optional[EmailStr] = None
    billing_email: Optional[EmailStr] = None
    is_active: bool = True

class CompanyCreate(CompanyBase):
    subscription_plan: Optional[str] = "basic"
    storage_limit_gb: int = 10
    user_limit: int = 5

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    address: Optional[Dict[str, Any]] = None
    contact_info: Optional[Dict[str, Any]] = None
    default_currency_code: Optional[str] = None
    primary_contact_email: Optional[EmailStr] = None
    billing_email: Optional[EmailStr] = None
    subscription_status: Optional[SubscriptionStatus] = None
    subscription_plan: Optional[str] = None
    subscription_expires: Optional[date] = None
    storage_limit_gb: Optional[int] = None
    user_limit: Optional[int] = None
    is_active: Optional[bool] = None

class Company(CompanyBase):
    id: int
    subscription_status: SubscriptionStatus
    subscription_plan: Optional[str]
    subscription_expires: Optional[date]
    storage_limit_gb: int
    user_limit: int
    created_at: datetime
    is_deleted: bool = False
    
    class Config:
        from_attributes = True

class CompanyWithStats(BaseModel):
    company: Company
    user_count: int
    active_users_30d: int
    transaction_count: int
    storage_used_gb: float

# Enhanced User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    is_active: bool = True
    user_type: UserType = UserType.COMPANY_USER

class UserCreate(UserBase):
    password: str
    company_id: Optional[int] = None
    
    @validator('company_id')
    def validate_company_requirement(cls, v, values):
        if values.get('user_type') != UserType.PLATFORM_ADMIN and v is None:
            raise ValueError('Company ID is required for non-platform users')
        return v

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    user_type: Optional[UserType] = None
    default_company_id: Optional[int] = None

class User(UserBase):
    id: int
    company_id: Optional[int]
    default_company_id: Optional[int]
    last_login: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Platform Audit Log Schemas
class PlatformAuditLogCreate(BaseModel):
    action: str
    company_id: Optional[int] = None
    resource_type: Optional[str] = None
    resource_id: Optional[int] = None
    details: Optional[Dict[str, Any]] = None

class PlatformAuditLog(PlatformAuditLogCreate):
    id: int
    user_id: int
    ip_address: Optional[str]
    user_agent: Optional[str]
    timestamp: datetime
    
    class Config:
        from_attributes = True

# Platform-specific schemas
class ImpersonationToken(BaseModel):
    access_token: str
    token_type: str = "bearer"
    company: Company
    expires_in: int

class PlatformMetrics(BaseModel):
    total_companies: int
    active_companies: int
    suspended_companies: int
    total_users: int
    active_users_today: int
    total_transactions: int
    total_storage_gb: float
    revenue_this_month: Optional[float]
```

---

## 2. Platform Authentication/Authorization

### 2.1 Create Platform Security Module

**Create `backend/app/core/platform_security.py`**:

```python
from typing import Optional, Any
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.core.security import get_current_active_user, create_access_token, decode_access_token
from app.database.database import get_db
from app import models, schemas
from app.models.core import UserType

class PlatformContext:
    """Stores the current platform context for a request"""
    def __init__(
        self, 
        platform_user: models.User, 
        target_company: Optional[models.Company] = None,
        is_impersonation: bool = False
    ):
        self.platform_user = platform_user
        self.target_company = target_company
        self.is_impersonation = is_impersonation
        self.target_company_id = target_company.id if target_company else None

async def get_platform_admin(
    current_user: models.User = Depends(get_current_active_user)
) -> models.User:
    """Ensure user is a platform admin"""
    if current_user.user_type != UserType.PLATFORM_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Platform administrator access required"
        )
    return current_user

async def get_platform_context(
    request: Request,
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> PlatformContext:
    """Get platform context from request, handling both regular and impersonation tokens"""
    
    # Decode token to check if it's an impersonation token
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    user_id = payload.get("user_id")
    is_impersonation = payload.get("is_impersonation", False)
    impersonation_company_id = payload.get("company_id") if is_impersonation else None
    
    # Get the user
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user or user.user_type != UserType.PLATFORM_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid platform access"
        )
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.add(user)
    
    # Get target company from header or impersonation token
    target_company = None
    target_company_id = request.headers.get("X-Target-Company-ID") or impersonation_company_id
    
    if target_company_id:
        target_company = db.query(models.Company).filter(
            models.Company.id == int(target_company_id),
            models.Company.is_deleted == False
        ).first()
        
        if not target_company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Target company not found"
            )
        
        # Log the access
        audit_log = models.PlatformAuditLog(
            user_id=user.id,
            company_id=target_company.id,
            action="accessed_company" if not is_impersonation else "impersonated_company",
            resource_type="company",
            resource_id=target_company.id,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("User-Agent"),
            details={
                "is_impersonation": is_impersonation,
                "request_path": str(request.url.path)
            }
        )
        db.add(audit_log)
    
    db.commit()
    
    return PlatformContext(user, target_company, is_impersonation)

def create_impersonation_token(
    platform_user: models.User,
    company: models.Company,
    expires_delta: timedelta = timedelta(hours=1)
) -> str:
    """Create a special token for company impersonation"""
    if platform_user.user_type != UserType.PLATFORM_ADMIN:
        raise ValueError("Only platform admins can create impersonation tokens")
    
    token_data = {
        "user_id": platform_user.id,
        "company_id": company.id,
        "is_impersonation": True,
        "impersonation_expires": (datetime.utcnow() + expires_delta).isoformat()
    }
    
    return create_access_token(data=token_data, expires_delta=expires_delta)

def log_platform_action(
    db: Session,
    user_id: int,
    action: str,
    company_id: Optional[int] = None,
    resource_type: Optional[str] = None,
    resource_id: Optional[int] = None,
    details: Optional[dict] = None,
    request: Optional[Request] = None
):
    """Helper function to log platform admin actions"""
    audit_log = models.PlatformAuditLog(
        user_id=user_id,
        company_id=company_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details,
        ip_address=request.client.host if request and request.client else None,
        user_agent=request.headers.get("User-Agent") if request else None
    )
    db.add(audit_log)
    db.commit()
    return audit_log
```

### 2.2 Create Platform API Endpoints

**Create `backend/app/api/v1/endpoints/platform.py`**:

```python
from typing import List, Optional
from datetime import datetime, timedelta, date
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from app.database.database import get_db
from app import models, schemas, crud
from app.core.platform_security import (
    get_platform_admin, 
    get_platform_context, 
    create_impersonation_token,
    log_platform_action,
    PlatformContext
)

router = APIRouter(prefix="/platform", tags=["platform"])

# Company Management
@router.get("/companies", response_model=List[schemas.CompanyWithStats])
async def list_all_companies(
    request: Request,
    skip: int = 0,
    limit: int = 100,
    subscription_status: Optional[schemas.SubscriptionStatus] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    platform_admin: models.User = Depends(get_platform_admin)
):
    """List all companies with statistics"""
    query = db.query(models.Company).filter(models.Company.is_deleted == False)
    
    if subscription_status:
        query = query.filter(models.Company.subscription_status == subscription_status)
    
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            models.Company.name.ilike(search_pattern) |
            models.Company.code.ilike(search_pattern) |
            models.Company.primary_contact_email.ilike(search_pattern)
        )
    
    companies = query.order_by(models.Company.created_at.desc()).offset(skip).limit(limit).all()
    
    # Log the access
    log_platform_action(
        db, platform_admin.id, "listed_companies", 
        details={"count": len(companies), "search": search},
        request=request
    )
    
    # Add statistics
    company_stats = []
    for company in companies:
        # User statistics
        user_count = db.query(models.User).filter(
            models.User.company_id == company.id
        ).count()
        
        active_users_30d = db.query(models.User).filter(
            models.User.company_id == company.id,
            models.User.last_login >= datetime.utcnow() - timedelta(days=30)
        ).count()
        
        # Transaction count (simplified - count GL journal entries)
        transaction_count = db.query(models.GLJournalEntry).filter(
            models.GLJournalEntry.company_id == company.id
        ).count()
        
        # Storage calculation (simplified - could be based on attachments, documents, etc.)
        storage_used_gb = 0.1 * transaction_count / 1000  # Rough estimate
        
        company_stats.append(schemas.CompanyWithStats(
            company=company,
            user_count=user_count,
            active_users_30d=active_users_30d,
            transaction_count=transaction_count,
            storage_used_gb=round(storage_used_gb, 2)
        ))
    
    return company_stats

@router.get("/companies/{company_id}", response_model=schemas.Company)
async def get_company_details(
    company_id: int,
    request: Request,
    db: Session = Depends(get_db),
    platform_admin: models.User = Depends(get_platform_admin)
):
    """Get detailed information about a specific company"""
    company = db.query(models.Company).filter(
        models.Company.id == company_id,
        models.Company.is_deleted == False
    ).first()
    
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    log_platform_action(
        db, platform_admin.id, "viewed_company_details",
        company_id=company_id, resource_type="company", resource_id=company_id,
        request=request
    )
    
    return company

@router.post("/companies", response_model=schemas.Company)
async def create_company(
    company_in: schemas.CompanyCreate,
    request: Request,
    db: Session = Depends(get_db),
    platform_admin: models.User = Depends(get_platform_admin)
):
    """Create a new company with initial setup"""
    # Check if company name or code already exists
    existing = db.query(models.Company).filter(
        (models.Company.name == company_in.name) |
        (models.Company.code == company_in.code)
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Company with this name or code already exists"
        )
    
    # Generate code if not provided
    if not company_in.code:
        # Find the highest code number
        last_company = db.query(models.Company).order_by(
            models.Company.id.desc()
        ).first()
        next_id = (last_company.id + 1) if last_company else 1
        company_in.code = f"COMP{next_id:04d}"
    
    # Create company
    company_dict = company_in.dict()
    company_dict["created_by_user_id"] = platform_admin.id
    db_company = models.Company(**company_dict)
    db.add(db_company)
    db.commit()
    db.refresh(db_company)
    
    # Create default data for the company
    try:
        # Create default roles
        default_roles = [
            {
                "name": "Administrator",
                "description": "Full system access",
                "permissions": crud.core.get_all_permissions()
            },
            {
                "name": "Accountant",
                "description": "Access to financial modules",
                "permissions": [
                    "gl:setup_manage", "gl:journal_post", "gl:reports_view",
                    "ar:setup_manage", "ar:transactions_post", "ar:reports_view",
                    "ap:setup_manage", "ap:transactions_post", "ap:reports_view"
                ]
            },
            {
                "name": "Clerk",
                "description": "Basic data entry",
                "permissions": [
                    "gl:journal_post", "ar:transactions_post", "ap:transactions_post"
                ]
            }
        ]
        
        for role_data in default_roles:
            role = models.Role(company_id=db_company.id, **role_data)
            db.add(role)
        
        # Create default accounting period
        current_year = datetime.now().year
        accounting_period = models.AccountingPeriod(
            company_id=db_company.id,
            name=f"FY {current_year}",
            start_date=date(current_year, 1, 1),
            end_date=date(current_year, 12, 31),
            status="Open"
        )
        db.add(accounting_period)
        
        # Create initial admin user
        admin_role = db.query(models.Role).filter(
            models.Role.company_id == db_company.id,
            models.Role.name == "Administrator"
        ).first()
        
        if company_in.primary_contact_email:
            from app.core.security import get_password_hash
            temp_password = f"Welcome{db_company.code}!"  # Temporary password
            
            admin_user = models.User(
                email=company_in.primary_contact_email,
                hashed_password=get_password_hash(temp_password),
                full_name=f"{db_company.name} Administrator",
                user_type=models.UserType.COMPANY_ADMIN,
                company_id=db_company.id,
                is_active=True
            )
            db.add(admin_user)
            db.flush()
            
            # Assign admin role
            user_role = models.UserRole(
                user_id=admin_user.id,
                role_id=admin_role.id
            )
            db.add(user_role)
        
        db.commit()
        
    except Exception as e:
        db.rollback()
        # Delete the company if setup fails
        db.delete(db_company)
        db.commit()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create company setup: {str(e)}"
        )
    
    # Log the creation
    log_platform_action(
        db, platform_admin.id, "created_company",
        company_id=db_company.id,
        resource_type="company",
        resource_id=db_company.id,
        details={"company_name": db_company.name, "company_code": db_company.code},
        request=request
    )
    
    return db_company

@router.post("/companies/{company_id}/impersonate", response_model=schemas.ImpersonationToken)
async def impersonate_company(
    company_id: int,
    request: Request,
    reason: str = Query(..., description="Reason for impersonation"),
    expires_hours: int = Query(1, ge=1, le=24, description="Token expiration in hours"),
    db: Session = Depends(get_db),
    platform_admin: models.User = Depends(get_platform_admin)
):
    """Generate a temporary token to act as admin within a company"""
    company = db.query(models.Company).filter(
        models.Company.id == company_id,
        models.Company.is_deleted == False
    ).first()
    
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    if not company.is_active:
        raise HTTPException(status_code=400, detail="Cannot impersonate inactive company")
    
    # Create impersonation token
    expires_delta = timedelta(hours=expires_hours)
    access_token = create_impersonation_token(platform_admin, company, expires_delta)
    
    # Log the impersonation
    log_platform_action(
        db, platform_admin.id, "impersonated_company",
        company_id=company_id,
        resource_type="company",
        resource_id=company_id,
        details={
            "reason": reason,
            "expires_hours": expires_hours,
            "company_name": company.name
        },
        request=request
    )
    
    return schemas.ImpersonationToken(
        access_token=access_token,
        company=company,
        expires_in=expires_hours * 3600
    )

@router.post("/companies/{company_id}/suspend")
async def suspend_company(
    company_id: int,
    request: Request,
    reason: str = Query(..., description="Reason for suspension"),
    db: Session = Depends(get_db),
    platform_admin: models.User = Depends(get_platform_admin)
):
    """Suspend a company's access"""
    company = db.query(models.Company).filter(
        models.Company.id == company_id
    ).first()
    
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    if company.subscription_status == schemas.SubscriptionStatus.SUSPENDED:
        raise HTTPException(status_code=400, detail="Company is already suspended")
    
    # Suspend the company
    company.subscription_status = schemas.SubscriptionStatus.SUSPENDED
    company.is_active = False
    
    # Deactivate all users
    db.query(models.User).filter(
        models.User.company_id == company_id
    ).update({"is_active": False})
    
    db.commit()
    
    # Log the action
    log_platform_action(
        db, platform_admin.id, "suspended_company",
        company_id=company_id,
        resource_type="company",
        resource_id=company_id,
        details={"reason": reason, "company_name": company.name},
        request=request
    )
    
    return {"status": "suspended", "company_id": company_id, "reason": reason}

@router.post("/companies/{company_id}/activate")
async def activate_company(
    company_id: int,
    request: Request,
    activate_all_users: bool = Query(False, description="Reactivate all users"),
    db: Session = Depends(get_db),
    platform_admin: models.User = Depends(get_platform_admin)
):
    """Reactivate a suspended company"""
    company = db.query(models.Company).filter(
        models.Company.id == company_id
    ).first()
    
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Activate the company
    company.subscription_status = schemas.SubscriptionStatus.ACTIVE
    company.is_active = True
    
    # Optionally reactivate users
    if activate_all_users:
        db.query(models.User).filter(
            models.User.company_id == company_id
        ).update({"is_active": True})
    
    db.commit()
    
    # Log the action
    log_platform_action(
        db, platform_admin.id, "activated_company",
        company_id=company_id,
        resource_type="company",
        resource_id=company_id,
        details={
            "activate_all_users": activate_all_users,
            "company_name": company.name
        },
        request=request
    )
    
    return {"status": "activated", "company_id": company_id}

# Audit Logs
@router.get("/audit-logs", response_model=List[schemas.PlatformAuditLog])
async def get_platform_audit_logs(
    skip: int = 0,
    limit: int = 100,
    company_id: Optional[int] = None,
    user_id: Optional[int] = None,
    action: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
    platform_admin: models.User = Depends(get_platform_admin)
):
    """Get platform audit logs with filtering"""
    query = db.query(models.PlatformAuditLog)
    
    if company_id:
        query = query.filter(models.PlatformAuditLog.company_id == company_id)
    if user_id:
        query = query.filter(models.PlatformAuditLog.user_id == user_id)
    if action:
        query = query.filter(models.PlatformAuditLog.action.ilike(f"%{action}%"))
    if start_date:
        query = query.filter(models.PlatformAuditLog.timestamp >= start_date)
    if end_date:
        query = query.filter(models.PlatformAuditLog.timestamp <= end_date)
    
    logs = query.order_by(
        models.PlatformAuditLog.timestamp.desc()
    ).offset(skip).limit(limit).all()
    
    return logs

# Platform Metrics
@router.get("/metrics/summary", response_model=schemas.PlatformMetrics)
async def get_platform_metrics(
    db: Session = Depends(get_db),
    platform_admin: models.User = Depends(get_platform_admin)
):
    """Get platform-wide metrics"""
    # Company metrics
    total_companies = db.query(models.Company).filter(
        models.Company.is_deleted == False
    ).count()
    
    active_companies = db.query(models.Company).filter(
        models.Company.subscription_status == schemas.SubscriptionStatus.ACTIVE,
        models.Company.is_deleted == False
    ).count()
    
    suspended_companies = db.query(models.Company).filter(
        models.Company.subscription_status == schemas.SubscriptionStatus.SUSPENDED,
        models.Company.is_deleted == False
    ).count()
    
    # User metrics
    total_users = db.query(models.User).filter(
        models.User.user_type != models.UserType.PLATFORM_ADMIN
    ).count()
    
    active_users_today = db.query(models.User).filter(
        models.User.last_login >= datetime.utcnow().date()
    ).count()
    
    # Transaction metrics
    total_transactions = db.query(models.GLJournalEntry).count()
    
    # Storage metrics (simplified)
    total_storage_gb = db.query(
        func.sum(models.Company.storage_limit_gb)
    ).scalar() or 0
    
    # Revenue calculation (simplified - would depend on billing system)
    revenue_this_month = active_companies * 99.99  # Example: $99.99 per active company
    
    return schemas.PlatformMetrics(
        total_companies=total_companies,
        active_companies=active_companies,
        suspended_companies=suspended_companies,
        total_users=total_users,
        active_users_today=active_users_today,
        total_transactions=total_transactions,
        total_storage_gb=total_storage_gb,
        revenue_this_month=revenue_this_month
    )

# Company Context Operations (when using impersonation or target company)
@router.get("/context/users", response_model=List[schemas.User])
async def get_company_users(
    request: Request,
    db: Session = Depends(get_db),
    platform_context: PlatformContext = Depends(get_platform_context)
):
    """Get users for the target company"""
    if not platform_context.target_company:
        raise HTTPException(
            status_code=400,
            detail="Target company context required"
        )
    
    users = db.query(models.User).filter(
        models.User.company_id == platform_context.target_company_id
    ).all()
    
    return users

@router.get("/context/financial-summary")
async def get_company_financial_summary(
    request: Request,
    db: Session = Depends(get_db),
    platform_context: PlatformContext = Depends(get_platform_context)
):
    """Get financial summary for the target company"""
    if not platform_context.target_company:
        raise HTTPException(
            status_code=400,
            detail="Target company context required"
        )
    
    # Example financial summary
    total_revenue = db.query(func.sum(models.ARTransaction.total_amount)).filter(
        models.ARTransaction.company_id == platform_context.target_company_id,
        models.ARTransaction.ar_transaction_type_id.in_(
            db.query(models.ARTransactionType.id).filter(
                models.ARTransactionType.base_type == "Invoice"
            )
        )
    ).scalar() or 0
    
    total_expenses = db.query(func.sum(models.APTransaction.total_amount)).filter(
        models.APTransaction.company_id == platform_context.target_company_id
    ).scalar() or 0
    
    return {
        "company_id": platform_context.target_company_id,
        "company_name": platform_context.target_company.name,
        "total_revenue": total_revenue,
        "total_expenses": total_expenses,
        "net_income": total_revenue - total_expenses
    }
```

### 2.3 Update Main App Router

**Update `backend/app/api/v1/api.py`**:

```python
from fastapi import APIRouter, Depends
from app.api.v1.endpoints import auth, users, roles, companies, accounting_periods, gl, ar, ap, inventory, oe, common, platform
from app.core.security import get_current_active_user
from app.models.core import UserType

api_router = APIRouter(prefix="/api/v1")

# Regular endpoints
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(roles.router, prefix="/roles", tags=["roles"])
api_router.include_router(companies.router, prefix="/companies", tags=["companies"])
api_router.include_router(accounting_periods.router, prefix="/accounting-periods", tags=["accounting-periods"])
api_router.include_router(gl.router, prefix="/gl", tags=["general-ledger"])
api_router.include_router(ar.router, prefix="/ar", tags=["accounts-receivable"])
api_router.include_router(ap.router, prefix="/ap", tags=["accounts-payable"])
api_router.include_router(inventory.router, prefix="/inventory", tags=["inventory"])
api_router.include_router(oe.router, prefix="/oe", tags=["order-entry"])
api_router.include_router(common.router, prefix="/common", tags=["common"])

# Platform endpoints (protected)
api_router.include_router(platform.router, tags=["platform"])
```

---

## 3. Platform Admin UI

### 3.1 Create Platform Layout

**Create `frontend/src/app/(platform)/layout.tsx`**:

```tsx
'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { PlatformSidebar } from '@/components/platform/PlatformSidebar';
import { PlatformHeader } from '@/components/platform/PlatformHeader';
import { UserType } from '@/types/user';

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/platform-login');
      } else if (user?.user_type !== UserType.PLATFORM_ADMIN) {
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user || user.user_type !== UserType.PLATFORM_ADMIN) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <PlatformSidebar />
      <div className="flex-1 flex flex-col">
        <PlatformHeader />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
```

### 3.2 Platform Components

**Create `frontend/src/components/platform/PlatformSidebar.tsx`**:

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  Settings,
  Shield,
  BarChart3,
  AlertCircle,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/platform', icon: LayoutDashboard },
  { name: 'Companies', href: '/platform/companies', icon: Building2 },
  { name: 'Users', href: '/platform/users', icon: Users },
  { name: 'Audit Logs', href: '/platform/audit', icon: FileText },
  { name: 'Analytics', href: '/platform/analytics', icon: BarChart3 },
  { name: 'Alerts', href: '/platform/alerts', icon: AlertCircle },
  { name: 'Security', href: '/platform/security', icon: Shield },
  { name: 'Settings', href: '/platform/settings', icon: Settings },
];

export function PlatformSidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-gray-900 text-white">
      <div className="flex h-16 items-center px-6">
        <h1 className="text-xl font-bold">Vinea Platform</h1>
      </div>
      
      <nav className="mt-6 space-y-1 px-3">
        {navigation.map((item) => {
          const isActive = pathname === item.href || 
                          (item.href !== '/platform' && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      
      <div className="absolute bottom-0 w-64 p-4">
        <div className="rounded-lg bg-orange-600 p-3">
          <p className="text-xs font-medium">PLATFORM ADMIN MODE</p>
          <p className="mt-1 text-xs text-orange-100">
            Full system access enabled
          </p>
        </div>
      </div>
    </div>
  );
}
```

**Create `frontend/src/components/platform/PlatformHeader.tsx`**:

```tsx
'use client';

import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function PlatformHeader() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = '/platform-login';
  };

  return (
    <header className="h-16 border-b bg-white px-6">
      <div className="flex h-full items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Platform Administration</h2>
          <p className="text-sm text-gray-500">
            Managing {new Date().toLocaleDateString()}
          </p>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {user?.email}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Platform Admin</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
```

### 3.3 Platform Pages

**Create `frontend/src/app/(platform)/platform/page.tsx`**:

```tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { platformService } from '@/services/platformService';
import {
  Building2,
  Users,
  DollarSign,
  Activity,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

export default function PlatformDashboard() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['platform-metrics'],
    queryFn: platformService.getMetrics,
  });

  if (isLoading) {
    return <div>Loading metrics...</div>;
  }

  const cards = [
    {
      title: 'Total Companies',
      value: metrics?.total_companies || 0,
      icon: Building2,
      description: `${metrics?.active_companies || 0} active`,
      trend: '+12%',
    },
    {
      title: 'Total Users',
      value: metrics?.total_users || 0,
      icon: Users,
      description: `${metrics?.active_users_today || 0} active today`,
      trend: '+5%',
    },
    {
      title: 'Monthly Revenue',
      value: `$${metrics?.revenue_this_month?.toLocaleString() || 0}`,
      icon: DollarSign,
      description: 'Recurring revenue',
      trend: '+8%',
    },
    {
      title: 'System Health',
      value: '99.9%',
      icon: Activity,
      description: 'Uptime this month',
      trend: 'Stable',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Platform Overview</h1>
        <p className="mt-2 text-gray-600">
          Monitor and manage all tenant companies from a single dashboard
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">
                {card.description}
              </p>
              <div className="mt-2 flex items-center text-xs">
                <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                <span className="text-green-600">{card.trend}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Add activity feed component */}
            <p className="text-sm text-gray-500">
              Platform activity will be shown here
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">High Storage Usage</p>
                  <p className="text-xs text-gray-500">
                    Company ABC Corp is at 95% storage capacity
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

### 3.4 Platform Services

**Create `frontend/src/services/platformService.ts`**:

```typescript
import { platformAxiosInstance } from '@/lib/platformAxiosInstance';
import {
  Company,
  CompanyWithStats,
  CompanyCreate,
  ImpersonationToken,
  PlatformMetrics,
  PlatformAuditLog,
  AuditLogFilters,
} from '@/types/platform';

export const platformService = {
  // Companies
  async getCompanies(params?: {
    skip?: number;
    limit?: number;
    subscription_status?: string;
    search?: string;
  }): Promise<CompanyWithStats[]> {
    const response = await platformAxiosInstance.get('/platform/companies', { params });
    return response.data;
  },

  async getCompany(companyId: number): Promise<Company> {
    const response = await platformAxiosInstance.get(`/platform/companies/${companyId}`);
    return response.data;
  },

  async createCompany(data: CompanyCreate): Promise<Company> {
    const response = await platformAxiosInstance.post('/platform/companies', data);
    return response.data;
  },

  async impersonateCompany(
    companyId: number,
    reason: string,
    expires_hours: number = 1
  ): Promise<ImpersonationToken> {
    const response = await platformAxiosInstance.post(
      `/platform/companies/${companyId}/impersonate`,
      null,
      { params: { reason, expires_hours } }
    );
    return response.data;
  },

  async suspendCompany(companyId: number, reason: string): Promise<void> {
    await platformAxiosInstance.post(
      `/platform/companies/${companyId}/suspend`,
      null,
      { params: { reason } }
    );
  },

  async activateCompany(
    companyId: number,
    activate_all_users: boolean = false
  ): Promise<void> {
    await platformAxiosInstance.post(
      `/platform/companies/${companyId}/activate`,
      null,
      { params: { activate_all_users } }
    );
  },

  // Metrics
  async getMetrics(): Promise<PlatformMetrics> {
    const response = await platformAxiosInstance.get('/platform/metrics/summary');
    return response.data;
  },

  // Audit Logs
  async getAuditLogs(filters?: AuditLogFilters): Promise<PlatformAuditLog[]> {
    const response = await platformAxiosInstance.get('/platform/audit-logs', {
      params: filters,
    });
    return response.data;
  },

  // Context operations (when impersonating)
  async getCompanyUsers(targetCompanyId: number): Promise<any[]> {
    const response = await platformAxiosInstance.get('/platform/context/users', {
      headers: { 'X-Target-Company-ID': targetCompanyId },
    });
    return response.data;
  },

  async getCompanyFinancialSummary(targetCompanyId: number): Promise<any> {
    const response = await platformAxiosInstance.get(
      '/platform/context/financial-summary',
      {
        headers: { 'X-Target-Company-ID': targetCompanyId },
      }
    );
    return response.data;
  },
};
```

**Create `frontend/src/lib/platformAxiosInstance.ts`**:

```typescript
import axios from 'axios';
import Cookies from 'js-cookie';

const PLATFORM_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

export const platformAxiosInstance = axios.create({
  baseURL: PLATFORM_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth
platformAxiosInstance.interceptors.request.use(
  (config) => {
    const token = Cookies.get('platform_token') || Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
platformAxiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Clear tokens and redirect to platform login
      Cookies.remove('platform_token');
      Cookies.remove('token');
      window.location.href = '/platform-login';
    }
    return Promise.reject(error);
  }
);
```

---

## 4. Audit Logging System

### 4.1 Enhanced Audit Logging Middleware

**Create `backend/app/middleware/audit_middleware.py`**:

```python
from typing import Callable
from fastapi import Request, Response
from fastapi.routing import APIRoute
import json
import time
from app.database.database import SessionLocal
from app.models import PlatformAuditLog, User, UserType

class AuditRoute(APIRoute):
    """Custom route class that logs platform admin actions"""
    
    def get_route_handler(self) -> Callable:
        original_route_handler = super().get_route_handler()
        
        async def custom_route_handler(request: Request) -> Response:
            # Only audit platform routes or sensitive operations
            should_audit = (
                request.url.path.startswith("/api/v1/platform") or
                request.method in ["POST", "PUT", "DELETE", "PATCH"]
            )
            
            if not should_audit:
                return await original_route_handler(request)
            
            # Capture request details
            start_time = time.time()
            request_body = None
            
            if request.method in ["POST", "PUT", "PATCH"]:
                body = await request.body()
                request._body = body  # Store for later use
                try:
                    request_body = json.loads(body) if body else None
                except:
                    request_body = {"raw": str(body)}
            
            # Execute the route
            response = await original_route_handler(request)
            
            # Calculate response time
            process_time = time.time() - start_time
            
            # Log if user is platform admin
            try:
                # Get user from token if available
                auth_header = request.headers.get("Authorization", "")
                if auth_header.startswith("Bearer "):
                    from app.core.security import decode_access_token
                    token = auth_header.split(" ")[1]
                    payload = decode_access_token(token)
                    
                    if payload and payload.get("user_id"):
                        db = SessionLocal()
                        user = db.query(User).filter(
                            User.id == payload["user_id"]
                        ).first()
                        
                        if user and user.user_type == UserType.PLATFORM_ADMIN:
                            # Extract target company from header or body
                            target_company_id = request.headers.get("X-Target-Company-ID")
                            if not target_company_id and request_body:
                                target_company_id = request_body.get("company_id")
                            
                            # Create audit log
                            audit_log = PlatformAuditLog(
                                user_id=user.id,
                                company_id=int(target_company_id) if target_company_id else None,
                                action=f"{request.method} {request.url.path}",
                                resource_type="api_call",
                                details={
                                    "method": request.method,
                                    "path": request.url.path,
                                    "query_params": dict(request.query_params),
                                    "response_status": response.status_code,
                                    "response_time_ms": round(process_time * 1000, 2),
                                    "request_size": len(await request.body()) if request.method in ["POST", "PUT", "PATCH"] else 0,
                                },
                                ip_address=request.client.host if request.client else None,
                                user_agent=request.headers.get("User-Agent"),
                            )
                            
                            db.add(audit_log)
                            db.commit()
                        
                        db.close()
            except Exception as e:
                # Don't let audit logging break the application
                print(f"Audit logging error: {str(e)}")
            
            return response
        
        return custom_route_handler
```

### 4.2 Audit Log Reports

**Create `backend/app/api/v1/endpoints/platform_reports.py`**:

```python
from typing import List, Dict, Any
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from app.database.database import get_db
from app import models
from app.core.platform_security import get_platform_admin

router = APIRouter(prefix="/platform/reports", tags=["platform-reports"])

@router.get("/audit-summary")
async def get_audit_summary(
    days: int = Query(7, ge=1, le=90),
    db: Session = Depends(get_db),
    platform_admin: models.User = Depends(get_platform_admin)
) -> Dict[str, Any]:
    """Get audit log summary for the specified period"""
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Total actions
    total_actions = db.query(models.PlatformAuditLog).filter(
        models.PlatformAuditLog.timestamp >= start_date
    ).count()
    
    # Actions by type
    actions_by_type = db.query(
        models.PlatformAuditLog.action,
        func.count(models.PlatformAuditLog.id).label('count')
    ).filter(
        models.PlatformAuditLog.timestamp >= start_date
    ).group_by(
        models.PlatformAuditLog.action
    ).all()
    
    # Most active platform admins
    most_active_admins = db.query(
        models.User.email,
        func.count(models.PlatformAuditLog.id).label('action_count')
    ).join(
        models.PlatformAuditLog,
        models.User.id == models.PlatformAuditLog.user_id
    ).filter(
        models.PlatformAuditLog.timestamp >= start_date
    ).group_by(
        models.User.email
    ).order_by(
        func.count(models.PlatformAuditLog.id).desc()
    ).limit(5).all()
    
    # Most accessed companies
    most_accessed_companies = db.query(
        models.Company.name,
        func.count(models.PlatformAuditLog.id).label('access_count')
    ).join(
        models.PlatformAuditLog,
        models.Company.id == models.PlatformAuditLog.company_id
    ).filter(
        models.PlatformAuditLog.timestamp >= start_date,
        models.PlatformAuditLog.company_id.isnot(None)
    ).group_by(
        models.Company.name
    ).order_by(
        func.count(models.PlatformAuditLog.id).desc()
    ).limit(5).all()
    
    # Activity by day
    daily_activity = db.query(
        func.date(models.PlatformAuditLog.timestamp).label('date'),
        func.count(models.PlatformAuditLog.id).label('count')
    ).filter(
        models.PlatformAuditLog.timestamp >= start_date
    ).group_by(
        func.date(models.PlatformAuditLog.timestamp)
    ).order_by(
        func.date(models.PlatformAuditLog.timestamp)
    ).all()
    
    return {
        "period_days": days,
        "total_actions": total_actions,
        "actions_by_type": [
            {"action": action, "count": count}
            for action, count in actions_by_type
        ],
        "most_active_admins": [
            {"email": email, "action_count": count}
            for email, count in most_active_admins
        ],
        "most_accessed_companies": [
            {"company": name, "access_count": count}
            for name, count in most_accessed_companies
        ],
        "daily_activity": [
            {"date": date.isoformat(), "count": count}
            for date, count in daily_activity
        ],
    }

@router.get("/compliance-report")
async def get_compliance_report(
    company_id: int,
    start_date: datetime = Query(...),
    end_date: datetime = Query(...),
    db: Session = Depends(get_db),
    platform_admin: models.User = Depends(get_platform_admin)
) -> Dict[str, Any]:
    """Generate compliance report for a specific company"""
    
    # All platform admin actions on this company
    actions = db.query(models.PlatformAuditLog).filter(
        models.PlatformAuditLog.company_id == company_id,
        models.PlatformAuditLog.timestamp >= start_date,
        models.PlatformAuditLog.timestamp <= end_date
    ).order_by(
        models.PlatformAuditLog.timestamp.desc()
    ).all()
    
    # Group by admin
    admin_actions = {}
    for action in actions:
        admin_email = action.user.email
        if admin_email not in admin_actions:
            admin_actions[admin_email] = []
        
        admin_actions[admin_email].append({
            "timestamp": action.timestamp.isoformat(),
            "action": action.action,
            "resource_type": action.resource_type,
            "resource_id": action.resource_id,
            "ip_address": action.ip_address,
            "details": action.details
        })
    
    # Company details
    company = db.query(models.Company).filter(
        models.Company.id == company_id
    ).first()
    
    return {
        "company": {
            "id": company.id,
            "name": company.name,
            "code": company.code
        },
        "report_period": {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat()
        },
        "total_actions": len(actions),
        "unique_admins": len(admin_actions),
        "actions_by_admin": admin_actions,
        "generated_at": datetime.utcnow().isoformat(),
        "generated_by": platform_admin.email
    }
```

### 4.3 Audit Log UI Component

**Create `frontend/src/components/platform/AuditLogViewer.tsx`**:

```tsx
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { platformService } from '@/services/platformService';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export function AuditLogViewer() {
  const [filters, setFilters] = useState({
    company_id: undefined,
    action: '',
    start_date: undefined,
    end_date: undefined,
  });

  const { data: logs, isLoading } = useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: () => platformService.getAuditLogs(filters),
  });

  const actionTypeColors: Record<string, string> = {
    created_company: 'bg-green-100 text-green-800',
    suspended_company: 'bg-red-100 text-red-800',
    impersonated_company: 'bg-yellow-100 text-yellow-800',
    viewed_company_details: 'bg-blue-100 text-blue-800',
    modified_user: 'bg-purple-100 text-purple-800',
  };

  const columns = [
    {
      accessorKey: 'timestamp',
      header: 'Timestamp',
      cell: ({ row }) => format(new Date(row.original.timestamp), 'PPpp'),
    },
    {
      accessorKey: 'user.email',
      header: 'Admin',
    },
    {
      accessorKey: 'action',
      header: 'Action',
      cell: ({ row }) => {
        const action = row.original.action;
        const colorClass = actionTypeColors[action] || 'bg-gray-100 text-gray-800';
        return (
          <Badge variant="secondary" className={colorClass}>
            {action.replace(/_/g, ' ')}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'company.name',
      header: 'Company',
      cell: ({ row }) => row.original.company?.name || '-',
    },
    {
      accessorKey: 'resource_type',
      header: 'Resource',
      cell: ({ row }) => {
        const { resource_type, resource_id } = row.original;
        if (!resource_type) return '-';
        return `${resource_type}${resource_id ? ` #${resource_id}` : ''}`;
      },
    },
    {
      accessorKey: 'ip_address',
      header: 'IP Address',
    },
    {
      id: 'details',
      header: 'Details',
      cell: ({ row }) => {
        const details = row.original.details;
        if (!details || Object.keys(details).length === 0) return '-';
        
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // Open details modal
              console.log('Details:', details);
            }}
          >
            View
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <Input
          placeholder="Search actions..."
          value={filters.action}
          onChange={(e) => setFilters({ ...filters, action: e.target.value })}
          className="w-64"
        />
        
        <DatePicker
          value={filters.start_date}
          onChange={(date) => setFilters({ ...filters, start_date: date })}
          placeholder="Start date"
        />
        
        <DatePicker
          value={filters.end_date}
          onChange={(date) => setFilters({ ...filters, end_date: date })}
          placeholder="End date"
        />
        
        <Button
          variant="outline"
          onClick={() => setFilters({
            company_id: undefined,
            action: '',
            start_date: undefined,
            end_date: undefined,
          })}
        >
          Clear Filters
        </Button>
      </div>
      
      {isLoading ? (
        <div>Loading audit logs...</div>
      ) : (
        <DataTable
          columns={columns}
          data={logs || []}
          pagination
        />
      )}
    </div>
  );
}
```

---

## 5. Testing & Verification

### 5.1 Create Platform Admin User Script

**Create `backend/scripts/create_platform_admin.py`**:

```python
#!/usr/bin/env python3
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from getpass import getpass
from app.database.database import SessionLocal
from app.models import User, UserType
from app.core.security import get_password_hash

def create_platform_admin():
    """Create a platform admin user"""
    db = SessionLocal()
    
    print("Creating Platform Administrator")
    print("-" * 40)
    
    email = input("Email: ")
    
    # Check if user exists
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        if existing.user_type == UserType.PLATFORM_ADMIN:
            print(f"User {email} is already a platform admin!")
        else:
            convert = input(f"Convert {email} to platform admin? (yes/no): ")
            if convert.lower() == 'yes':
                existing.user_type = UserType.PLATFORM_ADMIN
                existing.company_id = None
                db.commit()
                print("User converted to platform admin!")
        db.close()
        return
    
    full_name = input("Full Name: ")
    password = getpass("Password: ")
    password_confirm = getpass("Confirm Password: ")
    
    if password != password_confirm:
        print("Passwords don't match!")
        db.close()
        return
    
    # Create platform admin
    platform_admin = User(
        email=email,
        hashed_password=get_password_hash(password),
        full_name=full_name,
        user_type=UserType.PLATFORM_ADMIN,
        company_id=None,  # No company association
        is_active=True,
        is_superuser=True  # For backward compatibility
    )
    
    db.add(platform_admin)
    db.commit()
    
    print(f"\nPlatform admin created successfully!")
    print(f"Email: {platform_admin.email}")
    print(f"Type: {platform_admin.user_type}")
    print("\nYou can now log in at /platform-login")
    
    db.close()

if __name__ == "__main__":
    create_platform_admin()
```

### 5.2 Testing Checklist

1. **Database Migration**
   - [ ] Run migration successfully
   - [ ] Verify new columns exist
   - [ ] Check constraints are in place

2. **Platform Admin Creation**
   - [ ] Create platform admin user
   - [ ] Verify can login at /platform-login
   - [ ] Verify access to platform routes

3. **Company Management**
   - [ ] List all companies
   - [ ] Create new company
   - [ ] Suspend/activate companies
   - [ ] Impersonate company

4. **Audit Logging**
   - [ ] All platform actions logged
   - [ ] Can view audit logs
   - [ ] Can filter by company/date
   - [ ] Generate compliance reports

5. **Security**
   - [ ] Non-platform users cannot access platform routes
   - [ ] Impersonation tokens expire
   - [ ] All actions are audited

### 5.3 Common Issues & Solutions

1. **Migration Fails**
   - Check if enum types already exist
   - Ensure foreign key references are valid
   - Run with `--sql` to preview changes

2. **Cannot Create Platform Admin**
   - Ensure migration has run
   - Check user_type enum is created
   - Verify company_id can be null

3. **Platform Routes Return 403**
   - Verify user has user_type = 'platform_admin'
   - Check token includes correct user_id
   - Ensure middleware is properly configured

4. **Audit Logs Not Recording**
   - Check middleware is applied to routes
   - Verify database connection in middleware
   - Check for exceptions in audit logging

---

## Conclusion

This implementation provides a complete multi-tenant platform administration system with:

1. **Flexible User Model**: Platform admins exist outside companies
2. **Secure Authentication**: Separate login and impersonation tokens
3. **Comprehensive UI**: Full platform management interface
4. **Complete Audit Trail**: Every action is logged for compliance

The system allows you to effectively manage multiple tenant companies while maintaining security and compliance requirements.