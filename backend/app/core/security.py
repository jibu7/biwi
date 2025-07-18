from datetime import datetime, timedelta
from typing import Any, Dict, Optional, Union
from jose import jwt
from passlib.context import CryptContext
from app.config import settings
from app.models.core import UserType

# Additional imports
from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordBearer
from app.database.database import get_db
from app.models.core import User
from app.core.tenant_context import set_tenant_id
from app.core.platform_context import set_platform_admin_context, set_target_company
from app.schemas.token import TokenPayload

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")
platform_oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/platform/auth/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(
    subject: Union[str, Any], 
    user_type: Union[UserType, str],
    company_id: Optional[int] = None,
    expires_delta: Optional[timedelta] = None,
    additional_claims: Optional[Dict[str, Any]] = None,
) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    # Handle both enum and string user_type
    user_type_value = user_type.value if hasattr(user_type, 'value') else user_type
    
    # Base JWT claims
    to_encode = {
        "exp": expire, 
        "sub": str(subject),
        "user_type": user_type_value,
    }
    
    # Add company_id for tenant users
    if company_id is not None:
        to_encode["company_id"] = company_id
    
    # Add any additional claims
    if additional_claims:
        to_encode.update(additional_claims)
    
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )
    
    return encoded_jwt

def decode_access_token(token: str) -> Optional[TokenPayload]:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        return TokenPayload(**payload)
    except Exception:
        return None

async def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme),
    x_target_company_id: Optional[str] = Header(None),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token_data = decode_access_token(token)
    if token_data is None or token_data.sub is None:
        raise credentials_exception

    user = db.query(User).filter(User.id == token_data.sub).first()
    if not user or not user.is_active:
        raise credentials_exception

    # Handle tenant context
    user_type = user.user_type or UserType.COMPANY_USER
    
    # Set tenant context based on user type
    if user_type == UserType.PLATFORM_ADMIN:
        # Platform admin - set context flag
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

async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

async def get_current_platform_admin(
    current_user: User = Depends(get_current_active_user),
) -> User:
    if current_user.user_type != UserType.PLATFORM_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized for platform administration",
        )
    return current_user

async def get_current_active_superuser(
    current_user: User = Depends(get_current_active_user),
) -> User:
    if current_user.user_type != UserType.PLATFORM_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges",
        )
    return current_user

class TenantPermissionChecker:
    """
    Permission checker that uses tenant context from request middleware.
    """
    def __init__(self, required_permissions: list[str], require_all: bool = False):
        """
        Initialize tenant permission checker.
        
        Args:
            required_permissions: List of permissions to check
            require_all: If True, user must have ALL permissions (AND logic).
                        If False, user must have AT LEAST ONE permission (OR logic).
                        Default is False for backward compatibility.
        """
        self.required_permissions = required_permissions
        self.require_all = require_all
    
    async def __call__(
        self,
        user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
    ):
        # Platform admins and superusers have all permissions
        if user.is_superuser or user.user_type == UserType.PLATFORM_ADMIN:
            return user
        
        # Get user's permissions from all roles
        user_permissions = []
        for user_role in user.roles:
            role = user_role.role
            if role and role.permissions:
                user_permissions.extend(role.permissions)
        
        if self.require_all:
            # Check if user has ALL required permissions (AND logic)
            for permission in self.required_permissions:
                if permission not in user_permissions:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Not enough permissions"
                    )
        else:
            # Check if user has AT LEAST ONE required permission (OR logic)
            if not any(permission in user_permissions for permission in self.required_permissions):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not enough permissions"
                )
        
        return user
