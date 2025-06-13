from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Date, Numeric, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.database.database import Base

class Supplier(Base):
    __tablename__ = "suppliers"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    supplier_code = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    address = Column(JSONB, nullable=True)
    contact_info = Column(JSONB, nullable=True)
    payment_terms = Column(String, nullable=True)  # e.g., "Net 30"
    current_balance = Column(Numeric(precision=15, scale=2), default=0.00)
    default_ap_gl_account_id = Column(Integer, ForeignKey("gl_accounts.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    company = relationship("Company")
    default_ap_gl_account = relationship("GLAccount")
    transactions = relationship("APTransaction", back_populates="supplier")
    
    __table_args__ = (
        UniqueConstraint('supplier_code', 'company_id', name='uq_supplier_code_company'),
    )

class APTransactionType(Base):
    __tablename__ = "ap_transaction_types"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    base_type = Column(String, nullable=False)  # Supplier Invoice, Payment, Debit Note, Journal
    default_gl_account_id = Column(Integer, ForeignKey("gl_accounts.id"), nullable=True)
    default_ap_control_gl_account_id = Column(Integer, ForeignKey("gl_accounts.id"), nullable=True)
    affects_balance_direction = Column(String, nullable=False)  # Credit or Debit
    is_active = Column(Boolean, default=True)
    
    # Relationships
    company = relationship("Company")
    default_gl_account = relationship("GLAccount", foreign_keys=[default_gl_account_id])
    default_ap_control_gl_account = relationship("GLAccount", foreign_keys=[default_ap_control_gl_account_id])
    
    __table_args__ = (
        UniqueConstraint('name', 'company_id', name='uq_aptransactiontype_name_company'),
    )

class APTransaction(Base):
    __tablename__ = "ap_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    ap_transaction_type_id = Column(Integer, ForeignKey("ap_transaction_types.id"), nullable=False)
    linked_gl_journal_entry_id = Column(Integer, ForeignKey("gl_journal_entries.id"), nullable=True)
    purchase_order_id = Column(Integer, nullable=True)  # For Phase 7
    transaction_date = Column(Date, nullable=False)
    due_date = Column(Date, nullable=True)
    reference = Column(String, nullable=True)
    document_number = Column(String, nullable=False)
    total_amount = Column(Numeric(precision=15, scale=2), nullable=False)
    open_amount = Column(Numeric(precision=15, scale=2), nullable=False)
    is_posted_to_gl = Column(Boolean, default=False)
    status = Column(String, nullable=False, default="Draft")  # Draft, Posted, Paid, PartiallyPaid
    
    # Relationships
    company = relationship("Company")
    supplier = relationship("Supplier", back_populates="transactions")
    ap_transaction_type = relationship("APTransactionType")
    linked_gl_journal_entry = relationship("GLJournalEntry")
    
    __table_args__ = (
        UniqueConstraint('document_number', 'company_id', 'ap_transaction_type_id', 
                        name='uq_ap_doc_number_company_type'),
    )

class APAllocation(Base):
    __tablename__ = "ap_allocations"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    allocation_date = Column(Date, nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    
    # Relationships
    company = relationship("Company")
    supplier = relationship("Supplier")
    lines = relationship("APAllocationLine", back_populates="allocation", cascade="all, delete-orphan")

class APAllocationLine(Base):
    __tablename__ = "ap_allocation_lines"
    
    id = Column(Integer, primary_key=True, index=True)
    ap_allocation_id = Column(Integer, ForeignKey("ap_allocations.id"), nullable=False)
    credit_transaction_id = Column(Integer, ForeignKey("ap_transactions.id"), nullable=False)
    debit_transaction_id = Column(Integer, ForeignKey("ap_transactions.id"), nullable=False)
    allocated_amount = Column(Numeric(precision=15, scale=2), nullable=False)
    
    # Relationships
    allocation = relationship("APAllocation", back_populates="lines")
    credit_transaction = relationship("APTransaction", foreign_keys=[credit_transaction_id])
    debit_transaction = relationship("APTransaction", foreign_keys=[debit_transaction_id])

class APDefaults(Base):
    __tablename__ = "ap_defaults"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), unique=True, nullable=False)
    default_ap_control_gl_account_id = Column(Integer, ForeignKey("gl_accounts.id"), nullable=True)
    default_expense_gl_account_id = Column(Integer, ForeignKey("gl_accounts.id"), nullable=True)
    default_payment_gl_account_id = Column(Integer, ForeignKey("gl_accounts.id"), nullable=True)
    default_purchase_discount_gl_account_id = Column(Integer, ForeignKey("gl_accounts.id"), nullable=True)
    
    # Relationships
    company = relationship("Company")
    default_ap_control_gl_account = relationship("GLAccount", foreign_keys=[default_ap_control_gl_account_id])
    default_expense_gl_account = relationship("GLAccount", foreign_keys=[default_expense_gl_account_id])
    default_payment_gl_account = relationship("GLAccount", foreign_keys=[default_payment_gl_account_id])
    default_purchase_discount_gl_account = relationship("GLAccount", foreign_keys=[default_purchase_discount_gl_account_id])
