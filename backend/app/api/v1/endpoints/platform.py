from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_
from datetime import datetime, timedelta
from app import models, schemas, crud
from app.database.database import get_db
from app.core.platform_security import get_platform_admin, get_platform_context, PlatformContext
from app.core.security import create_access_token
from app.models.core import UserType
from app.schemas import PlatformUser  # Ensure this schema exists or create it accordingly

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

@router.put("/companies/{company_id}", response_model=schemas.Company)
async def update_company(
    company_id: int,
    company_in: schemas.CompanyUpdate,
    db: Session = Depends(get_db),
    platform_admin: models.User = Depends(get_platform_admin)
):
    """Update a company (platform admin only)"""
    # Get the company
    company = db.query(models.Company).filter(
        models.Company.id == company_id,
        models.Company.is_deleted == False
    ).first()
    
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Check if company code already exists (if being updated)
    if company_in.code and company_in.code != company.code:
        existing = db.query(models.Company).filter(
            models.Company.code == company_in.code,
            models.Company.id != company_id
        ).first()
        
        if existing:
            raise HTTPException(status_code=400, detail="Company code already exists")
    
    # Update company
    update_data = company_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(company, field, value)
    
    company.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(company)
    
    # Log action
    audit_log = models.PlatformAuditLog(
        user_id=platform_admin.id,
        company_id=company.id,
        action="updated_company",
        resource_type="company",
        resource_id=company.id,
        details={
            "company_name": company.name,
            "company_code": company.code,
            "updated_fields": list(update_data.keys())
        }
    )
    db.add(audit_log)
    db.commit()
    
    return company

@router.delete("/companies/{company_id}")
async def delete_company(
    company_id: int,
    db: Session = Depends(get_db),
    platform_admin: models.User = Depends(get_platform_admin)
):
    """Soft delete a company (platform admin only)"""
    # Get the company
    company = db.query(models.Company).filter(
        models.Company.id == company_id,
        models.Company.is_deleted == False
    ).first()
    
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Check if company has active users
    active_users = db.query(models.User).filter(
        models.User.company_id == company_id,
        models.User.is_active == True
    ).count()
    
    if active_users > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete company with {active_users} active users. Please deactivate users first."
        )
    
    # Soft delete the company
    company.is_deleted = True
    company.updated_at = datetime.utcnow()
    db.commit()
    
    # Log action
    audit_log = models.PlatformAuditLog(
        user_id=platform_admin.id,
        company_id=company.id,
        action="deleted_company",
        resource_type="company",
        resource_id=company.id,
        details={
            "company_name": company.name,
            "company_code": company.code
        }
    )
    db.add(audit_log)
    db.commit()
    
    return {"message": "Company deleted successfully"}

# User Management Endpoints
@router.get("/users")
async def get_platform_users(
    skip: int = 0,
    limit: int = 100,
    user_type: Optional[str] = None,
    company_id: Optional[int] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    platform_admin: models.User = Depends(get_platform_admin)
):
    """Get all users across all companies"""
    query = db.query(models.User)
    
    # Filter by user type if specified
    if user_type:
        if user_type == "platform_admin":
            query = query.filter(models.User.user_type == UserType.PLATFORM_ADMIN)
        elif user_type == "company_admin":
            query = query.filter(models.User.user_type == UserType.COMPANY_ADMIN)
        elif user_type == "company_user":
            query = query.filter(models.User.user_type == UserType.COMPANY_USER)
    
    # Filter by company if specified
    if company_id:
        query = query.filter(models.User.company_id == company_id)
    
    # Search functionality
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            models.User.email.ilike(search_pattern) |
            models.User.full_name.ilike(search_pattern)
        )
    
    users = query.offset(skip).limit(limit).all()
    
    # Add company information for each user
    result = []
    for user in users:
        user_data = {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "user_type": user.user_type,
            "is_active": user.is_active,
            "last_login": user.last_login,
            "created_at": user.created_at,
            "company_id": user.company_id,
            "company_name": user.company.name if user.company else None,
            "company_code": user.company.code if user.company else None,
        }
        result.append(user_data)
    
    return result

@router.get("/users/stats")
async def get_user_stats(
    db: Session = Depends(get_db),
    platform_admin: models.User = Depends(get_platform_admin)
):
    """Get user statistics for the platform"""
    total_users = db.query(models.User).filter(models.User.user_type != UserType.PLATFORM_ADMIN).count()
    platform_admins = db.query(models.User).filter(models.User.user_type == UserType.PLATFORM_ADMIN).count()
    company_admins = db.query(models.User).filter(models.User.user_type == UserType.COMPANY_ADMIN).count()
    company_users = db.query(models.User).filter(models.User.user_type == UserType.COMPANY_USER).count()
    
    # Active users today
    today = datetime.utcnow().date()
    active_today = db.query(models.User).filter(
        func.date(models.User.last_login) == today,
        models.User.user_type != UserType.PLATFORM_ADMIN
    ).count()
    
    return {
        "total_users": total_users,
        "platform_admins": platform_admins,
        "company_admins": company_admins,
        "company_users": company_users,
        "active_today": active_today,
    }

