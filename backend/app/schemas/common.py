from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from decimal import Decimal


# Currency Schemas
class CurrencyBase(BaseModel):
    code: str = Field(..., max_length=3, description="ISO currency code (e.g., USD, EUR)")
    name: str = Field(..., description="Full currency name")
    symbol: Optional[str] = Field(None, max_length=5, description="Currency symbol")
    exchange_rate_to_base: Decimal = Field(default=Decimal("1.000000"), description="Exchange rate to base currency")
    is_base_currency: bool = Field(default=False, description="Whether this is the base currency")
    is_active: bool = Field(default=True, description="Whether currency is active")


class CurrencyCreate(CurrencyBase):
    company_id: int


class CurrencyUpdate(BaseModel):
    name: Optional[str] = None
    symbol: Optional[str] = None
    exchange_rate_to_base: Optional[Decimal] = None
    is_base_currency: Optional[bool] = None
    is_active: Optional[bool] = None


class Currency(CurrencyBase):
    id: int
    company_id: int

    class Config:
        from_attributes = True


# Tax Type Schemas
class TaxTypeBase(BaseModel):
    name: str = Field(..., description="Tax type name")
    rate_percentage: Decimal = Field(..., description="Tax rate percentage")
    tax_authority_gl_account_id: Optional[int] = Field(None, description="GL account for tax authority")
    tax_code: Optional[str] = Field(None, description="External tax code")
    tax_nature: str = Field(..., description="Tax nature: Sales, Purchases, Exempt, ZeroRated")
    is_active: bool = Field(default=True, description="Whether tax type is active")


class TaxTypeCreate(TaxTypeBase):
    company_id: int


class TaxTypeUpdate(BaseModel):
    name: Optional[str] = None
    rate_percentage: Optional[Decimal] = None
    tax_authority_gl_account_id: Optional[int] = None
    tax_code: Optional[str] = None
    tax_nature: Optional[str] = None
    is_active: Optional[bool] = None


class TaxType(TaxTypeBase):
    id: int
    company_id: int

    class Config:
        from_attributes = True


# Branch Schemas
class BranchBase(BaseModel):
    name: str = Field(..., description="Branch name")
    address: Optional[Dict[str, Any]] = Field(None, description="Branch address (JSON)")
    contact_info: Optional[Dict[str, Any]] = Field(None, description="Contact information (JSON)")
    default_gl_segment_code: Optional[str] = Field(None, description="Default GL segment code")
    is_active: bool = Field(default=True, description="Whether branch is active")


class BranchCreate(BranchBase):
    company_id: int


class BranchUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[Dict[str, Any]] = None
    contact_info: Optional[Dict[str, Any]] = None
    default_gl_segment_code: Optional[str] = None
    is_active: Optional[bool] = None


class Branch(BranchBase):
    id: int
    company_id: int

    class Config:
        from_attributes = True
