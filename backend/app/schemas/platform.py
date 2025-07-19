from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal
from enum import Enum

# Enums
class UsageMetricType(str, Enum):
    API_CALLS = "api_calls"
    STORAGE_MB = "storage_mb"
    ACTIVE_USERS = "active_users"
    TRANSACTIONS = "transactions"
    DOCUMENTS = "documents"
    REPORTS_GENERATED = "reports_generated"

class BillingPlanType(str, Enum):
    FREE = "free"
    STARTER = "starter"
    PROFESSIONAL = "professional"
    ENTERPRISE = "enterprise"
    CUSTOM = "custom"

class AuditActionType(str, Enum):
    CREATE = "create"
    READ = "read"
    UPDATE = "update"
    DELETE = "delete"
    LOGIN = "login"
    LOGOUT = "logout"
    EXPORT = "export"
    IMPORT = "import"
    APPROVE = "approve"
    REJECT = "reject"

# Platform Admin Schemas
class PlatformAdminBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    is_active: bool = True

class PlatformAdminCreate(PlatformAdminBase):
    password: str
    permissions: List[str] = []

class PlatformAdminUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    permissions: Optional[List[str]] = None

class PlatformAdmin(PlatformAdminBase):
    id: int
    last_login: Optional[datetime] = None
    created_at: datetime
    permissions: List[str]
    
    class Config:
        from_attributes = True

# Billing Plan Schemas
class BillingPlanBase(BaseModel):
    name: str
    plan_type: BillingPlanType
    monthly_price: Decimal
    annual_price: Decimal
    max_users: Optional[int] = None
    max_transactions_per_month: Optional[int] = None
    max_storage_gb: Optional[int] = None
    max_api_calls_per_day: Optional[int] = None
    features: Dict[str, bool] = {}

class BillingPlanCreate(BillingPlanBase):
    pass

class BillingPlanUpdate(BaseModel):
    name: Optional[str] = None
    monthly_price: Optional[Decimal] = None
    annual_price: Optional[Decimal] = None
    max_users: Optional[int] = None
    max_transactions_per_month: Optional[int] = None
    max_storage_gb: Optional[int] = None
    max_api_calls_per_day: Optional[int] = None
    features: Optional[Dict[str, bool]] = None
    is_active: Optional[bool] = None

