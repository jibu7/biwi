from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import Optional
from app.core.security import get_current_active_user
from app.database.database import get_db
from app import models
from app.models.core import UserType

class PlatformContext:
    """Stores the current platform context"""
    def __init__(self, platform_user: models.User, target_company_id: Optional[int] = None):
        self.platform_user = platform_user
        self.target_company_id = target_company_id

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
    platform_admin: models.User = Depends(get_platform_admin),
    db: Session = Depends(get_db)
) -> PlatformContext:
    """Get platform context with optional target company"""
    # Check for X-Target-Company-ID header
    target_company_id = request.headers.get("X-Target-Company-ID")
    
    if target_company_id:
        company = db.query(models.Company).filter(
            models.Company.id == int(target_company_id),
            models.Company.is_deleted == False
        ).first()
        
        if not company:
            raise HTTPException(status_code=404, detail="Target company not found")
        
        # Log the access
        audit_log = models.PlatformAuditLog(
            user_id=platform_admin.id,
            company_id=company.id,
            action="accessed_company",
            resource_type="company",
            resource_id=company.id,
            ip_address=request.client.host,
            user_agent=request.headers.get("User-Agent")
        )
        db.add(audit_log)
        db.commit()
        
        return PlatformContext(platform_admin, company.id)
    
    return PlatformContext(platform_admin, None)
