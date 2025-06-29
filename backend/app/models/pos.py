from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Date, DateTime, Numeric, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database.database import Base
from datetime import datetime

class Till(Base):
    __tablename__ = "tills"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    till_code = Column(String, nullable=False)
    till_name = Column(String, nullable=False)
    location = Column(String, nullable=True)
    default_cashier_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    default_warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    cash_gl_account_id = Column(Integer, ForeignKey("gl_accounts.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    
    company = relationship("Company")
    default_cashier = relationship("User")
    default_warehouse = relationship("Warehouse")
    cash_gl_account = relationship("GLAccount")
    sessions = relationship("POSSession", back_populates="till")
    
    __table_args__ = (UniqueConstraint('till_code', 'company_id', name='uq_till_code_company'),)

class POSTransactionType(Base):
    __tablename__ = "pos_transaction_types"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    base_type = Column(String, nullable=False)  # "Sale", "Return", "CashIn", "CashOut"
    affects_inventory = Column(Boolean, default=True)
    affects_ar = Column(Boolean, default=True)
    default_payment_method = Column(String, default="Cash")  # "Cash", "Card", "EFT", "Voucher"
    is_active = Column(Boolean, default=True)
    
    company = relationship("Company")
    
    __table_args__ = (UniqueConstraint('name', 'company_id', name='uq_postranstype_name_company'),)

class POSSession(Base):
    __tablename__ = "pos_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    till_id = Column(Integer, ForeignKey("tills.id"), nullable=False)
    cashier_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    session_date = Column(Date, nullable=False)
    opening_time = Column(DateTime, nullable=False, default=datetime.utcnow)
    closing_time = Column(DateTime, nullable=True)
    opening_cash = Column(Numeric(15, 2), default=0.00)
    closing_cash = Column(Numeric(15, 2), nullable=True)
    expected_cash = Column(Numeric(15, 2), default=0.00)
    cash_variance = Column(Numeric(15, 2), default=0.00)
    status = Column(String, default="Open")  # "Open", "Closed", "Suspended"
    
    company = relationship("Company")
    till = relationship("Till", back_populates="sessions")
    cashier = relationship("User")
    transactions = relationship("POSTransaction", back_populates="session")

class POSTransaction(Base):
    __tablename__ = "pos_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    session_id = Column(Integer, ForeignKey("pos_sessions.id"), nullable=False)
    transaction_type_id = Column(Integer, ForeignKey("pos_transaction_types.id"), nullable=False)
    transaction_number = Column(String, nullable=False)  # POS-YYYYMMDD-0001
    transaction_datetime = Column(DateTime, nullable=False, default=datetime.utcnow)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    payment_method = Column(String, nullable=False)
    subtotal_amount = Column(Numeric(15, 2), nullable=False)
    tax_amount = Column(Numeric(15, 2), default=0.00)
    discount_amount = Column(Numeric(15, 2), default=0.00)
    total_amount = Column(Numeric(15, 2), nullable=False)
    cash_tendered = Column(Numeric(15, 2), nullable=True)
    change_amount = Column(Numeric(15, 2), nullable=True)
    linked_gl_journal_entry_id = Column(Integer, ForeignKey("gl_journal_entries.id"), nullable=True)
    linked_ar_transaction_id = Column(Integer, ForeignKey("ar_transactions.id"), nullable=True)
    reference_transaction_id = Column(Integer, ForeignKey("pos_transactions.id"), nullable=True)  # For returns
    status = Column(String, default="Completed")  # "Draft", "Completed", "Voided", "Returned"
    notes = Column(Text, nullable=True)
    
    company = relationship("Company")
    session = relationship("POSSession", back_populates="transactions")
    transaction_type = relationship("POSTransactionType")
    customer = relationship("Customer")
    lines = relationship("POSTransactionLine", back_populates="transaction")
    
    __table_args__ = (UniqueConstraint('transaction_number', 'company_id', name='uq_postrans_number_company'),)

class POSTransactionLine(Base):
    __tablename__ = "pos_transaction_lines"
    
    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("pos_transactions.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=False)
    barcode_used = Column(String, nullable=True)
    description = Column(String, nullable=False)
    quantity = Column(Numeric(15, 3), nullable=False)
    unit_price = Column(Numeric(15, 2), nullable=False)
    discount_percentage = Column(Numeric(5, 2), default=0.00)
    discount_amount = Column(Numeric(15, 2), default=0.00)
    tax_type_id = Column(Integer, ForeignKey("tax_types.id"), nullable=True)
    tax_amount = Column(Numeric(15, 2), default=0.00)
    line_total = Column(Numeric(15, 2), nullable=False)
    
    transaction = relationship("POSTransaction", back_populates="lines")
    item = relationship("InventoryItem")
    tax_type = relationship("TaxType")

class POSCashMovement(Base):
    __tablename__ = "pos_cash_movements"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    session_id = Column(Integer, ForeignKey("pos_sessions.id"), nullable=False)
    movement_type = Column(String, nullable=False)  # "CashIn", "CashOut", "Float"
    amount = Column(Numeric(15, 2), nullable=False)
    reason = Column(String, nullable=False)
    reference = Column(String, nullable=True)
    movement_datetime = Column(DateTime, nullable=False, default=datetime.utcnow)
    authorized_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    company = relationship("Company")
    session = relationship("POSSession")
    authorized_by = relationship("User")

class POSDefaults(Base):
    __tablename__ = "pos_defaults"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), unique=True, nullable=False)
    default_customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)  # Walk-in customer
    default_tax_type_id = Column(Integer, ForeignKey("tax_types.id"), nullable=True)
    receipt_header = Column(Text, nullable=True)
    receipt_footer = Column(Text, nullable=True)
    enable_negative_stock = Column(Boolean, default=False)
    require_customer_for_credit = Column(Boolean, default=True)
    auto_print_receipt = Column(Boolean, default=True)
    default_sale_transaction_type_id = Column(Integer, ForeignKey("pos_transaction_types.id"), nullable=True)
    default_return_transaction_type_id = Column(Integer, ForeignKey("pos_transaction_types.id"), nullable=True)
    cash_rounding_method = Column(String, default="None")  # "None", "Up", "Down", "Nearest5Cents"
    next_transaction_number = Column(Integer, default=1)
    
    company = relationship("Company")
