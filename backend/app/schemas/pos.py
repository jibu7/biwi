from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal

# Till Schemas
class TillBase(BaseModel):
    till_code: str
    till_name: str
    location: Optional[str] = None
    default_cashier_id: Optional[int] = None
    default_warehouse_id: int
    cash_gl_account_id: int
    is_active: bool = True

class TillCreate(TillBase):
    pass

class TillUpdate(BaseModel):
    till_code: Optional[str] = None
    till_name: Optional[str] = None
    location: Optional[str] = None
    default_cashier_id: Optional[int] = None
    default_warehouse_id: Optional[int] = None
    cash_gl_account_id: Optional[int] = None
    is_active: Optional[bool] = None

class Till(TillBase):
    id: int
    company_id: int
    
    class Config:
        from_attributes = True

# POS Transaction Type Schemas
class POSTransactionTypeBase(BaseModel):
    name: str
    description: Optional[str] = None
    base_type: str
    affects_inventory: bool = True
    affects_ar: bool = True
    default_payment_method: str = "Cash"
    is_active: bool = True

class POSTransactionTypeCreate(POSTransactionTypeBase):
    pass

class POSTransactionTypeUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    base_type: Optional[str] = None
    affects_inventory: Optional[bool] = None
    affects_ar: Optional[bool] = None
    default_payment_method: Optional[str] = None
    is_active: Optional[bool] = None

class POSTransactionType(POSTransactionTypeBase):
    id: int
    company_id: int
    
    class Config:
        from_attributes = True

# POS Session Schemas
class POSSessionBase(BaseModel):
    till_id: int
    cashier_id: int
    session_date: date
    opening_cash: Decimal = Decimal("0.00")

class POSSessionCreate(POSSessionBase):
    pass

class POSSessionClose(BaseModel):
    closing_cash: Decimal

class POSSession(POSSessionBase):
    id: int
    company_id: int
    opening_time: datetime
    closing_time: Optional[datetime] = None
    closing_cash: Optional[Decimal] = None
    expected_cash: Decimal = Decimal("0.00")
    cash_variance: Decimal = Decimal("0.00")
    status: str = "Open"
    
    class Config:
        from_attributes = True

# POS Transaction Line Schemas
class POSTransactionLineBase(BaseModel):
    item_id: int
    barcode_used: Optional[str] = None
    description: str
    quantity: Decimal
    unit_price: Decimal
    discount_percentage: Decimal = Decimal("0.00")
    discount_amount: Decimal = Decimal("0.00")
    tax_type_id: Optional[int] = None
    tax_amount: Decimal = Decimal("0.00")
    line_total: Decimal

class POSTransactionLineCreate(POSTransactionLineBase):
    pass

class POSTransactionLine(POSTransactionLineBase):
    id: int
    transaction_id: int
    
    class Config:
        from_attributes = True

# POS Transaction Schemas
class POSTransactionBase(BaseModel):
    transaction_type_id: int
    customer_id: Optional[int] = None
    payment_method: str
    cash_tendered: Optional[Decimal] = None
    notes: Optional[str] = None

class POSTransactionCreate(POSTransactionBase):
    lines: List[POSTransactionLineCreate]
    reference_transaction_id: Optional[int] = None  # For returns

class POSTransaction(POSTransactionBase):
    id: int
    company_id: int
    session_id: int
    transaction_number: str
    transaction_datetime: datetime
    subtotal_amount: Decimal
    tax_amount: Decimal
    discount_amount: Decimal
    total_amount: Decimal
    change_amount: Optional[Decimal] = None
    linked_gl_journal_entry_id: Optional[int] = None
    linked_ar_transaction_id: Optional[int] = None
    reference_transaction_id: Optional[int] = None
    status: str
    lines: List[POSTransactionLine] = []
    
    class Config:
        from_attributes = True

# POS Cash Movement Schemas
class POSCashMovementBase(BaseModel):
    movement_type: str
    amount: Decimal
    reason: str
    reference: Optional[str] = None
    authorized_by_id: Optional[int] = None

class POSCashMovementCreate(POSCashMovementBase):
    pass

class POSCashMovement(POSCashMovementBase):
    id: int
    company_id: int
    session_id: int
    movement_datetime: datetime
    
    class Config:
        from_attributes = True

# POS Defaults Schemas
class POSDefaultsBase(BaseModel):
    default_customer_id: Optional[int] = None
    default_tax_type_id: Optional[int] = None
    receipt_header: Optional[str] = None
    receipt_footer: Optional[str] = None
    enable_negative_stock: bool = False
    require_customer_for_credit: bool = True
    auto_print_receipt: bool = True
    default_sale_transaction_type_id: Optional[int] = None
    default_return_transaction_type_id: Optional[int] = None
    cash_rounding_method: str = "None"

class POSDefaultsCreate(POSDefaultsBase):
    pass

class POSDefaultsUpdate(POSDefaultsBase):
    pass

class POSDefaults(POSDefaultsBase):
    id: int
    company_id: int
    next_transaction_number: int
    
    class Config:
        from_attributes = True

# Report Schemas
class CashierSalesReport(BaseModel):
    cashier_id: int
    cashier_name: str
    session_count: int
    total_sales: Decimal
    total_returns: Decimal
    net_sales: Decimal
    cash_sales: Decimal
    card_sales: Decimal
    other_sales: Decimal

class InventorySalesReport(BaseModel):
    item_id: int
    item_code: str
    description: str
    quantity_sold: Decimal
    quantity_returned: Decimal
    net_quantity: Decimal
    sales_amount: Decimal
    return_amount: Decimal
    net_amount: Decimal
