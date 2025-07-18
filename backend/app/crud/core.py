from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime
from app import models, schemas
from app.core.security import get_password_hash
from app.models.core import UserType

# User CRUD
def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate, company_id: Optional[int] = None) -> models.User:
    hashed_password = get_password_hash(user.password)
    
    # For platform admins, company_id can be None
    if user.user_type == UserType.PLATFORM_ADMIN:
        user_company_id = None
    else:
        user_company_id = company_id or user.company_id
        if not user_company_id:
            raise ValueError("company_id is required for non-platform users")
    
    db_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name,
        is_active=user.is_active,
        is_superuser=user.is_superuser,
        user_type=user.user_type,
        company_id=user_company_id
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user(db: Session, user_db_obj: models.User, user_in: schemas.UserUpdate) -> models.User:
    update_data = user_in.model_dump(exclude_unset=True)
    
    # Handle password update separately
    if "password" in update_data and update_data["password"]:
        hashed_password = get_password_hash(update_data["password"])
        del update_data["password"]
        setattr(user_db_obj, "hashed_password", hashed_password)
    
    # Update other fields
    for field, value in update_data.items():
        setattr(user_db_obj, field, value)
    
    db.commit()
    db.refresh(user_db_obj)
    return user_db_obj

def get_users_by_company(db: Session, company_id: int, skip: int = 0, limit: int = 100) -> List[models.User]:
    return db.query(models.User).filter(
        models.User.company_id == company_id
    ).offset(skip).limit(limit).all()

def get_user(db: Session, user_id: int) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.id == user_id).first()

def delete_user(db: Session, user_id: int) -> Optional[models.User]:
    user = get_user(db, user_id)
    if user:
        db.delete(user)
        db.commit()
    return user

def get_user_roles(db: Session, user_id: int) -> List[models.Role]:
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user:
        # Get the actual Role objects through the UserRole association
        return [user_role.role for user_role in user.roles]
    return []

# Role CRUD
def create_role(db: Session, role: schemas.RoleCreate, company_id: int) -> models.Role:
    db_role = models.Role(
        name=role.name,
        description=role.description,
        permissions=role.permissions,
        company_id=company_id
    )
    db.add(db_role)
    db.commit()
    db.refresh(db_role)
    return db_role

def get_role(db: Session, role_id: int, company_id: int) -> Optional[models.Role]:
    return db.query(models.Role).filter(
        models.Role.id == role_id,
        models.Role.company_id == company_id
    ).first()

def get_roles_by_company(db: Session, company_id: int, skip: int = 0, limit: int = 100) -> List[models.Role]:
    return db.query(models.Role).filter(
        models.Role.company_id == company_id
    ).offset(skip).limit(limit).all()

def update_role(db: Session, role_db_obj: models.Role, role_in: schemas.RoleUpdate) -> models.Role:
    update_data = role_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(role_db_obj, field, value)
    
    db.add(role_db_obj)
    db.commit()
    db.refresh(role_db_obj)
    return role_db_obj

def delete_role(db: Session, role_id: int, company_id: int) -> Optional[models.Role]:
    role = get_role(db, role_id, company_id)
    if role:
        db.delete(role)
        db.commit()
    return role

def assign_role_to_user(db: Session, user_id: int, role_id: int, company_id: int) -> models.User:
    user = get_user(db, user_id)
    role = get_role(db, role_id, company_id)
    
    if not user or not role:
        return None
    
    # Check if role assignment already exists
    existing_assignment = db.query(models.UserRole).filter(
        models.UserRole.user_id == user_id,
        models.UserRole.role_id == role_id
    ).first()
    
    if not existing_assignment:
        user_role = models.UserRole(user_id=user_id, role_id=role_id)
        db.add(user_role)
        db.commit()
    
    return user

def remove_role_from_user(db: Session, user_id: int, role_id: int) -> models.User:
    user_role = db.query(models.UserRole).filter(
        models.UserRole.user_id == user_id,
        models.UserRole.role_id == role_id
    ).first()
    
    if user_role:
        db.delete(user_role)
        db.commit()
    
    return get_user(db, user_id)

# Company CRUD
def get_company(db: Session, company_id: int) -> Optional[models.Company]:
    return db.query(models.Company).filter(models.Company.id == company_id).first()

def get_company_by_name(db: Session, name: str) -> Optional[models.Company]:
    return db.query(models.Company).filter(models.Company.name == name).first()

def create_company(db: Session, company: schemas.CompanyCreate) -> models.Company:
    db_company = models.Company(
        name=company.name,
        address=company.address,
        contact_info=company.contact_info,
        default_currency_code=company.default_currency_code,
        is_active=company.is_active
    )
    db.add(db_company)
    db.commit()
    db.refresh(db_company)
    return db_company

