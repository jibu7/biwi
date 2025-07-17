from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Date, Numeric, UniqueConstraint, Text, DateTime, Index
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.database import Base

class Customer(Base):
    __tablename__ = "customers"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    customer_code = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    address = Column(JSONB, nullable=True)
    contact_info = Column(JSONB, nullable=True)
    payment_terms = Column(String, nullable=True)  # e.g., "Net 30"
    credit_limit = Column(Numeric(precision=15, scale=2), default=0.00)
    current_balance = Column(Numeric(precision=15, scale=2), default=0.00)
    sales_representative_id = Column(Integer, ForeignKey("sales_representatives.id"), nullable=True)
    default_ar_gl_account_id = Column(Integer, ForeignKey("gl_accounts.id"), nullable=True)
    default_currency_id = Column(Integer, ForeignKey("currencies.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    company = relationship("Company")
    sales_representative = relationship("SalesRepresentative", back_populates="customers")
    default_ar_gl_account = relationship("GLAccount")
    currency = relationship("Currency")
    transactions = relationship("ARTransaction", back_populates="customer")
    
    __table_args__ = (
        UniqueConstraint('customer_code', 'company_id', name='uq_customer_code_company'),
        Index('idx_customer_company_active', 'company_id', 'is_active'),
        Index('idx_customer_company_balance', 'company_id', 'current_balance'),
    )

class SalesRepresentative(Base):
    __tablename__ = "sales_representatives"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    name = Column(String, nullable=False)
    contact_info = Column(JSONB, nullable=True)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    company = relationship("Company")
    customers = relationship("Customer", back_populates="sales_representative")

class ARTransactionType(Base):
    __tablename__ = "ar_transaction_types"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    base_type = Column(String, nullable=False)  # Invoice, Receipt, Credit Note, Journal
    default_gl_account_id = Column(Integer, ForeignKey("gl_accounts.id"), nullable=True)
    default_ar_control_gl_account_id = Column(Integer, ForeignKey("gl_accounts.id"), nullable=True)
    affects_balance_direction = Column(String, nullable=False)  # Debit or Credit
    is_active = Column(Boolean, default=True)
    
    # Relationships
    company = relationship("Company")
    default_gl_account = relationship("GLAccount", foreign_keys=[default_gl_account_id])
    default_ar_control_gl_account = relationship("GLAccount", foreign_keys=[default_ar_control_gl_account_id])
    
    __table_args__ = (
        UniqueConstraint('name', 'company_id', name='uq_artransactiontype_name_company'),
    )

class ARTransaction(Base):
    __tablename__ = "ar_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    ar_transaction_type_id = Column(Integer, ForeignKey("ar_transaction_types.id"), nullable=False)
    linked_gl_journal_entry_id = Column(Integer, ForeignKey("gl_journal_entries.id"), nullable=True)
    sales_order_id = Column(Integer, nullable=True)  # For Phase 7
    transaction_date = Column(Date, nullable=False)
    due_date = Column(Date, nullable=True)
    reference = Column(String, nullable=True)
    document_number = Column(String, nullable=False)
    total_amount = Column(Numeric(precision=15, scale=2), nullable=False)
    open_amount = Column(Numeric(precision=15, scale=2), nullable=False)
    is_posted_to_gl = Column(Boolean, default=False)
    status = Column(String, nullable=False, default="Draft")  # Draft, Posted, Paid, PartiallyPaid
    
    # Multi-currency support
    currency_id = Column(Integer, ForeignKey("currencies.id"), nullable=True)
    exchange_rate = Column(Numeric(15, 6), default=1.000000)
    base_currency_amount = Column(Numeric(15, 2))  # Amount in company's base currency
    foreign_currency_amount = Column(Numeric(15, 2))  # Amount in transaction currency
    
    # Relationships
    company = relationship("Company")
    customer = relationship("Customer", back_populates="transactions")
    ar_transaction_type = relationship("ARTransactionType")
    linked_gl_journal_entry = relationship("GLJournalEntry")
    currency = relationship("Currency")
    tax_lines = relationship("ARTransactionTaxLine", back_populates="ar_transaction", cascade="all, delete-orphan")
    
    __table_args__ = (
        UniqueConstraint('document_number', 'company_id', 'ar_transaction_type_id', 
                        name='uq_ar_doc_number_company_type'),
        Index('idx_ar_trans_company_customer', 'company_id', 'customer_id'),
        Index('idx_ar_trans_company_date', 'company_id', 'transaction_date'),
        Index('idx_ar_trans_company_open', 'company_id', 'open_amount'),
    )

class ARAllocation(Base):
    __tablename__ = "ar_allocations"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    allocation_date = Column(Date, nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    
    # Relationships
    company = relationship("Company")
    customer = relationship("Customer")
    lines = relationship("ARAllocationLine", back_populates="allocation", cascade="all, delete-orphan")

class ARAllocationLine(Base):
    __tablename__ = "ar_allocation_lines"
    
    id = Column(Integer, primary_key=True, index=True)
    ar_allocation_id = Column(Integer, ForeignKey("ar_allocations.id"), nullable=False)
    debit_transaction_id = Column(Integer, ForeignKey("ar_transactions.id"), nullable=False)
    credit_transaction_id = Column(Integer, ForeignKey("ar_transactions.id"), nullable=False)
    allocated_amount = Column(Numeric(precision=15, scale=2), nullable=False)
    
    # Relationships
    allocation = relationship("ARAllocation", back_populates="lines")
    debit_transaction = relationship("ARTransaction", foreign_keys=[debit_transaction_id])
    credit_transaction = relationship("ARTransaction", foreign_keys=[credit_transaction_id])

class ARDefaults(Base):
    __tablename__ = "ar_defaults"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), unique=True, nullable=False)
    default_ar_control_gl_account_id = Column(Integer, ForeignKey("gl_accounts.id"), nullable=True)
    default_sales_gl_account_id = Column(Integer, ForeignKey("gl_accounts.id"), nullable=True)
    default_receipt_gl_account_id = Column(Integer, ForeignKey("gl_accounts.id"), nullable=True)
    default_sales_discount_gl_account_id = Column(Integer, ForeignKey("gl_accounts.id"), nullable=True)
    default_bad_debt_gl_account_id = Column(Integer, ForeignKey("gl_accounts.id"), nullable=True)
    
    # Relationships
    company = relationship("Company")
    default_ar_control_gl_account = relationship("GLAccount", foreign_keys=[default_ar_control_gl_account_id])
    default_sales_gl_account = relationship("GLAccount", foreign_keys=[default_sales_gl_account_id])
    default_receipt_gl_account = relationship("GLAccount", foreign_keys=[default_receipt_gl_account_id])
    default_sales_discount_gl_account = relationship("GLAccount", foreign_keys=[default_sales_discount_gl_account_id])
    default_bad_debt_gl_account = relationship("GLAccount", foreign_keys=[default_bad_debt_gl_account_id])

class ARWriteOff(Base):
    __tablename__ = "ar_writeoffs"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    original_invoice_id = Column(Integer, ForeignKey("ar_transactions.id"), nullable=False)
    ar_transaction_type_id = Column(Integer, ForeignKey("ar_transaction_types.id"), nullable=False)
    linked_gl_journal_entry_id = Column(Integer, ForeignKey("gl_journal_entries.id"), nullable=True)
    
    # Write-off details
    document_number = Column(String, nullable=False)
    writeoff_date = Column(Date, nullable=False)
    writeoff_amount = Column(Numeric(precision=15, scale=2), nullable=False)
    reason_code = Column(String, nullable=False)  # UNCOLLECTIBLE, CUSTOMER_BANKRUPTCY, SMALL_BALANCE, etc.
    reason_description = Column(Text, nullable=True)
    
    # Approval workflow
    status = Column(String, nullable=False, default="Draft")  # Draft, Approved, Rejected, Posted
    requested_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    approved_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    approval_date = Column(DateTime, nullable=True)
    approval_notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company")
    customer = relationship("Customer")
    original_invoice = relationship("ARTransaction")
    ar_transaction_type = relationship("ARTransactionType")
    requested_by = relationship("User", foreign_keys=[requested_by_user_id])
    approved_by = relationship("User", foreign_keys=[approved_by_user_id])
    
    __table_args__ = (
        UniqueConstraint('document_number', 'company_id', name='uq_writeoff_document_company'),
    )


class ARTransactionTaxLine(Base):
    __tablename__ = "ar_transaction_tax_lines"
    
    id = Column(Integer, primary_key=True)
    ar_transaction_id = Column(Integer, ForeignKey("ar_transactions.id"))
    tax_type_id = Column(Integer, ForeignKey("tax_types.id"))
    taxable_amount = Column(Numeric(15, 2))
    tax_amount = Column(Numeric(15, 2))
    base_currency_tax_amount = Column(Numeric(15, 2))
    
    ar_transaction = relationship("ARTransaction", back_populates="tax_lines")
    tax_type = relationship("TaxType")
