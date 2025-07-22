from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List
from datetime import date, datetime
from enum import Enum
from app.models.core import UserType

# User Type Enum
class UserType(str, Enum):
    PLATFORM_ADMIN = "platform_admin"
    COMPANY_ADMIN = "company_admin"
    COMPANY_USER = "company_user"

# Subscription Status Enum
class SubscriptionStatus(str, Enum):
    TRIAL = "trial"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    CANCELLED = "cancelled"

# Company Schemas
class CompanyBase(BaseModel):
    name: str
    code: str
    address: Optional[dict] = None
    contact_info: Optional[dict] = None
    default_currency_code: Optional[str] = None
    is_active: bool = True
    subscription_status: str = 'trial'
    subscription_start_date: Optional[date] = None
    subscription_end_date: Optional[date] = None
    subscription_plan: Optional[str] = None

    @validator('subscription_status')
    def validate_subscription_status(cls, v):
        valid_statuses = ['trial', 'active', 'suspended', 'cancelled']
        if v not in valid_statuses:
            raise ValueError(f"Invalid subscription status: {v}")
        return v

class CompanyCreate(CompanyBase):
    # Additional fields required for company creation
    subscription_expires: Optional[date] = None
    primary_contact_email: Optional[str] = None
    billing_email: Optional[str] = None
    storage_limit_gb: Optional[int] = 10
    user_limit: Optional[int] = 5

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[dict] = None
    contact_info: Optional[dict] = None
    default_currency_code: Optional[str] = None
    is_active: Optional[bool] = None
    subscription_status: Optional[str] = None
    subscription_plan: Optional[str] = None
    subscription_start_date: Optional[date] = None
    subscription_end_date: Optional[date] = None
    subscription_expires: Optional[date] = None
    primary_contact_email: Optional[str] = None
    billing_email: Optional[str] = None
    storage_limit_gb: Optional[int] = None
    user_limit: Optional[int] = None

class Company(CompanyBase):
    id: int
    created_at: Optional[datetime] = None
    created_by_user_id: Optional[int] = None
    is_deleted: bool = False
    subscription_expires: Optional[date] = None
    primary_contact_email: Optional[str] = None
    billing_email: Optional[str] = None
    storage_limit_gb: Optional[int] = None
    user_limit: Optional[int] = None
    
    class Config:
        from_attributes = True

class CompanyWithStats(BaseModel):
    company: Company
    user_count: int
    active_users_30d: int
    transaction_count: int
    storage_used_gb: float

# Role Schemas
class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None
    permissions: List[str] = []

class RoleCreate(RoleBase):
    pass

class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    permissions: Optional[List[str]] = None

class Role(RoleBase):
    id: int
    company_id: int
    
    class Config:
        from_attributes = True

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    is_active: bool = True
    is_superuser: bool = False

class UserCreate(UserBase):
    password: str
    user_type: Optional[str] = "company_user"
    company_id: Optional[int] = None

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = None
    is_superuser: Optional[bool] = None
    password: Optional[str] = None
    user_type: Optional[str] = None
    company_id: Optional[int] = None

class User(UserBase):
    id: int
    user_type: UserType
    company_id: Optional[int] = None
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Platform User Schema (extends User with company info)
class PlatformUser(User):
    company_name: Optional[str] = None
    company_code: Optional[str] = None

# Accounting Period Schemas
class AccountingPeriodBase(BaseModel):
    name: str
    start_date: date
    end_date: date
    status: str = "Open"

class AccountingPeriodCreate(AccountingPeriodBase):
    pass

class AccountingPeriodUpdate(BaseModel):
    name: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = None

class AccountingPeriod(AccountingPeriodBase):
    id: int
    company_id: int
    
    class Config:
        from_attributes = True

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    is_platform_admin: Optional[bool] = False

class TokenData(BaseModel):
    email: Optional[str] = None
    user_id: Optional[int] = None
    permissions: List[str] = []

class TokenPayload(BaseModel):
    sub: Optional[int] = None  # user ID
    user_type: Optional[str] = None
    company_id: Optional[int] = None
    exp: Optional[int] = None

# Platform Audit Log Schemas
class PlatformAuditLogBase(BaseModel):
    action: str
    resource_type: Optional[str] = None
    resource_id: Optional[int] = None
    details: Optional[dict] = None

class PlatformAuditLogCreate(PlatformAuditLogBase):
    user_id: int
    company_id: Optional[int] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None

class PlatformAuditLog(PlatformAuditLogBase):
    id: int
    user_id: int
    company_id: Optional[int] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    timestamp: datetime
    
    class Config:
        from_attributes = True

# Platform-specific schemas
class ImpersonationRequest(BaseModel):
    reason: Optional[str] = "Platform administration"

class ImpersonationToken(BaseModel):
    access_token: str
    token_type: str = "bearer"
    company: Company
    expires_in: int

class PlatformMetrics(BaseModel):
    total_companies: int
    active_companies: int
    suspended_companies: int
    trial_companies: int
    total_users: int
    active_users_today: int
    total_transactions: int
    revenue_this_month: Optional[float] = None

class CompanyHealthMetrics(BaseModel):
    company_id: int
    company_name: str
    subscription_status: str
    user_count: int
    user_limit: int
    storage_used_gb: float
    storage_limit_gb: int
    storage_percentage: float
    health_status: str  # "healthy", "warning", "critical"

class AuditLogFilters(BaseModel):
    company_id: Optional[int] = None
    user_id: Optional[int] = None
    action: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
