from typing import Optional, Any
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from app.core.security import get_current_active_user, create_access_token, decode_access_token
from app.database.database import get_db
from app import models, schemas
from app.models.core import UserType

oauth2_scheme = HTTPBearer()

class PlatformContext:
    """Stores the current platform context for a request"""
    def __init__(self, user: models.User, target_company: Optional[models.Company] = None, is_impersonation: bool = False):
        self.user = user
        self.target_company = target_company
        self.is_impersonation = is_impersonation
        self.target_company_id = target_company.id if target_company else None

async def get_platform_admin(
    current_user: models.User = Depends(get_current_active_user)
) -> models.User:
    """Ensure user is a platform admin"""
    if current_user.user_type != "platform_admin":
        raise HTTPException(
            status_code=403,
            detail="Platform administrator access required"
        )
    return current_user

async def get_platform_context(
    request: Request,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> PlatformContext:
    """Get platform context from request, handling both regular and impersonation tokens"""
    try:
        # Decode the token to check if it's an impersonation token
        payload = decode_access_token(token.credentials)
        
        if payload.get("is_impersonation"):
            # Handle impersonation token
            user_id = payload.get("user_id")
            company_id = payload.get("company_id")
            
            if not user_id or not company_id:
                raise HTTPException(status_code=401, detail="Invalid impersonation token")
            
            platform_user = db.query(models.User).filter(models.User.id == user_id).first()
            if not platform_user or platform_user.user_type != "platform_admin":
                raise HTTPException(status_code=401, detail="Invalid platform user")
            
            target_company = db.query(models.Company).filter(models.Company.id == company_id).first()
            if not target_company:
                raise HTTPException(status_code=404, detail="Target company not found")
            
            return PlatformContext(platform_user, target_company, True)
        else:
            # Regular platform admin token
            platform_admin = await get_platform_admin(await get_current_active_user())
            
            # Check for X-Target-Company-ID header
            target_company_id = request.headers.get("X-Target-Company-ID")
            
            if target_company_id:
                target_company = db.query(models.Company).filter(
                    models.Company.id == int(target_company_id),
                    models.Company.is_deleted == False
                ).first()
                
                if not target_company:
                    raise HTTPException(status_code=404, detail="Target company not found")
                
                # Log the access
                audit_log = models.PlatformAuditLog(
                    user_id=platform_admin.id,
                    company_id=target_company.id,
                    action="accessed_company",
                    resource_type="company",
                    resource_id=target_company.id,
                    ip_address=request.client.host,
                    user_agent=request.headers.get("User-Agent")
                )
                db.add(audit_log)
                db.commit()
                
                return PlatformContext(platform_admin, target_company, False)
            
            return PlatformContext(platform_admin, None, False)
    
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid authentication token")

def create_impersonation_token(
    platform_user: models.User,
    target_company_id: int,
    expires_delta: timedelta = timedelta(hours=1)
) -> str:
    """Create a special token for company impersonation"""
    token_data = {
        "user_id": platform_user.id,
        "company_id": target_company_id,
        "is_impersonation": True,
        "platform_user_email": platform_user.email
    }
    return create_access_token(data=token_data, expires_delta=expires_delta)

def log_platform_action(
    db: Session,
    user_id: int,
    action: str,
    company_id: Optional[int] = None,
    resource_type: Optional[str] = None,
    resource_id: Optional[int] = None,
    details: Optional[dict] = None,
    request: Optional[Request] = None
) -> models.PlatformAuditLog:
    """Helper function to log platform admin actions"""
    audit_log = models.PlatformAuditLog(
        user_id=user_id,
        company_id=company_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details,
        ip_address=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None
    )
    db.add(audit_log)
    db.commit()
    return audit_log
