from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from decimal import Decimal
import hashlib
import hmac
from app import models, schemas
from app.core.security import get_password_hash, verify_password
from app.models.platform import UsageMetricType, AuditActionType
from fastapi import HTTPException, status

# Platform Admin CRUD
def authenticate_platform_admin(db: Session, email: str, password: str) -> Optional[models.PlatformAdmin]:
    admin = db.query(models.PlatformAdmin).filter(
        models.PlatformAdmin.email == email
    ).first()
    if not admin or not verify_password(password, admin.hashed_password):
        return None
    
    # Update last login
    admin.last_login = datetime.utcnow()
    db.commit()
    return admin

def create_platform_admin(db: Session, admin_in: schemas.PlatformAdminCreate) -> models.PlatformAdmin:
    hashed_password = get_password_hash(admin_in.password)
    db_admin = models.PlatformAdmin(
        email=admin_in.email,
        hashed_password=hashed_password,
        full_name=admin_in.full_name,
        is_active=admin_in.is_active,
        permissions=admin_in.permissions
    )
    db.add(db_admin)
    db.commit()
    db.refresh(db_admin)
    return db_admin

# Billing Plan CRUD
def create_billing_plan(db: Session, plan_in: schemas.BillingPlanCreate) -> models.BillingPlan:
    db_plan = models.BillingPlan(**plan_in.dict())
    db.add(db_plan)
    db.commit()
    db.refresh(db_plan)
    return db_plan

def get_billing_plans(db: Session, active_only: bool = True) -> List[models.BillingPlan]:
    query = db.query(models.BillingPlan)
    if active_only:
        query = query.filter(models.BillingPlan.is_active == True)
    return query.all()

# Company Subscription Services
def create_company_subscription(
    db: Session, 
    subscription_in: schemas.CompanySubscriptionCreate
) -> models.CompanySubscription:
    # End any existing active subscription
    existing = db.query(models.CompanySubscription).filter(
        models.CompanySubscription.company_id == subscription_in.company_id,
        models.CompanySubscription.end_date.is_(None)
    ).first()
    
    if existing:
        existing.end_date = datetime.utcnow()
        db.commit()
    
    # Create new subscription
    trial_end_date = None
    if subscription_in.is_trial and subscription_in.trial_days:
        trial_end_date = subscription_in.start_date + timedelta(days=subscription_in.trial_days)
    
    # Calculate next billing date
    plan = db.query(models.BillingPlan).filter(
        models.BillingPlan.id == subscription_in.billing_plan_id
    ).first()
    
    next_billing_date = subscription_in.start_date + timedelta(days=30)
    if trial_end_date and trial_end_date > subscription_in.start_date:
        next_billing_date = trial_end_date + timedelta(days=1)
    
    db_subscription = models.CompanySubscription(
        **subscription_in.dict(exclude={'trial_days'}),
        trial_end_date=trial_end_date,
        next_billing_date=next_billing_date
    )
    db.add(db_subscription)
    db.commit()
    db.refresh(db_subscription)
    return db_subscription

def check_subscription_limits(
    db: Session, 
    company_id: int, 
    metric_type: str, 
    value: int = 1
) -> bool:
    """Check if company is within subscription limits"""
    subscription = db.query(models.CompanySubscription).filter(
        models.CompanySubscription.company_id == company_id,
        models.CompanySubscription.end_date.is_(None),
        models.CompanySubscription.status == "active"
    ).first()
    
    if not subscription:
        return False
    
    plan = subscription.billing_plan
    limits = subscription.custom_limits or {}
    
    # Check specific limit
    if metric_type == "users":
        max_limit = limits.get("max_users", plan.max_users)
        if max_limit is None:
            return True
        current = db.query(models.User).filter(
            models.User.company_id == company_id,
            models.User.is_active == True
        ).count()
        return current + value <= max_limit
    
    elif metric_type == "api_calls":
        max_limit = limits.get("max_api_calls_per_day", plan.max_api_calls_per_day)
        if max_limit is None:
            return True
        today = datetime.utcnow().date()
        current = db.query(models.UsageMetric).filter(
            models.UsageMetric.company_id == company_id,
            models.UsageMetric.metric_type == UsageMetricType.API_CALLS,
            models.UsageMetric.metric_date >= today
        ).first()
        current_value = current.value if current else 0
        return current_value + value <= max_limit
    
    # Add more limit checks as needed
    return True

# Usage Tracking Services
def track_usage(
    db: Session,
    company_id: int,
    metric_type: UsageMetricType,
    value: float = 1.0,
    metadata: Optional[Dict[str, Any]] = None
):
    """Track usage metric for a company"""
    now = datetime.utcnow()
    metric_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Try to update existing metric for today
    existing = db.query(models.UsageMetric).filter(
        models.UsageMetric.company_id == company_id,
        models.UsageMetric.metric_type == metric_type,
        models.UsageMetric.metric_date == metric_date
    ).first()
    
    if existing:
        existing.value += value
        if metadata and existing.meta_data:
            existing.meta_data.update(metadata)
        elif metadata:
            existing.meta_data = metadata
    else:
        db_metric = models.UsageMetric(
            company_id=company_id,
            metric_type=metric_type,
            metric_date=metric_date,
            value=value,
            meta_data=metadata or {}
        )
        db.add(db_metric)
    
    db.commit()

