from typing import Any, List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_

from app.database.database import get_db
from app.models.core import User, Company, PlatformAuditLog, UserType, SubscriptionStatus
from app.models.gl import GLJournalEntry
from app.models.ar import ARTransaction
from app.schemas.core import Company as CompanySchema, CompanyCreate, CompanyUpdate, CompanyWithStats
from app.schemas.core import User as UserSchema
from app.api.deps import get_current_platform_admin
from app.core.context_managers import tenant_context

router = APIRouter()

@router.get("/stats")
def get_platform_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_platform_admin),
) -> Any:
    """
    Get platform-wide statistics for dashboard.
    """
    try:
        # Count users by type - use string values to avoid enum issues
        total_users = db.query(func.count(User.id)).scalar() or 0
        platform_admins = db.query(func.count(User.id)).filter(
            or_(
                User.user_type == 'platform_admin',
                User.user_type == 'PLATFORM_ADMIN'
            )
        ).scalar() or 0
        company_admins = db.query(func.count(User.id)).filter(
            or_(
                User.user_type == 'company_admin',
                User.user_type == 'COMPANY_ADMIN'
            )
        ).scalar() or 0
        company_users = db.query(func.count(User.id)).filter(
            or_(
                User.user_type == 'company_user',
                User.user_type == 'COMPANY_USER'
            )
        ).scalar() or 0
        
        # Active today (users who logged in today)
        today = datetime.now().date()
        active_today = db.query(func.count(User.id)).filter(
            User.last_login >= today
        ).scalar() or 0
        
        # Company stats - use string values to avoid enum issues
        total_companies = db.query(func.count(Company.id)).filter(
            Company.is_deleted == False
        ).scalar() or 0
        active_companies = db.query(func.count(Company.id)).filter(
            Company.is_active == True,
            Company.is_deleted == False,
            or_(
                Company.subscription_status == 'active',
                Company.subscription_status == 'ACTIVE'
            )
        ).scalar() or 0
        
        return {
            "total_users": total_users,
            "platform_admins": platform_admins,
            "company_admins": company_admins,
            "company_users": company_users,
            "active_today": active_today,
            "total_companies": total_companies,
            "active_companies": active_companies,
        }
    except Exception as e:
        print(f"Error in get_platform_stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get platform stats: {str(e)}"
        )

@router.get("/dashboard/stats", response_model=dict)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_platform_admin),
) -> Any:
    """Get platform dashboard statistics."""
    try:
        # Rollback any pending transaction to start fresh
        db.rollback()
        
        # Get counts
        total_companies = db.query(Company).count()
        
        # Count companies by subscription status - use string values to avoid enum issues
        active_companies = db.query(Company).filter(
            or_(
                Company.subscription_status == 'active',
                Company.subscription_status == 'ACTIVE'
            )
        ).count()
        
        suspended_companies = db.query(Company).filter(
            or_(
                Company.subscription_status == 'suspended',
                Company.subscription_status == 'SUSPENDED'
            )
        ).count()
        
        trial_companies = db.query(Company).filter(
            or_(
                Company.subscription_status == 'trial',
                Company.subscription_status == 'TRIAL'
            )
        ).count()
        
        # Count users by type - use string values to avoid enum issues
        total_users = db.query(User).filter(
            and_(
                User.user_type != 'platform_admin',
                User.user_type != 'PLATFORM_ADMIN'
            )
        ).count()
        
        platform_admins = db.query(User).filter(
            or_(
                User.user_type == 'platform_admin',
                User.user_type == 'PLATFORM_ADMIN'
            )
        ).count()
        
        # Get transaction counts (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        try:
            total_transactions = db.query(GLJournalEntry).filter(
                GLJournalEntry.created_at >= thirty_days_ago
            ).count()
        except Exception:
            total_transactions = 0
            
        return {
            "total_companies": total_companies,
            "active_companies": active_companies,
            "suspended_companies": suspended_companies,
            "trial_companies": trial_companies,
            "total_users": total_users,
            "total_transactions": total_transactions,
            "platform_admins": platform_admins,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching dashboard stats: {str(e)}"
        )

