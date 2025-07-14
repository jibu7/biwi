from typing import List, Dict, Any
from datetime import datetime, timedelta, date
from fastapi import APIRouter, Depends, Query, Request, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from app.database.database import get_db
from app import models, schemas
from app.core.platform_security import (
    get_platform_admin, 
    PlatformContext,
    get_platform_context,
    log_platform_action
)
from app.services.usage_tracking import UsageTrackingService
from app.services.billing_service import BillingService
from app.services.tenant_provisioning import TenantProvisioningService
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/platform/reports", tags=["platform-reports"])

@router.get("/audit-summary")
async def get_audit_summary(
    days: int = Query(7, ge=1, le=90),
    db: Session = Depends(get_db),
    platform_admin: models.User = Depends(get_platform_admin)
) -> Dict[str, Any]:
    """Get audit log summary for the specified period"""
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    # Get audit logs for the period
    audit_logs = db.query(models.PlatformAuditLog).filter(
        models.PlatformAuditLog.timestamp >= start_date,
        models.PlatformAuditLog.timestamp <= end_date
    ).all()
    
    # Aggregate by action type
    actions_summary = {}
    companies_accessed = set()
    users_active = set()
    
    for log in audit_logs:
        action = log.action
        if action not in actions_summary:
            actions_summary[action] = 0
        actions_summary[action] += 1
        
        if log.company_id:
            companies_accessed.add(log.company_id)
        users_active.add(log.user_id)
    
    # Get top companies by access frequency
    company_access_counts = db.query(
        models.PlatformAuditLog.company_id,
        func.count(models.PlatformAuditLog.id).label('access_count')
    ).filter(
        models.PlatformAuditLog.timestamp >= start_date,
        models.PlatformAuditLog.timestamp <= end_date,
        models.PlatformAuditLog.company_id.isnot(None)
    ).group_by(models.PlatformAuditLog.company_id).order_by(
        func.count(models.PlatformAuditLog.id).desc()
    ).limit(10).all()
    
    top_companies = []
    for company_id, count in company_access_counts:
        company = db.query(models.Company).filter(models.Company.id == company_id).first()
        if company:
            top_companies.append({
                "company_id": company_id,
                "company_name": company.name,
                "access_count": count
            })
    
    return {
        "period_days": days,
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "total_actions": len(audit_logs),
        "unique_companies_accessed": len(companies_accessed),
        "unique_users_active": len(users_active),
        "actions_summary": actions_summary,
        "top_companies": top_companies
    }

