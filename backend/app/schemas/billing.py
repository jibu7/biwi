from pydantic import BaseModel, validator
from typing import Optional, List, Dict, Any
from datetime import date, datetime
from enum import Enum

# Resource Usage Schemas
class ResourceUsageBase(BaseModel):
    resource_type: str
    usage_amount: float
    usage_date: date
    billing_period: str
    usage_metadata: Optional[Dict[str, Any]] = None

class ResourceUsageCreate(ResourceUsageBase):
    company_id: int

class ResourceUsage(ResourceUsageBase):
    id: int
    company_id: int
    
    class Config:
        from_attributes = True

# Billing Configuration Schemas
class BillingConfigurationBase(BaseModel):
    base_monthly_fee: float = 0.00
    per_user_fee: float = 0.00
    per_gb_storage_fee: float = 0.00
    per_transaction_fee: float = 0.00
    billing_cycle: str = "monthly"
    billing_email: Optional[str] = None
    payment_method: Optional[str] = None

class BillingConfigurationCreate(BillingConfigurationBase):
    company_id: int

class BillingConfigurationUpdate(BaseModel):
    base_monthly_fee: Optional[float] = None
    per_user_fee: Optional[float] = None
    per_gb_storage_fee: Optional[float] = None
    per_transaction_fee: Optional[float] = None
    billing_cycle: Optional[str] = None
    billing_email: Optional[str] = None
    payment_method: Optional[str] = None

class BillingConfiguration(BillingConfigurationBase):
    id: int
    company_id: int
    stripe_customer_id: Optional[str] = None
    stripe_subscription_id: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Usage Alert Schemas
class UsageAlertBase(BaseModel):
    alert_type: str
    threshold_percentage: float
    is_active: bool = True
    alert_recipients: Optional[List[str]] = None

class UsageAlertCreate(UsageAlertBase):
    company_id: int

class UsageAlertUpdate(BaseModel):
    alert_type: Optional[str] = None
    threshold_percentage: Optional[float] = None
    is_active: Optional[bool] = None
    alert_recipients: Optional[List[str]] = None

class UsageAlert(UsageAlertBase):
    id: int
    company_id: int
    last_triggered: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Billing Transaction Schemas
class BillingTransactionBase(BaseModel):
    transaction_type: str
    amount: float
    currency: str = "USD"
    description: Optional[str] = None
    billing_period: str
    status: str = "pending"

class BillingTransactionCreate(BillingTransactionBase):
    company_id: int

class BillingTransaction(BillingTransactionBase):
    id: int
    company_id: int
    stripe_invoice_id: Optional[str] = None
    stripe_charge_id: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Usage Summary Schemas
class UsageSummary(BaseModel):
    company_id: int
    billing_period: str
    storage_gb: float
    users: int
    transactions: int
    api_calls: int

class UsageTrend(BaseModel):
    billing_period: str
    storage_gb: float
    users: int
    transactions: int
    api_calls: int

class CostCalculation(BaseModel):
    base_fee: float
    user_fees: float
    storage_fees: float
    transaction_fees: float
    total: float

# Tenant Provisioning Schemas
class TenantProvisioningRequest(BaseModel):
    company_data: Dict[str, Any]
    admin_user_data: Dict[str, Any]

class TenantProvisioningResult(BaseModel):
    company_id: int
    admin_user_id: int
    status: str
    billing_config_id: Optional[int] = None
    roles_created: List[int] = []

class TenantHealthStatus(BaseModel):
    company_id: int
    company_name: str
    overall_health: str
    subscription_status: str
    usage: UsageSummary
    users: Dict[str, Any]
    storage: Dict[str, Any]
    last_checked: str

class BulkTenantProvisioningRequest(BaseModel):
    tenant_configs: List[TenantProvisioningRequest]

class BulkTenantProvisioningResult(BaseModel):
    results: List[Dict[str, Any]]
    total_requested: int
    successful: int
    failed: int

# Stripe Integration Schemas
class StripeCustomerCreate(BaseModel):
    email: str
    name: str
    company_id: int

class StripeSubscriptionCreate(BaseModel):
    customer_id: str
    price_id: str
    company_id: int

class StripeWebhookEvent(BaseModel):
    type: str
    data: Dict[str, Any]
    created: int
    id: str

# Platform Analytics Schemas
class PlatformAnalytics(BaseModel):
    period: Dict[str, str]
    total_companies: int
    usage_by_company: List[Dict[str, Any]]
    aggregated_usage: Dict[str, Any]
    growth_metrics: Dict[str, Any]

class FinancialSummary(BaseModel):
    billing_period: str
    total_companies: int
    revenue_summary: Dict[str, Any]
    subscription_breakdown: Dict[str, int]
    company_revenues: List[Dict[str, Any]]

class TenantHealthDashboard(BaseModel):
    overview: Dict[str, int]
    tenant_details: List[TenantHealthStatus]
    alerts: List[Dict[str, Any]]
    recommendations: List[str]

# Bulk Operations Schemas
class BulkOperationRequest(BaseModel):
    company_ids: List[int]
    reason: str

class BulkOperationResult(BaseModel):
    action: str
    total_companies: int
    results: List[Dict[str, Any]]
    performed_by: str
    performed_at: str
