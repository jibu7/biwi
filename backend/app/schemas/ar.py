from pydantic import BaseModel, validator
from typing import Optional, List
from datetime import date
from decimal import Decimal

# Customer Schemas
class CustomerBase(BaseModel):
    customer_code: str
    name: str
    address: Optional[dict] = None
    contact_info: Optional[dict] = None
    payment_terms: Optional[str] = None
    credit_limit: Decimal = Decimal('0.00')
    sales_representative_id: Optional[int] = None
    default_ar_gl_account_id: Optional[int] = None
    is_active: bool = True

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    customer_code: Optional[str] = None
    name: Optional[str] = None
    address: Optional[dict] = None
    contact_info: Optional[dict] = None
    payment_terms: Optional[str] = None
    credit_limit: Optional[Decimal] = None
    sales_representative_id: Optional[int] = None
    default_ar_gl_account_id: Optional[int] = None
    is_active: Optional[bool] = None

class Customer(CustomerBase):
    id: int
    company_id: int
    current_balance: Decimal
    
    class Config:
        from_attributes = True

# Sales Representative Schemas
class SalesRepresentativeBase(BaseModel):
    name: str
    contact_info: Optional[dict] = None
    is_active: bool = True

class SalesRepresentativeCreate(SalesRepresentativeBase):
    pass

class SalesRepresentativeUpdate(BaseModel):
    name: Optional[str] = None
    contact_info: Optional[dict] = None
    is_active: Optional[bool] = None

class SalesRepresentative(SalesRepresentativeBase):
    id: int
    company_id: int
    
    class Config:
        from_attributes = True

# AR Transaction Type Schemas
class ARTransactionTypeBase(BaseModel):
    name: str
    description: Optional[str] = None
    base_type: str  # Invoice, Receipt, Credit Note, Journal
    default_gl_account_id: Optional[int] = None
    default_ar_control_gl_account_id: Optional[int] = None
    affects_balance_direction: str  # Debit or Credit
    is_active: bool = True

class ARTransactionTypeCreate(ARTransactionTypeBase):
    pass

class ARTransactionTypeUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    base_type: Optional[str] = None
    default_gl_account_id: Optional[int] = None
    default_ar_control_gl_account_id: Optional[int] = None
    affects_balance_direction: Optional[str] = None
    is_active: Optional[bool] = None

class ARTransactionType(ARTransactionTypeBase):
    id: int
    company_id: int
    
    class Config:
        from_attributes = True

# AR Transaction Schemas
class ARTransactionBase(BaseModel):
    customer_id: int
    ar_transaction_type_id: int
    transaction_date: date
    due_date: Optional[date] = None
    reference: Optional[str] = None
    total_amount: Decimal
    
    @validator('total_amount')
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError('Amount must be positive')
        return v

class ARTransactionCreate(ARTransactionBase):
    pass

class ARTransactionUpdate(BaseModel):
    transaction_date: Optional[date] = None
    due_date: Optional[date] = None
    reference: Optional[str] = None
    status: Optional[str] = None

class ARTransaction(ARTransactionBase):
    id: int
    company_id: int
    document_number: str
    open_amount: Decimal
    is_posted_to_gl: bool
    status: str
    linked_gl_journal_entry_id: Optional[int] = None
    
    class Config:
        from_attributes = True

# AR Allocation Schemas
class ARAllocationLineCreate(BaseModel):
    debit_transaction_id: int
    credit_transaction_id: int
    allocated_amount: Decimal
    
    @validator('allocated_amount')
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError('Allocated amount must be positive')
        return v

class ARAllocationLine(ARAllocationLineCreate):
    id: int
    ar_allocation_id: int
    
    class Config:
        from_attributes = True

class ARAllocationBase(BaseModel):
    allocation_date: date
    customer_id: int

class ARAllocationCreate(ARAllocationBase):
    lines: List[ARAllocationLineCreate]
    
    @validator('lines')
    def validate_lines(cls, v):
        if not v:
            raise ValueError('At least one allocation line is required')
        return v

class ARAllocation(ARAllocationBase):
    id: int
    company_id: int
    lines: List[ARAllocationLine] = []
    
    class Config:
        from_attributes = True

# AR Defaults Schemas
class ARDefaultsBase(BaseModel):
    default_ar_control_gl_account_id: Optional[int] = None
    default_sales_gl_account_id: Optional[int] = None
    default_receipt_gl_account_id: Optional[int] = None
    default_sales_discount_gl_account_id: Optional[int] = None

class ARDefaultsCreate(ARDefaultsBase):
    pass

class ARDefaultsUpdate(ARDefaultsBase):
    pass

class ARDefaults(ARDefaultsBase):
    id: int
    company_id: int
    
    class Config:
        from_attributes = True

# Report Schemas
class CustomerAgeing(BaseModel):
    customer_id: int
    customer_code: str
    customer_name: str
    current: Decimal
    days_30: Decimal
    days_60: Decimal
    days_90: Decimal
    days_120_plus: Decimal
    total_due: Decimal

class CustomerStatement(BaseModel):
    customer: Customer
    opening_balance: Decimal
    transactions: List[ARTransaction]
    closing_balance: Decimal
    period_start: date
    period_end: date
