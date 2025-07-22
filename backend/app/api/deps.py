from typing import Generator, Optional
from fastapi import Depends, HTTPException, Security, status, Header
from sqlalchemy.orm import Session
from app.database.database import SessionLocal
from app.core.security import oauth2_scheme, decode_access_token
from app.core.tenant_context import get_current_tenant_id, set_tenant_id
from app.core.platform_context import is_in_platform_admin_context, get_target_company, set_platform_admin_context, set_target_company
from app.models.core import User, UserType

def get_db() -> Generator:
    """Get database session."""
    db = None
    try:
        db = SessionLocal()
        yield db
    finally:
        if db:
            db.close()

def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme),
    x_target_company_id: Optional[str] = Header(None),
) -> User:
    """Get the current authenticated user with tenant context setup."""
    from datetime import datetime
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token_data = decode_access_token(token)
    if token_data is None or token_data.sub is None:
        raise credentials_exception
    
    # Try to parse sub as integer (user ID)
    try:
        user_id = int(token_data.sub)
        user = db.query(User).filter(User.id == user_id).first()
    except ValueError:
        # If not an integer, assume it's an email
        user = db.query(User).filter(User.email == token_data.sub).first()
    
    if user is None:
        raise credentials_exception
    
    # Set platform admin context if applicable
    if user.user_type == UserType.PLATFORM_ADMIN:
        set_platform_admin_context(True)
        
        # Handle target company header for impersonation
        if x_target_company_id is not None:
            try:
                target_company_id = int(x_target_company_id)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid X-Target-Company-ID header format",
                )
                
            # Verify the target company exists
            from app.models.core import Company
            target_company = db.query(Company).filter(
                Company.id == target_company_id,
                Company.is_active == True,
                Company.is_deleted == False
            ).first()
            
            if not target_company:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Target company with ID {target_company_id} not found or inactive",
                )
            
            # Set target company for impersonation
            set_target_company(target_company_id)
            set_tenant_id(target_company_id)
            
            # Log platform admin impersonation
            from app.models.core import PlatformAuditLog
            db.add(PlatformAuditLog(
                user_id=user.id,
                company_id=target_company_id,
                action="company_impersonation",
                details={"company_id": target_company_id}
            ))
            db.commit()
    else:
        # Regular company user - set tenant context from user's company
        company_id = user.company_id
        if not company_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User not associated with a company",
            )
        set_tenant_id(company_id)
    
    # Update last login time
    user.last_login = datetime.utcnow()
    db.commit()
    
    return user

def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Get the current active authenticated user."""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

def get_current_tenant_user(
    current_user: User = Depends(get_current_active_user),
) -> User:
    """
    Get current user and ensure they belong to a tenant/company.
    This is for endpoints that require a company context.
    """
    # Platform admins can access tenant endpoints if they've set a target company
    if current_user.user_type == UserType.PLATFORM_ADMIN:
        target_company = get_target_company()
        if not target_company:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Platform admin must specify a target company using X-Target-Company-ID header",
            )
        return current_user
    
    # For regular users, verify they have a company
    if not current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User not associated with any company",
        )
    
    return current_user

def get_current_platform_admin(
    current_user: User = Depends(get_current_active_user),
) -> User:
    """
    Get current user and ensure they are a platform admin.
    This is for platform-only endpoints.
    """
    if current_user.user_type != UserType.PLATFORM_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized for platform administration",
        )
    
    return current_user

def get_current_company_admin(
    current_user: User = Depends(get_current_active_user),
) -> User:
    """
    Get current user and ensure they are a company admin.
    This is for company admin endpoints.
    """
    if current_user.user_type not in [UserType.COMPANY_ADMIN, UserType.PLATFORM_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized for company administration",
        )
    
    return current_user

def get_current_admin(
    current_user: User = Depends(get_current_active_user),
) -> User:
    """
    Get current user and ensure they are either a platform admin or company admin.
    This is for endpoints that require admin privileges.
    """
    if current_user.user_type not in [UserType.PLATFORM_ADMIN, UserType.COMPANY_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized for administration",
        )
    
    return current_user

def require_tenant_context() -> int:
    """Dependency that requires a valid tenant context."""
    tenant_id = get_current_tenant_id()
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tenant context available",
        )
    return tenant_id
