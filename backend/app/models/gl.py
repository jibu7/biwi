from sqlalchemy import Column, Integer, String, ForeignKey, Date, Numeric, Boolean, Text, DateTime, UniqueConstraint, CheckConstraint, Index
from sqlalchemy.orm import relationship, validates
from sqlalchemy.sql import func
from app.database.database import Base

class GLAccount(Base):
    __tablename__ = "gl_accounts"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    account_code = Column(String, nullable=False, index=True)
    account_name = Column(String, nullable=False)
    account_type = Column(String, nullable=False)  # Asset, Liability, Equity, Income, Expense
    parent_account_id = Column(Integer, ForeignKey("gl_accounts.id"), nullable=True)
    current_balance = Column(Numeric(precision=15, scale=2), default=0.00)
    is_active = Column(Boolean, default=True)
    is_control_account = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    company = relationship("Company", back_populates="gl_accounts")
    parent = relationship("GLAccount", remote_side=[id], backref="children")
    journal_lines = relationship("GLJournalEntryLine", back_populates="gl_account")
    
    __table_args__ = (
        UniqueConstraint('account_code', 'company_id', name='uq_glaccount_code_company'),
        CheckConstraint("account_type IN ('Asset', 'Liability', 'Equity', 'Income', 'Expense')", 
                       name='ck_glaccount_type'),
    )
    
    @validates('parent_account_id')
    def validate_parent(self, key, parent_id):
        """Ensure parent account belongs to same company"""
        if parent_id and hasattr(self, 'company_id'):
            # This validation will be enforced at service level
            pass
        return parent_id

class GLJournalEntry(Base):
    __tablename__ = "gl_journal_entries"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    entry_date = Column(Date, nullable=False, index=True)
    reference = Column(String, nullable=True)
    description = Column(String, nullable=False)
    posted_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String, nullable=False, default="Draft")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Add audit fields
    posting_date = Column(DateTime(timezone=True), nullable=True)
    approved_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    approval_date = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    company = relationship("Company", back_populates="gl_journal_entries")
    posted_by_user = relationship("User", foreign_keys=[posted_by_user_id])
    approved_by_user = relationship("User", foreign_keys=[approved_by_user_id])
    lines = relationship("GLJournalEntryLine", back_populates="journal_entry", cascade="all, delete-orphan")
    
    __table_args__ = (
        CheckConstraint("status IN ('Draft', 'Posted', 'Cancelled')", name='ck_gljournal_status'),
    )

class GLJournalEntryLine(Base):
    __tablename__ = "gl_journal_entry_lines"
    
    id = Column(Integer, primary_key=True, index=True)
    journal_entry_id = Column(Integer, ForeignKey("gl_journal_entries.id"), nullable=False)
    gl_account_id = Column(Integer, ForeignKey("gl_accounts.id"), nullable=False)
    description = Column(String, nullable=True)
    debit_amount = Column(Numeric(precision=15, scale=2), default=0.00)
    credit_amount = Column(Numeric(precision=15, scale=2), default=0.00)
    
    # Multi-currency support for foreign currency transactions
    currency_id = Column(Integer, ForeignKey("currencies.id"), nullable=True)
    exchange_rate = Column(Numeric(15, 6), default=1.000000)
    foreign_currency_debit_amount = Column(Numeric(15, 2), default=0.00)
    foreign_currency_credit_amount = Column(Numeric(15, 2), default=0.00)
    
    # Relationships
    journal_entry = relationship("GLJournalEntry", back_populates="lines")
    gl_account = relationship("GLAccount", back_populates="journal_lines")
    currency = relationship("Currency")

class GLTransactionType(Base):
    __tablename__ = "gl_transaction_types"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    default_debit_account_id = Column(Integer, ForeignKey("gl_accounts.id"), nullable=True)
    default_credit_account_id = Column(Integer, ForeignKey("gl_accounts.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    company = relationship("Company")
    default_debit_account = relationship("GLAccount", foreign_keys=[default_debit_account_id])
    default_credit_account = relationship("GLAccount", foreign_keys=[default_credit_account_id])
    
    __table_args__ = (
        UniqueConstraint('name', 'company_id', name='uq_gltransactiontype_name_company'),
        Index('idx_gl_trans_type_company', 'company_id'),
    )

class GLDefaults(Base):
    __tablename__ = "gl_defaults"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), unique=True, nullable=False)
    retained_earnings_account_id = Column(Integer, ForeignKey("gl_accounts.id"), nullable=True)
    default_cash_account_id = Column(Integer, ForeignKey("gl_accounts.id"), nullable=True)
    default_ar_control_account_id = Column(Integer, ForeignKey("gl_accounts.id"), nullable=True)
    default_ap_control_account_id = Column(Integer, ForeignKey("gl_accounts.id"), nullable=True)
    forex_gain_account_id = Column(Integer, ForeignKey("gl_accounts.id"), nullable=True)
    forex_loss_account_id = Column(Integer, ForeignKey("gl_accounts.id"), nullable=True)
    
    # Relationships
    company = relationship("Company")
    retained_earnings_account = relationship("GLAccount", foreign_keys=[retained_earnings_account_id])
    default_cash_account = relationship("GLAccount", foreign_keys=[default_cash_account_id])
    default_ar_control_account = relationship("GLAccount", foreign_keys=[default_ar_control_account_id])
    default_ap_control_account = relationship("GLAccount", foreign_keys=[default_ap_control_account_id])
    forex_gain_account = relationship("GLAccount", foreign_keys=[forex_gain_account_id])
    forex_loss_account = relationship("GLAccount", foreign_keys=[forex_loss_account_id])
