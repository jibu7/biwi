from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.core import User, Company, PlatformAuditLog, SubscriptionStatus
from app.schemas.company import Company as CompanySchema, CompanyCreate, CompanyUpdate
from app.schemas.user import User as UserSchema
from app.api.deps import get_current_platform_admin
from app.core.context_managers import tenant_context

router = APIRouter()

@router.get("/companies", response_model=List[CompanySchema])
def get_all_companies(
    db: Session = Depends(get_db),
    skip: int = Query(0),
    limit: int = Query(100),
    current_user: User = Depends(get_current_platform_admin),
) -> Any:
    """
    Get all companies (platform admin only).
    """
    companies = db.query(Company).filter(
        Company.is_deleted == False
    ).offset(skip).limit(limit).all()
    return companies

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

@router.get("/audit-logs", response_model=List[dict])
def get_audit_logs(
    db: Session = Depends(get_db),
    skip: int = Query(0),
    limit: int = Query(100),
    company_id: Optional[int] = Query(None),
    user_id: Optional[int] = Query(None),
    action: Optional[str] = Query(None),
    current_user: User = Depends(get_current_platform_admin),
) -> Any:
    """
    Get platform audit logs (platform admin only).
    """
    query = db.query(PlatformAuditLog)
    
    # Apply filters
    if company_id:
        query = query.filter(PlatformAuditLog.company_id == company_id)
    if user_id:
        query = query.filter(PlatformAuditLog.user_id == user_id)
    if action:
        query = query.filter(PlatformAuditLog.action.ilike(f"%{action}%"))
    
    # Sort by timestamp descending
    query = query.order_by(PlatformAuditLog.timestamp.desc())
    
    # Pagination
    logs = query.offset(skip).limit(limit).all()
    
    # Convert to dict for response
    result = []
    for log in logs:
        log_dict = {
            "id": log.id,
            "user_id": log.user_id,
            "company_id": log.company_id,
            "action": log.action,
            "resource_type": log.resource_type,
            "resource_id": log.resource_id,
            "details": log.details,
            "ip_address": log.ip_address,
            "timestamp": log.timestamp.isoformat(),
        }
        result.append(log_dict)
    
    return result