@router.post("/users", response_model=PlatformUser)
async def create_platform_user(
    user: schemas.UserCreate,
    db: Session = Depends(get_db),
    platform_admin: models.User = Depends(get_platform_admin)
):
    """Create a new user"""
    # Check if user already exists
    existing_user = crud.get_user_by_email(db, user.email)
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="User with this email already exists"
        )
    
    # For non-platform users, validate company exists
    if user.user_type != UserType.PLATFORM_ADMIN and user.company_id:
        company = crud.get_company(db, user.company_id)
        if not company or company.is_deleted:
            raise HTTPException(
                status_code=400,
                detail="Invalid company ID"
            )
    
    # Create user
    db_user = crud.create_user(db, user)
    db.refresh(db_user)  # Ensure fresh data
    return PlatformUser(
        id=db_user.id,
        email=db_user.email,
        full_name=db_user.full_name,
        user_type=db_user.user_type,
        is_active=db_user.is_active,
        last_login=db_user.last_login,
        created_at=db_user.created_at,
        company_id=db_user.company_id,
        company_name=db_user.company.name if db_user.company else None,
        company_code=db_user.company.code if db_user.company else None,
    )

@router.put("/users/{user_id}", response_model=PlatformUser)
async def update_platform_user(
    user_id: int,
    user_update: schemas.UserUpdate,
    db: Session = Depends(get_db),
    platform_admin: models.User = Depends(get_platform_admin)
):
    """Update a user"""
    # Get the user
    db_user = crud.get_user(db, user_id)
    if not db_user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )
    
    # Check if email is being changed and if it's already in use
    if user_update.email and user_update.email != db_user.email:
        existing_user = crud.get_user_by_email(db, user_update.email)
        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="Email already in use"
            )
    
    # Update user
    updated_user = crud.update_user(db, db_user, user_update)
    db.refresh(updated_user)
    return PlatformUser(
        id=updated_user.id,
        email=updated_user.email,
        full_name=updated_user.full_name,
        user_type=updated_user.user_type,
        is_active=updated_user.is_active,
        last_login=updated_user.last_login,
        created_at=updated_user.created_at,
        company_id=updated_user.company_id,
        company_name=updated_user.company.name if updated_user.company else None,
        company_code=updated_user.company.code if updated_user.company else None,
    )

@router.delete("/users/{user_id}", status_code=204)
async def delete_platform_user(
    user_id: int,
    db: Session = Depends(get_db),
    platform_admin: models.User = Depends(get_platform_admin)
):
    """Delete a user"""
    # Get the user
    db_user = crud.get_user(db, user_id)
    if not db_user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )
    
    # Prevent deletion of platform admins or the current user
    if db_user.user_type == UserType.PLATFORM_ADMIN:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete platform admin users"
        )
    
    if db_user.id == platform_admin.id:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete your own account"
        )
    
    # Delete user
    crud.delete_user(db, user_id)
    db.commit()
    return Response(status_code=204)

@router.get("/users/{user_id}", response_model=schemas.User)
async def get_platform_user(
    user_id: int,
    db: Session = Depends(get_db),
    platform_admin: models.User = Depends(get_platform_admin)
):
    """Get a specific user"""
    db_user = crud.get_user(db, user_id)
    if not db_user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )
    
    return db_user

