from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date
from decimal import Decimal

# Sales Order Schemas
class SalesOrderLineBase(BaseModel):
    item_id: int
    description: str
    quantity_ordered: Decimal
    unit_price: Decimal
    discount_percentage: Optional[Decimal] = 0
    tax_type_id: Optional[int] = None
    tax_amount: Optional[Decimal] = 0
    line_total: Decimal

class SalesOrderLineCreate(BaseModel):
    item_id: int
    description: str
    quantity_ordered: Decimal
    unit_price: Decimal
    discount_percentage: Optional[Decimal] = 0
    tax_type_id: Optional[int] = None

class SalesOrderLineUpdate(BaseModel):
    item_id: Optional[int] = None
    description: Optional[str] = None
    quantity_ordered: Optional[Decimal] = None
    unit_price: Optional[Decimal] = None
    discount_percentage: Optional[Decimal] = None
    tax_type_id: Optional[int] = None
    tax_amount: Optional[Decimal] = None
    line_total: Optional[Decimal] = None

class SalesOrderLine(SalesOrderLineBase):
    id: int
    sales_order_id: int
    quantity_invoiced: Decimal
    
    # Related item data
    item_code: Optional[str] = None
    item_description: Optional[str] = None

    class Config:
        from_attributes = True

class SalesOrderBase(BaseModel):
    customer_id: int
    order_date: date
    reference: Optional[str] = None
    status: str = "Draft"
    total_amount: Decimal
    notes: Optional[str] = None
    shipping_address: Optional[dict] = None
    billing_address: Optional[dict] = None
    sales_representative_id: Optional[int] = None

class SalesOrderCreate(BaseModel):
    customer_id: int
    order_date: date
    reference: Optional[str] = None
    notes: Optional[str] = None
    shipping_address: Optional[dict] = None
    billing_address: Optional[dict] = None
    sales_representative_id: Optional[int] = None
    lines: List[SalesOrderLineCreate] = []

class SalesOrderUpdate(BaseModel):
    customer_id: Optional[int] = None
    order_date: Optional[date] = None
    reference: Optional[str] = None
    status: Optional[str] = None
    total_amount: Optional[Decimal] = None
    notes: Optional[str] = None
    shipping_address: Optional[dict] = None
    billing_address: Optional[dict] = None
    sales_representative_id: Optional[int] = None
    lines: Optional[List[SalesOrderLineUpdate]] = None

class SalesOrder(SalesOrderBase):
    id: int
    company_id: int
    document_number: str
    ar_invoice_id: Optional[int] = None
    lines: List[SalesOrderLine] = []
    
    # Related data
    customer_name: Optional[str] = None
    sales_representative_name: Optional[str] = None
    currency_code: Optional[str] = "USD"
    exchange_rate: Optional[Decimal] = 1.0
    subtotal: Optional[Decimal] = None
    tax_amount: Optional[Decimal] = None

    class Config:
        from_attributes = True

# Purchase Order Schemas
class PurchaseOrderLineBase(BaseModel):
    item_id: int
    description: str
    quantity_ordered: Decimal
    unit_price: Decimal
    discount_percentage: Optional[Decimal] = 0
    tax_type_id: Optional[int] = None
    tax_amount: Optional[Decimal] = 0
    line_total: Decimal

class PurchaseOrderLineCreate(PurchaseOrderLineBase):
    pass

class PurchaseOrderLineUpdate(BaseModel):
    item_id: Optional[int] = None
    description: Optional[str] = None
    quantity_ordered: Optional[Decimal] = None
    unit_price: Optional[Decimal] = None
    discount_percentage: Optional[Decimal] = None
    tax_type_id: Optional[int] = None
    tax_amount: Optional[Decimal] = None
    line_total: Optional[Decimal] = None

class PurchaseOrderLine(PurchaseOrderLineBase):
    id: int
    purchase_order_id: int
    quantity_received: Decimal

    class Config:
        from_attributes = True

class PurchaseOrderBase(BaseModel):
    supplier_id: int
    order_date: date
    expected_delivery_date: Optional[date] = None
    reference: Optional[str] = None
    status: str = "Draft"
    total_amount: Decimal
    notes: Optional[str] = None
    delivery_address_warehouse_id: int

class PurchaseOrderCreate(PurchaseOrderBase):
    lines: List[PurchaseOrderLineCreate] = []

class PurchaseOrderUpdate(BaseModel):
    supplier_id: Optional[int] = None
    order_date: Optional[date] = None
    expected_delivery_date: Optional[date] = None
    reference: Optional[str] = None
    status: Optional[str] = None
    total_amount: Optional[Decimal] = None
    notes: Optional[str] = None
    delivery_address_warehouse_id: Optional[int] = None
    lines: Optional[List[PurchaseOrderLineUpdate]] = None

