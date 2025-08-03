from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Date, Numeric, Text, DateTime, Enum
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.database.database import Base
from datetime import datetime
import enum

class ReportType(enum.Enum):
    BALANCE_SHEET = "balance_sheet"
    INCOME_STATEMENT = "income_statement"
    CASH_FLOW = "cash_flow"
    TRIAL_BALANCE = "trial_balance"
    CUSTOM = "custom"
    AR_AGING = "ar_aging"
    AP_AGING = "ap_aging"
    INVENTORY_VALUATION = "inventory_valuation"

class ReportFrequency(enum.Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"
    ON_DEMAND = "on_demand"


class ReportTemplate(Base):
    __tablename__ = "report_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    name = Column(String, nullable=False)
    report_type = Column(Enum(ReportType), nullable=False)
    configuration = Column(JSONB, nullable=False)  # Stores report parameters, filters, columns
    is_system = Column(Boolean, default=False)  # System reports vs custom
    created_by_user_id = Column(Integer, ForeignKey("users.id"))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    company = relationship("Company", back_populates="report_templates")
    created_by = relationship("User")
    schedules = relationship("ReportSchedule", back_populates="template")


class ReportSchedule(Base):
    __tablename__ = "report_schedules"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    template_id = Column(Integer, ForeignKey("report_templates.id"), nullable=False)
    frequency = Column(Enum(ReportFrequency), nullable=False)
    schedule_config = Column(JSONB)  # Cron expression or specific timing
    recipient_emails = Column(JSONB)  # List of email addresses
    export_formats = Column(JSONB)  # ["pdf", "excel", "csv"]
    is_active = Column(Boolean, default=True)
    last_run_at = Column(DateTime, nullable=True)
    next_run_at = Column(DateTime, nullable=True)

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


class GeneratedReport(Base):
    __tablename__ = "generated_reports"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    template_id = Column(Integer, ForeignKey("report_templates.id"), nullable=True)
    report_type = Column(Enum(ReportType), nullable=False)
    report_name = Column(String, nullable=False)
    parameters = Column(JSONB)  # Parameters used for generation
    file_path = Column(String, nullable=True)  # S3 or local storage path
    format = Column(String)  # pdf, excel, csv
    generated_at = Column(DateTime, nullable=False)
    generated_by_user_id = Column(Integer, ForeignKey("users.id"))
    file_size = Column(Integer, nullable=True)

    # Relationships
    company = relationship("Company")
    template = relationship("ReportTemplate")
    generated_by = relationship("User")


class FinancialReportingPeriod(Base):
    __tablename__ = "financial_reporting_periods"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    period_type = Column(String)  # "monthly", "quarterly", "yearly"
    period_name = Column(String)  # "Q1 2024", "FY 2024"
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    is_closed = Column(Boolean, default=False)
    closing_entries_posted = Column(Boolean, default=False)

    # Relationships
    company = relationship("Company")
