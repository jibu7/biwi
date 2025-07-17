from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Date, Numeric, UniqueConstraint, DateTime, CheckConstraint, Text, Index
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy import Enum
from enum import Enum as PyEnum
from datetime import datetime
from app.database.database import Base

class UserType(str, PyEnum):
    PLATFORM_ADMIN = "platform_admin"  # Can access all companies
    COMPANY_ADMIN = "company_admin"    # Admin within a company
    COMPANY_USER = "company_user"      # Regular user within a company

class SubscriptionStatus(str, PyEnum):
    TRIAL = "trial"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    CANCELLED = "cancelled"

class Company(Base):
    __tablename__ = "companies"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    code = Column(String(10), unique=True, nullable=False, index=True)  # Short code for easy identification
    
    # Multi-tenant specific fields
    subscription_status = Column(Enum(SubscriptionStatus), default=SubscriptionStatus.TRIAL, nullable=False)
    subscription_plan = Column(String(50), nullable=True)  # basic, professional, enterprise
    subscription_expires = Column(Date, nullable=True)
    storage_limit_gb = Column(Integer, default=10, nullable=False)
    user_limit = Column(Integer, default=5, nullable=False)
    
    # Contact and billing
    primary_contact_email = Column(String(255), nullable=True)
    billing_email = Column(String(255), nullable=True)
    
    # Platform metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Existing fields
    address = Column(JSONB, nullable=True)
    contact_info = Column(JSONB, nullable=True)
    default_currency_code = Column(String(3), nullable=True)
    is_active = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime, nullable=True)
    
    users = relationship("User", foreign_keys="User.company_id", back_populates="company")
    roles = relationship("Role", back_populates="company", cascade="all, delete-orphan")
    accounting_periods = relationship("AccountingPeriod", back_populates="company", cascade="all, delete-orphan")
    audit_logs = relationship("PlatformAuditLog", back_populates="company")
    
    # GL relationships
    gl_accounts = relationship("GLAccount", back_populates="company", cascade="all, delete-orphan")
    gl_journal_entries = relationship("GLJournalEntry", back_populates="company", cascade="all, delete-orphan")
    
    # Billing relationships
    billing_configuration = relationship("BillingConfiguration", back_populates="company", uselist=False)
    usage_alerts = relationship("UsageAlert", back_populates="company")
    
    # Reporting relationships
    report_templates = relationship("ReportTemplate", back_populates="company")
    report_schedules = relationship("ReportSchedule", back_populates="company")
    bank_reconciliations = relationship("BankReconciliation", back_populates="company")
    
    # GL relationships
    gl_accounts = relationship("GLAccount", back_populates="company")
    gl_journal_entries = relationship("GLJournalEntry", back_populates="company")

class Role(Base):
    __tablename__ = "roles"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(String, nullable=True)
    permissions = Column(JSONB, nullable=True)  # List of permission strings
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    
    company = relationship("Company", back_populates="roles")
    users = relationship("UserRole", back_populates="role")
    
    __table_args__ = (UniqueConstraint('name', 'company_id', name='uq_role_name_company'),)

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)  # Deprecated, use user_type
    
    # NEW FIELDS
    user_type = Column(String, default=UserType.COMPANY_USER.value, nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)  # Now nullable!
    default_company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    mfa_secret = Column(String, nullable=True)  # For MFA
    
    # Update relationships
    company = relationship("Company", foreign_keys=[company_id], back_populates="users")
    default_company = relationship("Company", foreign_keys=[default_company_id])
    roles = relationship("UserRole", back_populates="user", cascade="all, delete-orphan")
    platform_audit_logs = relationship("PlatformAuditLog", back_populates="user")
    
    __table_args__ = (
        CheckConstraint(
            "user_type = 'platform_admin' OR company_id IS NOT NULL",
            name='ck_company_required_for_non_platform_users'
        ),
        CheckConstraint(
            "user_type IN ('platform_admin', 'company_admin', 'company_user')",
            name='ck_valid_user_type'
        ),
    )

class UserRole(Base):
    __tablename__ = "user_roles"
    
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    role_id = Column(Integer, ForeignKey("roles.id"), primary_key=True)
    
    user = relationship("User", back_populates="roles")
    role = relationship("Role", back_populates="users")

class AccountingPeriod(Base):
    __tablename__ = "accounting_periods"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    name = Column(String, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(String, nullable=False)  # "Open", "Closed", "Future"
    
    company = relationship("Company", back_populates="accounting_periods")
    
    __table_args__ = (UniqueConstraint('name', 'company_id', name='uq_accountingperiod_name_company'),)

class PlatformAuditLog(Base):
    __tablename__ = "platform_audit_logs"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Nullable for system events
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    action = Column(String(100), nullable=False, index=True)
    resource_type = Column(String(50), nullable=True)
    resource_id = Column(Integer, nullable=True)
    details = Column(JSONB, nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Relationships
    user = relationship("User", back_populates="platform_audit_logs")
    company = relationship("Company", back_populates="audit_logs")
    
    __table_args__ = (
        Index('idx_platform_audit_company_timestamp', 'company_id', 'timestamp'),
        Index('idx_platform_audit_user_timestamp', 'user_id', 'timestamp'),
    )