class PurchaseOrder(PurchaseOrderBase):
    id: int
    company_id: int
    document_number: str
    lines: List[PurchaseOrderLine] = []

    class Config:
        from_attributes = True

# Purchase Order Report Schema with additional fields
class PurchaseOrderReport(BaseModel):
    id: int
    order_number: str  # document_number
    supplier_id: int
    supplier_name: str
    order_date: date
    expected_delivery_date: Optional[date] = None
    reference: Optional[str] = None
    supplier_reference: Optional[str] = None  # from supplier.supplier_code or reference field
    status: str
    total_amount: Decimal
    currency_code: str = "USD"  # Default to USD for now
    notes: Optional[str] = None

    class Config:
        from_attributes = True

# Goods Received Voucher Schemas
class GoodsReceivedVoucherLineBase(BaseModel):
    item_id: int
    description: str
    quantity_received: Decimal
    unit_cost: Decimal
    line_total: Decimal
    purchase_order_line_id: Optional[int] = None

class GoodsReceivedVoucherLineCreate(GoodsReceivedVoucherLineBase):
    pass

class GoodsReceivedVoucherLineUpdate(BaseModel):
    item_id: Optional[int] = None
    description: Optional[str] = None
    quantity_received: Optional[Decimal] = None
    unit_cost: Optional[Decimal] = None
    line_total: Optional[Decimal] = None
    purchase_order_line_id: Optional[int] = None

class GoodsReceivedVoucherLine(GoodsReceivedVoucherLineBase):
    id: int
    grv_id: int
    
    # Related item data
    item_code: Optional[str] = None
    item_description: Optional[str] = None

    class Config:
        from_attributes = True

class GoodsReceivedVoucherBase(BaseModel):
    supplier_id: int
    grv_date: date
    reference: Optional[str] = None  # Supplier's Delivery Note No.
    status: str = "Open"
    notes: Optional[str] = None
    purchase_order_id: Optional[int] = None

class GoodsReceivedVoucherCreate(GoodsReceivedVoucherBase):
    lines: List[GoodsReceivedVoucherLineCreate] = []

class GoodsReceivedVoucherUpdate(BaseModel):
    supplier_id: Optional[int] = None
    grv_date: Optional[date] = None
    reference: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    purchase_order_id: Optional[int] = None
    lines: Optional[List[GoodsReceivedVoucherLineUpdate]] = None

class GoodsReceivedVoucher(GoodsReceivedVoucherBase):
    id: int
    company_id: int
    document_number: str
    ap_invoice_id: Optional[int] = None
    lines: List[GoodsReceivedVoucherLine] = []
    
    # Related data
    supplier_name: Optional[str] = None
    purchase_order_number: Optional[str] = None
    total_value: Optional[Decimal] = None

    class Config:
        from_attributes = True

# Order Defaults Schemas
class OrderDefaultsBase(BaseModel):
    # Status defaults
    default_so_status: str = "Draft"
    default_po_status: str = "Draft"
    default_grv_status: str = "Open"
    
    # Document numbering
    next_so_number: int = 1
    next_po_number: int = 1
    next_grv_number: int = 1
    
    # General settings
    default_currency_code: str = "USD"
    default_payment_terms: Optional[str] = None
    default_sales_representative_id: Optional[int] = None
    default_warehouse_id: Optional[int] = None
    
    # Numbering settings
    auto_generate_order_numbers: bool = True
    sales_order_number_prefix: str = "SO-"
    purchase_order_number_prefix: str = "PO-"
    grv_number_prefix: str = "GRV-"
    
    # Approval settings
    require_approval_for_orders: bool = False
    order_approval_limit: Optional[float] = None

class OrderDefaultsCreate(OrderDefaultsBase):
    pass

class OrderDefaultsUpdate(BaseModel):
    # Status defaults
    default_so_status: Optional[str] = None
    default_po_status: Optional[str] = None
    default_grv_status: Optional[str] = None
    
    # Document numbering
    next_so_number: Optional[int] = None
    next_po_number: Optional[int] = None
    next_grv_number: Optional[int] = None
    
    # General settings
    default_currency_code: Optional[str] = None
    default_payment_terms: Optional[str] = None
    default_sales_representative_id: Optional[int] = None
    default_warehouse_id: Optional[int] = None
    
    # Numbering settings
    auto_generate_order_numbers: Optional[bool] = None
    sales_order_number_prefix: Optional[str] = None
    purchase_order_number_prefix: Optional[str] = None
    grv_number_prefix: Optional[str] = None
    
    # Approval settings
    require_approval_for_orders: Optional[bool] = None
    order_approval_limit: Optional[float] = None

class OrderDefaults(OrderDefaultsBase):
    id: int
    company_id: int

    class Config:
        from_attributes = True