@router.get("/compliance-report")
async def get_compliance_report(
    company_id: int,
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    platform_admin: models.User = Depends(get_platform_admin)
) -> Dict[str, Any]:
    """Generate compliance report for a specific company"""
    company = db.query(models.Company).filter(models.Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    # Get all platform admin actions for this company
    audit_logs = db.query(models.PlatformAuditLog).filter(
        models.PlatformAuditLog.company_id == company_id,
        models.PlatformAuditLog.timestamp >= start_date,
        models.PlatformAuditLog.timestamp <= end_date
    ).all()
    
    # Categorize actions
    data_access_actions = []
    modification_actions = []
    administrative_actions = []
    
    for log in audit_logs:
        log_data = {
            "timestamp": log.timestamp.isoformat(),
            "action": log.action,
            "user_id": log.user_id,
            "resource_type": log.resource_type,
            "resource_id": log.resource_id,
            "details": log.details,
            "ip_address": log.ip_address
        }
        
        if log.action in ["viewed_financials", "accessed_company", "exported_data"]:
            data_access_actions.append(log_data)
        elif log.action in ["modified_user", "updated_company", "created_company"]:
            modification_actions.append(log_data)
        else:
            administrative_actions.append(log_data)
    
    # Get company health metrics
    usage_service = UsageTrackingService(db)
    usage_summary = usage_service.get_usage_summary(company_id)
    
    # Get billing information
    billing_service = BillingService(db)
    billing_config = billing_service.get_billing_configuration(company_id)
    billing_history = billing_service.get_billing_history(company_id, 12)
    
    return {
        "company": {
            "id": company.id,
            "name": company.name,
            "code": company.code,
            "subscription_status": company.subscription_status,
            "created_at": company.created_at.isoformat() if company.created_at else None
        },
        "report_period": {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "days": days
        },
        "audit_summary": {
            "total_actions": len(audit_logs),
            "data_access_count": len(data_access_actions),
            "modification_count": len(modification_actions),
            "administrative_count": len(administrative_actions)
        },
        "detailed_actions": {
            "data_access": data_access_actions,
            "modifications": modification_actions,
            "administrative": administrative_actions
        },
        "current_usage": usage_summary,
        "billing_info": {
            "configuration": {
                "base_monthly_fee": float(billing_config.base_monthly_fee) if billing_config else 0,
                "per_user_fee": float(billing_config.per_user_fee) if billing_config else 0,
                "per_gb_storage_fee": float(billing_config.per_gb_storage_fee) if billing_config else 0
            },
            "recent_transactions": billing_history
        },
        "generated_at": datetime.utcnow().isoformat(),
        "generated_by": platform_admin.email
    }

@router.get("/usage-analytics")
async def get_usage_analytics(
    start_date: datetime,
    end_date: datetime,
    db: Session = Depends(get_db),
    platform_admin: models.User = Depends(get_platform_admin)
) -> Dict[str, Any]:
    """Get platform-wide usage analytics"""
    # Get all companies
    companies = db.query(models.Company).filter(
        models.Company.is_deleted == False
    ).all()
    
    usage_service = UsageTrackingService(db)
    
    analytics = {
        "period": {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat()
        },
        "total_companies": len(companies),
        "usage_by_company": [],
        "aggregated_usage": {
            "total_storage_gb": 0,
            "total_users": 0,
            "total_transactions": 0,
            "average_storage_per_company": 0,
            "average_users_per_company": 0
        },
        "growth_metrics": {
            "storage_growth": 0,
            "user_growth": 0,
            "transaction_growth": 0
        }
    }
    
    total_storage = 0
    total_users = 0
    total_transactions = 0
    
    for company in companies:
        # Get usage trends for this company
        usage_trends = usage_service.get_usage_trends(company.id, 3)  # Last 3 months
        
        if usage_trends:
            latest_usage = usage_trends[-1]
            company_usage = {
                "company_id": company.id,
                "company_name": company.name,
                "company_code": company.code,
                "subscription_status": company.subscription_status,
                "current_usage": latest_usage,
                "usage_trends": usage_trends
            }
            
            analytics["usage_by_company"].append(company_usage)
            
            total_storage += latest_usage["storage_gb"]
            total_users += latest_usage["users"]
            total_transactions += latest_usage["transactions"]
    
    # Calculate aggregated metrics
    analytics["aggregated_usage"]["total_storage_gb"] = total_storage
    analytics["aggregated_usage"]["total_users"] = total_users
    analytics["aggregated_usage"]["total_transactions"] = total_transactions
    
    if len(companies) > 0:
        analytics["aggregated_usage"]["average_storage_per_company"] = total_storage / len(companies)
        analytics["aggregated_usage"]["average_users_per_company"] = total_users / len(companies)
    
    return analytics

@router.get("/financial-summary")
async def get_financial_summary(
    billing_period: str = Query(None, description="YYYY-MM format"),
    db: Session = Depends(get_db),
    platform_admin: models.User = Depends(get_platform_admin)
) -> Dict[str, Any]:
    """Get financial summary for the platform"""
    if billing_period is None:
        billing_period = date.today().strftime("%Y-%m")
    
    billing_service = BillingService(db)
    
    # Get all active companies
    companies = db.query(models.Company).filter(
        models.Company.is_active == True,
        models.Company.is_deleted == False
    ).all()
    
    financial_summary = {
        "billing_period": billing_period,
        "total_companies": len(companies),
        "revenue_summary": {
            "total_revenue": 0,
            "base_fees": 0,
            "usage_fees": 0,
            "average_revenue_per_company": 0
        },
        "subscription_breakdown": {
            "active": 0,
            "trial": 0,
            "suspended": 0,
            "cancelled": 0
        },
        "company_revenues": []
    }
    
    total_revenue = 0
    subscription_counts = {"active": 0, "trial": 0, "suspended": 0, "cancelled": 0}
    
    for company in companies:
        # Count subscription status
        if company.subscription_status in subscription_counts:
            subscription_counts[company.subscription_status] += 1
        
        # Calculate revenue for this company
        try:
            charges = billing_service.calculate_usage_charges(company.id, billing_period)
            
            company_revenue = {
                "company_id": company.id,
                "company_name": company.name,
                "subscription_status": company.subscription_status,
                "charges": charges
            }
            
            financial_summary["company_revenues"].append(company_revenue)
            total_revenue += charges["total"]
            
        except Exception as e:
            logger.error(f"Error calculating charges for company {company.id}: {str(e)}")
    
    # Update summary totals
    financial_summary["revenue_summary"]["total_revenue"] = total_revenue
    financial_summary["revenue_summary"]["average_revenue_per_company"] = (
        total_revenue / len(companies) if companies else 0
    )
    financial_summary["subscription_breakdown"] = subscription_counts
    
    return financial_summary

@router.get("/tenant-health-dashboard")
async def get_tenant_health_dashboard(
    db: Session = Depends(get_db),
    platform_admin: models.User = Depends(get_platform_admin)
) -> Dict[str, Any]:
    """Get comprehensive tenant health dashboard"""
    # Get all companies
    companies = db.query(models.Company).filter(
        models.Company.is_deleted == False
    ).all()
    
    provisioning_service = TenantProvisioningService(db)
    
    health_dashboard = {
        "overview": {
            "total_tenants": len(companies),
            "healthy_tenants": 0,
            "warning_tenants": 0,
            "critical_tenants": 0
        },
        "tenant_details": [],
        "alerts": [],
        "recommendations": []
    }
    
    for company in companies:
        try:
            health_status = provisioning_service.get_tenant_health_status(company.id)
            health_dashboard["tenant_details"].append(health_status)
            
            # Count health statuses
            if health_status["overall_health"] == "healthy":
                health_dashboard["overview"]["healthy_tenants"] += 1
            elif health_status["overall_health"] == "warning":
                health_dashboard["overview"]["warning_tenants"] += 1
            else:
                health_dashboard["overview"]["critical_tenants"] += 1
            
            # Generate alerts for problematic tenants
            if health_status["overall_health"] in ["warning", "critical"]:
                alert = {
                    "tenant_id": company.id,
                    "tenant_name": company.name,
                    "severity": health_status["overall_health"],
                    "issues": []
                }
                
                if health_status["storage"]["health"] != "healthy":
                    alert["issues"].append(f"Storage usage at {health_status['storage']['percentage']:.1f}%")
                
                if health_status["users"]["health"] != "healthy":
                    alert["issues"].append(f"User count at {health_status['users']['total']}/{health_status['users']['limit']}")
                
                health_dashboard["alerts"].append(alert)
        
        except Exception as e:
            logger.error(f"Error getting health status for company {company.id}: {str(e)}")
    
    # Generate recommendations
    if health_dashboard["overview"]["warning_tenants"] > 0:
        health_dashboard["recommendations"].append(
            f"Review {health_dashboard['overview']['warning_tenants']} tenants with warning status"
        )
    
    if health_dashboard["overview"]["critical_tenants"] > 0:
        health_dashboard["recommendations"].append(
            f"Immediate attention required for {health_dashboard['overview']['critical_tenants']} critical tenants"
        )
    
    return health_dashboard

@router.post("/bulk-actions/suspend")
async def bulk_suspend_companies(
    company_ids: List[int],
    reason: str,
    db: Session = Depends(get_db),
    platform_admin: models.User = Depends(get_platform_admin)
) -> Dict[str, Any]:
    """Suspend multiple companies in bulk"""
    results = []
    
    for company_id in company_ids:
        try:
            company = db.query(models.Company).filter(models.Company.id == company_id).first()
            if not company:
                results.append({
                    "company_id": company_id,
                    "status": "failed",
                    "error": "Company not found"
                })
                continue
            
            company.subscription_status = "suspended"
            company.is_active = False
            
            # Log action
            log_platform_action(
                db, platform_admin.id, "bulk_suspended_company",
                company_id=company_id,
                details={"reason": reason, "bulk_action": True}
            )
            
            results.append({
                "company_id": company_id,
                "company_name": company.name,
                "status": "suspended"
            })
            
        except Exception as e:
            results.append({
                "company_id": company_id,
                "status": "failed",
                "error": str(e)
            })
    
    db.commit()
    
    return {
        "action": "bulk_suspend",
        "total_companies": len(company_ids),
        "results": results,
        "performed_by": platform_admin.email,
        "performed_at": datetime.utcnow().isoformat()
    }

@router.post("/bulk-actions/activate")
async def bulk_activate_companies(
    company_ids: List[int],
    reason: str,
    db: Session = Depends(get_db),
    platform_admin: models.User = Depends(get_platform_admin)
) -> Dict[str, Any]:
    """Activate multiple companies in bulk"""
    results = []
    
    for company_id in company_ids:
        try:
            company = db.query(models.Company).filter(models.Company.id == company_id).first()
            if not company:
                results.append({
                    "company_id": company_id,
                    "status": "failed",
                    "error": "Company not found"
                })
                continue
            
            company.subscription_status = "active"
            company.is_active = True
            
            # Log action
            log_platform_action(
                db, platform_admin.id, "bulk_activated_company",
                company_id=company_id,
                details={"reason": reason, "bulk_action": True}
            )
            
            results.append({
                "company_id": company_id,
                "company_name": company.name,
                "status": "activated"
            })
            
        except Exception as e:
            results.append({
                "company_id": company_id,
                "status": "failed",
                "error": str(e)
            })
    
    db.commit()
    
    return {
        "action": "bulk_activate",
        "total_companies": len(company_ids),
        "results": results,
        "performed_by": platform_admin.email,
        "performed_at": datetime.utcnow().isoformat()
    }
