from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from decimal import Decimal


# Currency Schemas
class CurrencyBase(BaseModel):
    code: str = Field(..., min_length=3, max_length=3, description="ISO currency code (e.g., USD, EUR)")
    name: str = Field(..., min_length=1, max_length=100, description="Full currency name")
    symbol: str = Field(..., max_length=5, description="Currency symbol")
    exchange_rate_to_base: Decimal = Field(default=Decimal("1.000000"), ge=Decimal("0.000001"), le=Decimal("999999"), description="Exchange rate to base currency")
    is_base_currency: bool = Field(default=False, description="Whether this is the base currency")
    is_active: bool = Field(default=True, description="Whether currency is active")
    decimal_places: int = Field(default=2, ge=0, le=10, description="Number of decimal places")
    symbol_position: str = Field(default="prefix", description="Symbol position: prefix or suffix")


class CurrencyCreate(CurrencyBase):
    # company_id must NOT be required from the frontend
    pass


class CurrencyUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    symbol: Optional[str] = Field(None, max_length=5)
    exchange_rate_to_base: Optional[Decimal] = Field(None, ge=Decimal("0.000001"), le=Decimal("999999"))
    is_base_currency: Optional[bool] = None
    is_active: Optional[bool] = None
    decimal_places: Optional[int] = Field(None, ge=0, le=10)
    symbol_position: Optional[str] = None


class Currency(CurrencyBase):
    id: int
    company_id: int

    class Config:
        from_attributes = True

# Extended Currency Read Schema
class CurrencyRead(CurrencyBase):
    id: int
    decimal_places: int
    symbol_position: str
    
    class Config:
        from_attributes = True


# Tax Type Schemas
class TaxTypeBase(BaseModel):
    name: str = Field(..., description="Tax type name")
    rate_percentage: Decimal = Field(..., ge=0, le=999.99, description="Tax rate percentage (0-999.99)")
    tax_authority_gl_account_id: Optional[int] = Field(None, description="GL account for tax authority")
    tax_code: Optional[str] = Field(None, description="External tax code")
    tax_nature: str = Field(..., description="Tax nature: Sales, Purchases, Exempt, ZeroRated")
    is_active: bool = Field(default=True, description="Whether tax type is active")


class TaxTypeCreate(TaxTypeBase):
    # company_id must NOT be required from the frontend
    pass


class TaxTypeUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1)
    rate_percentage: Optional[Decimal] = Field(None, ge=0, le=999.99)
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
    # company_id must NOT be required from the frontend
    pass


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


# Generic Document Line with Tax Schema for Tax Calculations
class DocumentLineWithTax(BaseModel):
    quantity: Decimal = Field(..., gt=0, description="Line item quantity")
    unit_price: Decimal = Field(..., ge=0, description="Unit price")
    discount_percentage: Decimal = Field(default=Decimal("0"), ge=0, le=100, description="Discount percentage")
    tax_type_id: Optional[int] = Field(None, description="Tax type ID for line item")

    class Config:
        from_attributes = True