class BillingPlan(BillingPlanBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Company Subscription Schemas
class CompanySubscriptionBase(BaseModel):
    company_id: int
    billing_plan_id: int
    is_trial: bool = False
    payment_method: Optional[str] = None
    billing_email: Optional[str] = None

class CompanySubscriptionCreate(CompanySubscriptionBase):
    start_date: datetime
    trial_days: Optional[int] = None
    custom_limits: Optional[Dict[str, Any]] = None
    custom_price: Optional[Decimal] = None

class CompanySubscriptionUpdate(BaseModel):
    billing_plan_id: Optional[int] = None
    payment_method: Optional[str] = None
    billing_email: Optional[str] = None
    custom_limits: Optional[Dict[str, Any]] = None
    custom_price: Optional[Decimal] = None
    status: Optional[str] = None

class CompanySubscription(CompanySubscriptionBase):
    id: int
    start_date: datetime
    end_date: Optional[datetime] = None
    next_billing_date: Optional[datetime] = None
    trial_end_date: Optional[datetime] = None
    custom_limits: Optional[Dict[str, Any]] = None
    custom_price: Optional[Decimal] = None
    status: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Usage Metric Schemas
class UsageMetricCreate(BaseModel):
    company_id: int
    metric_type: UsageMetricType
    metric_date: datetime
    value: float
    meta_data: Optional[Dict[str, Any]] = None

class UsageMetricQuery(BaseModel):
    company_id: Optional[int] = None
    metric_type: Optional[UsageMetricType] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class UsageMetric(BaseModel):
    id: int
    company_id: int
    metric_type: UsageMetricType
    metric_date: datetime
    value: float
    meta_data: Optional[Dict[str, Any]] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# Platform Invoice Schemas
class PlatformInvoiceBase(BaseModel):
    company_id: int
    subscription_id: int
    invoice_date: datetime
    due_date: datetime
    subtotal: Decimal
    tax_amount: Decimal = Decimal("0.00")
    total_amount: Decimal

class PlatformInvoiceCreate(PlatformInvoiceBase):
    usage_summary: Optional[Dict[str, Any]] = None

class PlatformInvoiceUpdate(BaseModel):
    status: Optional[str] = None
    paid_date: Optional[datetime] = None
    payment_reference: Optional[str] = None

class PlatformInvoice(PlatformInvoiceBase):
    id: int
    invoice_number: str
    status: str
    paid_date: Optional[datetime] = None
    payment_reference: Optional[str] = None
    usage_summary: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# System Health Schemas
class SystemHealthCreate(BaseModel):
    service_name: str
    status: str
    response_time_ms: Optional[int] = None
    cpu_usage_percent: Optional[float] = None
    memory_usage_mb: Optional[int] = None
    disk_usage_percent: Optional[float] = None
    error_count: int = 0
    last_error: Optional[str] = None
    meta_data: Optional[Dict[str, Any]] = None

class SystemHealth(SystemHealthCreate):
    id: int
    checked_at: datetime
    
    class Config:
        from_attributes = True

# Audit Log Schemas
class AuditLogCreate(BaseModel):
    action: AuditActionType
    resource_type: str
    resource_id: Optional[str] = None
    old_values: Optional[Dict[str, Any]] = None
    new_values: Optional[Dict[str, Any]] = None
    status_code: Optional[int] = None
    error_message: Optional[str] = None

class AuditLogQuery(BaseModel):
    company_id: Optional[int] = None
    user_id: Optional[int] = None
    action: Optional[AuditActionType] = None
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    limit: int = 100
    offset: int = 0

class AuditLog(BaseModel):
    id: int
    company_id: Optional[int] = None
    user_id: Optional[int] = None
    platform_admin_id: Optional[int] = None
    action: AuditActionType
    resource_type: str
    resource_id: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    request_method: Optional[str] = None
    request_path: Optional[str] = None
    old_values: Optional[Dict[str, Any]] = None
    new_values: Optional[Dict[str, Any]] = None
    status_code: Optional[int] = None
    error_message: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# System Configuration Schemas
class SystemConfigurationBase(BaseModel):
    key: str
    value: Any
    description: Optional[str] = None
    is_sensitive: bool = False
    requires_restart: bool = False

class SystemConfigurationCreate(SystemConfigurationBase):
    pass

class SystemConfigurationUpdate(BaseModel):
    value: Any
    description: Optional[str] = None

class SystemConfiguration(SystemConfigurationBase):
    id: int
    updated_by_admin_id: Optional[int] = None
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Feature Flag Schemas
class FeatureFlagBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_enabled_globally: bool = False
    rollout_percentage: int = 0

class FeatureFlagCreate(FeatureFlagBase):
    enabled_companies: List[int] = []
    disabled_companies: List[int] = []

class FeatureFlagUpdate(BaseModel):
    description: Optional[str] = None
    is_enabled_globally: Optional[bool] = None
    enabled_companies: Optional[List[int]] = None
    disabled_companies: Optional[List[int]] = None
    rollout_percentage: Optional[int] = None

class FeatureFlag(FeatureFlagBase):
    id: int
    enabled_companies: List[int]
    disabled_companies: List[int]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Dashboard Statistics
class PlatformStats(BaseModel):
    total_companies: int
    active_companies: int
    total_users: int
    active_users_today: int
    total_revenue_mtd: Decimal
    total_api_calls_today: int
    system_health_status: str
    critical_errors_today: int

class CompanyUsageStats(BaseModel):
    company_id: int
    company_name: str
    plan_name: str
    users_count: int
    users_limit: Optional[int]
    storage_used_gb: float
    storage_limit_gb: Optional[int]
    api_calls_today: int
    api_calls_limit: Optional[int]
    transactions_mtd: int
    transactions_limit: Optional[int]
