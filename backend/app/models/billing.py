from sqlalchemy import Column, Integer, String, Numeric, Date, DateTime, ForeignKey, UniqueConstraint, Index, Boolean
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.database.database import Base
from datetime import datetime

class ResourceUsage(Base):
    __tablename__ = "resource_usage"
    
    id = Column(Integer, primary_key=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    resource_type = Column(String, nullable=False)  # storage, api_calls, users, transactions
    usage_date = Column(Date, nullable=False)
    quantity = Column(Numeric(15, 4), nullable=False)
    unit = Column(String, nullable=False)  # GB, count, etc.
    usage_metadata = Column(JSONB, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    company = relationship("Company")
    
    __table_args__ = (
        UniqueConstraint('company_id', 'resource_type', 'usage_date', name='uq_company_resource_date'),
        Index('idx_resource_usage_company_date', 'company_id', 'usage_date'),
    )

class BillingConfiguration(Base):
    __tablename__ = "billing_configurations"
    
    company_id = Column(Integer, ForeignKey("companies.id"), primary_key=True)
    billing_provider = Column(String, default="stripe")
    customer_id = Column(String, nullable=True)
    subscription_id = Column(String, nullable=True)
    payment_method_id = Column(String, nullable=True)
    billing_cycle = Column(String, default="monthly")
    next_billing_date = Column(Date, nullable=True)
    custom_pricing = Column(JSONB, nullable=True)
    discount_percentage = Column(Numeric(5, 2), default=0)
    
    company = relationship("Company", back_populates="billing_configuration")

class UsageAlert(Base):
    __tablename__ = "usage_alerts"
    
    id = Column(Integer, primary_key=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    alert_type = Column(String, nullable=False)
    threshold_value = Column(Numeric(15, 4), nullable=False)
    current_value = Column(Numeric(15, 4), nullable=False)
    alert_date = Column(DateTime, default=datetime.utcnow)
    acknowledged = Column(Boolean, default=False)
    acknowledged_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    company = relationship("Company")
    acknowledged_by_user = relationship("User")
