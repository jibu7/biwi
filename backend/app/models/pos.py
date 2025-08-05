from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Numeric, JSON, UniqueConstraint, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.database import Base

class Till(Base):
    __tablename__ = "pos_tills"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=True)
    till_number = Column(String(50), nullable=False)
    name = Column(String(100), nullable=False)
    location = Column(String(200), nullable=True)
    hardware_config = Column(JSON, nullable=True)  # Printer settings, cash drawer config
    is_active = Column(Boolean, default=True)
    default_warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    default_customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)  # Walk-in customer
    
    sessions = relationship("TillSession", back_populates="till")
    __table_args__ = (UniqueConstraint('till_number', 'company_id', name='uq_till_number_company'),)

class TillSession(Base):
    __tablename__ = "pos_till_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    till_id = Column(Integer, ForeignKey("pos_tills.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    opening_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    closing_date = Column(DateTime, nullable=True)
    opening_balance = Column(Numeric(15, 2), nullable=False)
    expected_closing_balance = Column(Numeric(15, 2), nullable=True)
    actual_closing_balance = Column(Numeric(15, 2), nullable=True)
    variance = Column(Numeric(15, 2), nullable=True)
    status = Column(String(20), nullable=False)  # "Open", "Closed", "Reconciled"
    reconciliation_notes = Column(Text, nullable=True)
    
    till = relationship("Till", back_populates="sessions")
    user = relationship("User")
    transactions = relationship("POSTransaction", back_populates="session")
    reconciliation_details = relationship("TillReconciliation", back_populates="session")

class POSTransactionType(Base):
    __tablename__ = "pos_transaction_types"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    name = Column(String(100), nullable=False)
    base_type = Column(String(50), nullable=False)  # "Sale", "Return", "CashIn", "CashOut"
    default_payment_method = Column(String(50), nullable=True)  # "Cash", "Card", "EFT"
    gl_account_id = Column(Integer, ForeignKey("gl_accounts.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    
    __table_args__ = (UniqueConstraint('name', 'company_id', name='uq_pos_trans_type_company'),)

class POSTransaction(Base):
    __tablename__ = "pos_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    till_session_id = Column(Integer, ForeignKey("pos_till_sessions.id"), nullable=False)
    transaction_number = Column(String(50), nullable=False, unique=True)
    transaction_type_id = Column(Integer, ForeignKey("pos_transaction_types.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    transaction_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    subtotal = Column(Numeric(15, 2), nullable=False)
    tax_amount = Column(Numeric(15, 2), nullable=False, default=0)
    discount_amount = Column(Numeric(15, 2), nullable=False, default=0)
    total_amount = Column(Numeric(15, 2), nullable=False)
    payment_method = Column(String(50), nullable=False)
    payment_details = Column(JSON, nullable=True)  # Card last 4 digits, auth code, etc.
    status = Column(String(20), nullable=False)  # "Completed", "Void", "Refunded"
    reference_transaction_id = Column(Integer, ForeignKey("pos_transactions.id"), nullable=True)  # For returns
    linked_ar_transaction_id = Column(Integer, ForeignKey("ar_transactions.id"), nullable=True)
    linked_gl_journal_entry_id = Column(Integer, ForeignKey("gl_journal_entries.id"), nullable=True)
    receipt_printed = Column(Boolean, default=False)
    receipt_email_sent = Column(Boolean, default=False)
    
    session = relationship("TillSession", back_populates="transactions")
    transaction_type = relationship("POSTransactionType")
    customer = relationship("Customer")
    lines = relationship("POSTransactionLine", back_populates="transaction", cascade="all, delete-orphan")
    payments = relationship("POSPayment", back_populates="transaction", cascade="all, delete-orphan")

class POSTransactionLine(Base):
    __tablename__ = "pos_transaction_lines"
    
    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("pos_transactions.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=False)
    description = Column(String(200), nullable=False)
    quantity = Column(Numeric(10, 2), nullable=False)
    unit_price = Column(Numeric(15, 2), nullable=False)
    discount_percentage = Column(Numeric(5, 2), default=0)
    discount_amount = Column(Numeric(15, 2), default=0)
    tax_type_id = Column(Integer, ForeignKey("tax_types.id"), nullable=True)
    tax_amount = Column(Numeric(15, 2), default=0)
    line_total = Column(Numeric(15, 2), nullable=False)
    
    transaction = relationship("POSTransaction", back_populates="lines")
    item = relationship("InventoryItem")
    tax_type = relationship("TaxType")

class POSPayment(Base):
    __tablename__ = "pos_payments"
    
    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("pos_transactions.id"), nullable=False)
    payment_method = Column(String(50), nullable=False)
    amount = Column(Numeric(15, 2), nullable=False)
    reference_number = Column(String(100), nullable=True)  # Check number, card auth code
    payment_details = Column(JSON, nullable=True)
    
    transaction = relationship("POSTransaction", back_populates="payments")

class TillReconciliation(Base):
    __tablename__ = "till_reconciliations"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    session_id = Column(Integer, ForeignKey("pos_till_sessions.id"), nullable=False)
    expected_cash = Column(Numeric(15, 2), nullable=False)
    actual_cash = Column(Numeric(15, 2), nullable=False)
    variance = Column(Numeric(15, 2), nullable=False)
    reconciliation_time = Column(DateTime, nullable=False)
    reconciled_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    notes = Column(Text, nullable=True)
    
    # Relationships
    session = relationship("TillSession", back_populates="reconciliation_details")

class POSCashMovement(Base):
    __tablename__ = "pos_cash_movements"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    session_id = Column(Integer, ForeignKey("pos_till_sessions.id"), nullable=False)
    movement_type = Column(String(20), nullable=False)  # "cash_in", "cash_out"
    amount = Column(Numeric(15, 2), nullable=False)
    reason = Column(String(255), nullable=False)
    reference = Column(String(100), nullable=True)
    movement_datetime = Column(DateTime, nullable=False)
    authorized_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

class POSDefaults(Base):
    __tablename__ = "pos_defaults"
    
    id = Column(Integer, primary_key=True)
    company_id = Column(Integer, ForeignKey("companies.id"), unique=True, nullable=False)
    default_walk_in_customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    receipt_header = Column(Text, nullable=True)
    receipt_footer = Column(Text, nullable=True)
    auto_print_receipt = Column(Boolean, default=True)
    allow_negative_stock = Column(Boolean, default=False)
    require_customer_for_credit = Column(Boolean, default=True)
    default_tax_type_id = Column(Integer, ForeignKey("tax_types.id"), nullable=True)
    cash_rounding_method = Column(String(20), default="None")  # "None", "Up", "Down", "Nearest"
    cash_rounding_precision = Column(Numeric(3, 2), default=0.01)
