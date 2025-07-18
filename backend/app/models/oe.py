from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Date, Numeric, UniqueConstraint, Index
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.database.database import Base

class SalesOrder(Base):
    __tablename__ = "sales_orders"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)  # ENSURE THIS EXISTS
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    order_date = Column(Date, nullable=False)
    reference = Column(String, nullable=True)
    document_number = Column(String, nullable=False)
    status = Column(String, nullable=False)  # "Draft", "Open", "PartiallyInvoiced", etc.
    total_amount = Column(Numeric, default=0.00)
    notes = Column(String, nullable=True)
    shipping_address = Column(JSONB, nullable=True)
    billing_address = Column(JSONB, nullable=True)
    sales_representative_id = Column(Integer, ForeignKey("sales_representatives.id"), nullable=True)
    ar_invoice_id = Column(Integer, ForeignKey("ar_transactions.id"), nullable=True)
    
    __table_args__ = (
        UniqueConstraint('document_number', 'company_id', name='uq_so_doc_number_company'),
        Index('ix_so_company_customer', 'company_id', 'customer_id'),
        Index('ix_so_company_date', 'company_id', 'order_date'),
        Index('ix_so_company_status', 'company_id', 'status'),
    )

class SalesOrderLine(Base):
    __tablename__ = "sales_order_lines"
    
    id = Column(Integer, primary_key=True, index=True)
    sales_order_id = Column(Integer, ForeignKey("sales_orders.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=False)
    description = Column(String, nullable=False)
    quantity_ordered = Column(Numeric, nullable=False)
    quantity_invoiced = Column(Numeric, default=0.00)
    unit_price = Column(Numeric, nullable=False)
    discount_percentage = Column(Numeric, default=0.00)
    tax_type_id = Column(Integer, ForeignKey("tax_types.id"), nullable=True)
    tax_amount = Column(Numeric, default=0.00)
    line_total = Column(Numeric, nullable=False)

class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)  # ENSURE THIS EXISTS
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    order_date = Column(Date, nullable=False)
    expected_delivery_date = Column(Date, nullable=True)
    reference = Column(String, nullable=True)
    document_number = Column(String, nullable=False)
    status = Column(String, nullable=False)
    total_amount = Column(Numeric, default=0.00)
    notes = Column(String, nullable=True)
    delivery_address_warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    
    __table_args__ = (
        UniqueConstraint('document_number', 'company_id', name='uq_po_doc_number_company'),
        Index('ix_po_company_supplier', 'company_id', 'supplier_id'),
        Index('ix_po_company_date', 'company_id', 'order_date'),
        Index('ix_po_company_status', 'company_id', 'status'),
    )

class PurchaseOrderLine(Base):
    __tablename__ = "purchase_order_lines"
    
    id = Column(Integer, primary_key=True, index=True)
    purchase_order_id = Column(Integer, ForeignKey("purchase_orders.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=False)
    description = Column(String, nullable=False)
    quantity_ordered = Column(Numeric, nullable=False)
    quantity_received = Column(Numeric, default=0.00)
    unit_price = Column(Numeric, nullable=False)
    discount_percentage = Column(Numeric, default=0.00)
    tax_type_id = Column(Integer, ForeignKey("tax_types.id"), nullable=True)
    tax_amount = Column(Numeric, default=0.00)
    line_total = Column(Numeric, nullable=False)

class GoodsReceivedVoucher(Base):
    __tablename__ = "goods_received_vouchers"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)  # ENSURE THIS EXISTS
    purchase_order_id = Column(Integer, ForeignKey("purchase_orders.id"), nullable=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    grv_date = Column(Date, nullable=False)
    reference = Column(String, nullable=True)
    document_number = Column(String, nullable=False)
    status = Column(String, nullable=False)
    notes = Column(String, nullable=True)
    ap_invoice_id = Column(Integer, ForeignKey("ap_transactions.id"), nullable=True)
    
    __table_args__ = (
        UniqueConstraint('document_number', 'company_id', name='uq_grv_doc_number_company'),
        Index('ix_grv_company_supplier', 'company_id', 'supplier_id'),
        Index('ix_grv_company_date', 'company_id', 'grv_date'),
        Index('ix_grv_company_status', 'company_id', 'status'),
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

class OrderDefaults(Base):
    __tablename__ = "order_defaults"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, unique=True)  # ENSURE THIS EXISTS
    default_so_status = Column(String, default="Draft")
    default_po_status = Column(String, default="Draft")
    default_grv_status = Column(String, default="Open")
    next_so_number = Column(Integer, default=1)
    next_po_number = Column(Integer, default=1)
    next_grv_number = Column(Integer, default=1)
