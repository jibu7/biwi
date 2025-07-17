from sqlalchemy import Column, Integer, String, ForeignKey, Date, Numeric, Text, Boolean, Index
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.database.database import Base

class SalesOrder(Base):
    __tablename__ = "sales_orders"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    order_date = Column(Date, nullable=False)
    reference = Column(String, nullable=True)
    document_number = Column(String, nullable=False)  # Unique per company
    status = Column(String, nullable=False)  # "Draft", "Open", "PartiallyInvoiced", "Invoiced", "Closed", "Cancelled"
    total_amount = Column(Numeric, nullable=False)
    notes = Column(Text, nullable=True)
    shipping_address = Column(JSONB, nullable=True)
    billing_address = Column(JSONB, nullable=True)
    sales_representative_id = Column(Integer, ForeignKey("sales_representatives.id"), nullable=True)
    ar_invoice_id = Column(Integer, ForeignKey("ar_transactions.id"), nullable=True)
    
    # Multi-currency support
    currency_id = Column(Integer, ForeignKey("currencies.id"), nullable=True)
    exchange_rate = Column(Numeric(15, 6), default=1.000000)
    base_currency_amount = Column(Numeric(15, 2))  # Amount in company's base currency
    foreign_currency_amount = Column(Numeric(15, 2))  # Amount in transaction currency
    
    # Relationships
    lines = relationship("SalesOrderLine", back_populates="sales_order")
    customer = relationship("Customer")
    sales_representative = relationship("SalesRepresentative")
    currency = relationship("Currency")
    
    __table_args__ = (
        Index('idx_so_company_customer', 'company_id', 'customer_id'),
        Index('idx_so_company_date', 'company_id', 'order_date'),
        Index('idx_so_company_status', 'company_id', 'status'),
    )

class SalesOrderLine(Base):
    __tablename__ = "sales_order_lines"
    
    id = Column(Integer, primary_key=True, index=True)
    sales_order_id = Column(Integer, ForeignKey("sales_orders.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=False)
    description = Column(String, nullable=False)
    quantity_ordered = Column(Numeric, nullable=False)
    quantity_invoiced = Column(Numeric, default=0)
    unit_price = Column(Numeric, nullable=False)
    discount_percentage = Column(Numeric, default=0)
    tax_type_id = Column(Integer, ForeignKey("tax_types.id"), nullable=True)
    tax_amount = Column(Numeric, default=0)
    base_currency_tax_amount = Column(Numeric(15, 2))
    line_total = Column(Numeric, nullable=False)
    
    # Relationships
    sales_order = relationship("SalesOrder", back_populates="lines")
    item = relationship("InventoryItem")
    tax_type = relationship("TaxType")

class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    order_date = Column(Date, nullable=False)
    expected_delivery_date = Column(Date, nullable=True)
    reference = Column(String, nullable=True)
    document_number = Column(String, nullable=False)
    status = Column(String, nullable=False)  # "Draft", "Open", "PartiallyReceived", "Received", "Closed", "Cancelled"
    total_amount = Column(Numeric, nullable=False)
    notes = Column(Text, nullable=True)
    delivery_address_warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    
    # Multi-currency support
    currency_id = Column(Integer, ForeignKey("currencies.id"), nullable=True)
    exchange_rate = Column(Numeric(15, 6), default=1.000000)
    base_currency_amount = Column(Numeric(15, 2))  # Amount in company's base currency
    foreign_currency_amount = Column(Numeric(15, 2))  # Amount in transaction currency
    
    # Relationships
    lines = relationship("PurchaseOrderLine", back_populates="purchase_order")
    supplier = relationship("Supplier")
    warehouse = relationship("Warehouse")
    currency = relationship("Currency")
    
    __table_args__ = (
        Index('idx_po_company_supplier', 'company_id', 'supplier_id'),
        Index('idx_po_company_date', 'company_id', 'order_date'),
        Index('idx_po_company_status', 'company_id', 'status'),
    )

class PurchaseOrderLine(Base):
    __tablename__ = "purchase_order_lines"
    
    id = Column(Integer, primary_key=True, index=True)
    purchase_order_id = Column(Integer, ForeignKey("purchase_orders.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=False)
    description = Column(String, nullable=False)
    quantity_ordered = Column(Numeric, nullable=False)
    quantity_received = Column(Numeric, default=0)
    unit_price = Column(Numeric, nullable=False)
    discount_percentage = Column(Numeric, default=0)
    tax_type_id = Column(Integer, ForeignKey("tax_types.id"), nullable=True)
    tax_amount = Column(Numeric, default=0)
    base_currency_tax_amount = Column(Numeric(15, 2))
    line_total = Column(Numeric, nullable=False)
    
    # Relationships
    purchase_order = relationship("PurchaseOrder", back_populates="lines")
    item = relationship("InventoryItem")
    tax_type = relationship("TaxType")

class GoodsReceivedVoucher(Base):
    __tablename__ = "goods_received_vouchers"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    purchase_order_id = Column(Integer, ForeignKey("purchase_orders.id"), nullable=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    grv_date = Column(Date, nullable=False)
    reference = Column(String, nullable=True)  # Supplier's Delivery Note No.
    document_number = Column(String, nullable=False)
    status = Column(String, nullable=False)  # "Open", "PartiallyInvoiced", "Invoiced", "Closed"
    notes = Column(Text, nullable=True)
    ap_invoice_id = Column(Integer, ForeignKey("ap_transactions.id"), nullable=True)
    
    # Relationships
    lines = relationship("GoodsReceivedVoucherLine", back_populates="grv")
    purchase_order = relationship("PurchaseOrder")
    supplier = relationship("Supplier")
    
    __table_args__ = (
        Index('idx_grv_company_supplier', 'company_id', 'supplier_id'),
        Index('idx_grv_company_date', 'company_id', 'grv_date'),
        Index('idx_grv_company_status', 'company_id', 'status'),
    )

class GoodsReceivedVoucherLine(Base):
    __tablename__ = "goods_received_voucher_lines"
    
    id = Column(Integer, primary_key=True, index=True)
    grv_id = Column(Integer, ForeignKey("goods_received_vouchers.id"), nullable=False)
    purchase_order_line_id = Column(Integer, ForeignKey("purchase_order_lines.id"), nullable=True)
    item_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=False)
    description = Column(String, nullable=False)
    quantity_received = Column(Numeric, nullable=False)
    unit_cost = Column(Numeric, nullable=False)
    line_total = Column(Numeric, nullable=False)
    
    # Relationships
    grv = relationship("GoodsReceivedVoucher", back_populates="lines")
    item = relationship("InventoryItem")
    purchase_order_line = relationship("PurchaseOrderLine")

class OrderDefaults(Base):
    __tablename__ = "order_defaults"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), unique=True, nullable=False)
    default_so_status = Column(String, default="Draft")
    default_po_status = Column(String, default="Draft")
    default_grv_status = Column(String, default="Open")
    next_so_number = Column(Integer, default=1)
    next_po_number = Column(Integer, default=1)
    next_grv_number = Column(Integer, default=1)
