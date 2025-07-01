from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date, datetime
from app.models.core import UserType

# Company Schemas
class CompanyBase(BaseModel):
    name: str
    code: str
    address: Optional[dict] = None
    contact_info: Optional[dict] = None
    default_currency_code: Optional[str] = None
    is_active: bool = True
    
    # Multi-tenant specific fields
    subscription_status: str = "trial"
    subscription_plan: Optional[str] = None
    subscription_expires: Optional[date] = None
    storage_limit_gb: int = 10
    user_limit: int = 5
    
    # Contact and billing
    primary_contact_email: Optional[str] = None
    billing_email: Optional[str] = None

class CompanyCreate(CompanyBase):
    pass

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    address: Optional[dict] = None
    contact_info: Optional[dict] = None
    default_currency_code: Optional[str] = None
    is_active: Optional[bool] = None
    subscription_status: Optional[str] = None
    subscription_plan: Optional[str] = None
    subscription_expires: Optional[date] = None
    storage_limit_gb: Optional[int] = None
    user_limit: Optional[int] = None
    primary_contact_email: Optional[str] = None
    billing_email: Optional[str] = None

class Company(CompanyBase):
    id: int
    created_at: Optional[datetime] = None
    created_by_user_id: Optional[int] = None
    is_deleted: bool = False
    
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
    user_type: UserType = UserType.COMPANY_USER

class UserCreate(UserBase):
    password: str
    company_id: Optional[int] = None  # Required for non-platform users

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    is_superuser: Optional[bool] = None
    user_type: Optional[UserType] = None
    default_company_id: Optional[int] = None

class User(UserBase):
    id: int
    company_id: Optional[int] = None
    default_company_id: Optional[int] = None
    last_login: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

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

class TokenData(BaseModel):
    email: Optional[str] = None
    user_id: Optional[int] = None
    permissions: List[str] = []

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