def update_company(db: Session, company_db_obj: models.Company, company_in: schemas.CompanyUpdate) -> models.Company:
    update_data = company_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(company_db_obj, field, value)
    
    db.add(company_db_obj)
    db.commit()
    db.refresh(company_db_obj)
    return company_db_obj

def get_companies(db: Session, skip: int = 0, limit: int = 100) -> List[models.Company]:
    return db.query(models.Company).offset(skip).limit(limit).all()

# Accounting Period CRUD
def create_accounting_period(db: Session, period: schemas.AccountingPeriodCreate, company_id: int) -> models.AccountingPeriod:
    db_period = models.AccountingPeriod(
        name=period.name,
        start_date=period.start_date,
        end_date=period.end_date,
        status=period.status,
        company_id=company_id
    )
    db.add(db_period)
    db.commit()
    db.refresh(db_period)
    return db_period

def get_accounting_period(db: Session, period_id: int, company_id: int) -> Optional[models.AccountingPeriod]:
    return db.query(models.AccountingPeriod).filter(
        models.AccountingPeriod.id == period_id,
        models.AccountingPeriod.company_id == company_id
    ).first()

def get_accounting_periods_by_company(db: Session, company_id: int, skip: int = 0, limit: int = 100) -> List[models.AccountingPeriod]:
    return db.query(models.AccountingPeriod).filter(
        models.AccountingPeriod.company_id == company_id
    ).offset(skip).limit(limit).all()

def update_accounting_period(db: Session, period_db_obj: models.AccountingPeriod, period_in: schemas.AccountingPeriodUpdate) -> models.AccountingPeriod:
    update_data = period_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(period_db_obj, field, value)
    
    db.add(period_db_obj)
    db.commit()
    db.refresh(period_db_obj)
    return period_db_obj

def delete_accounting_period(db: Session, period_id: int, company_id: int) -> Optional[models.AccountingPeriod]:
    period = get_accounting_period(db, period_id, company_id)
    if period:
        db.delete(period)
        db.commit()
    return period

# Platform-specific CRUD functions

def update_user_last_login(db: Session, user: models.User) -> models.User:
    """Update user's last login timestamp"""
    user.last_login = datetime.utcnow()
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def get_platform_admins(db: Session, skip: int = 0, limit: int = 100) -> List[models.User]:
    """Get all platform administrators"""
    return db.query(models.User).filter(
        models.User.user_type == UserType.PLATFORM_ADMIN
    ).offset(skip).limit(limit).all()

def get_users_by_type(db: Session, user_type: UserType, skip: int = 0, limit: int = 100) -> List[models.User]:
    """Get users by type"""
    return db.query(models.User).filter(
        models.User.user_type == user_type
    ).offset(skip).limit(limit).all()

def create_platform_audit_log(db: Session, audit_log: schemas.PlatformAuditLogCreate) -> models.PlatformAuditLog:
    """Create a platform audit log entry"""
    db_audit_log = models.PlatformAuditLog(**audit_log.model_dump())
    db.add(db_audit_log)
    db.commit()
    db.refresh(db_audit_log)
    return db_audit_log

def get_platform_audit_logs(
    db: Session, 
    skip: int = 0, 
    limit: int = 100,
    company_id: Optional[int] = None,
    user_id: Optional[int] = None,
    action: Optional[str] = None
) -> List[models.PlatformAuditLog]:
    """Get platform audit logs with optional filters"""
    query = db.query(models.PlatformAuditLog)
    
    if company_id:
        query = query.filter(models.PlatformAuditLog.company_id == company_id)
    if user_id:
        query = query.filter(models.PlatformAuditLog.user_id == user_id)
    if action:
        query = query.filter(models.PlatformAuditLog.action == action)
    
    return query.order_by(models.PlatformAuditLog.timestamp.desc()).offset(skip).limit(limit).all()

def get_companies_for_platform_admin(db: Session, skip: int = 0, limit: int = 100) -> List[models.Company]:
    """Get all companies for platform administration"""
    return db.query(models.Company).filter(
        models.Company.is_deleted == False
    ).offset(skip).limit(limit).all()

def create_company_with_audit(
    db: Session, 
    company: schemas.CompanyCreate, 
    created_by_user_id: int
) -> models.Company:
    """Create a company with audit trail"""
    db_company = models.Company(
        **company.model_dump(),
        created_by_user_id=created_by_user_id
    )
    db.add(db_company)
    db.commit()
    db.refresh(db_company)
    return db_company
