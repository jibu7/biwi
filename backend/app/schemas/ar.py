from pydantic import BaseModel, validator
from typing import Optional, List
from datetime import date, datetime
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
    document_number: Optional[str] = None

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
    customer_name: Optional[str] = None
    ar_transaction_type_name: Optional[str] = None
    
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
    default_bad_debt_gl_account_id: Optional[int] = None

class ARDefaultsCreate(ARDefaultsBase):
    pass

class ARDefaultsUpdate(ARDefaultsBase):
    pass

class ARDefaults(ARDefaultsBase):
    id: int
    company_id: int
    
    class Config:
        from_attributes = True

# AR Write-off Schemas
class ARWriteOffBase(BaseModel):
    customer_id: int
    original_invoice_id: int
    writeoff_date: date
    writeoff_amount: Decimal
    reason_code: str
    reason_description: Optional[str] = None
    
    @validator('writeoff_amount')
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError('Write-off amount must be positive')
        return v
    
    @validator('reason_code')
    def validate_reason_code(cls, v):
        valid_codes = ['UNCOLLECTIBLE', 'CUSTOMER_BANKRUPTCY', 'SMALL_BALANCE', 'DISPUTE_RESOLUTION', 'OTHER']
        if v not in valid_codes:
            raise ValueError(f'Reason code must be one of: {", ".join(valid_codes)}')
        return v

class ARWriteOffCreate(ARWriteOffBase):
    pass

class ARWriteOffUpdate(BaseModel):
    writeoff_date: Optional[date] = None
    writeoff_amount: Optional[Decimal] = None
    reason_code: Optional[str] = None
    reason_description: Optional[str] = None

class ARWriteOffApproval(BaseModel):
    approval_decision: str  # APPROVE or REJECT
    approval_notes: Optional[str] = None
    
    @validator('approval_decision')
    def validate_decision(cls, v):
        if v not in ['APPROVE', 'REJECT']:
            raise ValueError('Approval decision must be APPROVE or REJECT')
        return v

class ARWriteOff(ARWriteOffBase):
    id: int
    company_id: int
    ar_transaction_type_id: int
    document_number: str
    status: str
    requested_by_user_id: int
    approved_by_user_id: Optional[int] = None
    approval_date: Optional[datetime] = None
    approval_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    linked_gl_journal_entry_id: Optional[int] = None
    
    # Relationships (populated by CRUD)
    customer: Optional[Customer] = None
    original_invoice: Optional[ARTransaction] = None
    
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

class CustomerAgingReportItem(BaseModel):
    """Customer aging report item matching frontend interface"""
    customer_id: int
    customer_name: str
    current_balance: Decimal
    current: Decimal
    days_1_30: Decimal
    days_31_60: Decimal
    days_61_90: Decimal
    over_90: Decimal
    
    @classmethod
    def from_customer_ageing(cls, customer_ageing: CustomerAgeing):
        """Convert CustomerAgeing to CustomerAgingReportItem"""
        return cls(
            customer_id=customer_ageing.customer_id,
            customer_name=customer_ageing.customer_name,
            current_balance=customer_ageing.total_due,
            current=customer_ageing.current,
            days_1_30=customer_ageing.days_30,
            days_31_60=customer_ageing.days_60,
            days_61_90=customer_ageing.days_90,
            over_90=customer_ageing.days_120_plus
        )

class CustomerStatement(BaseModel):
    customer: Customer
    opening_balance: Decimal
    transactions: List[ARTransaction]
    closing_balance: Decimal
    period_start: date
    period_end: date

# Customer Write-off Analytics
class CustomerWriteOffSummary(BaseModel):
    total_writeoffs: Decimal
    writeoff_count: int
    last_writeoff_date: Optional[date] = None
    writeoff_percentage: Decimal  # Percentage of total sales written off
    risk_level: str  # LOW, MEDIUM, HIGH based on writeoff_percentage

class CustomerCreditAnalysis(BaseModel):
    customer_id: int
    current_balance: Decimal
    credit_limit: Decimal
    credit_utilization: Decimal  # Percentage of credit limit used
    writeoff_summary: CustomerWriteOffSummary
    overdue_amount: Decimal
    days_overdue: int
    recommended_action: str  # INCREASE_LIMIT, DECREASE_LIMIT, HOLD_ORDERS, REVIEW

# Enhanced Customer schema with write-off data
class CustomerWithAnalytics(Customer):
    writeoff_summary: Optional[CustomerWriteOffSummary] = None
    credit_analysis: Optional[CustomerCreditAnalysis] = None

# Financial Reporting Schemas
class BadDebtExpenseReport(BaseModel):
    period_start: date
    period_end: date
    total_writeoffs: Decimal
    writeoff_count: int
    writeoffs_by_reason: List[dict]  # [{"reason_code": "...", "amount": ..., "count": ...}]
    writeoffs_by_customer: List[dict]  # [{"customer_name": "...", "amount": ..., "count": ...}]
    recovery_amount: Decimal  # Payments received after write-off

class ARAgingWithWriteoffs(BaseModel):
    customer_id: int
    customer_code: str
    customer_name: str
    current: Decimal
    days_30: Decimal
    days_60: Decimal
    days_90: Decimal
    days_120_plus: Decimal
    total_due: Decimal
    total_writeoffs_ytd: Decimal
    writeoff_percentage: Decimal
    risk_level: str

class WriteOffRecovery(BaseModel):
    writeoff_id: int
    writeoff_document_number: str
    original_writeoff_amount: Decimal
    recovery_amount: Decimal
    recovery_date: date
    recovery_percentage: Decimal
    customer_name: str

class PLReportLine(BaseModel):
    account_code: str
    account_name: str
    current_period: Decimal
    ytd_amount: Decimal
    prior_year: Decimal
    variance: Decimal