def get_usage_summary(
    db: Session,
    company_id: int,
    start_date: datetime,
    end_date: datetime
) -> Dict[str, Any]:
    """Get usage summary for billing period"""
    metrics = db.query(models.UsageMetric).filter(
        models.UsageMetric.company_id == company_id,
        models.UsageMetric.metric_date >= start_date,
        models.UsageMetric.metric_date <= end_date
    ).all()
    
    summary = {
        "api_calls": 0,
        "storage_mb": 0,
        "active_users": 0,
        "transactions": 0,
        "documents": 0,
        "reports_generated": 0
    }
    
    for metric in metrics:
        key = metric.metric_type.value
        if key in summary:
            summary[key] += metric.value
    
    # Get current values for point-in-time metrics
    summary["active_users"] = db.query(models.User).filter(
        models.User.company_id == company_id,
        models.User.is_active == True
    ).count()
    
    return summary

# Invoice Generation
def generate_invoice(
    db: Session,
    subscription_id: int
) -> models.PlatformInvoice:
    """Generate invoice for subscription"""
    subscription = db.query(models.CompanySubscription).filter(
        models.CompanySubscription.id == subscription_id
    ).first()
    
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    # Calculate billing period
    end_date = datetime.utcnow()
    start_date = subscription.next_billing_date - timedelta(days=30)
    
    # Get usage summary
    usage_summary = get_usage_summary(db, subscription.company_id, start_date, end_date)
    
    # Calculate amount
    plan = subscription.billing_plan
    base_amount = subscription.custom_price or plan.monthly_price
    
    # Apply usage-based pricing if applicable
    # This is simplified - real implementation would be more complex
    total_amount = base_amount
    
    # Generate invoice number
    invoice_count = db.query(models.PlatformInvoice).count()
    invoice_number = f"INV-{datetime.utcnow().strftime('%Y%m')}-{invoice_count + 1:04d}"
    
    db_invoice = models.PlatformInvoice(
        company_id=subscription.company_id,
        subscription_id=subscription_id,
        invoice_number=invoice_number,
        invoice_date=datetime.utcnow(),
        due_date=datetime.utcnow() + timedelta(days=30),
        subtotal=total_amount,
        tax_amount=Decimal("0.00"),  # Implement tax calculation
        total_amount=total_amount,
        usage_summary=usage_summary,
        status="draft"
    )
    
    db.add(db_invoice)
    
    # Update next billing date
    subscription.next_billing_date = end_date + timedelta(days=30)
    
    db.commit()
    db.refresh(db_invoice)
    return db_invoice

# Health Monitoring
def record_health_check(
    db: Session,
    health_data: schemas.SystemHealthCreate
) -> models.SystemHealth:
    """Record system health check"""
    db_health = models.SystemHealth(**health_data.dict())
    db.add(db_health)
    db.commit()
    db.refresh(db_health)
    return db_health

def get_system_health_summary(db: Session) -> Dict[str, Any]:
    """Get current system health summary"""
    # Get latest health check for each service
    latest_checks = db.query(models.SystemHealth).distinct(
        models.SystemHealth.service_name
    ).order_by(
        models.SystemHealth.service_name,
        models.SystemHealth.checked_at.desc()
    ).all()
    
    summary = {
        "overall_status": "healthy",
        "services": {},
        "last_check": None
    }
    
    for check in latest_checks:
        summary["services"][check.service_name] = {
            "status": check.status,
            "response_time_ms": check.response_time_ms,
            "error_count": check.error_count,
            "checked_at": check.checked_at
        }
        
        if check.status != "healthy":
            summary["overall_status"] = "degraded"
        
        if summary["last_check"] is None or check.checked_at > summary["last_check"]:
            summary["last_check"] = check.checked_at
    
    return summary

# Audit Logging
def create_audit_log(
    db: Session,
    audit_data: schemas.AuditLogCreate,
    company_id: Optional[int] = None,
    user_id: Optional[int] = None,
    platform_admin_id: Optional[int] = None,
    request_info: Optional[Dict[str, str]] = None
) -> models.AuditLog:
    """Create audit log entry"""
    db_audit = models.AuditLog(
        **audit_data.dict(),
        company_id=company_id,
        user_id=user_id,
        platform_admin_id=platform_admin_id
    )
    
    if request_info:
        db_audit.ip_address = request_info.get("ip_address")
        db_audit.user_agent = request_info.get("user_agent")
        db_audit.request_method = request_info.get("request_method")
        db_audit.request_path = request_info.get("request_path")
    
    db.add(db_audit)
    db.commit()
    db.refresh(db_audit)
    return db_audit