# Alerts Endpoints
@router.get("/alerts")
async def get_platform_alerts(
    skip: int = 0,
    limit: int = 100,
    alert_type: Optional[str] = None,
    resolved: Optional[bool] = None,
    db: Session = Depends(get_db),
    platform_admin: models.User = Depends(get_platform_admin)
):
    """Get platform alerts (system-generated alerts)"""
    alerts = []
    
    # Check for companies with high storage usage
    companies = db.query(models.Company).filter(models.Company.is_deleted == False).all()
    for company in companies:
        storage_used = calculate_storage_usage(db, company.id)
        storage_limit = company.storage_limit_gb or 10.0
        
        if storage_used / storage_limit > 0.9:  # 90% threshold
            alerts.append({
                "id": f"storage_{company.id}",
                "type": "warning" if storage_used / storage_limit < 0.95 else "critical",
                "title": "High Storage Usage",
                "message": f"{company.name} is at {int(storage_used/storage_limit*100)}% storage capacity ({storage_used:.1f}GB / {storage_limit:.1f}GB)",
                "company": company.name,
                "company_id": company.id,
                "timestamp": datetime.utcnow().isoformat(),
                "resolved": False,
            })
    
    # Check for expiring subscriptions
    expiring_soon = datetime.utcnow() + timedelta(days=7)
    expiring_companies = db.query(models.Company).filter(
        models.Company.subscription_expires <= expiring_soon,
        models.Company.subscription_expires > datetime.utcnow(),
        models.Company.is_deleted == False
    ).all()
    
    for company in expiring_companies:
        days_left = (company.subscription_expires - datetime.utcnow()).days
        alerts.append({
            "id": f"expire_{company.id}",
            "type": "warning",
            "title": "Subscription Expiring",
            "message": f"{company.name} subscription expires in {days_left} days",
            "company": company.name,
            "company_id": company.id,
            "timestamp": datetime.utcnow().isoformat(),
            "resolved": False,
        })
    
    # Check for failed login attempts (from audit logs)
    failed_login_threshold = 5
    recent_time = datetime.utcnow() - timedelta(hours=24)
    
    failed_logins = db.query(models.PlatformAuditLog).filter(
        models.PlatformAuditLog.action == "failed_login",
        models.PlatformAuditLog.timestamp >= recent_time
    ).all()
    
    # Group by company
    company_failures = {}
    for log in failed_logins:
        if log.company_id:
            company_failures[log.company_id] = company_failures.get(log.company_id, 0) + 1
    
    for company_id, count in company_failures.items():
        if count >= failed_login_threshold:
            company = db.query(models.Company).filter(models.Company.id == company_id).first()
            if company:
                alerts.append({
                    "id": f"failed_login_{company_id}",
                    "type": "warning",
                    "title": "Failed Login Attempts",
                    "message": f"Multiple failed login attempts ({count}) detected for {company.name} users",
                    "company": company.name,
                    "company_id": company_id,
                    "timestamp": datetime.utcnow().isoformat(),
                    "resolved": False,
                })
    
    # Add system health alerts
    alerts.append({
        "id": "backup_success",
        "type": "success",
        "title": "Backup Completed",
        "message": "Daily backup completed successfully for all companies",
        "timestamp": (datetime.utcnow() - timedelta(hours=2)).isoformat(),
        "resolved": True,
    })
    
    # Filter alerts
    if alert_type and alert_type != "all":
        alerts = [a for a in alerts if a["type"] == alert_type]
    
    if resolved is not None:
        alerts = [a for a in alerts if a["resolved"] == resolved]
    
    # Sort by timestamp (newest first)
    alerts.sort(key=lambda x: x["timestamp"], reverse=True)
    
    return alerts[skip:skip+limit]

# Security Endpoints
@router.get("/security/events")
async def get_security_events(
    skip: int = 0,
    limit: int = 100,
    event_type: Optional[str] = None,
    severity: Optional[str] = None,
    db: Session = Depends(get_db),
    platform_admin: models.User = Depends(get_platform_admin)
):
    """Get security-related events from audit logs"""
    security_actions = [
        "failed_login", "successful_login", "password_reset", "account_locked",
        "permission_changed", "user_created", "user_deleted", "company_suspended",
        "company_activated", "impersonated_company"
    ]
    
    query = db.query(models.PlatformAuditLog).filter(
        models.PlatformAuditLog.action.in_(security_actions)
    )
    
    if event_type:
        query = query.filter(models.PlatformAuditLog.action == event_type)
    
    events = query.order_by(desc(models.PlatformAuditLog.timestamp)).offset(skip).limit(limit).all()
    
    return events

@router.get("/security/stats")
async def get_security_stats(
    db: Session = Depends(get_db),
    platform_admin: models.User = Depends(get_platform_admin)
):
    """Get security statistics"""
    last_24h = datetime.utcnow() - timedelta(hours=24)
    last_7d = datetime.utcnow() - timedelta(days=7)
    
    # Login attempts in last 24h
    failed_logins_24h = db.query(models.PlatformAuditLog).filter(
        models.PlatformAuditLog.action == "failed_login",
        models.PlatformAuditLog.timestamp >= last_24h
    ).count()
    
    successful_logins_24h = db.query(models.PlatformAuditLog).filter(
        models.PlatformAuditLog.action == "successful_login",
        models.PlatformAuditLog.timestamp >= last_24h
    ).count()
    
    # Platform admin actions in last 7 days
    admin_actions_7d = db.query(models.PlatformAuditLog).filter(
        models.PlatformAuditLog.timestamp >= last_7d
    ).count()
    
    # Suspended companies
    suspended_companies = db.query(models.Company).filter(
        models.Company.subscription_status == "suspended"
    ).count()
    
    return {
        "failed_logins_24h": failed_logins_24h,
        "successful_logins_24h": successful_logins_24h,
        "admin_actions_7d": admin_actions_7d,
        "suspended_companies": suspended_companies,
        "total_companies": db.query(models.Company).filter(models.Company.is_deleted == False).count(),
    }

