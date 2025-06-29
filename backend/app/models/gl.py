from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Date, Numeric, Text, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.database import Base

class GLAccount(Base):
    __tablename__ = "gl_accounts"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    account_code = Column(String, index=True, nullable=False)
    account_name = Column(String, nullable=False)
    account_type = Column(String, nullable=False)  # Asset, Liability, Equity, Income, Expense
    parent_account_id = Column(Integer, ForeignKey("gl_accounts.id"), nullable=True)
    current_balance = Column(Numeric(precision=15, scale=2), default=0.00)
    is_active = Column(Boolean, default=True)
    is_control_account = Column(Boolean, default=False)
    
    # Relationships
    company = relationship("Company")
    parent = relationship("GLAccount", remote_side=[id], backref="children")
    
    __table_args__ = (
        UniqueConstraint('account_code', 'company_id', name='uq_glaccount_code_company'),
    )

class GLJournalEntry(Base):
    __tablename__ = "gl_journal_entries"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    entry_date = Column(Date, nullable=False)
    reference = Column(String, nullable=True)
    description = Column(String, nullable=True)
    posted_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String, nullable=False, default="Draft")  # Draft, Posted
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company")
    posted_by = relationship("User")
    lines = relationship("GLJournalEntryLine", back_populates="journal_entry", cascade="all, delete-orphan")

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
    gl_account = relationship("GLAccount")
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
