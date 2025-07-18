from typing import Any, Optional
from datetime import timedelta, datetime
from fastapi import APIRouter, Depends, HTTPException, status, Form
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database.database import get_db
from app.models.core import User, UserType, PlatformAuditLog
from app.core.security import (
    create_access_token, 
    verify_password,
    get_current_platform_admin
)
from app.config import settings
from app.schemas.token import Token

router = APIRouter()

class PlatformLoginRequest(BaseModel):
    username: str
    password: str
    otp_code: Optional[str] = None

@router.post("/login", response_model=Token)
def platform_login(
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends(),
) -> Any:
    """
    Platform admin login endpoint (OAuth2 compatible)
    """
    # Authenticate the user
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    
    # Verify user is a platform admin
    if user.user_type != UserType.PLATFORM_ADMIN:
        # Log unauthorized platform access attempt
        db.add(PlatformAuditLog(
            user_id=user.id,
            action="unauthorized_platform_access_attempt",
            details={"attempted_by": form_data.username}
        ))
        db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized for platform access",
        )
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive",
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        user.id, 
        user_type=UserType.PLATFORM_ADMIN,
        expires_delta=access_token_expires
    )
    
    # Log successful platform login
    db.add(PlatformAuditLog(
        user_id=user.id,
        action="platform_login",
        details={"login_time": str(datetime.utcnow())}
    ))
    db.commit()
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "is_platform_admin": True
    }

@router.post("/login-mfa", response_model=Token)
def platform_login_with_mfa(
    *,
    db: Session = Depends(get_db),
    login_data: PlatformLoginRequest,
) -> Any:
    """
    Platform admin login endpoint with MFA support (JSON body)
    """
    # Authenticate the user
    user = db.query(User).filter(User.email == login_data.username).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    
    # Verify user is a platform admin
    if user.user_type != UserType.PLATFORM_ADMIN:
        # Log unauthorized platform access attempt
        db.add(PlatformAuditLog(
            user_id=user.id,
            action="unauthorized_platform_access_attempt",
            details={"attempted_by": login_data.username}
        ))
        db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized for platform access",
        )
    
    # Check MFA if enabled
    if user.mfa_secret and not login_data.otp_code:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="MFA code required",
            headers={"X-MFA-Required": "true"},
        )
    
    if user.mfa_secret and login_data.otp_code:
        # Verify MFA code
        import pyotp
        totp = pyotp.TOTP(user.mfa_secret)
        if not totp.verify(login_data.otp_code, valid_window=1):
            # Log failed MFA attempt
            db.add(PlatformAuditLog(
                user_id=user.id,
                action="failed_mfa_attempt",
                details={"attempted_by": login_data.username}
            ))
            db.commit()
            
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid MFA code",
            )
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        user.id, 
        user_type=UserType.PLATFORM_ADMIN,
        expires_delta=access_token_expires
    )
    
    # Log successful platform login
    db.add(PlatformAuditLog(
        user_id=user.id,
        action="platform_login",
        details={"login_time": str(datetime.utcnow()), "mfa_used": bool(user.mfa_secret)}
    ))
    db.commit()
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "is_platform_admin": True
    }

# MFA setup endpoints...
@router.post("/mfa/setup", response_model=dict)
def setup_mfa(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_platform_admin)
) -> Any:
    """Setup MFA for platform admin"""
    import pyotp
    import qrcode
    import io
    import base64
    
    # Generate a new secret key
    secret = pyotp.random_base32()
    
    # Create a TOTP instance
    totp = pyotp.TOTP(secret)
    
    # Generate the provisioning URI
    provisioning_uri = totp.provisioning_uri(
        name=current_user.email,
        issuer_name="Vinea ERP Platform"
    )
    
    # Generate QR code
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(provisioning_uri)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Save QR code to buffer
    buffer = io.BytesIO()
    img.save(buffer)
    buffer.seek(0)
    
    # Convert to base64
    qr_base64 = base64.b64encode(buffer.read()).decode()
    
    return {
        "secret": secret,
        "qr_code": f"data:image/png;base64,{qr_base64}",
    }

@router.post("/mfa/confirm", response_model=dict)
def confirm_mfa(
    code: str = Form(...),
    secret: str = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_platform_admin)
) -> Any:
    """Confirm MFA setup by verifying the provided code"""
    import pyotp
    
    # Verify the code
    totp = pyotp.TOTP(secret)
    if not totp.verify(code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code",
        )
    
    # Save the secret
    current_user.mfa_secret = secret
    db.commit()
    
    # Log MFA setup
    db.add(PlatformAuditLog(
        user_id=current_user.id,
        action="mfa_setup",
        details={"setup_time": str(datetime.utcnow())}
    ))
    db.commit()
    
    return {"status": "MFA setup completed successfully"}
