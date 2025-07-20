from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Numeric, JSON, Text, Enum, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.database import Base
import enum

class SubscriptionStatus(str, enum.Enum):
    TRIAL = "trial"
    ACTIVE = "active"
    CANCELLED = "cancelled"
    EXPIRED = "expired"

class UsageMetricType(str, enum.Enum):
    API_CALLS = "api_calls"
    STORAGE = "storage"
    USERS = "users"
    TRANSACTIONS = "transactions"
    CUSTOM = "custom"

class BillingPlanType(str, enum.Enum):
    TRIAL = "trial"
    BASIC = "basic"
    PROFESSIONAL = "professional"
    ENTERPRISE = "enterprise"
    CUSTOM = "custom"

class AuditActionType(str, enum.Enum):
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"
    LOGIN = "login"
    LOGOUT = "logout"
    API_CALL = "api_call"
    PERMISSION_CHANGE = "permission_change"
    SUBSCRIPTION_CHANGE = "subscription_change"
    OTHER = "other"

class PlatformAdmin(Base):
    __tablename__ = "platform_admins"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Platform admins are separate from company users
    permissions = Column(JSON, default=list)  # List of platform permissions

class BillingPlan(Base):
    __tablename__ = "billing_plans"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    plan_type = Column(Enum(BillingPlanType), nullable=False)
    monthly_price = Column(Numeric(10, 2), default=0.00)
    annual_price = Column(Numeric(10, 2), default=0.00)
    
    # Limits
    max_users = Column(Integer, nullable=True)  # NULL = unlimited
    max_transactions_per_month = Column(Integer, nullable=True)
    max_storage_gb = Column(Integer, nullable=True)
    max_api_calls_per_day = Column(Integer, nullable=True)
    
    # Features
    features = Column(JSON, default=dict)  # {"feature_name": boolean}
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    company_subscriptions = relationship("CompanySubscription", back_populates="billing_plan")

class CompanySubscription(Base):
    __tablename__ = "company_subscriptions"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    billing_plan_id = Column(Integer, ForeignKey("billing_plans.id"), nullable=False)
    
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=True)  # NULL = active
    next_billing_date = Column(DateTime, nullable=True)
    
    is_trial = Column(Boolean, default=False)
    trial_end_date = Column(DateTime, nullable=True)
    
    # Payment info
    payment_method = Column(String, nullable=True)  # "card", "invoice", "bank_transfer"
    billing_email = Column(String, nullable=True)
    
    # Overrides
    custom_limits = Column(JSON, nullable=True)  # Override plan limits
    custom_price = Column(Numeric(10, 2), nullable=True)
    
    status = Column(Enum(SubscriptionStatus), default=SubscriptionStatus.ACTIVE)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    company = relationship("Company", backref="subscription")
    billing_plan = relationship("BillingPlan", back_populates="company_subscriptions")
    invoices = relationship("PlatformInvoice", back_populates="subscription")

class UsageMetric(Base):
    __tablename__ = "usage_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    metric_type = Column(Enum(UsageMetricType), nullable=False)
    metric_date = Column(DateTime, nullable=False, index=True)
    
    value = Column(Numeric, nullable=False)
    meta_data = Column(JSON, nullable=True)  # Additional context
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    __table_args__ = (
        UniqueConstraint('company_id', 'metric_type', 'metric_date', 
                        name='uq_usage_metric_company_type_date'),
    )

class PlatformInvoice(Base):
    __tablename__ = "platform_invoices"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    subscription_id = Column(Integer, ForeignKey("company_subscriptions.id"), nullable=False)
    
    invoice_number = Column(String, unique=True, nullable=False)
    invoice_date = Column(DateTime, nullable=False)
    due_date = Column(DateTime, nullable=False)
    
    subtotal = Column(Numeric(10, 2), nullable=False)
    tax_amount = Column(Numeric(10, 2), default=0.00)
    total_amount = Column(Numeric(10, 2), nullable=False)
    
    status = Column(String, default="draft")  # "draft", "sent", "paid", "overdue", "cancelled"
    paid_date = Column(DateTime, nullable=True)
    payment_reference = Column(String, nullable=True)
    
    # Usage summary
    usage_summary = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    subscription = relationship("CompanySubscription", back_populates="invoices")

class SystemHealth(Base):
    __tablename__ = "system_health"
    
    id = Column(Integer, primary_key=True, index=True)
    service_name = Column(String, nullable=False)  # "api", "database", "redis", "worker"
    status = Column(String, nullable=False)  # "healthy", "degraded", "down"
    
    response_time_ms = Column(Integer, nullable=True)
    cpu_usage_percent = Column(Numeric(5, 2), nullable=True)
    memory_usage_mb = Column(Integer, nullable=True)
    disk_usage_percent = Column(Numeric(5, 2), nullable=True)
    
    error_count = Column(Integer, default=0)
    last_error = Column(Text, nullable=True)
    
    meta_data = Column(JSON, nullable=True)
    
    checked_at = Column(DateTime, default=datetime.utcnow, index=True)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)  # NULL for platform actions
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    platform_admin_id = Column(Integer, ForeignKey("platform_admins.id"), nullable=True)
    
    action = Column(Enum(AuditActionType), nullable=False, index=True)
    resource_type = Column(String, nullable=False, index=True)  # "user", "invoice", "customer", etc.
    resource_id = Column(String, nullable=True)
    
    # Request details
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    request_method = Column(String, nullable=True)
    request_path = Column(String, nullable=True)
    
    # Change details
    old_values = Column(JSON, nullable=True)
    new_values = Column(JSON, nullable=True)
    
    # Response
    status_code = Column(Integer, nullable=True)
    error_message = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Indexes for common queries
    __table_args__ = (
        Index('idx_audit_company_created', 'company_id', 'created_at'),
        Index('idx_audit_user_created', 'user_id', 'created_at'),
        Index('idx_audit_resource', 'resource_type', 'resource_id'),
    )

class SystemConfiguration(Base):
    __tablename__ = "system_configurations"
    
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, nullable=False, index=True)
    value = Column(JSON, nullable=False)
    description = Column(String, nullable=True)
    
    is_sensitive = Column(Boolean, default=False)  # Encrypt in DB
    requires_restart = Column(Boolean, default=False)
    
    updated_by_admin_id = Column(Integer, ForeignKey("platform_admins.id"), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class FeatureFlag(Base):
    __tablename__ = "feature_flags"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)
    description = Column(String, nullable=True)
    
    is_enabled_globally = Column(Boolean, default=False)
    
    # Per-company enablement
    enabled_companies = Column(JSON, default=list)  # List of company IDs
    disabled_companies = Column(JSON, default=list)  # List of company IDs
    
    # Rollout percentage (0-100)
    rollout_percentage = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
