from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from app import models, schemas
from app.database.database import get_db
from app.core.platform_security import get_platform_admin, get_platform_context, PlatformContext
from app.core.security import create_access_token
from app.models.core import UserType

router = APIRouter(prefix="/platform", tags=["platform"])

def calculate_storage_usage(db: Session, company_id: int) -> float:
    """Calculate storage usage for a company (placeholder implementation)"""
    # This is a placeholder - you would implement actual storage calculation
    # based on your data size metrics
    return 2.5  # Example: 2.5 GB

def calculate_platform_revenue(db: Session) -> float:
    """Calculate platform revenue (placeholder implementation)"""
    # This is a placeholder - you would implement actual revenue calculation
    # based on your subscription model
    return 50000.0  # Example: $50,000

@router.get("/companies", response_model=List[schemas.CompanyWithStats])
async def list_all_companies(
    skip: int = 0,
    limit: int = 100,
    subscription_status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    platform_admin: models.User = Depends(get_platform_admin)
):
    """List all companies with statistics"""
    query = db.query(models.Company).filter(models.Company.is_deleted == False)
    
    if subscription_status:
        query = query.filter(models.Company.subscription_status == subscription_status)
    
    if search:
        query = query.filter(
            models.Company.name.ilike(f"%{search}%") |
            models.Company.code.ilike(f"%{search}%")
        )
    
    companies = query.offset(skip).limit(limit).all()
    
    # Add statistics
    company_stats = []
    for company in companies:
        # Count users
        user_count = db.query(models.User).filter(
            models.User.company_id == company.id,
            models.User.user_type != UserType.PLATFORM_ADMIN
        ).count()
        
        # Count active users in last 30 days
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        active_users_30d = db.query(models.User).filter(
            models.User.company_id == company.id,
            models.User.last_login >= thirty_days_ago,
            models.User.user_type != UserType.PLATFORM_ADMIN
        ).count()
        
        # Count transactions (assuming GLJournalEntry exists)
        transaction_count = 0
        try:
            transaction_count = db.query(models.GLJournalEntry).filter(
                models.GLJournalEntry.company_id == company.id
            ).count()
        except:
            # GLJournalEntry might not exist yet
            pass
        
        stats = schemas.CompanyWithStats(
            company=company,
            user_count=user_count,
            active_users_30d=active_users_30d,
            transaction_count=transaction_count,
            storage_used_gb=calculate_storage_usage(db, company.id)
        )
        company_stats.append(stats)
    
    return company_stats

@router.post("/companies/{company_id}/impersonate")
async def impersonate_company(
    company_id: int,
    reason: Optional[str] = "Platform administration",
    db: Session = Depends(get_db),
    platform_admin: models.User = Depends(get_platform_admin)
):
    """Generate a temporary token to act as admin within a company"""
    company = db.query(models.Company).filter(
        models.Company.id == company_id,
        models.Company.is_deleted == False
    ).first()
    
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Create audit log
    audit_log = models.PlatformAuditLog(
        user_id=platform_admin.id,
        company_id=company_id,
        action="impersonated_company",
        resource_type="company",
        resource_id=company_id,
        details={"reason": reason}
    )
    db.add(audit_log)
    db.commit()
    
    # Generate a special token with company context
    token_data = {
        "user_id": platform_admin.id,
        "company_id": company_id,
        "is_impersonation": True,
        "exp": datetime.utcnow() + timedelta(hours=1)  # Short-lived
    }
    
    access_token = create_access_token(data=token_data)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "company": company,
        "expires_in": 3600  # 1 hour
    }

@router.get("/companies/{company_id}/health")
async def get_company_health(
    company_id: int,
    db: Session = Depends(get_db),
    platform_context: PlatformContext = Depends(get_platform_context)
):
    """Get health metrics for a company"""
    company = db.query(models.Company).filter(
        models.Company.id == company_id,
        models.Company.is_deleted == False
    ).first()
    
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Calculate health metrics
    user_count = db.query(models.User).filter(
        models.User.company_id == company_id,
        models.User.user_type != UserType.PLATFORM_ADMIN
    ).count()
    
    storage_used = calculate_storage_usage(db, company_id)
    storage_percentage = (storage_used / company.storage_limit_gb) * 100
    
    return {
        "company_id": company_id,
        "company_name": company.name,
        "subscription_status": company.subscription_status,
        "user_count": user_count,
        "user_limit": company.user_limit,
        "storage_used_gb": storage_used,
        "storage_limit_gb": company.storage_limit_gb,
        "storage_percentage": storage_percentage,
        "health_status": "healthy" if storage_percentage < 90 and user_count < company.user_limit else "warning"
    }

