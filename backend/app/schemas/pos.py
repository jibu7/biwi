from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from decimal import Decimal

# Till Schemas
class TillBase(BaseModel):
    till_number: str
    name: str
    location: Optional[str] = None
    hardware_config: Optional[dict] = None
    is_active: bool = True
    default_warehouse_id: int
    default_customer_id: Optional[int] = None
    branch_id: Optional[int] = None

class TillCreate(TillBase):
    pass

class TillUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    hardware_config: Optional[dict] = None
    is_active: Optional[bool] = None
    default_warehouse_id: Optional[int] = None
    default_customer_id: Optional[int] = None
    branch_id: Optional[int] = None

class Till(TillBase):
    id: int
    company_id: int
    
    class Config:
        from_attributes = True

# Till Session Schemas
class TillSessionOpen(BaseModel):
    till_id: int
    opening_balance: Decimal = Field(..., ge=0)

class POSSessionCreate(BaseModel):
    till_id: int
    opening_cash: Decimal = Field(..., ge=0)

class TillSessionClose(BaseModel):
    actual_closing_balance: Decimal = Field(..., ge=0)
    reconciliation_notes: Optional[str] = None

class TillReconciliationDetail(BaseModel):
    payment_method: str
    counted_amount: Decimal
    notes: Optional[str] = None

class TillSessionReconcile(BaseModel):
    reconciliation_details: List[TillReconciliationDetail]

class TillSession(BaseModel):
    id: int
    till_id: int
    user_id: int
    opening_date: datetime
    closing_date: Optional[datetime]
    opening_balance: Decimal
    expected_closing_balance: Optional[Decimal]
    actual_closing_balance: Optional[Decimal]
    variance: Optional[Decimal]
    status: str
    
    class Config:
        from_attributes = True

# POS Transaction Type Schemas
class POSTransactionTypeBase(BaseModel):
    name: str
    base_type: str
    default_payment_method: Optional[str] = None
    gl_account_id: Optional[int] = None
    is_active: bool = True

class POSTransactionTypeCreate(POSTransactionTypeBase):
    pass

class POSTransactionTypeUpdate(BaseModel):
    name: Optional[str] = None
    default_payment_method: Optional[str] = None
    gl_account_id: Optional[int] = None
    is_active: Optional[bool] = None

class POSTransactionType(POSTransactionTypeBase):
    id: int
    company_id: int
    
    class Config:
        from_attributes = True

# POS Transaction Line Schemas
class POSTransactionLineCreate(BaseModel):
    item_id: int
    quantity: Decimal = Field(..., gt=0)
    unit_price: Decimal
    discount_percentage: Decimal = Field(default=0, ge=0, le=100)
    discount_amount: Decimal = Field(default=0, ge=0)
    tax_type_id: Optional[int] = None

class POSTransactionLineRead(POSTransactionLineCreate):
    id: int
    description: str
    tax_amount: Decimal
    line_total: Decimal
    
    class Config:
        from_attributes = True

# POS Payment Schemas
class POSPaymentCreate(BaseModel):
    payment_method: str
    amount: Decimal = Field(..., gt=0)
    reference_number: Optional[str] = None
    payment_details: Optional[dict] = None

class POSPaymentRead(POSPaymentCreate):
    id: int
    
    class Config:
        from_attributes = True

# POS Transaction Schemas
class POSTransactionCreate(BaseModel):
    customer_id: Optional[int] = None
    transaction_type_id: int
    lines: List[POSTransactionLineCreate]
    payments: List[POSPaymentCreate]
    discount_amount: Decimal = Field(default=0, ge=0)

class POSTransactionRead(BaseModel):
    id: int
    transaction_number: str
    transaction_date: datetime
    customer_id: Optional[int]
    subtotal: Decimal
    tax_amount: Decimal
    discount_amount: Decimal
    total_amount: Decimal
    status: str
    lines: List[POSTransactionLineRead]
    payments: List[POSPaymentRead]
    
    class Config:
        from_attributes = True

class POSReturnCreate(BaseModel):
    original_transaction_id: int
    return_lines: List[POSTransactionLineCreate]
    reason: str

class POSCashMovementCreate(BaseModel):
    session_id: int
    movement_type: str  # "cash_in" or "cash_out"
    amount: Decimal = Field(..., gt=0)
    reason: str
    reference: Optional[str] = None

# POS Defaults Schemas
class POSDefaultsBase(BaseModel):
    default_walk_in_customer_id: Optional[int] = None
    receipt_header: Optional[str] = None
    receipt_footer: Optional[str] = None
    auto_print_receipt: bool = True
    allow_negative_stock: bool = False
    require_customer_for_credit: bool = True
    default_tax_type_id: Optional[int] = None
    cash_rounding_method: str = "None"
    cash_rounding_precision: Decimal = 0.01

class POSDefaultsCreate(POSDefaultsBase):
    pass

class POSDefaultsUpdate(POSDefaultsBase):
    pass

class POSDefaults(POSDefaultsBase):
    id: int
    company_id: int
    
    class Config:
        from_attributes = True

# Receipt Schema
class ReceiptData(BaseModel):
    transaction: POSTransactionRead
    company_info: dict
    till_info: dict
    cashier_name: str
    receipt_header: Optional[str]
    receipt_footer: Optional[str]

# Aliases for backward compatibility
POSTransaction = POSTransactionRead
POSTransactionLine = POSTransactionLineRead
POSPayment = POSPaymentRead
POSCashMovement = POSCashMovementCreate
POSSession = TillSession
POSSessionClose = TillSessionClose
