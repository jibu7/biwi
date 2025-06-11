from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date

# Company Schemas
class CompanyBase(BaseModel):
    name: str
    address: Optional[dict] = None
    contact_info: Optional[dict] = None
    default_currency_code: Optional[str] = None
    is_active: bool = True

class CompanyCreate(CompanyBase):
    pass

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[dict] = None
    contact_info: Optional[dict] = None
    default_currency_code: Optional[str] = None
    is_active: Optional[bool] = None

class Company(CompanyBase):
    id: int
    
    class Config:
        from_attributes = True

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

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    is_superuser: Optional[bool] = None

class User(UserBase):
    id: int
    company_id: int
    
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