@router.get("/companies", response_model=List[dict])
def get_all_companies(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    company_status: Optional[str] = None,
    current_user: User = Depends(get_current_platform_admin),
) -> Any:
    """Get all companies with statistics."""
    try:
        # Rollback any pending transaction to start fresh
        db.rollback()
        
        query = db.query(Company)
        
        # Apply filters
        if search:
            query = query.filter(
                or_(
                    Company.name.ilike(f"%{search}%"),
                    Company.code.ilike(f"%{search}%")
                )
            )
        
        if company_status:
            # Use string comparison to avoid enum issues
            query = query.filter(
                or_(
                    Company.subscription_status == company_status,
                    Company.subscription_status == company_status.upper(),
                    Company.subscription_status == company_status.lower()
                )
            )
        
        companies = query.offset(skip).limit(limit).all()
        
        # Build response with stats
        result = []
        for company in companies:
            try:
                # Get user count
                user_count = db.query(User).filter(
                    User.company_id == company.id,
                    User.is_active == True
                ).count()
            except Exception:
                user_count = 0
            
            try:
                # Get active users in last 30 days
                thirty_days_ago = datetime.utcnow() - timedelta(days=30)
                active_users_30d = db.query(User).filter(
                    User.company_id == company.id,
                    User.is_active == True,
                    User.last_login >= thirty_days_ago
                ).count()
            except Exception:
                active_users_30d = 0
            
            # Get transaction count (last 30 days) - handle missing columns gracefully
            try:
                transaction_count = db.query(GLJournalEntry).filter(
                    GLJournalEntry.company_id == company.id,
                    GLJournalEntry.created_at >= thirty_days_ago
                ).count()
            except Exception as e:
                # If there's an issue with the GL table (missing columns, etc), default to 0
                transaction_count = 0
            
            result.append({
                "company": {
                    "id": company.id,
                    "name": company.name,
                    "code": company.code,
                    "primary_contact_email": company.primary_contact_email,
                    "subscription_status": str(company.subscription_status),  # Convert to string safely
                    "subscription_plan": company.subscription_plan,
                    "subscription_expires": company.subscription_expires.isoformat() if company.subscription_expires else None,
                    "storage_limit_gb": company.storage_limit_gb,
                    "user_limit": company.user_limit,
                    "is_active": company.is_active,
                    "created_at": company.created_at.isoformat() if company.created_at else None
                },
                "user_count": user_count,
                "active_users_30d": active_users_30d,
                "transaction_count": transaction_count,
                "storage_used_gb": 0.0  # TODO: Implement storage tracking
            })
        
        return result
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching companies: {str(e)}"
        )

@router.get("/audit-logs", response_model=List[dict])
def get_audit_logs(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    company_id: Optional[int] = None,
    user_id: Optional[int] = None,
    action: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: User = Depends(get_current_platform_admin),
) -> Any:
    """Get platform audit logs."""
    try:
        query = db.query(PlatformAuditLog)
        
        # Apply filters
        if company_id:
            query = query.filter(PlatformAuditLog.company_id == company_id)
        if user_id:
            query = query.filter(PlatformAuditLog.user_id == user_id)
        if action:
            query = query.filter(PlatformAuditLog.action.ilike(f"%{action}%"))
        if start_date:
            query = query.filter(PlatformAuditLog.timestamp >= start_date)
        if end_date:
            query = query.filter(PlatformAuditLog.timestamp <= end_date)
        
        # Sort by timestamp descending
        query = query.order_by(PlatformAuditLog.timestamp.desc())
        
        # Get total count for pagination
        total_count = query.count()
        
        # Get paginated results
        logs = query.offset(skip).limit(limit).all()
        
        # Convert to dict for response
        result = []
        for log in logs:
            # Get user info
            user_info = None
            if log.user_id:
                user = db.query(User).filter(User.id == log.user_id).first()
                if user:
                    user_info = {
                        "id": user.id,
                        "email": user.email,
                        "full_name": user.full_name
                    }
            
            # Get company info
            company_info = None
            if log.company_id:
                company = db.query(Company).filter(Company.id == log.company_id).first()
                if company:
                    company_info = {
                        "id": company.id,
                        "name": company.name,
                        "code": company.code
                    }
            
            result.append({
                "id": log.id,
                "user": user_info,
                "company": company_info,
                "action": log.action,
                "resource_type": log.resource_type,
                "resource_id": log.resource_id,
                "details": log.details or {},
                "ip_address": log.ip_address,
                "timestamp": log.timestamp.isoformat(),
            })
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching audit logs: {str(e)}"
        )

@router.get("/users", response_model=List[dict])
def get_all_users(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    company_id: Optional[int] = None,
    search: Optional[str] = None,
    user_type: Optional[str] = None,
    current_user: User = Depends(get_current_platform_admin),
) -> Any:
    """Get all users across companies."""
    try:
        # By default, include both platform and non-platform users
        query = db.query(User)
        
        # Apply user type filter
        if user_type:
            if user_type == "platform_admin":
                query = query.filter(User.user_type == UserType.PLATFORM_ADMIN)
            else:
                query = query.filter(User.user_type == user_type)
                
        # Filter by company if specified
        if company_id:
            query = query.filter(User.company_id == company_id)
            
        # Apply search filter if provided
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    User.email.ilike(search_term),
                    User.full_name.ilike(search_term)
                )
            )
        
        users = query.offset(skip).limit(limit).all()
        
        result = []
        for user in users:
            company_name = None
            if user.company_id:
                company = db.query(Company).filter(Company.id == user.company_id).first()
                if company:
                    company_name = company.name
            
            # Format to match what frontend expects
            result.append({
                "id": user.id,
                "email": user.email,
                "full_name": user.full_name,
                "is_active": user.is_active,
                "user_type": user.user_type.value if hasattr(user.user_type, 'value') else user.user_type,
                "company_id": user.company_id,
                "company_name": company_name,
                "last_login": user.last_login.isoformat() if user.last_login else None,
                "created_at": user.created_at.isoformat()
            })
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching users: {str(e)}"
        )

