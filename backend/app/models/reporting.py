from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Date, Numeric, Text, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.database.database import Base
from datetime import datetime


class ReportTemplate(Base):
    __tablename__ = "report_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    name = Column(String, nullable=False)
    report_type = Column(String, nullable=False)  # "BalanceSheet", "IncomeStatement", "CashFlow"
    template_data = Column(JSONB, nullable=False)  # Report structure and formatting
    is_default = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    company = relationship("Company", back_populates="report_templates")
    created_by = relationship("User")
    schedules = relationship("ReportSchedule", back_populates="template")


class ReportSchedule(Base):
    __tablename__ = "report_schedules"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    name = Column(String, nullable=False)
    report_template_id = Column(Integer, ForeignKey("report_templates.id"), nullable=False)
    schedule_frequency = Column(String, nullable=False)  # "Daily", "Weekly", "Monthly", "Quarterly"
    schedule_parameters = Column(JSONB, nullable=True)  # Frequency details, recipients
    is_active = Column(Boolean, default=True)
    last_run_date = Column(DateTime, nullable=True)
    next_run_date = Column(DateTime, nullable=True)

    # Relationships
    company = relationship("Company", back_populates="report_schedules")
    template = relationship("ReportTemplate", back_populates="schedules")


class BankReconciliation(Base):
    __tablename__ = "bank_reconciliations"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    bank_gl_account_id = Column(Integer, ForeignKey("gl_accounts.id"), nullable=False)
    reconciliation_date = Column(Date, nullable=False)
    statement_balance = Column(Numeric, nullable=False)
    book_balance = Column(Numeric, nullable=False)
    status = Column(String, default="Open")  # "Open", "Reconciled", "Review"
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    company = relationship("Company", back_populates="bank_reconciliations")
    bank_gl_account = relationship("GLAccount")
    created_by = relationship("User")
    items = relationship("BankReconciliationItem", back_populates="bank_reconciliation")


class BankReconciliationItem(Base):
    __tablename__ = "bank_reconciliation_items"
    
    id = Column(Integer, primary_key=True, index=True)
    bank_reconciliation_id = Column(Integer, ForeignKey("bank_reconciliations.id"), nullable=False)
    gl_journal_entry_line_id = Column(Integer, ForeignKey("gl_journal_entry_lines.id"), nullable=True)
    item_type = Column(String, nullable=False)  # "Outstanding", "Deposit", "BankCharge", "Interest"
    description = Column(String, nullable=False)
    amount = Column(Numeric, nullable=False)
    is_reconciled = Column(Boolean, default=False)

    # Relationships
    bank_reconciliation = relationship("BankReconciliation", back_populates="items")
    gl_journal_entry_line = relationship("GLJournalEntryLine")
