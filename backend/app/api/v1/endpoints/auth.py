from datetime import timedelta, datetime
from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.core import User, UserType, Company
from app.core.security import create_access_token, verify_password, get_current_active_user
from app.core.formatting import FormattingService
from app.config import settings
from app.schemas.token import Token

router = APIRouter()

@router.post("/login", response_model=Token)
def login_access_token(
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    user = db.query(User).filter(User.email == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    elif user.user_type == UserType.PLATFORM_ADMIN:
        raise HTTPException(
            status_code=400, 
            detail="Platform admins must use platform login endpoint"
        )
    elif not user.company_id:
        raise HTTPException(
            status_code=400, 
            detail="User not associated with any company"
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Create token with user type and company information
    token = create_access_token(
        user.id, 
        user_type=user.user_type,
        company_id=user.company_id,
        expires_delta=access_token_expires
    )
    
    # Update last login time
    user.last_login = datetime.utcnow()
    db.commit()
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "is_platform_admin": False
    }

@router.get("/me", response_model=dict)
def read_current_user(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """Get current user information with formatting configuration"""
    # Get user's company information
    company = None
    if current_user.company_id:
        company = db.query(Company).filter(Company.id == current_user.company_id).first()
    
    # Get formatting configuration
    formatting_config = None
    if company:
        formatting_config = FormattingService.get_user_formatting_config(current_user, company)
    
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "user_type": current_user.user_type,
        "company_id": current_user.company_id,
        "is_active": current_user.is_active,
        "is_superuser": current_user.is_superuser,
        "date_format_override": getattr(current_user, 'date_format_override', None),
        "locale": getattr(current_user, 'locale', 'en-US'),
        "timezone": getattr(current_user, 'timezone', 'UTC'),
        "company": {
            "id": company.id if company else None,
            "name": company.name if company else None,
            "is_active": company.is_active if company else None,
            "date_format": getattr(company, 'date_format', 'YYYY-MM-DD') if company else None,
            "time_format": getattr(company, 'time_format', '24h') if company else None,
            "decimal_separator": getattr(company, 'decimal_separator', '.') if company else None,
            "thousand_separator": getattr(company, 'thousand_separator', ',') if company else None,
            "currency_position": getattr(company, 'currency_position', 'prefix') if company else None
        } if company else None,
        "formatting_config": formatting_config
    }

@router.get("/me/roles", response_model=list)
def read_current_user_roles(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """Get current user's roles"""
    from app.crud.core import get_user_roles
    
    roles = get_user_roles(db, current_user.id)
    return [
        {
            "id": role.id,
            "name": role.name,
            "description": role.description,
            "permissions": role.permissions,
            "company_id": role.company_id
        }
        for role in roles
    ]