@router.post("/companies/{company_id}/impersonate", response_model=dict)
def impersonate_company(
    company_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_platform_admin),
) -> Any:
    """Start impersonating a company."""
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    
    # Log impersonation
    db.add(PlatformAuditLog(
        user_id=current_user.id,
        company_id=company_id,
        action="company_impersonation_started",
        resource_type="company",
        resource_id=company_id,
        details={"company_name": company.name}
    ))
    db.commit()
    
    return {
        "status": "success",
        "company": {
            "id": company.id,
            "name": company.name,
            "code": company.code
        }
    }

@router.post("/stop-impersonation", response_model=dict)
def stop_impersonation(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_platform_admin),
) -> Any:
    """Stop impersonating a company."""
    # Log stop impersonation
    db.add(PlatformAuditLog(
        user_id=current_user.id,
        action="company_impersonation_stopped",
        details={}
    ))
    db.commit()
    
    return {"status": "success"}

@router.get("/me", response_model=UserSchema)
def read_platform_me(
    current_user: User = Depends(get_current_platform_admin),
) -> Any:
    """
    Get current platform admin user.
    """
    return current_user

@router.post("/companies", response_model=CompanySchema)
def create_company(
    company_in: CompanyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_platform_admin),
) -> Any:
    """
    Create new company (platform admin only).
    """
    # Check if company with this name or code already exists
    existing_company = db.query(Company).filter(
        (Company.name == company_in.name) | (Company.code == company_in.code),
        Company.is_deleted == False
    ).first()
    
    if existing_company:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Company with this name or code already exists",
        )
    
    # Create new company
    db_company = Company(
        name=company_in.name,
        code=company_in.code,
        subscription_status=company_in.subscription_status or SubscriptionStatus.TRIAL,
        subscription_plan=company_in.subscription_plan,
        subscription_expires=company_in.subscription_expires,
        storage_limit_gb=company_in.storage_limit_gb or 10,
        user_limit=company_in.user_limit or 5,
        primary_contact_email=company_in.primary_contact_email,
        billing_email=company_in.billing_email or company_in.primary_contact_email,
        address=company_in.address,
        contact_info=company_in.contact_info,
        created_by_user_id=current_user.id,
        is_active=True,
    )
    db.add(db_company)
    db.commit()
    db.refresh(db_company)
    
    # Log company creation
    db.add(PlatformAuditLog(
        user_id=current_user.id,
        company_id=db_company.id,
        action="company_created",
        resource_type="company",
        resource_id=db_company.id,
        details={"name": db_company.name, "code": db_company.code}
    ))
    db.commit()
    
    # Initialize company data
    with tenant_context(db_company.id):
        # TODO: Set up default GL accounts, roles, etc.
        pass
    
    return db_company

@router.get("/companies/{company_id}", response_model=CompanySchema)
def get_company(
    company_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_platform_admin),
) -> Any:
    """
    Get company details by ID (platform admin only).
    """
    company = db.query(Company).filter(
        Company.id == company_id,
        Company.is_deleted == False
    ).first()
    
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found",
        )
    return company

@router.put("/companies/{company_id}", response_model=CompanySchema)
def update_company(
    company_id: int,
    company_in: CompanyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_platform_admin),
) -> Any:
    """
    Update company (platform admin only).
    """
    company = db.query(Company).filter(
        Company.id == company_id,
        Company.is_deleted == False
    ).first()
    
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found",
        )
    
    # Update company fields
    update_data = company_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(company, field, value)
    
    db.commit()
    db.refresh(company)
    
    # Log company update
    db.add(PlatformAuditLog(
        user_id=current_user.id,
        company_id=company.id,
        action="company_updated",
        resource_type="company",
        resource_id=company.id,
        details={"updated_fields": list(update_data.keys())}
    ))
    db.commit()
    
    return company

@router.post("/companies/{company_id}/suspend", response_model=CompanySchema)
def suspend_company(
    company_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_platform_admin),
) -> Any:
    """
    Suspend a company (platform admin only).
    """
    company = db.query(Company).get(company_id)
    if not company or company.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found",
        )
    
    company.subscription_status = SubscriptionStatus.SUSPENDED
    db.commit()
    
    # Log company suspension
    db.add(PlatformAuditLog(
        user_id=current_user.id,
        company_id=company.id,
        action="company_suspended",
        resource_type="company",
        resource_id=company.id,
        details={}
    ))
    db.commit()
    
    return company

@router.delete("/companies/{company_id}")
def delete_company(
    company_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_platform_admin),
) -> Any:
    """
    Soft delete a company (platform admin only).
    """
    try:
        company = db.query(Company).filter(
            Company.id == company_id,
            Company.is_deleted == False
        ).first()
        
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found",
            )
        
        # Soft delete
        company.is_deleted = True
        company.deleted_at = datetime.utcnow()
        company.is_active = False
        db.commit()
        
        # Log company deletion
        db.add(PlatformAuditLog(
            user_id=current_user.id,
            company_id=company.id,
            action="company_deleted",
            resource_type="company",
            resource_id=company.id,
            details={"name": company.name}
        ))
        db.commit()
        
        return {"message": "Company deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in delete_company: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete company: {str(e)}"
        )
