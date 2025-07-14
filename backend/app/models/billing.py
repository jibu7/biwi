from sqlalchemy import Column, Integer, String, Numeric, Date, DateTime, ForeignKey, UniqueConstraint, Index, Float, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime
from app.database.database import Base

class ResourceUsage(Base):
    __tablename__ = "resource_usage"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    resource_type = Column(String, nullable=False)  # "storage", "users", "transactions", "api_calls"
    usage_amount = Column(Numeric(10, 2), nullable=False)  # Amount used
    usage_date = Column(Date, nullable=False)
    billing_period = Column(String, nullable=False)  # "2024-01", "2024-02", etc.
    usage_metadata = Column(JSONB, nullable=True)  # Additional usage context
    
    company = relationship("Company")
    
    __table_args__ = (
        UniqueConstraint('company_id', 'resource_type', 'usage_date', name='uq_usage_company_resource_date'),
        Index('idx_resource_usage_company_date', 'company_id', 'usage_date'),
        Index('idx_resource_usage_billing_period', 'billing_period'),
    )

class BillingConfiguration(Base):
    __tablename__ = "billing_configurations"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, unique=True)
    
    # Pricing configuration
    base_monthly_fee = Column(Numeric(10, 2), default=0.00)
    per_user_fee = Column(Numeric(10, 2), default=0.00)
    per_gb_storage_fee = Column(Numeric(10, 2), default=0.00)
    per_transaction_fee = Column(Numeric(10, 2), default=0.00)
    
    # Billing settings
    billing_cycle = Column(String, default="monthly")  # "monthly", "yearly"
    billing_email = Column(String, nullable=True)
    payment_method = Column(String, nullable=True)  # "stripe", "manual", etc.
    
    # Stripe integration
    stripe_customer_id = Column(String, nullable=True)
    stripe_subscription_id = Column(String, nullable=True)
    
    # Audit
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    company = relationship("Company", back_populates="billing_configuration")

class UsageAlert(Base):
    __tablename__ = "usage_alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    alert_type = Column(String, nullable=False)  # "storage_limit", "user_limit", "transaction_limit"
    threshold_percentage = Column(Float, nullable=False)  # 80.0 for 80%
    is_active = Column(Boolean, default=True)
    last_triggered = Column(DateTime, nullable=True)
    alert_recipients = Column(JSONB, nullable=True)  # List of email addresses
    
    company = relationship("Company", back_populates="usage_alerts")

class BillingTransaction(Base):
    __tablename__ = "billing_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    
    # Transaction details
    transaction_type = Column(String, nullable=False)  # "charge", "refund", "credit"
    amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(3), default="USD")
    description = Column(String, nullable=True)
    
    # Billing period
    billing_period = Column(String, nullable=False)  # "2024-01"
    
    # External references
    stripe_invoice_id = Column(String, nullable=True)
    stripe_charge_id = Column(String, nullable=True)
    
    # Status
    status = Column(String, default="pending")  # "pending", "paid", "failed", "refunded"
    
    # Audit
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    company = relationship("Company")
    
    __table_args__ = (
        Index('idx_billing_transaction_company_period', 'company_id', 'billing_period'),
    )
