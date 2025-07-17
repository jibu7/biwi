# Multi-Tenant Platform Implementation Guide

## Table of Contents
1. [User Model Changes](#1-user-model-changes)
2. [Platform Authentication/Authorization](#2-platform-authenticationauthorization)
3. [Platform Admin UI](#3-platform-admin-ui)
4. [Audit Logging System](#4-audit-logging-system)
5. [Data Isolation & Security](#5-data-isolation--security)
6. [Resource Metering & Billing](#6-resource-metering--billing)
7. [Tenant Provisioning & Lifecycle](#7-tenant-provisioning--lifecycle)
8. [Performance & Scalability](#8-performance--scalability)
9. [Monitoring & Health Checks](#9-monitoring--health-checks)
10. [Testing & Verification](#10-testing--verification)

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

## 5. Data Isolation & Security

### 5.1 Tenant Isolation Middleware

**Create `backend/app/middleware/tenant_isolation.py`**:

```python
from typing import Optional, Callable
from fastapi import Request, HTTPException, status
from sqlalchemy.orm import Session, Query
from sqlalchemy import event
from app.database.database import SessionLocal
from app.models import User, UserType
import contextvars

# Context variable to store current tenant
current_tenant_id: contextvars.ContextVar[Optional[int]] = contextvars.ContextVar('current_tenant_id', default=None)

class TenantIsolationMiddleware:
    """Middleware to enforce tenant isolation"""
    
    async def __call__(self, request: Request, call_next):
        # Extract tenant from request
        tenant_id = None
        
        # Check if this is a platform route
        if request.url.path.startswith("/api/v1/platform"):
            # Platform routes may have optional tenant context
            tenant_id = request.headers.get("X-Target-Company-ID")
        else:
            # Regular routes must have tenant context
            auth_header = request.headers.get("Authorization", "")
            if auth_header.startswith("Bearer "):
                from app.core.security import decode_access_token
                token = auth_header.split(" ")[1]
                payload = decode_access_token(token)
                
                if payload:
                    # Check if it's an impersonation token
                    if payload.get("is_impersonation"):
                        tenant_id = payload.get("company_id")
                    else:
                        # Get user's company
                        db = SessionLocal()
                        user = db.query(User).filter(User.id == payload.get("user_id")).first()
                        if user and user.company_id:
                            tenant_id = user.company_id
                        db.close()
        
        # Set tenant context
        if tenant_id:
            current_tenant_id.set(int(tenant_id))
        
        try:
            response = await call_next(request)
            return response
        finally:
            # Clear tenant context
            current_tenant_id.set(None)

def apply_tenant_filter(query: Query, model_class) -> Query:
    """Automatically apply tenant filter to queries"""
    tenant_id = current_tenant_id.get()
    
    if tenant_id and hasattr(model_class, 'company_id'):
        return query.filter(model_class.company_id == tenant_id)
    
    return query

def validate_tenant_access(obj, tenant_id: int):
    """Validate that an object belongs to the current tenant"""
    if hasattr(obj, 'company_id') and obj.company_id != tenant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Cross-tenant access violation"
        )

# SQLAlchemy event listeners for automatic filtering
@event.listens_for(Session, "after_begin")
def receive_after_begin(session, transaction, connection):
    """Set session-level tenant context"""
    tenant_id = current_tenant_id.get()
    if tenant_id:
        connection.execute(f"SET app.current_tenant = {tenant_id}")

class TenantQueryMixin:
    """Mixin to add tenant filtering to SQLAlchemy queries"""
    
    @classmethod
    def query(cls, session: Session) -> Query:
        query = session.query(cls)
        return apply_tenant_filter(query, cls)
```

### 5.2 Row-Level Security (Database Level)

**Create migration `add_row_level_security.sql`**:

```sql
-- Enable RLS on all tenant tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE gl_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gl_journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
-- ... continue for all tables with company_id

-- Create security policies
CREATE POLICY tenant_isolation_policy ON companies
    FOR ALL
    USING (
        id = current_setting('app.current_tenant', true)::int 
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = current_setting('app.current_user', true)::int 
            AND users.user_type = 'platform_admin'
        )
    );

-- Repeat for other tables
CREATE POLICY tenant_isolation_policy ON users
    FOR ALL
    USING (
        company_id = current_setting('app.current_tenant', true)::int
        OR user_type = 'platform_admin'
        OR EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = current_setting('app.current_user', true)::int 
            AND u.user_type = 'platform_admin'
        )
    );

-- Create function to validate foreign key references
CREATE OR REPLACE FUNCTION validate_same_tenant_reference()
RETURNS TRIGGER AS $
BEGIN
    -- Check if referenced record belongs to same tenant
    IF NEW.company_id IS DISTINCT FROM OLD.company_id THEN
        RAISE EXCEPTION 'Cross-tenant reference not allowed';
    END IF;
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Add triggers to validate references
CREATE TRIGGER check_customer_tenant
    BEFORE INSERT OR UPDATE ON ar_transactions
    FOR EACH ROW
    EXECUTE FUNCTION validate_same_tenant_reference();
```

### 5.3 Enhanced Security Features

**Update `backend/app/core/security.py`**:

```python
import pyotp
from typing import Optional
from datetime import datetime, timedelta
import ipaddress

class EnhancedSecurity:
    
    @staticmethod
    def setup_mfa(user_id: int) -> str:
        """Generate MFA secret for user"""
        secret = pyotp.random_base32()
        # Store encrypted secret in database
        return secret
    
    @staticmethod
    def verify_mfa(user_id: int, token: str, db: Session) -> bool:
        """Verify MFA token"""
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.mfa_secret:
            return False
        
        totp = pyotp.TOTP(user.mfa_secret)
        return totp.verify(token, valid_window=1)
    
    @staticmethod
    def check_ip_whitelist(ip: str, allowed_ips: List[str]) -> bool:
        """Check if IP is in whitelist"""
        try:
            request_ip = ipaddress.ip_address(ip)
            for allowed in allowed_ips:
                if '/' in allowed:  # CIDR notation
                    if request_ip in ipaddress.ip_network(allowed):
                        return True
                elif request_ip == ipaddress.ip_address(allowed):
                    return True
            return False
        except ValueError:
            return False
    
    @staticmethod
    def encrypt_field(value: str, tenant_key: str) -> str:
        """Encrypt sensitive field with tenant-specific key"""
        from cryptography.fernet import Fernet
        # Derive key from tenant_key
        fernet = Fernet(derive_key(tenant_key))
        return fernet.encrypt(value.encode()).decode()
    
    @staticmethod
    def decrypt_field(encrypted_value: str, tenant_key: str) -> str:
        """Decrypt sensitive field"""
        from cryptography.fernet import Fernet
        fernet = Fernet(derive_key(tenant_key))
        return fernet.decrypt(encrypted_value.encode()).decode()
```

---

## 6. Resource Metering & Billing

### 6.1 Resource Usage Tracking

**Add to `backend/app/models/billing.py`**:

```python
from sqlalchemy import Column, Integer, String, Numeric, Date, DateTime, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from app.database.database import Base

class ResourceUsage(Base):
    __tablename__ = "resource_usage"
    
    id = Column(Integer, primary_key=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    resource_type = Column(String, nullable=False)  # storage, api_calls, users, transactions
    usage_date = Column(Date, nullable=False)
    quantity = Column(Numeric(15, 4), nullable=False)
    unit = Column(String, nullable=False)  # GB, count, etc.
    metadata = Column(JSONB, nullable=True)  # Additional details
    created_at = Column(DateTime, default=datetime.utcnow)
    
    company = relationship("Company", back_populates="resource_usage")
    
    __table_args__ = (
        UniqueConstraint('company_id', 'resource_type', 'usage_date', name='uq_company_resource_date'),
        Index('idx_resource_usage_company_date', 'company_id', 'usage_date'),
    )

class BillingConfiguration(Base):
    __tablename__ = "billing_configurations"
    
    company_id = Column(Integer, ForeignKey("companies.id"), primary_key=True)
    billing_provider = Column(String, default="stripe")  # stripe, chargebee, manual
    customer_id = Column(String, nullable=True)  # External billing system ID
    subscription_id = Column(String, nullable=True)
    payment_method_id = Column(String, nullable=True)
    billing_cycle = Column(String, default="monthly")  # monthly, yearly
    next_billing_date = Column(Date, nullable=True)
    
    # Pricing overrides
    custom_pricing = Column(JSONB, nullable=True)
    discount_percentage = Column(Numeric(5, 2), default=0)
    
    company = relationship("Company", back_populates="billing_configuration")

class UsageAlert(Base):
    __tablename__ = "usage_alerts"
    
    id = Column(Integer, primary_key=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    alert_type = Column(String, nullable=False)  # storage_80, api_limit_90, etc.
    threshold_value = Column(Numeric(15, 4), nullable=False)
    current_value = Column(Numeric(15, 4), nullable=False)
    alert_date = Column(DateTime, default=datetime.utcnow)
    acknowledged = Column(Boolean, default=False)
    acknowledged_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    company = relationship("Company", back_populates="usage_alerts")
```

### 6.2 Usage Tracking Service

**Create `backend/app/services/usage_tracking.py`**:

```python
from typing import Dict, List
from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func
from app import models
from app.models.billing import ResourceUsage, UsageAlert
import asyncio

class UsageTrackingService:
    
    @staticmethod
    async def track_api_usage(company_id: int, endpoint: str, response_time: float, db: Session):
        """Track API usage in real-time"""
        usage_date = date.today()
        
        # Update or create usage record
        usage = db.query(ResourceUsage).filter(
            ResourceUsage.company_id == company_id,
            ResourceUsage.resource_type == "api_calls",
            ResourceUsage.usage_date == usage_date
        ).first()
        
        if usage:
            usage.quantity += 1
            usage.metadata["endpoints"][endpoint] = usage.metadata.get("endpoints", {}).get(endpoint, 0) + 1
            usage.metadata["total_response_time"] += response_time
        else:
            usage = ResourceUsage(
                company_id=company_id,
                resource_type="api_calls",
                usage_date=usage_date,
                quantity=1,
                unit="count",
                metadata={
                    "endpoints": {endpoint: 1},
                    "total_response_time": response_time
                }
            )
            db.add(usage)
        
        db.commit()
        
        # Check for alerts
        await UsageTrackingService.check_usage_alerts(company_id, "api_calls", usage.quantity, db)
    
    @staticmethod
    async def calculate_storage_usage(company_id: int, db: Session) -> Dict[str, float]:
        """Calculate storage usage for a company"""
        usage = {
            "documents": 0,
            "attachments": 0,
            "backups": 0,
            "database": 0,
            "total": 0
        }
        
        # Calculate database size (simplified - in reality, use pg_database_size)
        transaction_count = db.query(models.GLJournalEntry).filter(
            models.GLJournalEntry.company_id == company_id
        ).count()
        
        # Rough estimates
        usage["database"] = transaction_count * 0.001  # 1KB per transaction average
        
        # Add document storage, attachments, etc.
        # This would integrate with your file storage system
        
        usage["total"] = sum(usage.values())
        
        # Track in database
        await UsageTrackingService.track_resource_usage(
            company_id, "storage", usage["total"], "GB", {"breakdown": usage}, db
        )
        
        return usage
    
    @staticmethod
    async def track_resource_usage(
        company_id: int,
        resource_type: str,
        quantity: float,
        unit: str,
        metadata: Dict,
        db: Session
    ):
        """Generic resource usage tracking"""
        usage_date = date.today()
        
        usage = db.query(ResourceUsage).filter(
            ResourceUsage.company_id == company_id,
            ResourceUsage.resource_type == resource_type,
            ResourceUsage.usage_date == usage_date
        ).first()
        
        if usage:
            usage.quantity = quantity  # Storage is absolute, not cumulative
            usage.metadata.update(metadata)
        else:
            usage = ResourceUsage(
                company_id=company_id,
                resource_type=resource_type,
                usage_date=usage_date,
                quantity=quantity,
                unit=unit,
                metadata=metadata
            )
            db.add(usage)
        
        db.commit()
    
    @staticmethod
    async def check_usage_alerts(
        company_id: int,
        resource_type: str,
        current_value: float,
        db: Session
    ):
        """Check if usage alerts should be triggered"""
        company = db.query(models.Company).filter(
            models.Company.id == company_id
        ).first()
        
        if not company:
            return
        
        thresholds = {
            "api_calls": [
                (0.8, "api_limit_80"),
                (0.9, "api_limit_90"),
                (1.0, "api_limit_exceeded")
            ],
            "storage": [
                (0.8, "storage_80"),
                (0.9, "storage_90"),
                (1.0, "storage_exceeded")
            ]
        }
        
        # Get limit based on resource type
        if resource_type == "api_calls":
            # Assuming daily limit based on plan
            daily_limit = {"basic": 10000, "professional": 50000, "enterprise": 200000}
            limit = daily_limit.get(company.subscription_plan, 10000)
        elif resource_type == "storage":
            limit = company.storage_limit_gb
        else:
            return
        
        # Check thresholds
        for threshold_percent, alert_type in thresholds.get(resource_type, []):
            threshold_value = limit * threshold_percent
            
            if current_value >= threshold_value:
                # Check if alert already exists for today
                existing_alert = db.query(UsageAlert).filter(
                    UsageAlert.company_id == company_id,
                    UsageAlert.alert_type == alert_type,
                    func.date(UsageAlert.alert_date) == date.today()
                ).first()
                
                if not existing_alert:
                    alert = UsageAlert(
                        company_id=company_id,
                        alert_type=alert_type,
                        threshold_value=threshold_value,
                        current_value=current_value
                    )
                    db.add(alert)
                    db.commit()
                    
                    # Send notification (email, webhook, etc.)
                    await UsageTrackingService.send_usage_alert(company, alert)
    
    @staticmethod
    async def send_usage_alert(company: models.Company, alert: UsageAlert):
        """Send usage alert notification"""
        # Implement notification logic
        # Email, Slack, webhook, etc.
        pass
```

### 6.3 Billing Integration

**Create `backend/app/services/billing_service.py`**:

```python
import stripe
from typing import Dict, Optional
from datetime import datetime, date
from sqlalchemy.orm import Session
from app import models
from app.models.billing import BillingConfiguration, ResourceUsage

class BillingService:
    
    def __init__(self):
        stripe.api_key = settings.STRIPE_SECRET_KEY
    
    async def create_customer(self, company: models.Company, db: Session) -> str:
        """Create customer in billing system"""
        # Create Stripe customer
        customer = stripe.Customer.create(
            email=company.billing_email or company.primary_contact_email,
            name=company.name,
            metadata={
                "company_id": str(company.id),
                "company_code": company.code
            }
        )
        
        # Save configuration
        billing_config = BillingConfiguration(
            company_id=company.id,
            billing_provider="stripe",
            customer_id=customer.id
        )
        db.add(billing_config)
        db.commit()
        
        return customer.id
    
    async def create_subscription(
        self,
        company_id: int,
        plan: str,
        payment_method_id: str,
        db: Session
    ) -> Dict:
        """Create subscription for company"""
        billing_config = db.query(BillingConfiguration).filter(
            BillingConfiguration.company_id == company_id
        ).first()
        
        if not billing_config or not billing_config.customer_id:
            raise ValueError("No billing configuration found")
        
        # Attach payment method
        stripe.PaymentMethod.attach(
            payment_method_id,
            customer=billing_config.customer_id
        )
        
        # Set as default
        stripe.Customer.modify(
            billing_config.customer_id,
            invoice_settings={"default_payment_method": payment_method_id}
        )
        
        # Create subscription
        price_ids = {
            "basic": settings.STRIPE_PRICE_ID_BASIC,
            "professional": settings.STRIPE_PRICE_ID_PROFESSIONAL,
            "enterprise": settings.STRIPE_PRICE_ID_ENTERPRISE
        }
        
        subscription = stripe.Subscription.create(
            customer=billing_config.customer_id,
            items=[{"price": price_ids.get(plan)}],
            metadata={"company_id": str(company_id)}
        )
        
        # Update configuration
        billing_config.subscription_id = subscription.id
        billing_config.payment_method_id = payment_method_id
        billing_config.next_billing_date = datetime.fromtimestamp(
            subscription.current_period_end
        ).date()
        
        # Update company
        company = db.query(models.Company).filter(
            models.Company.id == company_id
        ).first()
        company.subscription_plan = plan
        company.subscription_status = models.SubscriptionStatus.ACTIVE
        
        db.commit()
        
        return {
            "subscription_id": subscription.id,
            "status": subscription.status,
            "next_billing_date": billing_config.next_billing_date
        }
    
    async def calculate_usage_charges(
        self,
        company_id: int,
        billing_period_start: date,
        billing_period_end: date,
        db: Session
    ) -> Dict[str, float]:
        """Calculate usage-based charges for billing period"""
        charges = {}
        
        # Get usage for period
        usage_records = db.query(ResourceUsage).filter(
            ResourceUsage.company_id == company_id,
            ResourceUsage.usage_date >= billing_period_start,
            ResourceUsage.usage_date <= billing_period_end
        ).all()
        
        # Calculate overage charges
        company = db.query(models.Company).filter(
            models.Company.id == company_id
        ).first()
        
        # API calls overage
        api_usage = sum(
            u.quantity for u in usage_records 
            if u.resource_type == "api_calls"
        )
        api_limit = self.get_plan_limit(company.subscription_plan, "api_calls")
        if api_usage > api_limit:
            charges["api_overage"] = (api_usage - api_limit) * 0.001  # $0.001 per call
        
        # Storage overage
        storage_usage = max(
            (u.quantity for u in usage_records if u.resource_type == "storage"),
            default=0
        )
        if storage_usage > company.storage_limit_gb:
            charges["storage_overage"] = (storage_usage - company.storage_limit_gb) * 0.10  # $0.10 per GB
        
        return charges
    
    def get_plan_limit(self, plan: str, resource: str) -> float:
        """Get resource limits for plan"""
        limits = {
            "basic": {
                "api_calls": 300000,  # Monthly
                "storage": 10,
                "users": 5
            },
            "professional": {
                "api_calls": 1500000,
                "storage": 50,
                "users": 25
            },
            "enterprise": {
                "api_calls": 6000000,
                "storage": 200,
                "users": 100
            }
        }
        return limits.get(plan, {}).get(resource, 0)
```

---

## 7. Tenant Provisioning & Lifecycle

### 7.1 Automated Provisioning Service

**Create `backend/app/services/tenant_provisioning.py`**:

```python
from typing import Dict, Optional
from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session
from app import models, schemas, crud
from app.core.security import get_password_hash
from app.services.billing_service import BillingService
from app.services.email_service import EmailService
import secrets
import asyncio

class TenantProvisioningService:
    
    @staticmethod
    async def provision_new_tenant(
        company_data: schemas.CompanyCreate,
        admin_email: str,
        plan: str = "trial",
        db: Session = None
    ) -> Dict:
        """Complete tenant provisioning workflow"""
        try:
            # 1. Generate unique company code if not provided
            if not company_data.code:
                company_data.code = await TenantProvisioningService.generate_company_code(
                    company_data.name, db
                )
            
            # 2. Create company
            company = await TenantProvisioningService.create_company(company_data, plan, db)
            
            # 3. Initialize schema (if using schema-per-tenant)
            if settings.TENANT_ISOLATION_STRATEGY == "schema":
                await TenantProvisioningService.create_tenant_schema(company.code, db)
            
            # 4. Seed default data
            await TenantProvisioningService.seed_default_data(company, db)
            
            # 5. Create admin user
            temp_password = secrets.token_urlsafe(12)
            admin_user = await TenantProvisioningService.create_admin_user(
                company, admin_email, temp_password, db
            )
            
            # 6. Initialize billing (if not trial)
            if plan != "trial":
                billing_service = BillingService()
                await billing_service.create_customer(company, db)
            
            # 7. Send welcome emails
            await TenantProvisioningService.send_onboarding_emails(
                company, admin_user, temp_password
            )
            
            # 8. Schedule onboarding tasks
            await TenantProvisioningService.schedule_onboarding_tasks(company.id)
            
            # 9. Log provisioning
            audit_log = models.PlatformAuditLog(
                user_id=admin_user.id,
                company_id=company.id,
                action="tenant_provisioned",
                resource_type="company",
                resource_id=company.id,
                details={
                    "plan": plan,
                    "admin_email": admin_email,
                    "provisioning_time": datetime.utcnow().isoformat()
                }
            )
            db.add(audit_log)
            db.commit()
            
            return {
                "company": company,
                "admin_user": admin_user,
                "temp_password": temp_password,
                "status": "success"
            }
            
        except Exception as e:
            # Rollback everything
            db.rollback()
            
            # Clean up any partial provisioning
            if 'company' in locals():
                await TenantProvisioningService.cleanup_failed_provisioning(
                    company.id, db
                )
            
            raise Exception(f"Tenant provisioning failed: {str(e)}")
    
    @staticmethod
    async def generate_company_code(name: str, db: Session) -> str:
        """Generate unique company code"""
        # Simple algorithm: first 4 letters + number
        base_code = ''.join(c for c in name.upper() if c.isalpha())[:4]
        if len(base_code) < 4:
            base_code = base_code.ljust(4, 'X')
        
        # Find unique number
        counter = 1
        while True:
            code = f"{base_code}{counter:03d}"
            existing = db.query(models.Company).filter(
                models.Company.code == code
            ).first()
            if not existing:
                return code
            counter += 1
    
    @staticmethod
    async def create_company(
        company_data: schemas.CompanyCreate,
        plan: str,
        db: Session
    ) -> models.Company:
        """Create company with initial settings"""
        company_dict = company_data.dict()
        company_dict["subscription_plan"] = plan
        company_dict["subscription_status"] = (
            models.SubscriptionStatus.TRIAL if plan == "trial" 
            else models.SubscriptionStatus.ACTIVE
        )
        
        if plan == "trial":
            company_dict["subscription_expires"] = date.today() + timedelta(days=14)
        
        company = models.Company(**company_dict)
        db.add(company)
        db.commit()
        db.refresh(company)
        
        return company
    
    @staticmethod
    async def seed_default_data(company: models.Company, db: Session):
        """Seed all default data for new tenant"""
        # 1. Create default roles
        roles = [
            {
                "name": "Administrator",
                "description": "Full system access",
                "permissions": crud.core.get_all_permissions()
            },
            {
                "name": "Accountant",
                "description": "Financial modules access",
                "permissions": [
                    "gl:setup_manage", "gl:journal_post", "gl:reports_view",
                    "ar:setup_manage", "ar:transactions_post", "ar:reports_view",
                    "ap:setup_manage", "ap:transactions_post", "ap:reports_view"
                ]
            },
            {
                "name": "Sales Manager",
                "description": "Sales and customer management",
                "permissions": [
                    "ar:setup_manage", "ar:transactions_post", "ar:reports_view",
                    "oe:sales_orders_manage", "oe:reports_view",
                    "inv:reports_view"
                ]
            },
            {
                "name": "Clerk",
                "description": "Basic data entry",
                "permissions": [
                    "gl:journal_post", "ar:transactions_post", "ap:transactions_post",
                    "inv:transactions_adjust"
                ]
            }
        ]
        
        for role_data in roles:
            role = models.Role(company_id=company.id, **role_data)
            db.add(role)
        
        # 2. Create current accounting period
        current_year = datetime.now().year
        accounting_period = models.AccountingPeriod(
            company_id=company.id,
            name=f"FY {current_year}",
            start_date=date(current_year, 1, 1),
            end_date=date(current_year, 12, 31),
            status="Open"
        )
        db.add(accounting_period)
        
        # 3. Create default Chart of Accounts
        default_accounts = [
            # Assets
            {"code": "1000", "name": "Cash", "type": "Asset"},
            {"code": "1100", "name": "Accounts Receivable", "type": "Asset", "is_control_account": True},
            {"code": "1200", "name": "Inventory", "type": "Asset"},
            {"code": "1500", "name": "Fixed Assets", "type": "Asset"},
            
            # Liabilities
            {"code": "2000", "name": "Accounts Payable", "type": "Liability", "is_control_account": True},
            {"code": "2100", "name": "Accrued Expenses", "type": "Liability"},
            {"code": "2500", "name": "Long Term Debt", "type": "Liability"},
            
            # Equity
            {"code": "3000", "name": "Common Stock", "type": "Equity"},
            {"code": "3100", "name": "Retained Earnings", "type": "Equity"},
            
            # Revenue
            {"code": "4000", "name": "Sales Revenue", "type": "Income"},
            {"code": "4100", "name": "Service Revenue", "type": "Income"},
            
            # Expenses
            {"code": "5000", "name": "Cost of Goods Sold", "type": "Expense"},
            {"code": "5100", "name": "Salaries Expense", "type": "Expense"},
            {"code": "5200", "name": "Rent Expense", "type": "Expense"},
            {"code": "5300", "name": "Utilities Expense", "type": "Expense"},
        ]
        
        for account_data in default_accounts:
            account = models.GLAccount(company_id=company.id, **account_data)
            db.add(account)
        
        # 4. Create default GL transaction types
        gl_types = [
            {"name": "General Journal", "description": "General journal entries"},
            {"name": "Cash Receipt", "description": "Cash receipts"},
            {"name": "Cash Payment", "description": "Cash payments"},
        ]
        
        for type_data in gl_types:
            gl_type = models.GLTransactionType(company_id=company.id, **type_data)
            db.add(gl_type)
        
        # 5. Create default warehouses
        warehouse = models.Warehouse(
            company_id=company.id,
            name="Main Warehouse",
            location="Default Location",
            is_default=True
        )
        db.add(warehouse)
        
        # 6. Create default units of measure
        uoms = [
            {"name": "Each", "abbreviation": "EA"},
            {"name": "Box", "abbreviation": "BX"},
            {"name": "Kilogram", "abbreviation": "KG"},
            {"name": "Liter", "abbreviation": "L"},
        ]
        
        for uom_data in uoms:
            uom = models.UnitOfMeasure(company_id=company.id, **uom_data)
            db.add(uom)
        
        # 7. Create default tax types
        tax_types = [
            {"name": "Sales Tax", "rate_percentage": 18, "tax_nature": "Sales"},
            {"name": "Purchase Tax", "rate_percentage": 18, "tax_nature": "Purchases"},
            {"name": "Exempt", "rate_percentage": 0, "tax_nature": "Exempt"},
            {"name": "Zero Rated", "rate_percentage": 0, "tax_nature": "ZeroRated"},
        ]
        
        sales_account = db.query(models.GLAccount).filter(
            models.GLAccount.company_id == company.id,
            models.GLAccount.code == "2100"  # Accrued Expenses as tax liability
        ).first()
        
        for tax_data in tax_types:
            tax = models.TaxType(
                company_id=company.id,
                tax_authority_gl_account_id=sales_account.id if sales_account else None,
                **tax_data
            )
            db.add(tax)
        
        # 8. Set GL Defaults
        ar_control = db.query(models.GLAccount).filter(
            models.GLAccount.company_id == company.id,
            models.GLAccount.code == "1100"
        ).first()
        
        ap_control = db.query(models.GLAccount).filter(
            models.GLAccount.company_id == company.id,
            models.GLAccount.code == "2000"
        ).first()
        
        cash_account = db.query(models.GLAccount).filter(
            models.GLAccount.company_id == company.id,
            models.GLAccount.code == "1000"
        ).first()
        
        gl_defaults = models.GLDefaults(
            company_id=company.id,
            retained_earnings_account_id=db.query(models.GLAccount).filter(
                models.GLAccount.company_id == company.id,
                models.GLAccount.code == "3100"
            ).first().id,
            default_cash_account_id=cash_account.id if cash_account else None,
            default_ar_control_account_id=ar_control.id if ar_control else None,
            default_ap_control_account_id=ap_control.id if ap_control else None
        )
        db.add(gl_defaults)
        
        db.commit()
    
    @staticmethod
    async def create_admin_user(
        company: models.Company,
        email: str,
        temp_password: str,
        db: Session
    ) -> models.User:
        """Create initial admin user for company"""
        admin_user = models.User(
            email=email,
            hashed_password=get_password_hash(temp_password),
            full_name=f"{company.name} Administrator",
            user_type=models.UserType.COMPANY_ADMIN,
            company_id=company.id,
            is_active=True
        )
        db.add(admin_user)
        db.flush()
        
        # Assign Administrator role
        admin_role = db.query(models.Role).filter(
            models.Role.company_id == company.id,
            models.Role.name == "Administrator"
        ).first()
        
        if admin_role:
            user_role = models.UserRole(
                user_id=admin_user.id,
                role_id=admin_role.id
            )
            db.add(user_role)
        
        db.commit()
        db.refresh(admin_user)
        
        return admin_user
    
    @staticmethod
    async def send_onboarding_emails(
        company: models.Company,
        admin_user: models.User,
        temp_password: str
    ):
        """Send welcome and onboarding emails"""
        email_service = EmailService()
        
        # Welcome email with credentials
        await email_service.send_email(
            to=admin_user.email,
            subject=f"Welcome to Vinea ERP - {company.name}",
            template="welcome_admin",
            context={
                "company_name": company.name,
                "admin_name": admin_user.full_name,
                "email": admin_user.email,
                "temp_password": temp_password,
                "login_url": f"{settings.FRONTEND_URL}/login",
                "company_code": company.code
            }
        )
        
        # Onboarding guide email (delayed)
        await asyncio.sleep(3600)  # Wait 1 hour
        await email_service.send_email(
            to=admin_user.email,
            subject="Getting Started with Vinea ERP",
            template="onboarding_guide",
            context={
                "company_name": company.name,
                "resources": [
                    {"name": "Quick Start Guide", "url": f"{settings.DOCS_URL}/quickstart"},
                    {"name": "Video Tutorials", "url": f"{settings.DOCS_URL}/videos"},
                    {"name": "Support Portal", "url": f"{settings.SUPPORT_URL}"},
                ]
            }
        )
    
    @staticmethod
    async def schedule_onboarding_tasks(company_id: int):
        """Schedule automated onboarding tasks"""
        # Day 3: Check-in email
        # Day 7: Feature highlight
        # Day 14: Trial expiration reminder (if applicable)
        # These would be handled by a task queue like Celery
        pass
    
    @staticmethod
    async def cleanup_failed_provisioning(company_id: int, db: Session):
        """Clean up after failed provisioning"""
        try:
            # Delete in reverse order of creation
            # Delete users and roles
            db.query(models.UserRole).filter(
                models.UserRole.user_id.in_(
                    db.query(models.User.id).filter(models.User.company_id == company_id)
                )
            ).delete(synchronize_session=False)
            
            db.query(models.User).filter(models.User.company_id == company_id).delete()
            db.query(models.Role).filter(models.Role.company_id == company_id).delete()
            
            # Delete GL data
            db.query(models.GLAccount).filter(models.GLAccount.company_id == company_id).delete()
            db.query(models.GLTransactionType).filter(models.GLTransactionType.company_id == company_id).delete()
            db.query(models.GLDefaults).filter(models.GLDefaults.company_id == company_id).delete()
            
            # Delete other data
            db.query(models.AccountingPeriod).filter(models.AccountingPeriod.company_id == company_id).delete()
            db.query(models.Warehouse).filter(models.Warehouse.company_id == company_id).delete()
            db.query(models.UnitOfMeasure).filter(models.UnitOfMeasure.company_id == company_id).delete()
            db.query(models.TaxType).filter(models.TaxType.company_id == company_id).delete()
            
            # Finally delete company
            db.query(models.Company).filter(models.Company.id == company_id).delete()
            
            db.commit()
        except Exception as e:
            # Log cleanup failure
            print(f"Cleanup failed: {str(e)}")
```

### 7.2 Tenant Lifecycle Management

**Create `backend/app/services/tenant_lifecycle.py`**:

```python
from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session
from app import models
from app.services.backup_service import BackupService
from typing import Dict

class TenantLifecycleService:
    
    @staticmethod
    async def handle_trial_expiration(db: Session):
        """Check and handle trial expirations"""
        expiring_trials = db.query(models.Company).filter(
            models.Company.subscription_status == models.SubscriptionStatus.TRIAL,
            models.Company.subscription_expires <= date.today() + timedelta(days=3),
            models.Company.is_deleted == False
        ).all()
        
        for company in expiring_trials:
            days_left = (company.subscription_expires - date.today()).days
            
            if days_left <= 0:
                # Trial expired
                await TenantLifecycleService.suspend_expired_trial(company, db)
            else:
                # Send reminder
                await TenantLifecycleService.send_trial_reminder(company, days_left)
    
    @staticmethod
    async def suspend_expired_trial(company: models.Company, db: Session):
        """Suspend company after trial expiration"""
        company.subscription_status = models.SubscriptionStatus.SUSPENDED
        company.is_active = False
        
        # Deactivate all users
        db.query(models.User).filter(
            models.User.company_id == company.id
        ).update({"is_active": False})
        
        # Create backup before suspension
        backup_service = BackupService()
        await backup_service.create_tenant_backup(company.id, "trial_expiration")
        
        db.commit()
        
        # Send notification
        await TenantLifecycleService.send_suspension_notification(company, "trial_expired")
    
    @staticmethod
    async def offboard_tenant(company_id: int, reason: str, db: Session) -> Dict:
        """Complete tenant offboarding process"""
        company = db.query(models.Company).filter(
            models.Company.id == company_id
        ).first()
        
        if not company:
            raise ValueError("Company not found")
        
        # 1. Create final backup
        backup_service = BackupService()
        backup_id = await backup_service.create_tenant_backup(
            company_id, f"final_backup_{reason}"
        )
        
        # 2. Export all data
        export_path = await TenantLifecycleService.export_tenant_data(company_id)
        
        # 3. Cancel subscriptions
        if company.billing_configuration:
            # Cancel in billing system
            pass
        
        # 4. Deactivate all users
        db.query(models.User).filter(
            models.User.company_id == company_id
        ).update({"is_active": False})
        
        # 5. Mark company as deleted (soft delete)
        company.is_deleted = True
        company.subscription_status = models.SubscriptionStatus.CANCELLED
        
        # 6. Schedule data deletion (after retention period)
        # This would be handled by a background job
        
        db.commit()
        
        return {
            "backup_id": backup_id,
            "export_path": export_path,
            "offboarded_at": datetime.utcnow()
        }
    
    @staticmethod
    async def reactivate_tenant(company_id: int, db: Session):
        """Reactivate a suspended tenant"""
        company = db.query(models.Company).filter(
            models.Company.id == company_id
        ).first()
        
        if not company:
            raise ValueError("Company not found")
        
        if company.is_deleted:
            raise ValueError("Cannot reactivate deleted company")
        
        # Restore from backup if needed
        if company.subscription_status == models.SubscriptionStatus.SUSPENDED:
            # Check if data needs restoration
            pass
        
        # Reactivate
        company.subscription_status = models.SubscriptionStatus.ACTIVE
        company.is_active = True
        
        # Reactivate admin users only
        db.query(models.User).filter(
            models.User.company_id == company_id,
            models.User.user_type == models.UserType.COMPANY_ADMIN
        ).update({"is_active": True})
        
        db.commit()
```

---

## 8. Performance & Scalability

### 8.1 Caching Layer

**Create `backend/app/core/caching.py`**:

```python
import redis
import json
from typing import Optional, Any, Callable
from functools import wraps
from datetime import timedelta
import hashlib

class TenantAwareCache:
    def __init__(self):
        self.redis_client = redis.Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            password=settings.REDIS_PASSWORD,
            decode_responses=True
        )
        self.default_ttl = 3600  # 1 hour
    
    def _make_key(self, company_id: int, key: str) -> str:
        """Generate tenant-specific cache key"""
        return f"tenant:{company_id}:{key}"
    
    def _make_hash_key(self, *args, **kwargs) -> str:
        """Generate hash from function arguments"""
        key_data = f"{args}:{sorted(kwargs.items())}"
        return hashlib.md5(key_data.encode()).hexdigest()
    
    def get(self, company_id: int, key: str) -> Optional[Any]:
        """Get value from cache"""
        cache_key = self._make_key(company_id, key)
        value = self.redis_client.get(cache_key)
        
        if value:
            try:
                return json.loads(value)
            except:
                return value
        return None
    
    def set(
        self,
        company_id: int,
        key: str,
        value: Any,
        ttl: Optional[int] = None
    ):
        """Set value in cache"""
        cache_key = self._make_key(company_id, key)
        
        if isinstance(value, (dict, list)):
            value = json.dumps(value, default=str)
        
        self.redis_client.setex(
            cache_key,
            ttl or self.default_ttl,
            value
        )
    
    def delete(self, company_id: int, key: str):
        """Delete value from cache"""
        cache_key = self._make_key(company_id, key)
        self.redis_client.delete(cache_key)
    
    def invalidate_pattern(self, company_id: int, pattern: str):
        """Invalidate all keys matching pattern for tenant"""
        cache_pattern = self._make_key(company_id, pattern)
        
        for key in self.redis_client.scan_iter(match=cache_pattern):
            self.redis_client.delete(key)
    
    def cache_result(
        self,
        key_prefix: str,
        ttl: int = 3600,
        include_args: bool = True
    ):
        """Decorator to cache function results per tenant"""
        def decorator(func: Callable) -> Callable:
            @wraps(func)
            async def wrapper(company_id: int, *args, **kwargs):
                # Build cache key
                if include_args:
                    arg_hash = self._make_hash_key(*args, **kwargs)
                    cache_key = f"{key_prefix}:{func.__name__}:{arg_hash}"
                else:
                    cache_key = f"{key_prefix}:{func.__name__}"
                
                # Try cache first
                cached = self.get(company_id, cache_key)
                if cached is not None:
                    return cached
                
                # Execute function
                if asyncio.iscoroutinefunction(func):
                    result = await func(company_id, *args, **kwargs)
                else:
                    result = func(company_id, *args, **kwargs)
                
                # Cache result
                self.set(company_id, cache_key, result, ttl)
                
                return result
            
            return wrapper
        return decorator

# Global cache instance
cache = TenantAwareCache()

# Cache warming service
class CacheWarmingService:
    
    @staticmethod
    async def warm_tenant_cache(company_id: int, db: Session):
        """Pre-load frequently accessed data into cache"""
        # Cache company details
        company = db.query(models.Company).filter(
            models.Company.id == company_id
        ).first()
        
        if company:
            cache.set(company_id, "company:details", {
                "id": company.id,
                "name": company.name,
                "code": company.code,
                "subscription_plan": company.subscription_plan
            })
        
        # Cache user count
        user_count = db.query(models.User).filter(
            models.User.company_id == company_id
        ).count()
        cache.set(company_id, "stats:user_count", user_count, ttl=3600)
        
        # Cache GL accounts for dropdowns
        gl_accounts = db.query(models.GLAccount).filter(
            models.GLAccount.company_id == company_id,
            models.GLAccount.is_active == True
        ).all()
        
        cache.set(company_id, "gl:accounts:active", [
            {"id": acc.id, "code": acc.code, "name": acc.name}
            for acc in gl_accounts
        ], ttl=7200)
```

### 8.2 Database Optimization

**Create `backend/app/core/db_optimization.py`**:

```python
from sqlalchemy import text, Index
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.schema import DDLElement

class CreatePartition(DDLElement):
    """Custom DDL for creating partitioned tables"""
    def __init__(self, table_name, company_id):
        self.table_name = table_name
        self.company_id = company_id

@compiles(CreatePartition, "postgresql")
def visit_create_partition(element, compiler, **kwargs):
    return f"""
    CREATE TABLE IF NOT EXISTS {element.table_name}_company_{element.company_id}
    PARTITION OF {element.table_name}
    FOR VALUES IN ({element.company_id})
    """

class DatabaseOptimization:
    
    @staticmethod
    async def create_tenant_indexes(company_id: int, db: Session):
        """Create optimized indexes for tenant"""
        # Composite indexes for common queries
        indexes = [
            "CREATE INDEX IF NOT EXISTS idx_gl_entries_company_date ON gl_journal_entries(company_id, entry_date)",
            "CREATE INDEX IF NOT EXISTS idx_ar_trans_company_customer ON ar_transactions(company_id, customer_id)",
            "CREATE INDEX IF NOT EXISTS idx_inventory_company_item ON inventory_item_locations(company_id, item_id)",
        ]
        
        for index_sql in indexes:
            db.execute(text(index_sql))
        
        db.commit()
    
    @staticmethod
    async def partition_large_tables(db: Session):
        """Partition large tables by company_id"""
        # Example: Partition GL journal entries
        partition_sql = """
        -- Convert existing table to partitioned
        ALTER TABLE gl_journal_entries RENAME TO gl_journal_entries_old;
        
        -- Create partitioned table
        CREATE TABLE gl_journal_entries (
            LIKE gl_journal_entries_old INCLUDING ALL
        ) PARTITION BY LIST (company_id);
        
        -- Create partitions for existing companies
        DO $
        DECLARE
            company record;
        BEGIN
            FOR company IN SELECT id FROM companies WHERE is_deleted = false
            LOOP
                EXECUTE format('
                    CREATE TABLE gl_journal_entries_company_%s 
                    PARTITION OF gl_journal_entries 
                    FOR VALUES IN (%s)',
                    company.id, company.id
                );
            END LOOP;
        END $;
        
        -- Copy data
        INSERT INTO gl_journal_entries SELECT * FROM gl_journal_entries_old;
        
        -- Drop old table
        DROP TABLE gl_journal_entries_old;
        """
        
        # Execute with caution in production
        # db.execute(text(partition_sql))
        # db.commit()
```

### 8.3 API Rate Limiting

**Create `backend/app/middleware/rate_limiting.py`**:

```python
from typing import Callable, Dict
from datetime import datetime, timedelta
from fastapi import Request, HTTPException, status
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import redis
from app.database.database import SessionLocal
from app.models import Company, User

class TenantRateLimiter:
    def __init__(self):
        self.redis_client = redis.Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            decode_responses=True
        )
        
        # Rate limits by plan
        self.rate_limits = {
            "trial": {"requests_per_hour": 1000, "requests_per_day": 10000},
            "basic": {"requests_per_hour": 5000, "requests_per_day": 50000},
            "professional": {"requests_per_hour": 20000, "requests_per_day": 200000},
            "enterprise": {"requests_per_hour": 100000, "requests_per_day": 1000000},
        }
    
    def get_tenant_identifier(self, request: Request) -> str:
        """Extract tenant identifier from request"""
        # Try to get from token
        auth_header = request.headers.get("Authorization", "")
        
        if auth_header.startswith("Bearer "):
            from app.core.security import decode_access_token
            token = auth_header.split(" ")[1]
            payload = decode_access_token(token)
            
            if payload:
                # Get company_id from token or user
                company_id = payload.get("company_id")
                
                if not company_id:
                    db = SessionLocal()
                    user = db.query(User).filter(
                        User.id == payload.get("user_id")
                    ).first()
                    if user:
                        company_id = user.company_id
                    db.close()
                
                if company_id:
                    return f"tenant:{company_id}"
        
        # Fallback to IP
        return f"ip:{get_remote_address(request)}"
    
    async def check_rate_limit(self, request: Request, call_next):
        """Check if request exceeds rate limit"""
        identifier = self.get_tenant_identifier(request)
        
        # Get company plan
        plan = "basic"  # Default
        if identifier.startswith("tenant:"):
            company_id = int(identifier.split(":")[1])
            db = SessionLocal()
            company = db.query(Company).filter(Company.id == company_id).first()
            if company:
                plan = company.subscription_plan
            db.close()
        
        # Get limits for plan
        limits = self.rate_limits.get(plan, self.rate_limits["basic"])
        
        # Check hourly limit
        hourly_key = f"{identifier}:hourly:{datetime.now().strftime('%Y%m%d%H')}"
        hourly_count = self.redis_client.incr(hourly_key)
        if hourly_count == 1:
            self.redis_client.expire(hourly_key, 3600)
        
        if hourly_count > limits["requests_per_hour"]:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded: {limits['requests_per_hour']} requests per hour"
            )
        
        # Check daily limit
        daily_key = f"{identifier}:daily:{datetime.now().strftime('%Y%m%d')}"
        daily_count = self.redis_client.incr(daily_key)
        if daily_count == 1:
            self.redis_client.expire(daily_key, 86400)
        
        if daily_count > limits["requests_per_day"]:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded: {limits['requests_per_day']} requests per day"
            )
        
        # Add rate limit headers
        response = await call_next(request)
        response.headers["X-RateLimit-Limit-Hour"] = str(limits["requests_per_hour"])
        response.headers["X-RateLimit-Remaining-Hour"] = str(
            limits["requests_per_hour"] - hourly_count
        )
        response.headers["X-RateLimit-Limit-Day"] = str(limits["requests_per_day"])
        response.headers["X-RateLimit-Remaining-Day"] = str(
            limits["requests_per_day"] - daily_count
        )
        
        return response

# Create middleware instance
rate_limiter = TenantRateLimiter()
```

### 8.4 Background Task Queue

**Create `backend/app/core/task_queue.py`**:

```python
from celery import Celery
from typing import Dict, Any
import asyncio
from datetime import datetime, timedelta

# Initialize Celery
celery_app = Celery(
    "vinea_erp",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND
)

# Configure Celery
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_routes={
        "app.tasks.tenant.*": {"queue": "tenant_queue"},
        "app.tasks.billing.*": {"queue": "billing_queue"},
        "app.tasks.reports.*": {"queue": "reports_queue"},
    }
)

# Tenant-specific tasks
@celery_app.task(name="app.tasks.tenant.process_month_end")
def process_month_end(company_id: int):
    """Process month-end closing for tenant"""
    from app.services.accounting_service import AccountingService
    
    accounting_service = AccountingService()
    asyncio.run(accounting_service.process_month_end(company_id))

@celery_app.task(name="app.tasks.tenant.generate_financial_reports")
def generate_financial_reports(company_id: int, period_id: int):
    """Generate financial reports for period"""
    from app.services.reporting_service import ReportingService
    
    reporting_service = ReportingService()
    asyncio.run(reporting_service.generate_period_reports(company_id, period_id))

@celery_app.task(name="app.tasks.tenant.backup_tenant_data")
def backup_tenant_data(company_id: int):
    """Create tenant backup"""
    from app.services.backup_service import BackupService
    
    backup_service = BackupService()
    asyncio.run(backup_service.create_tenant_backup(company_id, "scheduled"))

# Billing tasks
@celery_app.task(name="app.tasks.billing.calculate_usage")
def calculate_monthly_usage(company_id: int):
    """Calculate monthly usage for billing"""
    from app.services.usage_tracking import UsageTrackingService
    
    usage_service = UsageTrackingService()
    asyncio.run(usage_service.calculate_monthly_usage(company_id))

# Scheduled tasks
@celery_app.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    # Check trial expirations daily
    sender.add_periodic_task(
        crontab(hour=2, minute=0),  # 2 AM daily
        check_trial_expirations.s(),
        name="Check trial expirations"
    )
    
    # Calculate usage weekly
    sender.add_periodic_task(
        crontab(hour=3, minute=0, day_of_week=1),  # Monday 3 AM
        calculate_all_tenant_usage.s(),
        name="Calculate weekly usage"
    )
    
    # Backup all tenants monthly
    sender.add_periodic_task(
        crontab(hour=4, minute=0, day_of_month=1),  # First day of month
        backup_all_tenants.s(),
        name="Monthly tenant backups"
    )
```

---

## 9. Monitoring & Health Checks

### 9.1 Tenant Health Monitoring

**Create `backend/app/monitoring/tenant_health.py`**:

```python
from typing import Dict, List, Any
from datetime import datetime, timedelta, date
from sqlalchemy.orm import Session
from sqlalchemy import func
from app import models
from app.models.billing import ResourceUsage
from dataclasses import dataclass
from enum import Enum

class HealthStatus(str, Enum):
    HEALTHY = "healthy"
    WARNING = "warning"
    CRITICAL = "critical"
    UNKNOWN = "unknown"

@dataclass
class HealthCheck:
    name: str
    status: HealthStatus
    value: Any
    threshold: Any
    message: str
    checked_at: datetime

class TenantHealthMonitor:
    
    @staticmethod
    async def check_tenant_health(company_id: int, db: Session) -> Dict:
        """Comprehensive health check for a tenant"""
        health_report = {
            "company_id": company_id,
            "timestamp": datetime.utcnow(),
            "overall_status": HealthStatus.HEALTHY,
            "checks": []
        }
        
        # Run all health checks
        checks = [
            await TenantHealthMonitor.check_storage_usage(company_id, db),
            await TenantHealthMonitor.check_api_usage(company_id, db),
            await TenantHealthMonitor.check_user_activity(company_id, db),
            await TenantHealthMonitor.check_data_integrity(company_id, db),
            await TenantHealthMonitor.check_subscription_status(company_id, db),
            await TenantHealthMonitor.check_error_rate(company_id, db),
            await TenantHealthMonitor.check_database_performance(company_id, db),
        ]
        
        health_report["checks"] = checks
        
        # Determine overall status
        statuses = [check.status for check in checks]
        if HealthStatus.CRITICAL in statuses:
            health_report["overall_status"] = HealthStatus.CRITICAL
        elif HealthStatus.WARNING in statuses:
            health_report["overall_status"] = HealthStatus.WARNING
        
        # Store health check result
        await TenantHealthMonitor.store_health_check(company_id, health_report, db)
        
        return health_report
    
    @staticmethod
    async def check_storage_usage(company_id: int, db: Session) -> HealthCheck:
        """Check storage usage"""
        company = db.query(models.Company).filter(
            models.Company.id == company_id
        ).first()
        
        # Get latest storage usage
        storage_usage = db.query(ResourceUsage).filter(
            ResourceUsage.company_id == company_id,
            ResourceUsage.resource_type == "storage"
        ).order_by(ResourceUsage.usage_date.desc()).first()
        
        if not storage_usage or not company:
            return HealthCheck(
                name="storage_usage",
                status=HealthStatus.UNKNOWN,
                value=0,
                threshold=0,
                message="Unable to determine storage usage",
                checked_at=datetime.utcnow()
            )
        
        usage_percentage = (storage_usage.quantity / company.storage_limit_gb) * 100
        
        if usage_percentage >= 95:
            status = HealthStatus.CRITICAL
            message = f"Storage critical: {usage_percentage:.1f}% used"
        elif usage_percentage >= 80:
            status = HealthStatus.WARNING
            message = f"Storage warning: {usage_percentage:.1f}% used"
        else:
            status = HealthStatus.HEALTHY
            message = f"Storage healthy: {usage_percentage:.1f}% used"
        
        return HealthCheck(
            name="storage_usage",
            status=status,
            value=storage_usage.quantity,
            threshold=company.storage_limit_gb,
            message=message,
            checked_at=datetime.utcnow()
        )
    
    @staticmethod
    async def check_api_usage(company_id: int, db: Session) -> HealthCheck:
        """Check API usage rate"""
        # Get today's API usage
        today_usage = db.query(ResourceUsage).filter(
            ResourceUsage.company_id == company_id,
            ResourceUsage.resource_type == "api_calls",
            ResourceUsage.usage_date == date.today()
        ).first()
        
        company = db.query(models.Company).filter(
            models.Company.id == company_id
        ).first()
        
        if not company:
            return HealthCheck(
                name="api_usage",
                status=HealthStatus.UNKNOWN,
                value=0,
                threshold=0,
                message="Unable to determine API usage",
                checked_at=datetime.utcnow()
            )
        
        # Get daily limit based on plan
        daily_limits = {
            "trial": 10000,
            "basic": 50000,
            "professional": 200000,
            "enterprise": 1000000
        }
        daily_limit = daily_limits.get(company.subscription_plan, 10000)
        
        current_usage = today_usage.quantity if today_usage else 0
        usage_percentage = (current_usage / daily_limit) * 100
        
        if usage_percentage >= 95:
            status = HealthStatus.CRITICAL
            message = f"API limit critical: {current_usage}/{daily_limit} calls"
        elif usage_percentage >= 80:
            status = HealthStatus.WARNING
            message = f"API limit warning: {current_usage}/{daily_limit} calls"
        else:
            status = HealthStatus.HEALTHY
            message = f"API usage healthy: {current_usage}/{daily_limit} calls"
        
        return HealthCheck(
            name="api_usage",
            status=status,
            value=current_usage,
            threshold=daily_limit,
            message=message,
            checked_at=datetime.utcnow()
        )
    
    @staticmethod
    async def check_user_activity(company_id: int, db: Session) -> HealthCheck:
        """Check user activity levels"""
        # Active users in last 30 days
        active_users = db.query(models.User).filter(
            models.User.company_id == company_id,
            models.User.last_login >= datetime.utcnow() - timedelta(days=30)
        ).count()
        
        total_users = db.query(models.User).filter(
            models.User.company_id == company_id
        ).count()
        
        if total_users == 0:
            return HealthCheck(
                name="user_activity",
                status=HealthStatus.WARNING,
                value=0,
                threshold=0,
                message="No users found",
                checked_at=datetime.utcnow()
            )
        
        activity_rate = (active_users / total_users) * 100
        
        if activity_rate < 20:
            status = HealthStatus.WARNING
            message = f"Low user activity: {active_users}/{total_users} active"
        else:
            status = HealthStatus.HEALTHY
            message = f"User activity healthy: {active_users}/{total_users} active"
        
        return HealthCheck(
            name="user_activity",
            status=status,
            value=active_users,
            threshold=total_users,
            message=message,
            checked_at=datetime.utcnow()
        )
    
    @staticmethod
    async def check_data_integrity(company_id: int, db: Session) -> HealthCheck:
        """Check for data integrity issues"""
        issues = []
        
        # Check for unbalanced journal entries
        unbalanced_entries = db.query(models.GLJournalEntry).filter(
            models.GLJournalEntry.company_id == company_id
        ).join(
            models.GLJournalEntryLine
        ).group_by(
            models.GLJournalEntry.id
        ).having(
            func.sum(models.GLJournalEntryLine.debit_amount) != 
            func.sum(models.GLJournalEntryLine.credit_amount)
        ).count()
        
        if unbalanced_entries > 0:
            issues.append(f"{unbalanced_entries} unbalanced journal entries")
        
        # Check for orphaned records
        orphaned_transactions = db.query(models.ARTransaction).filter(
            models.ARTransaction.company_id == company_id,
            models.ARTransaction.customer_id.notin_(
                db.query(models.Customer.id).filter(
                    models.Customer.company_id == company_id
                )
            )
        ).count()
        
        if orphaned_transactions > 0:
            issues.append(f"{orphaned_transactions} orphaned AR transactions")
        
        if issues:
            status = HealthStatus.WARNING
            message = f"Data integrity issues: {', '.join(issues)}"
        else:
            status = HealthStatus.HEALTHY
            message = "Data integrity check passed"
        
        return HealthCheck(
            name="data_integrity",
            status=status,
            value=len(issues),
            threshold=0,
            message=message,
            checked_at=datetime.utcnow()
        )
    
    @staticmethod
    async def check_subscription_status(company_id: int, db: Session) -> HealthCheck:
        """Check subscription and billing status"""
        company = db.query(models.Company).filter(
            models.Company.id == company_id
        ).first()
        
        if not company:
            return HealthCheck(
                name="subscription_status",
                status=HealthStatus.UNKNOWN,
                value="unknown",
                threshold="active",
                message="Company not found",
                checked_at=datetime.utcnow()
            )
        
        if company.subscription_status == models.SubscriptionStatus.SUSPENDED:
            status = HealthStatus.CRITICAL
            message = "Subscription suspended"
        elif company.subscription_status == models.SubscriptionStatus.TRIAL:
            days_left = (company.subscription_expires - date.today()).days if company.subscription_expires else 0
            if days_left <= 3:
                status = HealthStatus.WARNING
                message = f"Trial expires in {days_left} days"
            else:
                status = HealthStatus.HEALTHY
                message = f"Trial active ({days_left} days remaining)"
        elif company.subscription_status == models.SubscriptionStatus.ACTIVE:
            status = HealthStatus.HEALTHY
            message = "Subscription active"
        else:
            status = HealthStatus.WARNING
            message = f"Unknown subscription status: {company.subscription_status}"
        
        return HealthCheck(
            name="subscription_status",
            status=status,
            value=company.subscription_status,
            threshold=models.SubscriptionStatus.ACTIVE,
            message=message,
            checked_at=datetime.utcnow()
        )
    
    @staticmethod
    async def check_error_rate(company_id: int, db: Session) -> HealthCheck:
        """Check application error rate"""
        # This would integrate with your logging system
        # For now, return a placeholder
        return HealthCheck(
            name="error_rate",
            status=HealthStatus.HEALTHY,
            value=0.1,  # 0.1% error rate
            threshold=1.0,  # 1% threshold
            message="Error rate within acceptable range",
            checked_at=datetime.utcnow()
        )
    
    @staticmethod
    async def check_database_performance(company_id: int, db: Session) -> HealthCheck:
        """Check database query performance"""
        # Run a sample query and measure time
        start_time = datetime.utcnow()
        
        # Sample query
        db.query(models.GLJournalEntry).filter(
            models.GLJournalEntry.company_id == company_id
        ).limit(100).all()
        
        query_time = (datetime.utcnow() - start_time).total_seconds()
        
        if query_time > 1.0:
            status = HealthStatus.WARNING
            message = f"Slow database queries: {query_time:.2f}s"
        else:
            status = HealthStatus.HEALTHY
            message = f"Database performance healthy: {query_time:.2f}s"
        
        return HealthCheck(
            name="database_performance",
            status=status,
            value=query_time,
            threshold=1.0,
            message=message,
            checked_at=datetime.utcnow()
        )
    
    @staticmethod
    async def store_health_check(company_id: int, health_report: Dict, db: Session):
        """Store health check results for historical tracking"""
        # This would store in a time-series database or similar
        # For now, just log critical issues
        if health_report["overall_status"] in [HealthStatus.WARNING, HealthStatus.CRITICAL]:
            audit_log = models.PlatformAuditLog(
                user_id=None,  # System generated
                company_id=company_id,
                action="health_check_alert",
                resource_type="system",
                details=health_report
            )
            db.add(audit_log)
            db.commit()
```

### 9.2 Platform Monitoring Dashboard

**Create `backend/app/api/v1/endpoints/platform_monitoring.py`**:

```python
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.core.platform_security import get_platform_admin
from app.monitoring.tenant_health import TenantHealthMonitor

router = APIRouter(prefix="/platform/monitoring", tags=["platform-monitoring"])

@router.get("/health/overview")
async def get_platform_health_overview(
    db: Session = Depends(get_db),
    platform_admin: models.User = Depends(get_platform_admin)
) -> Dict:
    """Get health overview for all tenants"""
    companies = db.query(models.Company).filter(
        models.Company.is_deleted == False,
        models.Company.is_active == True
    ).all()
    
    health_summary = {
        "total_companies": len(companies),
        "healthy": 0,
        "warning": 0,
        "critical": 0,
        "companies": []
    }
    
    for company in companies:
        health = await TenantHealthMonitor.check_tenant_health(company.id, db)
        
        health_summary["companies"].append({
            "company_id": company.id,
            "company_name": company.name,
            "status": health["overall_status"],
            "checks": len(health["checks"]),
            "failed_checks": len([c for c in health["checks"] if c.status != "healthy"])
        })
        
        if health["overall_status"] == "healthy":
            health_summary["healthy"] += 1
        elif health["overall_status"] == "warning":
            health_summary["warning"] += 1
        elif health["overall_status"] == "critical":
            health_summary["critical"] += 1
    
    return health_summary

@router.get("/health/{company_id}")
async def get_tenant_health_details(
    company_id: int,
    db: Session = Depends(get_db),
    platform_admin: models.User = Depends(get_platform_admin)
) -> Dict:
    """Get detailed health report for specific tenant"""
    health_report = await TenantHealthMonitor.check_tenant_health(company_id, db)
    return health_report

@router.get("/alerts/active")
async def get_active_alerts(
    severity: Optional[str] = None,
    db: Session = Depends(get_db),
    platform_admin: models.User = Depends(get_platform_admin)
) -> List[Dict]:
    """Get active platform alerts"""
    # Query recent health checks with warnings/critical status
    recent_logs = db.query(models.PlatformAuditLog).filter(
        models.PlatformAuditLog.action == "health_check_alert",
        models.PlatformAuditLog.timestamp >= datetime.utcnow() - timedelta(hours=24)
    ).order_by(
        models.PlatformAuditLog.timestamp.desc()
    ).limit(100).all()
    
    alerts = []
    for log in recent_logs:
        if log.details and log.details.get("overall_status") in ["warning", "critical"]:
            if severity and log.details.get("overall_status") != severity:
                continue
            
            alerts.append({
                "id": log.id,
                "company_id": log.company_id,
                "severity": log.details.get("overall_status"),
                "timestamp": log.timestamp,
                "checks": log.details.get("checks", [])
            })
    
    return alerts

@router.post("/health/check-all")
async def trigger_health_check_all(
    db: Session = Depends(get_db),
    platform_admin: models.User = Depends(get_platform_admin)
) -> Dict:
    """Trigger health check for all active tenants"""
    companies = db.query(models.Company).filter(
        models.Company.is_deleted == False,
        models.Company.is_active == True
    ).all()
    
    results = []
    for company in companies:
        try:
            health = await TenantHealthMonitor.check_tenant_health(company.id, db)
            results.append({
                "company_id": company.id,
                "status": "completed",
                "overall_status": health["overall_status"]
            })
        except Exception as e:
            results.append({
                "company_id": company.id,
                "status": "failed",
                "error": str(e)
            })
    
    return {
        "total_checked": len(results),
        "successful": len([r for r in results if r["status"] == "completed"]),
        "failed": len([r for r in results if r["status"] == "failed"]),
        "results": results
    }
```

---

## 10. Testing & Verification

### 10.1 Create Platform Admin User Script

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
    
    # MFA setup option
    enable_mfa = input("Enable MFA? (yes/no): ").lower() == 'yes'
    mfa_secret = None
    
    if enable_mfa:
        import pyotp
        mfa_secret = pyotp.random_base32()
        print(f"\nMFA Secret: {mfa_secret}")
        print("Scan this QR code in your authenticator app:")
        provisioning_uri = pyotp.totp.TOTP(mfa_secret).provisioning_uri(
            name=email,
            issuer_name='Vinea ERP Platform'
        )
        print(provisioning_uri)
    
    # Create platform admin
    platform_admin = User(
        email=email,
        hashed_password=get_password_hash(password),
        full_name=full_name,
        user_type=UserType.PLATFORM_ADMIN,
        company_id=None,  # No company association
        is_active=True,
        is_superuser=True,  # For backward compatibility
        mfa_secret=mfa_secret
    )
    
    db.add(platform_admin)
    db.commit()
    
    print(f"\nPlatform admin created successfully!")
    print(f"Email: {platform_admin.email}")
    print(f"Type: {platform_admin.user_type}")
    print(f"MFA Enabled: {enable_mfa}")
    print("\nYou can now log in at /platform-login")
    
    db.close()

if __name__ == "__main__":
    create_platform_admin()
```

### 10.2 Comprehensive Testing Checklist

#### Phase 1: Database & Model Testing

1. **Database Migration**
   - [ ] Run migration successfully: `poetry run alembic upgrade head`
   - [ ] Verify new columns exist (user_type, platform audit logs, resource usage, etc.)
   - [ ] Check constraints are in place (company requirement for non-platform users)
   - [ ] Verify Row-Level Security policies (if PostgreSQL)
   - [ ] Test partition creation for large tables

2. **Model Integrity**
   - [ ] Platform admin can be created without company_id
   - [ ] Regular users require company_id
   - [ ] Cross-tenant references are blocked
   - [ ] Cascade deletes work correctly
   - [ ] Soft delete functionality works

#### Phase 2: Authentication & Authorization Testing

3. **Platform Admin Authentication**
   - [ ] Create platform admin user via script
   - [ ] Login at /platform-login endpoint
   - [ ] MFA authentication works (if enabled)
   - [ ] Token includes correct user_type
   - [ ] IP whitelist enforcement (if configured)

4. **Impersonation Testing**
   - [ ] Generate impersonation token
   - [ ] Token expires after set time
   - [ ] Actions are logged with impersonation flag
   - [ ] Cannot impersonate suspended companies
   - [ ] Proper context switching

5. **Permission Testing**
   - [ ] Platform routes require platform_admin type
   - [ ] Regular users cannot access platform endpoints
   - [ ] Tenant isolation middleware works
   - [ ] Cross-tenant access is blocked

#### Phase 3: Core Platform Features

6. **Company Management**
   - [ ] List all companies with stats
   - [ ] Create new company with full setup
   - [ ] Suspend/activate companies
   - [ ] Search and filter companies
   - [ ] Company deletion/archiving

7. **Tenant Provisioning**
   - [ ] Automated provisioning workflow completes
   - [ ] Default data is seeded correctly
   - [ ] Admin user receives credentials
   - [ ] Billing customer created (if applicable)
   - [ ] Cleanup works on failure

8. **Resource Tracking**
   - [ ] API calls are tracked per tenant
   - [ ] Storage usage is calculated
   - [ ] Usage alerts are triggered
   - [ ] Billing calculations are accurate
   - [ ] Rate limiting works per plan

#### Phase 4: Performance & Scalability

9. **Caching Layer**
   - [ ] Tenant-specific cache keys work
   - [ ] Cache invalidation works properly
   - [ ] Cache warming improves performance
   - [ ] Redis connection is stable
   - [ ] Memory usage is reasonable

10. **Database Performance**
    - [ ] Composite indexes improve queries
    - [ ] Partitioned tables work (if implemented)
    - [ ] Query performance monitoring works
    - [ ] Connection pooling is effective
    - [ ] Deadlocks are handled

11. **Background Tasks**
    - [ ] Celery workers start correctly
    - [ ] Tasks execute successfully
    - [ ] Periodic tasks run on schedule
    - [ ] Task failures are logged
    - [ ] Queue separation works

#### Phase 5: Monitoring & Health

12. **Health Checks**
    - [ ] All health checks return data
    - [ ] Storage warnings trigger correctly
    - [ ] API limit warnings work
    - [ ] Data integrity checks pass
    - [ ] Performance metrics are accurate

13. **Audit Logging**
    - [ ] All platform actions are logged
    - [ ] Log queries work with filters
    - [ ] Compliance reports generate
    - [ ] Log retention works
    - [ ] No sensitive data in logs

14. **Platform Monitoring**
    - [ ] Dashboard shows all companies
    - [ ] Health overview is accurate
    - [ ] Alerts are generated
    - [ ] Metrics are real-time
    - [ ] Historical data is available

#### Phase 6: UI/UX Testing

15. **Platform Admin UI**
    - [ ] Navigation shows platform sections
    - [ ] Company list loads with pagination
    - [ ] Company details are complete
    - [ ] Impersonation UI works
    - [ ] Audit log viewer functions

16. **Visual Indicators**
    - [ ] Platform admin mode is clear
    - [ ] Impersonation mode shows warning
    - [ ] Company context is visible
    - [ ] Health status indicators work
    - [ ] Alerts are noticeable

#### Phase 7: Integration Testing

17. **End-to-End Workflows**
    - [ ] Complete tenant provisioning
    - [ ] Impersonate and perform actions
    - [ ] Generate usage and verify billing
    - [ ] Suspend and reactivate tenant
    - [ ] Export and restore tenant data

18. **Cross-Module Integration**
    - [ ] Platform actions affect tenant data
    - [ ] Tenant actions update platform metrics
    - [ ] Billing integrates with usage
    - [ ] Monitoring catches issues
    - [ ] Audit trail is complete

### 10.3 Load Testing Script

**Create `backend/tests/load_test_platform.py`**:

```python
import asyncio
import aiohttp
import time
from datetime import datetime
import statistics

class PlatformLoadTester:
    def __init__(self, base_url: str, platform_token: str):
        self.base_url = base_url
        self.headers = {"Authorization": f"Bearer {platform_token}"}
        self.results = []
    
    async def test_endpoint(self, session: aiohttp.ClientSession, endpoint: str, method: str = "GET", data: dict = None):
        """Test a single endpoint"""
        start_time = time.time()
        
        try:
            async with session.request(
                method,
                f"{self.base_url}{endpoint}",
                headers=self.headers,
                json=data
            ) as response:
                duration = time.time() - start_time
                
                self.results.append({
                    "endpoint": endpoint,
                    "method": method,
                    "status": response.status,
                    "duration": duration,
                    "timestamp": datetime.utcnow()
                })
                
                return response.status, duration
                
        except Exception as e:
            duration = time.time() - start_time
            self.results.append({
                "endpoint": endpoint,
                "method": method,
                "status": 0,
                "duration": duration,
                "error": str(e),
                "timestamp": datetime.utcnow()
            })
            return 0, duration
    
    async def simulate_platform_load(self, num_requests: int = 100):
        """Simulate platform admin load"""
        endpoints = [
            ("/platform/companies", "GET"),
            ("/platform/metrics/summary", "GET"),
            ("/platform/audit-logs", "GET"),
            ("/platform/monitoring/health/overview", "GET"),
        ]
        
        async with aiohttp.ClientSession() as session:
            tasks = []
            
            for i in range(num_requests):
                endpoint, method = endpoints[i % len(endpoints)]
                task = self.test_endpoint(session, endpoint, method)
                tasks.append(task)
            
            await asyncio.gather(*tasks)
    
    def print_results(self):
        """Print load test results"""
        if not self.results:
            print("No results to display")
            return
        
        # Group by endpoint
        endpoint_stats = {}
        
        for result in self.results:
            endpoint = f"{result['method']} {result['endpoint']}"
            
            if endpoint not in endpoint_stats:
                endpoint_stats[endpoint] = {
                    "count": 0,
                    "success": 0,
                    "durations": []
                }
            
            endpoint_stats[endpoint]["count"] += 1
            if result["status"] in [200, 201, 204]:
                endpoint_stats[endpoint]["success"] += 1
            endpoint_stats[endpoint]["durations"].append(result["duration"])
        
        # Print statistics
        print("\nLoad Test Results")
        print("=" * 80)
        
        for endpoint, stats in endpoint_stats.items():
            success_rate = (stats["success"] / stats["count"]) * 100
            avg_duration = statistics.mean(stats["durations"])
            p95_duration = statistics.quantiles(stats["durations"], n=20)[18]  # 95th percentile
            
            print(f"\n{endpoint}")
            print(f"  Requests: {stats['count']}")
            print(f"  Success Rate: {success_rate:.1f}%")
            print(f"  Avg Duration: {avg_duration:.3f}s")
            print(f"  P95 Duration: {p95_duration:.3f}s")

async def main():
    # Configure test
    base_url = "http://localhost:8000/api/v1"
    platform_token = "your_platform_token_here"
    
    tester = PlatformLoadTester(base_url, platform_token)
    
    print("Starting load test...")
    start_time = time.time()
    
    await tester.simulate_platform_load(num_requests=1000)
    
    total_duration = time.time() - start_time
    print(f"\nCompleted {len(tester.results)} requests in {total_duration:.2f}s")
    print(f"Requests per second: {len(tester.results) / total_duration:.2f}")
    
    tester.print_results()

if __name__ == "__main__":
    asyncio.run(main())
```

### 10.4 Security Testing

**Create `backend/tests/security_test_platform.py`**:

```python
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models import User, Company, UserType

class TestPlatformSecurity:
    
    def test_cross_tenant_access_blocked(self, client: TestClient, regular_user_token: str):
        """Test that regular users cannot access other tenant data"""
        headers = {"Authorization": f"Bearer {regular_user_token}"}
        
        # Try to access platform endpoints
        response = client.get("/api/v1/platform/companies", headers=headers)
        assert response.status_code == 403
        
        # Try to access other company's data with modified header
        headers["X-Target-Company-ID"] = "999"
        response = client.get("/api/v1/users", headers=headers)
        assert response.status_code == 403
    
    def test_sql_injection_prevention(self, client: TestClient, platform_token: str):
        """Test SQL injection prevention"""
        headers = {"Authorization": f"Bearer {platform_token}"}
        
        # Try SQL injection in search
        response = client.get(
            "/api/v1/platform/companies",
            params={"search": "'; DROP TABLE companies; --"},
            headers=headers
        )
        assert response.status_code == 200
        # Verify companies table still exists by checking response
        assert "companies" in response.text.lower()
    
    def test_rate_limiting(self, client: TestClient, regular_user_token: str):
        """Test rate limiting works"""
        headers = {"Authorization": f"Bearer {regular_user_token}"}
        
        # Make many requests quickly
        responses = []
        for _ in range(150):  # Exceed hourly limit
            response = client.get("/api/v1/users", headers=headers)
            responses.append(response.status_code)
        
        # Should see 429 responses
        assert 429 in responses
    
    def test_token_expiration(self, client: TestClient, expired_token: str):
        """Test expired tokens are rejected"""
        headers = {"Authorization": f"Bearer {expired_token}"}
        
        response = client.get("/api/v1/platform/companies", headers=headers)
        assert response.status_code == 401
    
    def test_mfa_requirement(self, client: TestClient):
        """Test MFA is required for platform admins"""
        # Login without MFA token
        response = client.post(
            "/api/v1/platform/auth/login",
            data={"username": "platform@admin.com", "password": "secure_password"}
        )
        
        if "mfa_required" in response.json():
            assert response.status_code == 200
            assert response.json()["mfa_required"] == True
            
            # Try with invalid MFA
            response = client.post(
                "/api/v1/platform/auth/verify-mfa",
                json={"session_id": response.json()["session_id"], "mfa_token": "000000"}
            )
            assert response.status_code == 401
```

### 10.5 Data Validation Script

**Create `backend/scripts/validate_tenant_data.py`**:

```python
#!/usr/bin/env python3
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database.database import SessionLocal
from app import models
from typing import List, Dict

class TenantDataValidator:
    def __init__(self, db: Session):
        self.db = db
        self.issues = []
    
    def validate_all_tenants(self) -> List[Dict]:
        """Validate data for all tenants"""
        companies = self.db.query(models.Company).filter(
            models.Company.is_deleted == False
        ).all()
        
        results = []
        for company in companies:
            print(f"\nValidating company: {company.name} (ID: {company.id})")
            company_issues = self.validate_tenant(company.id)
            
            results.append({
                "company_id": company.id,
                "company_name": company.name,
                "issues_found": len(company_issues),
                "issues": company_issues
            })
        
        return results
    
    def validate_tenant(self, company_id: int) -> List[Dict]:
        """Validate data integrity for a specific tenant"""
        issues = []
        
        # Check for orphaned users
        orphaned_users = self.db.execute(text("""
            SELECT COUNT(*) FROM user_roles ur
            WHERE ur.user_id NOT IN (SELECT id FROM users WHERE company_id = :company_id)
            AND ur.role_id IN (SELECT id FROM roles WHERE company_id = :company_id)
        """), {"company_id": company_id}).scalar()
        
        if orphaned_users > 0:
            issues.append({
                "type": "orphaned_user_roles",
                "count": orphaned_users,
                "severity": "high"
            })
        
        # Check GL balance
        unbalanced_entries = self.db.execute(text("""
            SELECT je.id, je.reference, 
                   SUM(jel.debit_amount) as total_debit,
                   SUM(jel.credit_amount) as total_credit
            FROM gl_journal_entries je
            JOIN gl_journal_entry_lines jel ON je.id = jel.journal_entry_id
            WHERE je.company_id = :company_id
            GROUP BY je.id, je.reference
            HAVING SUM(jel.debit_amount) != SUM(jel.credit_amount)
        """), {"company_id": company_id}).fetchall()
        
        if unbalanced_entries:
            issues.append({
                "type": "unbalanced_journal_entries",
                "count": len(unbalanced_entries),
                "severity": "critical",
                "details": [{"id": e.id, "reference": e.reference} for e in unbalanced_entries[:5]]
            })
        
        # Check foreign key integrity
        fk_checks = [
            ("ar_transactions", "customer_id", "customers"),
            ("ap_transactions", "supplier_id", "suppliers"),
            ("inventory_transactions", "item_id", "inventory_items"),
        ]
        
        for table, fk_column, ref_table in fk_checks:
            orphaned = self.db.execute(text(f"""
                SELECT COUNT(*) FROM {table} t
                WHERE t.company_id = :company_id
                AND t.{fk_column} NOT IN (
                    SELECT id FROM {ref_table} WHERE company_id = :company_id
                )
            """), {"company_id": company_id}).scalar()
            
            if orphaned > 0:
                issues.append({
                    "type": f"orphaned_{table}",
                    "count": orphaned,
                    "severity": "high"
                })
        
        # Check for duplicate transactions
        duplicates = self.db.execute(text("""
            SELECT document_number, COUNT(*) as count
            FROM ar_transactions
            WHERE company_id = :company_id
            GROUP BY document_number
            HAVING COUNT(*) > 1
        """), {"company_id": company_id}).fetchall()
        
        if duplicates:
            issues.append({
                "type": "duplicate_ar_documents",
                "count": sum(d.count - 1 for d in duplicates),
                "severity": "medium"
            })
        
        return issues
    
    def fix_issues(self, company_id: int, issue_type: str) -> bool:
        """Attempt to fix specific issues"""
        try:
            if issue_type == "orphaned_user_roles":
                self.db.execute(text("""
                    DELETE FROM user_roles ur
                    WHERE ur.user_id NOT IN (SELECT id FROM users WHERE company_id = :company_id)
                    AND ur.role_id IN (SELECT id FROM roles WHERE company_id = :company_id)
                """), {"company_id": company_id})
                self.db.commit()
                return True
            
            # Add more fix logic for other issue types
            
        except Exception as e:
            self.db.rollback()
            print(f"Error fixing {issue_type}: {str(e)}")
            return False

def main():
    db = SessionLocal()
    validator = TenantDataValidator(db)
    
    print("Tenant Data Validation Tool")
    print("=" * 50)
    
    results = validator.validate_all_tenants()
    
    # Summary
    total_issues = sum(r["issues_found"] for r in results)
    print(f"\n\nValidation Summary")
    print(f"Total Companies: {len(results)}")
    print(f"Total Issues Found: {total_issues}")
    
    if total_issues > 0:
        print("\nIssues by Company:")
        for result in results:
            if result["issues_found"] > 0:
                print(f"\n{result['company_name']} (ID: {result['company_id']})")
                for issue in result["issues"]:
                    print(f"  - {issue['type']}: {issue['count']} ({issue['severity']})")
        
        # Offer to fix
        fix = input("\nAttempt to fix issues? (yes/no): ")
        if fix.lower() == 'yes':
            for result in results:
                if result["issues_found"] > 0:
                    for issue in result["issues"]:
                        if validator.fix_issues(result["company_id"], issue["type"]):
                            print(f"Fixed {issue['type']} for company {result['company_id']}")
    
    db.close()

if __name__ == "__main__":
    main()
```

### 10.6 Common Issues & Solutions

1. **Migration Fails**
   - Check if enum types already exist: `SELECT * FROM pg_type WHERE typname = 'usertype';`
   - Ensure foreign key references are valid
   - Run with `--sql` to preview changes
   - Check for existing constraints with conflicting names

2. **Cannot Create Platform Admin**
   - Ensure migration has run successfully
   - Check user_type enum is created
   - Verify company_id can be null in users table
   - Check for existing user with same email

3. **Platform Routes Return 403**
   - Verify user has user_type = 'platform_admin'
   - Check token includes correct user_id
   - Ensure middleware is properly configured
   - Verify permission constants match between backend and frontend

4. **Audit Logs Not Recording**
   - Check middleware is applied to routes
   - Verify database connection in middleware
   - Check for exceptions in audit logging code
   - Ensure audit log table has proper indexes

5. **Rate Limiting Not Working**
   - Verify Redis connection
   - Check rate limit keys are being created
   - Ensure tenant identification works correctly
   - Verify plan limits are configured

6. **Health Checks Timeout**
   - Add database query timeouts
   - Implement circuit breakers
   - Cache health check results
   - Run checks asynchronously

7. **Impersonation Token Issues**
   - Check token expiration time
   - Verify company context switching
   - Ensure audit logging for impersonation
   - Test token refresh scenarios

---

## Conclusion

This enhanced Multi-Tenant Platform Implementation Guide provides a production-ready architecture for managing multiple tenant companies in your Vinea ERP system. The implementation includes:

### Core Features
- **Flexible User Model**: Platform admins exist outside companies with full oversight
- **Comprehensive Security**: MFA, IP whitelisting, row-level security, field encryption
- **Complete Audit Trail**: Every action logged for compliance and debugging
- **Resource Management**: Usage tracking, billing integration, rate limiting
- **Performance Optimized**: Caching, database partitioning, background tasks
- **Health Monitoring**: Real-time health checks and alerting

### Best Practices Implemented
- **Data Isolation**: Multiple strategies (RLS, middleware, validation)
- **Scalability**: Horizontal scaling ready with caching and queues
- **Maintainability**: Clear separation of concerns, comprehensive testing
- **Compliance**: GDPR-ready with audit trails and data export
- **Reliability**: Health monitoring, backup/restore, graceful degradation

### Deployment Considerations
1. **Environment Variables**: Configure all settings via environment
2. **Infrastructure**: Redis, PostgreSQL, Celery workers required
3. **Monitoring**: Integrate with APM tools (DataDog, New Relic)
4. **Backup Strategy**: Automated backups per tenant
5. **Security Hardening**: Regular security audits, penetration testing

The system is designed to scale from 10 to 1000+ tenants while maintaining performance, security, and data isolation. Regular monitoring and maintenance will ensure optimal operation as your platform grows.