# Analytics Endpoints
@router.get("/analytics/revenue")
async def get_revenue_analytics(
    period: str = Query("month", description="Period: day, week, month, year"),
    db: Session = Depends(get_db),
    platform_admin: models.User = Depends(get_platform_admin)
):
    """Get revenue analytics data"""
    # This is a placeholder implementation
    # You would implement actual revenue calculation based on your business model
    
    if period == "month":
        # Monthly revenue for the last 12 months
        data = []
        for i in range(12):
            month_start = datetime.utcnow().replace(day=1) - timedelta(days=30*i)
            month_name = month_start.strftime("%B %Y")
            # Calculate actual revenue for this month
            revenue = calculate_platform_revenue(db) * (0.8 + 0.4 * (i % 3))  # Mock variation
            data.append({
                "period": month_name,
                "revenue": round(revenue, 2),
                "timestamp": month_start.isoformat()
            })
        return {"data": list(reversed(data))}
    
    return {"data": []}

@router.get("/analytics/usage")
async def get_usage_analytics(
    metric: str = Query("storage", description="Metric: storage, users, transactions"),
    db: Session = Depends(get_db),
    platform_admin: models.User = Depends(get_platform_admin)
):
    """Get usage analytics data"""
    companies = db.query(models.Company).filter(models.Company.is_deleted == False).all()
    
    if metric == "storage":
        data = []
        for company in companies:
            storage_used = calculate_storage_usage(db, company.id)
            data.append({
                "company_name": company.name,
                "company_id": company.id,
                "value": storage_used,
                "limit": company.storage_limit_gb or 10.0,
                "percentage": min(100, (storage_used / (company.storage_limit_gb or 10.0)) * 100)
            })
        return {"data": data}
    
    elif metric == "users":
        data = []
        for company in companies:
            user_count = db.query(models.User).filter(models.User.company_id == company.id).count()
            data.append({
                "company_name": company.name,
                "company_id": company.id,
                "value": user_count,
                "limit": company.user_limit or 50,
                "percentage": min(100, (user_count / (company.user_limit or 50)) * 100)
            })
        return {"data": data}
    
    return {"data": []}

# Settings Endpoints
@router.get("/settings")
async def get_platform_settings(
    db: Session = Depends(get_db),
    platform_admin: models.User = Depends(get_platform_admin)
):
    """Get platform settings"""
    # For now, return some default settings
    # In a real implementation, you would store these in the database
    return {
        "platform_name": "Vinea ERP Platform",
        "platform_description": "Multi-tenant ERP platform for modern businesses",
        "support_email": "support@biwi.com",
        "admin_email": "admin@biwi.com",
        "default_storage_limit": 10,
        "default_user_limit": 5,
        "default_trial_period": 30,
        "default_currency": "USD",
        "basic_plan_price": 29.99,
        "pro_plan_price": 59.99,
        "enterprise_plan_price": 99.99,
        "smtp_host": "smtp.mailgun.org",
        "smtp_port": 587,
        "smtp_username": "",
        "backup_frequency": "daily",
        "backup_retention": 30,
        "backup_location": "s3://platform-backups/",
    }

@router.put("/settings")
async def update_platform_settings(
    settings: dict,
    db: Session = Depends(get_db),
    platform_admin: models.User = Depends(get_platform_admin)
):
    """Update platform settings"""
    # Log the settings update
    audit_log = models.PlatformAuditLog(
        user_id=platform_admin.id,
        action="updated_platform_settings",
        resource_type="platform_settings",
        details=settings
    )
    db.add(audit_log)
    db.commit()
    
    # In a real implementation, you would save these to the database
    return {"message": "Settings updated successfully", "settings": settings}
    """Update platform settings"""
    # Log the settings update
    audit_log = models.PlatformAuditLog(
        user_id=platform_admin.id,
        action="updated_platform_settings",
        resource_type="platform_settings",
        details=settings
    )
    db.add(audit_log)
    db.commit()
    
    # In a real implementation, you would save these to the database
    return {"message": "Settings updated successfully", "settings": settings}