@router.post("/companies/{company_id}/suspend")
async def suspend_company(
    company_id: int,
    reason: str,
    db: Session = Depends(get_db),
    platform_admin: models.User = Depends(get_platform_admin)
):
    """Suspend a company's access"""
    company = db.query(models.Company).filter(models.Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    company.subscription_status = "suspended"
    company.is_active = False
    
    # Log action
    audit_log = models.PlatformAuditLog(
        user_id=platform_admin.id,
        company_id=company_id,
        action="suspended_company",
        details={"reason": reason}
    )
    db.add(audit_log)
    db.commit()
    
    return {"status": "suspended", "company_id": company_id}

@router.post("/companies/{company_id}/activate")
async def activate_company(
    company_id: int,
    reason: str,
    db: Session = Depends(get_db),
    platform_admin: models.User = Depends(get_platform_admin)
):
    """Activate a suspended company"""
    company = db.query(models.Company).filter(models.Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    company.subscription_status = "active"
    company.is_active = True
    
    # Log action
    audit_log = models.PlatformAuditLog(
        user_id=platform_admin.id,
        company_id=company_id,
        action="activated_company",
        details={"reason": reason}
    )
    db.add(audit_log)
    db.commit()
    
    return {"status": "active", "company_id": company_id}

@router.get("/audit-logs", response_model=List[schemas.PlatformAuditLog])
async def get_platform_audit_logs(
    skip: int = 0,
    limit: int = 100,
    company_id: Optional[int] = None,
    user_id: Optional[int] = None,
    action: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
    platform_admin: models.User = Depends(get_platform_admin)
):
    """Get platform audit logs"""
    query = db.query(models.PlatformAuditLog)
    
    if company_id:
        query = query.filter(models.PlatformAuditLog.company_id == company_id)
    if user_id:
        query = query.filter(models.PlatformAuditLog.user_id == user_id)
    if action:
        query = query.filter(models.PlatformAuditLog.action == action)
    if start_date:
        query = query.filter(models.PlatformAuditLog.timestamp >= start_date)
    if end_date:
        query = query.filter(models.PlatformAuditLog.timestamp <= end_date)
    
    return query.order_by(models.PlatformAuditLog.timestamp.desc()).offset(skip).limit(limit).all()

@router.get("/metrics/summary")
async def get_platform_metrics(
    db: Session = Depends(get_db),
    platform_admin: models.User = Depends(get_platform_admin)
):
    """Get platform-wide metrics"""
    total_companies = db.query(models.Company).filter(models.Company.is_deleted == False).count()
    active_companies = db.query(models.Company).filter(
        models.Company.subscription_status == "active",
        models.Company.is_deleted == False
    ).count()
    total_users = db.query(models.User).filter(models.User.user_type != UserType.PLATFORM_ADMIN).count()
    
    today = datetime.utcnow().date()
    active_users_today = db.query(models.User).filter(
        func.date(models.User.last_login) == today,
        models.User.user_type != UserType.PLATFORM_ADMIN
    ).count()
    
    # Count total transactions (if GL module exists)
    total_transactions = 0
    try:
        total_transactions = db.query(models.GLJournalEntry).count()
    except:
        pass
    
    return {
        "total_companies": total_companies,
        "active_companies": active_companies,
        "suspended_companies": db.query(models.Company).filter(
            models.Company.subscription_status == "suspended",
            models.Company.is_deleted == False
        ).count(),
        "trial_companies": db.query(models.Company).filter(
            models.Company.subscription_status == "trial",
            models.Company.is_deleted == False
        ).count(),
        "total_users": total_users,
        "active_users_today": active_users_today,
        "total_transactions": total_transactions,
        "revenue_this_month": calculate_platform_revenue(db),
    }

@router.post("/companies", response_model=schemas.Company)
async def create_company(
    company_in: schemas.CompanyCreate,
    db: Session = Depends(get_db),
    platform_admin: models.User = Depends(get_platform_admin)
):
    """Create a new company (platform admin only)"""
    # Check if company code already exists
    existing = db.query(models.Company).filter(
        models.Company.code == company_in.code
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Company code already exists")
    
    # Create company
    db_company = models.Company(
        **company_in.model_dump(),
        created_by_user_id=platform_admin.id
    )
    db.add(db_company)
    db.commit()
    db.refresh(db_company)
    
    # Log action
    audit_log = models.PlatformAuditLog(
        user_id=platform_admin.id,
        company_id=db_company.id,
        action="created_company",
        resource_type="company",
        resource_id=db_company.id,
        details={"company_name": db_company.name, "company_code": db_company.code}
    )
    db.add(audit_log)
    db.commit()
    
    return db_company
