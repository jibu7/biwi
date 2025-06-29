from pydantic import BaseModel, validator
from typing import Optional, List
from datetime import date
from decimal import Decimal

# Supplier Schemas
class SupplierBase(BaseModel):
    supplier_code: str
    name: str
    address: Optional[dict] = None
    contact_info: Optional[dict] = None
    payment_terms: Optional[str] = None
    default_ap_gl_account_id: Optional[int] = None
    default_currency_id: Optional[int] = None
    is_active: bool = True

class SupplierCreate(SupplierBase):
    pass

class SupplierUpdate(BaseModel):
    supplier_code: Optional[str] = None
    name: Optional[str] = None
    address: Optional[dict] = None
    contact_info: Optional[dict] = None
    payment_terms: Optional[str] = None
    default_ap_gl_account_id: Optional[int] = None
    default_currency_id: Optional[int] = None
    is_active: Optional[bool] = None

class Supplier(SupplierBase):
    id: int
    company_id: int
    current_balance: Decimal
    
    class Config:
        from_attributes = True

# AP Transaction Type Schemas
class APTransactionTypeBase(BaseModel):
    name: str
    description: Optional[str] = None
    base_type: str  # Supplier Invoice, Payment, Debit Note, Journal
    default_gl_account_id: Optional[int] = None
    default_ap_control_gl_account_id: Optional[int] = None
    affects_balance_direction: str  # Credit or Debit
    is_active: bool = True

class APTransactionTypeCreate(APTransactionTypeBase):
    pass

class APTransactionTypeUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    base_type: Optional[str] = None
    default_gl_account_id: Optional[int] = None
    default_ap_control_gl_account_id: Optional[int] = None
    affects_balance_direction: Optional[str] = None
    is_active: Optional[bool] = None

class APTransactionType(APTransactionTypeBase):
    id: int
    company_id: int
    
    class Config:
        from_attributes = True

# AP Transaction Schemas
class APTransactionBase(BaseModel):
    supplier_id: int
    ap_transaction_type_id: int
    transaction_date: date
    due_date: Optional[date] = None
    reference: Optional[str] = None
    total_amount: Decimal
    
    @validator('total_amount')
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError('Amount must be positive')
        return v

class APTransactionCreate(APTransactionBase):
    pass

class APTransactionUpdate(BaseModel):
    transaction_date: Optional[date] = None
    due_date: Optional[date] = None
    reference: Optional[str] = None
    status: Optional[str] = None

class APTransaction(APTransactionBase):
    id: int
    company_id: int
    document_number: str
    open_amount: Decimal
    is_posted_to_gl: bool
    status: str
    linked_gl_journal_entry_id: Optional[int] = None
    
    class Config:
        from_attributes = True

# AP Allocation Schemas
class APAllocationLineCreate(BaseModel):
    credit_transaction_id: int  # Supplier Invoice
    debit_transaction_id: int   # Payment/Debit Note
    allocated_amount: Decimal
    
    @validator('allocated_amount')
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError('Allocated amount must be positive')
        return v

class APAllocationLine(APAllocationLineCreate):
    id: int
    ap_allocation_id: int
    
    class Config:
        from_attributes = True

class APAllocationBase(BaseModel):
    allocation_date: date
    supplier_id: int

class APAllocationCreate(APAllocationBase):
    lines: List[APAllocationLineCreate]
    
    @validator('lines')
    def validate_lines(cls, v):
        if not v:
            raise ValueError('At least one allocation line is required')
        return v

class APAllocation(APAllocationBase):
    id: int
    company_id: int
    lines: List[APAllocationLine] = []
    
    class Config:
        from_attributes = True

# AP Defaults Schemas
class APDefaultsBase(BaseModel):
    default_ap_control_gl_account_id: Optional[int] = None
    default_expense_gl_account_id: Optional[int] = None
    default_payment_gl_account_id: Optional[int] = None
    default_purchase_discount_gl_account_id: Optional[int] = None

class APDefaultsCreate(APDefaultsBase):
    pass

class APDefaultsUpdate(APDefaultsBase):
    pass

class APDefaults(APDefaultsBase):
    id: int
    company_id: int
    
    class Config:
        from_attributes = True

# Report Schemas
class SupplierAgeing(BaseModel):
    supplier_id: int
    supplier_code: str
    supplier_name: str
    current: Decimal
    days_30: Decimal
    days_60: Decimal
    days_90: Decimal
    days_120_plus: Decimal
    total_due: Decimal

class SupplierStatement(BaseModel):
    supplier: Supplier
    opening_balance: Decimal
    transactions: List[APTransaction]
    closing_balance: Decimal
    period_start: date
    period_end: date