def query_audit_logs(
    db: Session,
    query_params: schemas.AuditLogQuery
) -> List[models.AuditLog]:
    """Query audit logs with filters"""
    query = db.query(models.AuditLog)
    
    if query_params.company_id:
        query = query.filter(models.AuditLog.company_id == query_params.company_id)
    if query_params.user_id:
        query = query.filter(models.AuditLog.user_id == query_params.user_id)
    if query_params.action:
        query = query.filter(models.AuditLog.action == query_params.action)
    if query_params.resource_type:
        query = query.filter(models.AuditLog.resource_type == query_params.resource_type)
    if query_params.resource_id:
        query = query.filter(models.AuditLog.resource_id == query_params.resource_id)
    if query_params.start_date:
        query = query.filter(models.AuditLog.created_at >= query_params.start_date)
    if query_params.end_date:
        query = query.filter(models.AuditLog.created_at <= query_params.end_date)
    
    return query.order_by(
        models.AuditLog.created_at.desc()
    ).limit(query_params.limit).offset(query_params.offset).all()

# System Configuration
def get_system_config(db: Session, key: str) -> Optional[Any]:
    """Get system configuration value"""
    config = db.query(models.SystemConfiguration).filter(
        models.SystemConfiguration.key == key
    ).first()
    return config.value if config else None

def set_system_config(
    db: Session,
    key: str,
    value: Any,
    description: Optional[str] = None,
    admin_id: int = None,
    is_sensitive: bool = False,
    requires_restart: bool = False
) -> models.SystemConfiguration:
    """Set system configuration value"""
    config = db.query(models.SystemConfiguration).filter(
        models.SystemConfiguration.key == key
    ).first()
    
    if config:
        config.value = value
        if description:
            config.description = description
        config.updated_by_admin_id = admin_id
        config.updated_at = datetime.utcnow()
    else:
        config = models.SystemConfiguration(
            key=key,
            value=value,
            description=description,
            is_sensitive=is_sensitive,
            requires_restart=requires_restart,
            updated_by_admin_id=admin_id
        )
        db.add(config)
    
    db.commit()
    db.refresh(config)
    return config

# Feature Flags
def is_feature_enabled(
    db: Session,
    feature_name: str,
    company_id: int
) -> bool:
    """Check if feature is enabled for company"""
    feature = db.query(models.FeatureFlag).filter(
        models.FeatureFlag.name == feature_name
    ).first()
    
    if not feature:
        return False
    
    # Check global enablement
    if feature.is_enabled_globally:
        # Check if explicitly disabled for this company
        return company_id not in feature.disabled_companies
    
    # Check if explicitly enabled for this company
    if company_id in feature.enabled_companies:
        return True
    
    # Check rollout percentage
    if feature.rollout_percentage > 0:
        # Simple hash-based rollout
        hash_input = f"{feature_name}:{company_id}".encode()
        hash_value = int(hashlib.md5(hash_input).hexdigest(), 16)
        return (hash_value % 100) < feature.rollout_percentage
    
    return False

# Platform Statistics
def get_platform_stats(db: Session) -> schemas.PlatformStats:
    """Get platform-wide statistics"""
    total_companies = db.query(models.Company).count()
    active_companies = db.query(models.Company).filter(
        models.Company.is_active == True
    ).count()
    
    total_users = db.query(models.User).count()
    
    today = datetime.utcnow().date()
    active_users_today = db.query(models.AuditLog).filter(
        models.AuditLog.action == AuditActionType.LOGIN,
        models.AuditLog.created_at >= today
    ).distinct(models.AuditLog.user_id).count()
    
    # Revenue calculation
    mtd_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0)
    total_revenue_mtd = db.query(
        func.sum(models.PlatformInvoice.total_amount)
    ).filter(
        models.PlatformInvoice.status == "paid",
        models.PlatformInvoice.paid_date >= mtd_start
    ).scalar() or Decimal("0.00")
    
    # API calls today
    api_calls_today = db.query(
        func.sum(models.UsageMetric.value)
    ).filter(
        models.UsageMetric.metric_type == UsageMetricType.API_CALLS,
        models.UsageMetric.metric_date >= today
    ).scalar() or 0
    
    # System health
    health_summary = get_system_health_summary(db)
    
    # Critical errors
    critical_errors_today = db.query(models.AuditLog).filter(
        models.AuditLog.created_at >= today,
        models.AuditLog.status_code >= 500
    ).count()
    
    return schemas.PlatformStats(
        total_companies=total_companies,
        active_companies=active_companies,
        total_users=total_users,
        active_users_today=active_users_today,
        total_revenue_mtd=total_revenue_mtd,
        total_api_calls_today=int(api_calls_today),
        system_health_status=health_summary["overall_status"],
        critical_errors_today=critical_errors_today
    )
