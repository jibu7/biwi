jibu7: create a file called "week2_implementation.md" giving full instructions how to implement "authentication and middleware changes in Week 2 to properly enforce multi-tenant isolation."

GitHub Copilot: I'll create a comprehensive guide for Week 2 implementation of authentication and middleware changes to enforce multi-tenant isolation.

### [week2_implementation.md](vscode-remote://wsl/home/ubuntu24/proj/biwi/week2_implementation.md)

```markdown
# Week 2: Authentication and Middleware Implementation for Multi-Tenant Isolation

This document outlines the implementation steps for Week 2 of the multi-tenant migration, focusing on authentication and middleware changes to properly enforce tenant isolation.

## Table of Contents

1. [Overview](#overview)
2. [Day 1: Tenant Context System](#day-1-tenant-context-system)
3. [Day 2: Authentication System Updates](#day-2-authentication-system-updates)
4. [Day 3: Middleware Implementation](#day-3-middleware-implementation)
5. [Day 4: API Route Protection](#day-4-api-route-protection)
6. [Day 5: CRUD Operations Update](#day-5-crud-operations-update)
7. [Day 6: Frontend Authentication Updates](#day-6-frontend-authentication-updates)
8. [Day 7: Testing and Validation](#day-7-testing-and-validation)
9. [Troubleshooting](#troubleshooting)

## Overview

After completing Week 1's database migrations, we now need to modify the application logic to enforce tenant isolation. This includes:

- Creating a tenant context system
- Updating authentication to handle platform admins
- Implementing tenant isolation middleware
- Protecting API routes based on tenant context
- Updating CRUD operations to respect tenant boundaries
- Modifying frontend authentication to support tenant switching

## Day 1: Tenant Context System

The tenant context system will track the current tenant (company) throughout the request lifecycle.

### 1.1 Create Tenant Context Module

```python
# filepath: backend/app/core/tenant_context.py

from typing import Optional
from contextvars import ContextVar
from fastapi import HTTPException, status

# Create a context variable to store the current tenant ID
current_tenant_id: ContextVar[Optional[int]] = ContextVar('current_tenant_id', default=None)

def get_current_tenant_id() -> Optional[int]:
    """Get the current tenant ID from context."""
    return current_tenant_id.get()

def set_tenant_id(tenant_id: Optional[int]) -> None:
    """Set the current tenant ID in context."""
    current_tenant_id.set(tenant_id)

def reset_tenant_id() -> None:
    """Reset the tenant ID to None."""
    current_tenant_id.set(None)

def require_tenant() -> int:
    """Get current tenant ID, raising an exception if none is set."""
    tenant_id = get_current_tenant_id()
    if tenant_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tenant context required for this operation"
        )
    return tenant_id
```

### 1.2 Create Platform Context Module

```python
# filepath: backend/app/core/platform_context.py

from contextvars import ContextVar
from typing import Optional

# Track if the current request is from a platform admin
is_platform_admin: ContextVar[bool] = ContextVar('is_platform_admin', default=False)

# Track target company_id for impersonation scenarios
target_company_id: ContextVar[Optional[int]] = ContextVar('target_company_id', default=None)

def set_platform_admin_context(is_admin: bool = True) -> None:
    """Set the platform admin context flag."""
    is_platform_admin.set(is_admin)

def is_in_platform_admin_context() -> bool:
    """Check if the current context is platform admin."""
    return is_platform_admin.get()

def set_target_company(company_id: Optional[int]) -> None:
    """Set the target company ID for platform admin operations."""
    target_company_id.set(company_id)

def get_target_company() -> Optional[int]:
    """Get the target company ID if set."""
    return target_company_id.get()

def reset_platform_context() -> None:
    """Reset platform context variables."""
    set_platform_admin_context(False)
    set_target_company(None)
```

### 1.3 Create Context Manager for Tenant Operations

```python
# filepath: backend/app/core/context_managers.py

from contextlib import contextmanager
from app.core.tenant_context import set_tenant_id, reset_tenant_id
from app.core.platform_context import set_target_company, reset_platform_context

@contextmanager
def tenant_context(tenant_id: int):
    """Context manager for operating in a specific tenant context."""
    previous_tenant = None
    try:
        # Store previous value if we need to restore it
        try:
            from app.core.tenant_context import get_current_tenant_id
            previous_tenant = get_current_tenant_id()
        except:
            pass
            
        # Set the tenant ID for operations within this context
        set_tenant_id(tenant_id)
        yield
    finally:
        # Restore previous context or reset
        if previous_tenant is not None:
            set_tenant_id(previous_tenant)
        else:
            reset_tenant_id()

@contextmanager
def platform_admin_context(target_company_id: int = None):
    """Context manager for platform admin operations."""
    try:
        from app.core.platform_context import set_platform_admin_context
        set_platform_admin_context(True)
        if target_company_id:
            set_target_company(target_company_id)
        yield
    finally:
        reset_platform_context()
```

## Day 2: Authentication System Updates

### 2.1 Update Token Generation and Validation

```python
# filepath: backend/app/core/security.py

from datetime import datetime, timedelta
from typing import Any, Dict, Optional, Union
from jose import jwt
from passlib.context import CryptContext
from app.core.config import settings
from app.models.core import UserType

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Additional imports
from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.database.database import get_db
from app.models.core import User
from app.core.tenant_context import set_tenant_id
from app.core.platform_context import set_platform_admin_context, set_target_company

# ...existing code...

def create_access_token(
    subject: Union[str, Any], 
    user_type: UserType,
    company_id: Optional[int] = None,
    expires_delta: timedelta = None,
    additional_claims: Dict[str, Any] = None,
) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    # Base JWT claims
    to_encode = {
        "exp": expire, 
        "sub": str(subject),
        "user_type": user_type,
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

# ...existing code...

# Update the get_current_user function
async def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")),
    x_target_company_id: Optional[int] = None,
) -> User:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )

    user = db.query(User).filter(User.id == token_data.sub).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    # Handle tenant context
    user_type = getattr(user, "user_type", UserType.COMPANY_USER)
    
    # Set tenant context based on user type
    if user_type == UserType.PLATFORM_ADMIN:
        # Platform admin - set context flag
        set_platform_admin_context(True)
        
        # Handle target company header for impersonation
        if x_target_company_id is not None:
            # Verify the target company exists
            from app.models.core import Company
            target_company = db.query(Company).get(x_target_company_id)
            if not target_company:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Target company with ID {x_target_company_id} not found",
                )
            
            # Set target company for impersonation
            set_target_company(x_target_company_id)
            set_tenant_id(x_target_company_id)
            
            # Log platform admin impersonation
            from app.models.core import PlatformAuditLog
            db.add(PlatformAuditLog(
                user_id=user.id,
                company_id=x_target_company_id,
                action="company_impersonation",
                details={"company_id": x_target_company_id}
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
```

### 2.2 Create Platform Admin Authentication Endpoints

```python
# filepath: backend/app/api/v1/endpoints/platform_auth.py

from typing import Any
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.core import User, UserType
from app.core.security import (
    create_access_token, 
    get_password_hash, 
    verify_password
)
from app.core.config import settings
from app.schemas.token import Token
from app.models.core import PlatformAuditLog
from pydantic import BaseModel

router = APIRouter()

class PlatformLoginForm(BaseModel):
    username: str
    password: str
    otp_code: str = None  # For MFA

@router.post("/platform-login", response_model=Token)
def platform_login(
    db: Session = Depends(get_db),
    form_data: PlatformLoginForm = None,
    oauth_form: OAuth2PasswordRequestForm = Depends(),
) -> Any:
    """
    Platform admin login endpoint with MFA support
    """
    # Use either form data or OAuth form
    username = form_data.username if form_data else oauth_form.username
    password = form_data.password if form_data else oauth_form.password
    otp_code = getattr(form_data, "otp_code", None)
    
    # Authenticate the user
    user = db.query(User).filter(User.email == username).first()
    if not user or not verify_password(password, user.hashed_password):
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
            details={"ip_address": "client_ip"}  # You'd get this from the request
        ))
        db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized for platform access",
        )
    
    # Check MFA if enabled
    if user.mfa_secret and not otp_code:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="MFA code required",
            headers={"X-MFA-Required": "true"},
        )
    
    if user.mfa_secret and otp_code:
        # Verify MFA code
        import pyotp
        totp = pyotp.TOTP(user.mfa_secret)
        if not totp.verify(otp_code):
            # Log failed MFA attempt
            db.add(PlatformAuditLog(
                user_id=user.id,
                action="failed_mfa_attempt",
                details={"ip_address": "client_ip"}
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
        details={"ip_address": "client_ip"}
    ))
    db.commit()
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "is_platform_admin": True
    }

@router.post("/platform/mfa/setup", response_model=dict)
def setup_mfa(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Setup MFA for platform admin
    """
    # Verify user is a platform admin
    if current_user.user_type != UserType.PLATFORM_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized for platform access",
        )
    
    # Generate MFA secret
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
        issuer_name="BiwiERP Platform"
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
    
    # Don't save the secret yet - user needs to confirm it works
    
    return {
        "secret": secret,
        "qr_code": f"data:image/png;base64,{qr_base64}",
    }

@router.post("/platform/mfa/confirm", response_model=dict)
def confirm_mfa(
    code: str,
    secret: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Confirm MFA setup by verifying the provided code
    """
    # Verify user is a platform admin
    if current_user.user_type != UserType.PLATFORM_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized for platform access",
        )
    
    # Verify the code
    import pyotp
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
        details={"ip_address": "client_ip"}
    ))
    db.commit()
    
    return {"status": "MFA setup completed successfully"}

@router.post("/platform/mfa/disable", response_model=dict)
def disable_mfa(
    code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Disable MFA for platform admin
    """
    # Verify user is a platform admin
    if current_user.user_type != UserType.PLATFORM_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized for platform access",
        )
    
    # Make sure MFA is enabled
    if not current_user.mfa_secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MFA is not enabled",
        )
    
    # Verify the code
    import pyotp
    totp = pyotp.TOTP(current_user.mfa_secret)
    if not totp.verify(code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code",
        )
    
    # Disable MFA
    current_user.mfa_secret = None
    db.commit()
    
    # Log MFA disable
    db.add(PlatformAuditLog(
        user_id=current_user.id,
        action="mfa_disabled",
        details={"ip_address": "client_ip"}
    ))
    db.commit()
    
    return {"status": "MFA disabled successfully"}
```

### 2.3 Update Regular Authentication Endpoint

```python
# filepath: backend/app/api/v1/endpoints/auth.py

from datetime import timedelta
from typing import Any

from fastapi import APIRouter, Body, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.api import deps
from app.core import security
from app.core.config import settings
from app.database.database import get_db
from app.models.core import User, UserType
from app.schemas.token import Token

# ...existing code...

@router.post("/login", response_model=Token)
def login_access_token(
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    user = crud.user.authenticate(
        db, email=form_data.username, password=form_data.password
    )
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Get company_id based on user type
    company_id = None
    if user.user_type != UserType.PLATFORM_ADMIN:
        company_id = user.company_id
    
    # Create token with user type and company information
    token = security.create_access_token(
        user.id, 
        user_type=user.user_type,
        company_id=company_id,
        expires_delta=access_token_expires
    )
    
    # Update last login time
    user.last_login = datetime.utcnow()
    db.commit()
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "is_platform_admin": user.user_type == UserType.PLATFORM_ADMIN
    }

# ...existing code...
```

### 2.4 Update Main Router to Include Platform Auth

```python
# filepath: backend/app/api/v1/api.py

from fastapi import APIRouter

from app.api.v1.endpoints import auth, users, utils, gl, ar, ap, inventory, oe
from app.api.v1.endpoints import platform_auth  # New import

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(platform_auth.router, tags=["platform"])  # Add platform auth
# ...existing code...
```

## Day 3: Middleware Implementation

### 3.1 Create Tenant Isolation Middleware

```python
# filepath: backend/app/middleware/tenant_isolation.py

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
import logging
from app.core.tenant_context import get_current_tenant_id, reset_tenant_id
from app.core.platform_context import reset_platform_context
from jose import jwt, JWTError
from app.core.config import settings
from app.models.core import UserType

logger = logging.getLogger(__name__)

class TenantIsolationMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Reset context for each request
        reset_tenant_id()
        reset_platform_context()
        
        # Skip tenant extraction for certain paths
        if self._should_skip_tenant_extraction(request.url.path):
            return await call_next(request)
        
        # Extract tenant ID from token if present
        authorization = request.headers.get("Authorization")
        if authorization and authorization.startswith("Bearer "):
            token = authorization.replace("Bearer ", "")
            
            try:
                payload = jwt.decode(
                    token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
                )
                
                # Check for impersonation via header
                target_company_id = request.headers.get("X-Target-Company-ID")
                
                # Handle based on user type
                user_type = payload.get("user_type")
                
                # If platform admin and impersonating, log this
                if user_type == UserType.PLATFORM_ADMIN and target_company_id:
                    logger.info(f"Platform admin impersonating company {target_company_id}")
                    # Note: The actual context setting happens in the get_current_user dependency
                
            except JWTError:
                # If token is invalid, let the auth system handle it later
                pass
        
        # Add tenant_id to request state for access in route handlers
        # This will be populated by the authentication dependency
        
        try:
            response = await call_next(request)
            return response
        except Exception as e:
            logger.exception("Error processing request with tenant context")
            return JSONResponse(
                status_code=500,
                content={"detail": "Internal server error"},
            )
    
    def _should_skip_tenant_extraction(self, path: str) -> bool:
        """Determine if tenant extraction should be skipped for this path."""
        # Always skip for auth endpoints and docs
        skip_paths = [
            "/api/v1/auth/login",
            "/api/v1/platform-login",
            "/docs",
            "/redoc",
            "/openapi.json",
        ]
        
        return any(path.startswith(skip_p) for skip_p in skip_paths)
```

### 3.2 Create Audit Logging Middleware

```python
# filepath: backend/app/middleware/audit_logging.py

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import logging
import time
import json
from typing import Optional
from app.core.tenant_context import get_current_tenant_id
from app.core.platform_context import is_in_platform_admin_context
from app.database.database import SessionLocal
from app.models.core import PlatformAuditLog

logger = logging.getLogger(__name__)

class AuditLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        # Start timer for request duration
        start_time = time.time()
        
        # Skip audit logging for certain paths
        if self._should_skip_audit_logging(request.url.path):
            return await call_next(request)
        
        # Extract request details
        method = request.method
        path = request.url.path
        query_params = dict(request.query_params)
        
        # Try to extract body for certain operations (POST, PUT, PATCH)
        body = None
        if method in ["POST", "PUT", "PATCH"]:
            try:
                # Make a copy of the request body to avoid consuming it
                body_bytes = await request.body()
                request._body = body_bytes  # Save for later consumption
                
                # Try to parse as JSON if possible
                try:
                    body = json.loads(body_bytes.decode())
                    # Redact sensitive fields
                    if body and isinstance(body, dict):
                        if "password" in body:
                            body["password"] = "***REDACTED***"
                        if "hashed_password" in body:
                            body["hashed_password"] = "***REDACTED***"
                except:
                    body = {"raw_size_bytes": len(body_bytes)}
            except:
                pass
        
        # Process the request
        try:
            response = await call_next(request)
            status_code = response.status_code
            success = 200 <= status_code < 400
        except Exception as e:
            logger.exception("Error processing request")
            success = False
            status_code = 500
            raise e
        finally:
            # Only log platform admin operations and sensitive operations
            if is_in_platform_admin_context() or self._is_sensitive_operation(method, path):
                duration = time.time() - start_time
                
                # Extract user ID from request state if available
                user_id = getattr(request.state, "user_id", None)
                company_id = get_current_tenant_id()
                
                # Create audit log entry
                try:
                    # For platform admin operations, log to the database
                    if is_in_platform_admin_context():
                        self._log_to_database(
                            user_id=user_id,
                            company_id=company_id,
                            action=f"{method} {path}",
                            resource_type=self._extract_resource_type(path),
                            details={
                                "query_params": query_params,
                                "body": body,
                                "status_code": status_code,
                                "success": success,
                                "duration_ms": round(duration * 1000),
                                "ip_address": self._get_client_ip(request)
                            }
                        )
                except Exception as e:
                    logger.exception("Error logging audit information")
        
        return response
    
    def _should_skip_audit_logging(self, path: str) -> bool:
        """Determine if audit logging should be skipped for this path."""
        # Skip for docs, static files, health checks
        skip_paths = [
            "/docs",
            "/redoc",
            "/openapi.json",
            "/static",
            "/health",
        ]
        
        return any(path.startswith(skip_p) for skip_p in skip_paths)
    
    def _is_sensitive_operation(self, method: str, path: str) -> bool:
        """Determine if an operation is sensitive and should be logged."""
        # Log all write operations
        if method in ["POST", "PUT", "PATCH", "DELETE"]:
            return True
        
        # Log reads of sensitive resources
        sensitive_resources = [
            "/api/v1/users",
            "/api/v1/companies",
            "/api/v1/roles",
            "/api/v1/platform",
        ]
        
        return any(path.startswith(res) for res in sensitive_resources)
    
    def _extract_resource_type(self, path: str) -> Optional[str]:
        """Extract the resource type from the path."""
        parts = path.strip('/').split('/')
        if len(parts) >= 3 and parts[0] == "api" and parts[1] == "v1":
            return parts[2]
        return None
    
    def _get_client_ip(self, request: Request) -> str:
        """Get client IP from request."""
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        return request.client.host if request.client else "unknown"
    
    def _log_to_database(
        self, 
        user_id: Optional[int], 
        company_id: Optional[int],
        action: str,
        resource_type: Optional[str],
        details: dict
    ) -> None:
        """Log platform admin action to database."""
        try:
            db = SessionLocal()
            db.add(PlatformAuditLog(
                user_id=user_id,
                company_id=company_id,
                action=action,
                resource_type=resource_type,
                details=details,
                ip_address=details.get("ip_address")
            ))
            db.commit()
        except Exception as e:
            logger.exception(f"Failed to log to database: {e}")
        finally:
            db.close()
```

### 3.3 Register Middleware in Main Application

```python
# filepath: backend/app/main.py

from fastapi import FastAPI, Request
from starlette.middleware.cors import CORSMiddleware

from app.api.v1.api import api_router
from app.core.config import settings

# Import middleware
from app.middleware.tenant_isolation import TenantIsolationMiddleware
from app.middleware.audit_logging import AuditLoggingMiddleware

app = FastAPI(
    title=settings.PROJECT_NAME, openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set all CORS enabled origins
# ...existing code...

# Add custom middleware
app.add_middleware(TenantIsolationMiddleware)
app.add_middleware(AuditLoggingMiddleware)

# ...existing code...

app.include_router(api_router, prefix=settings.API_V1_STR)

# ...existing code...
```

## Day 4: API Route Protection

### 4.1 Create Custom Dependencies for Tenant Protection

```python
# filepath: backend/app/api/deps.py

from typing import Generator, Optional
from fastapi import Depends, HTTPException, Security, status, Header
from fastapi.security import OAuth2PasswordBearer, SecurityScopes
from sqlalchemy.orm import Session
from jose import jwt
from pydantic import ValidationError

from app.database.database import SessionLocal
from app.core.config import settings
from app.core.security import get_current_user as security_get_current_user
from app.core.tenant_context import get_current_tenant_id, require_tenant
from app.core.platform_context import is_in_platform_admin_context, get_target_company
from app.models.core import User, UserType

# ...existing code...

def get_db() -> Generator:
    """Get database session."""
    try:
        db = SessionLocal()
        yield db
    finally:
        db.close()

def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")),
    x_target_company_id: Optional[int] = Header(None),
) -> User:
    """Get the current authenticated user with tenant context setup."""
    return security_get_current_user(db, token, x_target_company_id)

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
```

### 4.2 Create Permission Helper

```python
# filepath: backend/app/core/permissions.py

from enum import Enum, auto
from typing import List, Optional
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.core import User, Role, UserRole
from app.core.tenant_context import get_current_tenant_id
from app.api.deps import get_current_active_user
from app.core.platform_context import is_in_platform_admin_context

class Permission(str, Enum):
    # Company management
    COMPANY_CREATE = "company:create"
    COMPANY_READ = "company:read"
    COMPANY_UPDATE = "company:update"
    COMPANY_DELETE = "company:delete"
    
    # User management
    USER_CREATE = "user:create"
    USER_READ = "user:read"
    USER_UPDATE = "user:update"
    USER_DELETE = "user:delete"
    
    # ... other permissions ...

def check_permissions(required_permissions: List[Permission]):
    """
    Dependency to check if the current user has the required permissions.
    Platform admins automatically have all permissions.
    """
    def _check_permissions(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_active_user),
    ):
        # Platform admins have all permissions
        if is_in_platform_admin_context() or current_user.is_superuser:
            return True
        
        # Get tenant ID from context
        tenant_id = get_current_tenant_id()
        if not tenant_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tenant context available",
            )
        
        # Get user's roles for the current tenant
        user_roles = db.query(UserRole).filter(
            UserRole.user_id == current_user.id
        ).all()
        
        role_ids = [ur.role_id for ur in user_roles]
        
        # Get the roles to check permissions
        roles = db.query(Role).filter(
            Role.id.in_(role_ids),
            Role.company_id == tenant_id,
        ).all()
        
        # Check if any of the roles have the required permissions
        user_permissions = set()
        for role in roles:
            if role.permissions:
                user_permissions.update(role.permissions)
        
        # Check if user has all required permissions
        missing_permissions = [
            p for p in required_permissions if p.value not in user_permissions
        ]
        
        if missing_permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Missing required permissions: {', '.join([p.value for p in missing_permissions])}",
            )
        
        return True
    
    return _check_permissions
```

### 4.3 Example Protected Platform Routes

```python
# filepath: backend/app/api/v1/endpoints/platform.py

from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
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
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_platform_admin),
) -> Any:
    """
    Get all companies (platform admin only).
    """
    companies = db.query(Company).offset(skip).limit(limit).all()
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
    db_company = db.query(Company).filter(
        (Company.name == company_in.name) | (Company.code == company_in.code)
    ).first()
    if db_company:
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
    
    # Initialize company data (in a background task in production)
    with tenant_context(db_company.id):
        # Set up default GL accounts
        # Set up default fiscal year
        # Set up default roles
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
    company = db.query(Company).get(company_id)
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
    company = db.query(Company).get(company_id)
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
    if not company:
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

@router.post("/companies/{company_id}/activate", response_model=CompanySchema)
def activate_company(
    company_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_platform_admin),
) -> Any:
    """
    Activate a suspended company (platform admin only).
    """
    company = db.query(Company).get(company_id)
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found",
        )
    
    company.subscription_status = SubscriptionStatus.ACTIVE
    db.commit()
    
    # Log company activation
    db.add(PlatformAuditLog(
        user_id=current_user.id,
        company_id=company.id,
        action="company_activated",
        resource_type="company",
        resource_id=company.id,
        details={}
    ))
    db.commit()
    
    return company

@router.get("/audit-logs", response_model=List[dict])
def get_audit_logs(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    company_id: Optional[int] = None,
    user_id: Optional[int] = None,
    action: Optional[str] = None,
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
        query = query.filter(PlatformAuditLog.action == action)
    
    # Sort by timestamp descending
    query = query.order_by(PlatformAuditLog.timestamp.desc())
    
    # Pagination
    logs = query.offset(skip).limit(limit).all()
    
    # Convert to dict for response (helps with JSONB fields)
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
```

### 4.4 Add Platform Routes to API Router

```python
# filepath: backend/app/api/v1/api.py

from fastapi import APIRouter

from app.api.v1.endpoints import auth, users, utils, gl, ar, ap, inventory, oe
from app.api.v1.endpoints import platform_auth, platform

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(platform_auth.router, tags=["platform-auth"])
api_router.include_router(platform.router, prefix="/platform", tags=["platform"])
# ...existing code...
```

## Day 5: CRUD Operations Update

### 5.1 Create Base CRUD Class with Tenant Isolation

```python
# filepath: backend/app/crud/base.py

from typing import Any, Dict, Generic, List, Optional, Type, TypeVar, Union
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.database.database import Base
from app.core.tenant_context import get_current_tenant_id

ModelType = TypeVar("ModelType", bound=Base)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)

class CRUDBase(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    def __init__(self, model: Type[ModelType]):
        """
        CRUD object with tenant isolation.
        
        Args:
            model: The SQLAlchemy model class
        """
        self.model = model
        self.has_company_id = hasattr(model, "company_id")
    
    def get(self, db: Session, id: Any) -> Optional[ModelType]:
        """
        Get a record by ID, respecting tenant isolation.
        """
        query = db.query(self.model).filter(self.model.id == id)
        
        # Apply tenant filtering if model has company_id
        if self.has_company_id:
            tenant_id = get_current_tenant_id()
            if tenant_id:
                query = query.filter(self.model.company_id == tenant_id)
        
        return query.first()
    
    def get_multi(
        self, db: Session, *, skip: int = 0, limit: int = 100
    ) -> List[ModelType]:
        """
        Get multiple records, respecting tenant isolation.
        """
        query = db.query(self.model)
        
        # Apply tenant filtering if model has company_id
        if self.has_company_id:
            tenant_id = get_current_tenant_id()
            if tenant_id:
                query = query.filter(self.model.company_id == tenant_id)
        
        return query.offset(skip).limit(limit).all()
    
    def create(self, db: Session, *, obj_in: CreateSchemaType) -> ModelType:
        """
        Create new record with tenant ID.
        """
        obj_in_data = jsonable_encoder(obj_in)
        db_obj = self.model(**obj_in_data)
        
        # Add company_id if model has it
        if self.has_company_id:
            tenant_id = get_current_tenant_id()
            if tenant_id and not getattr(db_obj, "company_id", None):
                db_obj.company_id = tenant_id
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def update(
        self,
        db: Session,
        *,
        db_obj: ModelType,
        obj_in: Union[UpdateSchemaType, Dict[str, Any]]
    ) -> ModelType:
        """
        Update a record, ensuring it belongs to current tenant.
        """
        # Check tenant isolation
        if self.has_company_id:
            tenant_id = get_current_tenant_id()
            if tenant_id and db_obj.company_id != tenant_id:
                raise ValueError("Cannot update object from different tenant")
        
        # Update object
        obj_data = jsonable_encoder(db_obj)
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.dict(exclude_unset=True)
        
        # Prevent company_id modification
        if "company_id" in update_data and self.has_company_id:
            tenant_id = get_current_tenant_id()
            if tenant_id and update_data["company_id"] != tenant_id:
                raise ValueError("Cannot change company_id to different tenant")
        
        # Apply updates
        for field in obj_data:
            if field in update_data:
                setattr(db_obj, field, update_data[field])
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def remove(self, db: Session, *, id: int) -> ModelType:
        """
        Delete a record, ensuring it belongs to current tenant.
        """
        obj = self.get(db, id=id)
        if not obj:
            return None
        
        # Check tenant isolation
        if self.has_company_id:
            tenant_id = get_current_tenant_id()
            if tenant_id and obj.company_id != tenant_id:
                raise ValueError("Cannot delete object from different tenant")
        
        db.delete(obj)
        db.commit()
        return obj
    
    def exists(self, db: Session, *, id: int) -> bool:
        """
        Check if a record exists, respecting tenant isolation.
        """
        query = db.query(self.model).filter(self.model.id == id)
        
        # Apply tenant filtering if model has company_id
        if self.has_company_id:
            tenant_id = get_current_tenant_id()
            if tenant_id:
                query = query.filter(self.model.company_id == tenant_id)
        
        return db.query(query.exists()).scalar()
    
    def count(self, db: Session) -> int:
        """
        Count records, respecting tenant isolation.
        """
        query = db.query(self.model)
        
        # Apply tenant filtering if model has company_id
        if self.has_company_id:
            tenant_id = get_current_tenant_id()
            if tenant_id:
                query = query.filter(self.model.company_id == tenant_id)
        
        return query.count()
    
    def get_by_field(
        self, db: Session, *, field: str, value: Any
    ) -> Optional[ModelType]:
        """
        Get record by arbitrary field, respecting tenant isolation.
        """
        query = db.query(self.model).filter(getattr(self.model, field) == value)
        
        # Apply tenant filtering if model has company_id
        if self.has_company_id:
            tenant_id = get_current_tenant_id()
            if tenant_id:
                query = query.filter(self.model.company_id == tenant_id)
        
        return query.first()
    
    def get_multi_by_filter(
        self, db: Session, *, filters: Dict[str, Any], skip: int = 0, limit: int = 100
    ) -> List[ModelType]:
        """
        Get records by multiple filters, respecting tenant isolation.
        """
        query = db.query(self.model)
        
        # Apply provided filters
        for field, value in filters.items():
            if hasattr(self.model, field):
                query = query.filter(getattr(self.model, field) == value)
        
        # Apply tenant filtering if model has company_id
        if self.has_company_id:
            tenant_id = get_current_tenant_id()
            if tenant_id:
                query = query.filter(self.model.company_id == tenant_id)
        
        return query.offset(skip).limit(limit).all()
```

### 5.2 Update Example CRUD Module (GL Accounts)

```python
# filepath: backend/app/crud/gl.py

from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from app.crud.base import CRUDBase
from app.models.gl import GLAccount, GLJournalEntry, GLJournalEntryLine
from app.schemas.gl import (
    GLAccountCreate, 
    GLAccountUpdate, 
    GLJournalEntryCreate,
    GLJournalEntryUpdate
)
from app.core.tenant_context import get_current_tenant_id

class CRUDGLAccount(CRUDBase[GLAccount, GLAccountCreate, GLAccountUpdate]):
    def get_by_code(self, db: Session, *, code: str) -> Optional[GLAccount]:
        """Get GL account by code within current tenant."""
        tenant_id = get_current_tenant_id()
        return db.query(GLAccount).filter(
            and_(
                GLAccount.account_code == code,
                GLAccount.company_id == tenant_id
            )
        ).first()
    
    def get_all_active(self, db: Session, *, skip: int = 0, limit: int = 100) -> List[GLAccount]:
        """Get all active GL accounts for current tenant."""
        tenant_id = get_current_tenant_id()
        return db.query(GLAccount).filter(
            and_(
                GLAccount.is_active == True,
                GLAccount.company_id == tenant_id
            )
        ).order_by(GLAccount.account_code).offset(skip).limit(limit).all()
    
    def create_with_tenant(self, db: Session, *, obj_in: GLAccountCreate) -> GLAccount:
        """Create GL account with current tenant ID."""
        tenant_id = get_current_tenant_id()
        
        # Check for duplicate account code
        existing = self.get_by_code(db, code=obj_in.account_code)
        if existing:
            raise ValueError(f"Account code {obj_in.account_code} already exists")
        
        db_obj = GLAccount(
            company_id=tenant_id,
            account_code=obj_in.account_code,
            account_name=obj_in.account_name,
            account_type=obj_in.account_type,
            description=obj_in.description,
            is_active=obj_in.is_active,
            parent_account_id=obj_in.parent_account_id,
            balance_sheet_section=obj_in.balance_sheet_section,
            income_statement_section=obj_in.income_statement_section,
            allow_manual_entries=obj_in.allow_manual_entries,
        )
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

class CRUDGLJournalEntry(CRUDBase[GLJournalEntry, GLJournalEntryCreate, GLJournalEntryUpdate]):
    def create_with_lines(self, db: Session, *, obj_in: GLJournalEntryCreate) -> GLJournalEntry:
        """
        Create journal entry with lines, enforcing tenant isolation for all accounts.
        """
        tenant_id = get_current_tenant_id()
        
        # Create the journal entry
        db_obj = GLJournalEntry(
            company_id=tenant_id,
            entry_date=obj_in.entry_date,
            posting_date=obj_in.posting_date,
            reference=obj_in.reference,
            source=obj_in.source,
            memo=obj_in.memo,
            status=obj_in.status,
            currency_code=obj_in.currency_code,
            exchange_rate=obj_in.exchange_rate,
        )
        
        db.add(db_obj)
        db.flush()  # Get ID without committing
        
        # Process journal lines
        total_debit = 0
        total_credit = 0
        
        for line in obj_in.lines:
            # Verify account belongs to current tenant
            account = db.query(GLAccount).filter(
                and_(
                    GLAccount.id == line.account_id,
                    GLAccount.company_id == tenant_id
                )
            ).first()
            
            if not account:
                db.rollback()
                raise ValueError(f"Account ID {line.account_id} not found or not accessible")
            
            # Create journal line
            journal_line = GLJournalEntryLine(
                journal_entry_id=db_obj.id,
                account_id=line.account_id,
                debit_amount=line.debit_amount,
                credit_amount=line.credit_amount,
                memo=line.memo,
                reference=line.reference,
            )
            
            db.add(journal_line)
            
            # Track totals
            total_debit += line.debit_amount
            total_credit += line.credit_amount
        
        # Verify balanced entry
        if round(total_debit, 2) != round(total_credit, 2):
            db.rollback()
            raise ValueError(f"Journal entry not balanced: Debit {total_debit} != Credit {total_credit}")
        
        db_obj.total_amount = total_debit
        
        db.commit()
        db.refresh(db_obj)
        return db_obj

gl_account = CRUDGLAccount(GLAccount)
gl_journal_entry = CRUDGLJournalEntry(GLJournalEntry)
```

### 5.3 Example API Endpoint with Tenant Isolation

```python
# filepath: backend/app/api/v1/endpoints/gl.py

from typing import Any, List
from fastapi import APIRouter, Body, Depends, HTTPException, Path, Query
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.api import deps
from app.core.permissions import Permission, check_permissions
from app.core.tenant_context import require_tenant

router = APIRouter()

@router.get("/accounts", response_model=List[schemas.GLAccount])
def read_gl_accounts(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    is_active: bool = Query(True),
    current_user: models.User = Depends(deps.get_current_tenant_user),
    _: bool = Depends(check_permissions([Permission.GL_ACCOUNT_READ])),
) -> Any:
    """
    Retrieve GL accounts for current tenant.
    """
    # Tenant isolation is applied automatically in CRUD methods
    if is_active:
        gl_accounts = crud.gl.gl_account.get_all_active(db, skip=skip, limit=limit)
    else:
        gl_accounts = crud.gl.gl_account.get_multi(db, skip=skip, limit=limit)
    
    return gl_accounts

@router.post("/accounts", response_model=schemas.GLAccount)
def create_gl_account(
    *,
    db: Session = Depends(deps.get_db),
    account_in: schemas.GLAccountCreate,
    current_user: models.User = Depends(deps.get_current_tenant_user),
    _: bool = Depends(check_permissions([Permission.GL_ACCOUNT_CREATE])),
) -> Any:
    """
    Create new GL account for current tenant.
    """
    try:
        gl_account = crud.gl.gl_account.create_with_tenant(db=db, obj_in=account_in)
        return gl_account
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/accounts/{id}", response_model=schemas.GLAccount)
def read_gl_account(
    *,
    db: Session = Depends(deps.get_db),
    id: int = Path(...),
    current_user: models.User = Depends(deps.get_current_tenant_user),
    _: bool = Depends(check_permissions([Permission.GL_ACCOUNT_READ])),
) -> Any:
    """
    Get specific GL account by ID, enforcing tenant isolation.
    """
    # Tenant isolation happens in get() method
    gl_account = crud.gl.gl_account.get(db=db, id=id)
    if not gl_account:
        raise HTTPException(status_code=404, detail="GL account not found")
    
    return gl_account

@router.put("/accounts/{id}", response_model=schemas.GLAccount)
def update_gl_account(
    *,
    db: Session = Depends(deps.get_db),
    i

jibu7: create a file called "week2_implementation.md" giving full instructions how to implement "authentication and middleware changes in Week 2 to properly enforce multi-tenant isolation."

GitHub Copilot: I'll create a comprehensive guide for Week 2 implementation of authentication and middleware changes to enforce multi-tenant isolation.

### [week2_implementation.md](vscode-remote://wsl/home/ubuntu24/proj/biwi/week2_implementation.md)

```markdown
# Week 2: Authentication and Middleware Implementation for Multi-Tenant Isolation

This document outlines the implementation steps for Week 2 of the multi-tenant migration, focusing on authentication and middleware changes to properly enforce tenant isolation.

## Table of Contents

1. [Overview](#overview)
2. [Day 1: Tenant Context System](#day-1-tenant-context-system)
3. [Day 2: Authentication System Updates](#day-2-authentication-system-updates)
4. [Day 3: Middleware Implementation](#day-3-middleware-implementation)
5. [Day 4: API Route Protection](#day-4-api-route-protection)
6. [Day 5: CRUD Operations Update](#day-5-crud-operations-update)
7. [Day 6: Frontend Authentication Updates](#day-6-frontend-authentication-updates)
8. [Day 7: Testing and Validation](#day-7-testing-and-validation)
9. [Troubleshooting](#troubleshooting)

## Overview

After completing Week 1's database migrations, we now need to modify the application logic to enforce tenant isolation. This includes:

- Creating a tenant context system
- Updating authentication to handle platform admins
- Implementing tenant isolation middleware
- Protecting API routes based on tenant context
- Updating CRUD operations to respect tenant boundaries
- Modifying frontend authentication to support tenant switching

## Day 1: Tenant Context System

The tenant context system will track the current tenant (company) throughout the request lifecycle.

### 1.1 Create Tenant Context Module

```python
# filepath: backend/app/core/tenant_context.py

from typing import Optional
from contextvars import ContextVar
from fastapi import HTTPException, status

# Create a context variable to store the current tenant ID
current_tenant_id: ContextVar[Optional[int]] = ContextVar('current_tenant_id', default=None)

def get_current_tenant_id() -> Optional[int]:
    """Get the current tenant ID from context."""
    return current_tenant_id.get()

def set_tenant_id(tenant_id: Optional[int]) -> None:
    """Set the current tenant ID in context."""
    current_tenant_id.set(tenant_id)

def reset_tenant_id() -> None:
    """Reset the tenant ID to None."""
    current_tenant_id.set(None)

def require_tenant() -> int:
    """Get current tenant ID, raising an exception if none is set."""
    tenant_id = get_current_tenant_id()
    if tenant_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tenant context required for this operation"
        )
    return tenant_id
```

### 1.2 Create Platform Context Module

```python
# filepath: backend/app/core/platform_context.py

from contextvars import ContextVar
from typing import Optional

# Track if the current request is from a platform admin
is_platform_admin: ContextVar[bool] = ContextVar('is_platform_admin', default=False)

# Track target company_id for impersonation scenarios
target_company_id: ContextVar[Optional[int]] = ContextVar('target_company_id', default=None)

def set_platform_admin_context(is_admin: bool = True) -> None:
    """Set the platform admin context flag."""
    is_platform_admin.set(is_admin)

def is_in_platform_admin_context() -> bool:
    """Check if the current context is platform admin."""
    return is_platform_admin.get()

def set_target_company(company_id: Optional[int]) -> None:
    """Set the target company ID for platform admin operations."""
    target_company_id.set(company_id)

def get_target_company() -> Optional[int]:
    """Get the target company ID if set."""
    return target_company_id.get()

def reset_platform_context() -> None:
    """Reset platform context variables."""
    set_platform_admin_context(False)
    set_target_company(None)
```

### 1.3 Create Context Manager for Tenant Operations

```python
# filepath: backend/app/core/context_managers.py

from contextlib import contextmanager
from app.core.tenant_context import set_tenant_id, reset_tenant_id
from app.core.platform_context import set_target_company, reset_platform_context

@contextmanager
def tenant_context(tenant_id: int):
    """Context manager for operating in a specific tenant context."""
    previous_tenant = None
    try:
        # Store previous value if we need to restore it
        try:
            from app.core.tenant_context import get_current_tenant_id
            previous_tenant = get_current_tenant_id()
        except:
            pass
            
        # Set the tenant ID for operations within this context
        set_tenant_id(tenant_id)
        yield
    finally:
        # Restore previous context or reset
        if previous_tenant is not None:
            set_tenant_id(previous_tenant)
        else:
            reset_tenant_id()

@contextmanager
def platform_admin_context(target_company_id: int = None):
    """Context manager for platform admin operations."""
    try:
        from app.core.platform_context import set_platform_admin_context
        set_platform_admin_context(True)
        if target_company_id:
            set_target_company(target_company_id)
        yield
    finally:
        reset_platform_context()
```

## Day 2: Authentication System Updates

### 2.1 Update Token Generation and Validation

```python
# filepath: backend/app/core/security.py

from datetime import datetime, timedelta
from typing import Any, Dict, Optional, Union
from jose import jwt
from passlib.context import CryptContext
from app.core.config import settings
from app.models.core import UserType

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Additional imports
from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.database.database import get_db
from app.models.core import User
from app.core.tenant_context import set_tenant_id
from app.core.platform_context import set_platform_admin_context, set_target_company

# ...existing code...

def create_access_token(
    subject: Union[str, Any], 
    user_type: UserType,
    company_id: Optional[int] = None,
    expires_delta: timedelta = None,
    additional_claims: Dict[str, Any] = None,
) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    # Base JWT claims
    to_encode = {
        "exp": expire, 
        "sub": str(subject),
        "user_type": user_type,
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

# ...existing code...

# Update the get_current_user function
async def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")),
    x_target_company_id: Optional[int] = None,
) -> User:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )

    user = db.query(User).filter(User.id == token_data.sub).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    # Handle tenant context
    user_type = getattr(user, "user_type", UserType.COMPANY_USER)
    
    # Set tenant context based on user type
    if user_type == UserType.PLATFORM_ADMIN:
        # Platform admin - set context flag
        set_platform_admin_context(True)
        
        # Handle target company header for impersonation
        if x_target_company_id is not None:
            # Verify the target company exists
            from app.models.core import Company
            target_company = db.query(Company).get(x_target_company_id)
            if not target_company:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Target company with ID {x_target_company_id} not found",
                )
            
            # Set target company for impersonation
            set_target_company(x_target_company_id)
            set_tenant_id(x_target_company_id)
            
            # Log platform admin impersonation
            from app.models.core import PlatformAuditLog
            db.add(PlatformAuditLog(
                user_id=user.id,
                company_id=x_target_company_id,
                action="company_impersonation",
                details={"company_id": x_target_company_id}
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
```

### 2.2 Create Platform Admin Authentication Endpoints

```python
# filepath: backend/app/api/v1/endpoints/platform_auth.py

from typing import Any
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.core import User, UserType
from app.core.security import (
    create_access_token, 
    get_password_hash, 
    verify_password
)
from app.core.config import settings
from app.schemas.token import Token
from app.models.core import PlatformAuditLog
from pydantic import BaseModel

router = APIRouter()

class PlatformLoginForm(BaseModel):
    username: str
    password: str
    otp_code: str = None  # For MFA

@router.post("/platform-login", response_model=Token)
def platform_login(
    db: Session = Depends(get_db),
    form_data: PlatformLoginForm = None,
    oauth_form: OAuth2PasswordRequestForm = Depends(),
) -> Any:
    """
    Platform admin login endpoint with MFA support
    """
    # Use either form data or OAuth form
    username = form_data.username if form_data else oauth_form.username
    password = form_data.password if form_data else oauth_form.password
    otp_code = getattr(form_data, "otp_code", None)
    
    # Authenticate the user
    user = db.query(User).filter(User.email == username).first()
    if not user or not verify_password(password, user.hashed_password):
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
            details={"ip_address": "client_ip"}  # You'd get this from the request
        ))
        db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized for platform access",
        )
    
    # Check MFA if enabled
    if user.mfa_secret and not otp_code:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="MFA code required",
            headers={"X-MFA-Required": "true"},
        )
    
    if user.mfa_secret and otp_code:
        # Verify MFA code
        import pyotp
        totp = pyotp.TOTP(user.mfa_secret)
        if not totp.verify(otp_code):
            # Log failed MFA attempt
            db.add(PlatformAuditLog(
                user_id=user.id,
                action="failed_mfa_attempt",
                details={"ip_address": "client_ip"}
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
        details={"ip_address": "client_ip"}
    ))
    db.commit()
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "is_platform_admin": True
    }

@router.post("/platform/mfa/setup", response_model=dict)
def setup_mfa(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Setup MFA for platform admin
    """
    # Verify user is a platform admin
    if current_user.user_type != UserType.PLATFORM_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized for platform access",
        )
    
    # Generate MFA secret
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
        issuer_name="BiwiERP Platform"
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
    
    # Don't save the secret yet - user needs to confirm it works
    
    return {
        "secret": secret,
        "qr_code": f"data:image/png;base64,{qr_base64}",
    }

@router.post("/platform/mfa/confirm", response_model=dict)
def confirm_mfa(
    code: str,
    secret: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Confirm MFA setup by verifying the provided code
    """
    # Verify user is a platform admin
    if current_user.user_type != UserType.PLATFORM_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized for platform access",
        )
    
    # Verify the code
    import pyotp
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
        details={"ip_address": "client_ip"}
    ))
    db.commit()
    
    return {"status": "MFA setup completed successfully"}

@router.post("/platform/mfa/disable", response_model=dict)
def disable_mfa(
    code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Disable MFA for platform admin
    """
    # Verify user is a platform admin
    if current_user.user_type != UserType.PLATFORM_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized for platform access",
        )
    
    # Make sure MFA is enabled
    if not current_user.mfa_secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MFA is not enabled",
        )
    
    # Verify the code
    import pyotp
    totp = pyotp.TOTP(current_user.mfa_secret)
    if not totp.verify(code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code",
        )
    
    # Disable MFA
    current_user.mfa_secret = None
    db.commit()
    
    # Log MFA disable
    db.add(PlatformAuditLog(
        user_id=current_user.id,
        action="mfa_disabled",
        details={"ip_address": "client_ip"}
    ))
    db.commit()
    
    return {"status": "MFA disabled successfully"}
```

### 2.3 Update Regular Authentication Endpoint

```python
# filepath: backend/app/api/v1/endpoints/auth.py

from datetime import timedelta
from typing import Any

from fastapi import APIRouter, Body, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.api import deps
from app.core import security
from app.core.config import settings
from app.database.database import get_db
from app.models.core import User, UserType
from app.schemas.token import Token

# ...existing code...

@router.post("/login", response_model=Token)
def login_access_token(
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    user = crud.user.authenticate(
        db, email=form_data.username, password=form_data.password
    )
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Get company_id based on user type
    company_id = None
    if user.user_type != UserType.PLATFORM_ADMIN:
        company_id = user.company_id
    
    # Create token with user type and company information
    token = security.create_access_token(
        user.id, 
        user_type=user.user_type,
        company_id=company_id,
        expires_delta=access_token_expires
    )
    
    # Update last login time
    user.last_login = datetime.utcnow()
    db.commit()
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "is_platform_admin": user.user_type == UserType.PLATFORM_ADMIN
    }

# ...existing code...
```

### 2.4 Update Main Router to Include Platform Auth

```python
# filepath: backend/app/api/v1/api.py

from fastapi import APIRouter

from app.api.v1.endpoints import auth, users, utils, gl, ar, ap, inventory, oe
from app.api.v1.endpoints import platform_auth  # New import

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(platform_auth.router, tags=["platform"])  # Add platform auth
# ...existing code...
```

## Day 3: Middleware Implementation

### 3.1 Create Tenant Isolation Middleware

```python
# filepath: backend/app/middleware/tenant_isolation.py

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
import logging
from app.core.tenant_context import get_current_tenant_id, reset_tenant_id
from app.core.platform_context import reset_platform_context
from jose import jwt, JWTError
from app.core.config import settings
from app.models.core import UserType

logger = logging.getLogger(__name__)

class TenantIsolationMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Reset context for each request
        reset_tenant_id()
        reset_platform_context()
        
        # Skip tenant extraction for certain paths
        if self._should_skip_tenant_extraction(request.url.path):
            return await call_next(request)
        
        # Extract tenant ID from token if present
        authorization = request.headers.get("Authorization")
        if authorization and authorization.startswith("Bearer "):
            token = authorization.replace("Bearer ", "")
            
            try:
                payload = jwt.decode(
                    token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
                )
                
                # Check for impersonation via header
                target_company_id = request.headers.get("X-Target-Company-ID")
                
                # Handle based on user type
                user_type = payload.get("user_type")
                
                # If platform admin and impersonating, log this
                if user_type == UserType.PLATFORM_ADMIN and target_company_id:
                    logger.info(f"Platform admin impersonating company {target_company_id}")
                    # Note: The actual context setting happens in the get_current_user dependency
                
            except JWTError:
                # If token is invalid, let the auth system handle it later
                pass
        
        # Add tenant_id to request state for access in route handlers
        # This will be populated by the authentication dependency
        
        try:
            response = await call_next(request)
            return response
        except Exception as e:
            logger.exception("Error processing request with tenant context")
            return JSONResponse(
                status_code=500,
                content={"detail": "Internal server error"},
            )
    
    def _should_skip_tenant_extraction(self, path: str) -> bool:
        """Determine if tenant extraction should be skipped for this path."""
        # Always skip for auth endpoints and docs
        skip_paths = [
            "/api/v1/auth/login",
            "/api/v1/platform-login",
            "/docs",
            "/redoc",
            "/openapi.json",
        ]
        
        return any(path.startswith(skip_p) for skip_p in skip_paths)
```

### 3.2 Create Audit Logging Middleware

```python
# filepath: backend/app/middleware/audit_logging.py

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import logging
import time
import json
from typing import Optional
from app.core.tenant_context import get_current_tenant_id
from app.core.platform_context import is_in_platform_admin_context
from app.database.database import SessionLocal
from app.models.core import PlatformAuditLog

logger = logging.getLogger(__name__)

class AuditLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        # Start timer for request duration
        start_time = time.time()
        
        # Skip audit logging for certain paths
        if self._should_skip_audit_logging(request.url.path):
            return await call_next(request)
        
        # Extract request details
        method = request.method
        path = request.url.path
        query_params = dict(request.query_params)
        
        # Try to extract body for certain operations (POST, PUT, PATCH)
        body = None
        if method in ["POST", "PUT", "PATCH"]:
            try:
                # Make a copy of the request body to avoid consuming it
                body_bytes = await request.body()
                request._body = body_bytes  # Save for later consumption
                
                # Try to parse as JSON if possible
                try:
                    body = json.loads(body_bytes.decode())
                    # Redact sensitive fields
                    if body and isinstance(body, dict):
                        if "password" in body:
                            body["password"] = "***REDACTED***"
                        if "hashed_password" in body:
                            body["hashed_password"] = "***REDACTED***"
                except:
                    body = {"raw_size_bytes": len(body_bytes)}
            except:
                pass
        
        # Process the request
        try:
            response = await call_next(request)
            status_code = response.status_code
            success = 200 <= status_code < 400
        except Exception as e:
            logger.exception("Error processing request")
            success = False
            status_code = 500
            raise e
        finally:
            # Only log platform admin operations and sensitive operations
            if is_in_platform_admin_context() or self._is_sensitive_operation(method, path):
                duration = time.time() - start_time
                
                # Extract user ID from request state if available
                user_id = getattr(request.state, "user_id", None)
                company_id = get_current_tenant_id()
                
                # Create audit log entry
                try:
                    # For platform admin operations, log to the database
                    if is_in_platform_admin_context():
                        self._log_to_database(
                            user_id=user_id,
                            company_id=company_id,
                            action=f"{method} {path}",
                            resource_type=self._extract_resource_type(path),
                            details={
                                "query_params": query_params,
                                "body": body,
                                "status_code": status_code,
                                "success": success,
                                "duration_ms": round(duration * 1000),
                                "ip_address": self._get_client_ip(request)
                            }
                        )
                except Exception as e:
                    logger.exception("Error logging audit information")
        
        return response
    
    def _should_skip_audit_logging(self, path: str) -> bool:
        """Determine if audit logging should be skipped for this path."""
        # Skip for docs, static files, health checks
        skip_paths = [
            "/docs",
            "/redoc",
            "/openapi.json",
            "/static",
            "/health",
        ]
        
        return any(path.startswith(skip_p) for skip_p in skip_paths)
    
    def _is_sensitive_operation(self, method: str, path: str) -> bool:
        """Determine if an operation is sensitive and should be logged."""
        # Log all write operations
        if method in ["POST", "PUT", "PATCH", "DELETE"]:
            return True
        
        # Log reads of sensitive resources
        sensitive_resources = [
            "/api/v1/users",
            "/api/v1/companies",
            "/api/v1/roles",
            "/api/v1/platform",
        ]
        
        return any(path.startswith(res) for res in sensitive_resources)
    
    def _extract_resource_type(self, path: str) -> Optional[str]:
        """Extract the resource type from the path."""
        parts = path.strip('/').split('/')
        if len(parts) >= 3 and parts[0] == "api" and parts[1] == "v1":
            return parts[2]
        return None
    
    def _get_client_ip(self, request: Request) -> str:
        """Get client IP from request."""
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        return request.client.host if request.client else "unknown"
    
    def _log_to_database(
        self, 
        user_id: Optional[int], 
        company_id: Optional[int],
        action: str,
        resource_type: Optional[str],
        details: dict
    ) -> None:
        """Log platform admin action to database."""
        try:
            db = SessionLocal()
            db.add(PlatformAuditLog(
                user_id=user_id,
                company_id=company_id,
                action=action,
                resource_type=resource_type,
                details=details,
                ip_address=details.get("ip_address")
            ))
            db.commit()
        except Exception as e:
            logger.exception(f"Failed to log to database: {e}")
        finally:
            db.close()
```

### 3.3 Register Middleware in Main Application

```python
# filepath: backend/app/main.py

from fastapi import FastAPI, Request
from starlette.middleware.cors import CORSMiddleware

from app.api.v1.api import api_router
from app.core.config import settings

# Import middleware
from app.middleware.tenant_isolation import TenantIsolationMiddleware
from app.middleware.audit_logging import AuditLoggingMiddleware

app = FastAPI(
    title=settings.PROJECT_NAME, openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set all CORS enabled origins
# ...existing code...

# Add custom middleware
app.add_middleware(TenantIsolationMiddleware)
app.add_middleware(AuditLoggingMiddleware)

# ...existing code...

app.include_router(api_router, prefix=settings.API_V1_STR)

# ...existing code...
```

## Day 4: API Route Protection

### 4.1 Create Custom Dependencies for Tenant Protection

```python
# filepath: backend/app/api/deps.py

from typing import Generator, Optional
from fastapi import Depends, HTTPException, Security, status, Header
from fastapi.security import OAuth2PasswordBearer, SecurityScopes
from sqlalchemy.orm import Session
from jose import jwt
from pydantic import ValidationError

from app.database.database import SessionLocal
from app.core.config import settings
from app.core.security import get_current_user as security_get_current_user
from app.core.tenant_context import get_current_tenant_id, require_tenant
from app.core.platform_context import is_in_platform_admin_context, get_target_company
from app.models.core import User, UserType

# ...existing code...

def get_db() -> Generator:
    """Get database session."""
    try:
        db = SessionLocal()
        yield db
    finally:
        db.close()

def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")),
    x_target_company_id: Optional[int] = Header(None),
) -> User:
    """Get the current authenticated user with tenant context setup."""
    return security_get_current_user(db, token, x_target_company_id)

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
```

### 4.2 Create Permission Helper

```python
# filepath: backend/app/core/permissions.py

from enum import Enum, auto
from typing import List, Optional
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.core import User, Role, UserRole
from app.core.tenant_context import get_current_tenant_id
from app.api.deps import get_current_active_user
from app.core.platform_context import is_in_platform_admin_context

class Permission(str, Enum):
    # Company management
    COMPANY_CREATE = "company:create"
    COMPANY_READ = "company:read"
    COMPANY_UPDATE = "company:update"
    COMPANY_DELETE = "company:delete"
    
    # User management
    USER_CREATE = "user:create"
    USER_READ = "user:read"
    USER_UPDATE = "user:update"
    USER_DELETE = "user:delete"
    
    # ... other permissions ...

def check_permissions(required_permissions: List[Permission]):
    """
    Dependency to check if the current user has the required permissions.
    Platform admins automatically have all permissions.
    """
    def _check_permissions(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_active_user),
    ):
        # Platform admins have all permissions
        if is_in_platform_admin_context() or current_user.is_superuser:
            return True
        
        # Get tenant ID from context
        tenant_id = get_current_tenant_id()
        if not tenant_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tenant context available",
            )
        
        # Get user's roles for the current tenant
        user_roles = db.query(UserRole).filter(
            UserRole.user_id == current_user.id
        ).all()
        
        role_ids = [ur.role_id for ur in user_roles]
        
        # Get the roles to check permissions
        roles = db.query(Role).filter(
            Role.id.in_(role_ids),
            Role.company_id == tenant_id,
        ).all()
        
        # Check if any of the roles have the required permissions
        user_permissions = set()
        for role in roles:
            if role.permissions:
                user_permissions.update(role.permissions)
        
        # Check if user has all required permissions
        missing_permissions = [
            p for p in required_permissions if p.value not in user_permissions
        ]
        
        if missing_permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Missing required permissions: {', '.join([p.value for p in missing_permissions])}",
            )
        
        return True
    
    return _check_permissions
```

### 4.3 Example Protected Platform Routes

```python
# filepath: backend/app/api/v1/endpoints/platform.py

from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
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
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_platform_admin),
) -> Any:
    """
    Get all companies (platform admin only).
    """
    companies = db.query(Company).offset(skip).limit(limit).all()
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
    db_company = db.query(Company).filter(
        (Company.name == company_in.name) | (Company.code == company_in.code)
    ).first()
    if db_company:
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
    
    # Initialize company data (in a background task in production)
    with tenant_context(db_company.id):
        # Set up default GL accounts
        # Set up default fiscal year
        # Set up default roles
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
    company = db.query(Company).get(company_id)
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
    company = db.query(Company).get(company_id)
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
    if not company:
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

@router.post("/companies/{company_id}/activate", response_model=CompanySchema)
def activate_company(
    company_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_platform_admin),
) -> Any:
    """
    Activate a suspended company (platform admin only).
    """
    company = db.query(Company).get(company_id)
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found",
        )
    
    company.subscription_status = SubscriptionStatus.ACTIVE
    db.commit()
    
    # Log company activation
    db.add(PlatformAuditLog(
        user_id=current_user.id,
        company_id=company.id,
        action="company_activated",
        resource_type="company",
        resource_id=company.id,
        details={}
    ))
    db.commit()
    
    return company

@router.get("/audit-logs", response_model=List[dict])
def get_audit_logs(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    company_id: Optional[int] = None,
    user_id: Optional[int] = None,
    action: Optional[str] = None,
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
        query = query.filter(PlatformAuditLog.action == action)
    
    # Sort by timestamp descending
    query = query.order_by(PlatformAuditLog.timestamp.desc())
    
    # Pagination
    logs = query.offset(skip).limit(limit).all()
    
    # Convert to dict for response (helps with JSONB fields)
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
```

### 4.4 Add Platform Routes to API Router

```python
# filepath: backend/app/api/v1/api.py

from fastapi import APIRouter

from app.api.v1.endpoints import auth, users, utils, gl, ar, ap, inventory, oe
from app.api.v1.endpoints import platform_auth, platform

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(platform_auth.router, tags=["platform-auth"])
api_router.include_router(platform.router, prefix="/platform", tags=["platform"])
# ...existing code...
```

## Day 5: CRUD Operations Update

### 5.1 Create Base CRUD Class with Tenant Isolation

```python
# filepath: backend/app/crud/base.py

from typing import Any, Dict, Generic, List, Optional, Type, TypeVar, Union
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.database.database import Base
from app.core.tenant_context import get_current_tenant_id

ModelType = TypeVar("ModelType", bound=Base)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)

class CRUDBase(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    def __init__(self, model: Type[ModelType]):
        """
        CRUD object with tenant isolation.
        
        Args:
            model: The SQLAlchemy model class
        """
        self.model = model
        self.has_company_id = hasattr(model, "company_id")
    
    def get(self, db: Session, id: Any) -> Optional[ModelType]:
        """
        Get a record by ID, respecting tenant isolation.
        """
        query = db.query(self.model).filter(self.model.id == id)
        
        # Apply tenant filtering if model has company_id
        if self.has_company_id:
            tenant_id = get_current_tenant_id()
            if tenant_id:
                query = query.filter(self.model.company_id == tenant_id)
        
        return query.first()
    
    def get_multi(
        self, db: Session, *, skip: int = 0, limit: int = 100
    ) -> List[ModelType]:
        """
        Get multiple records, respecting tenant isolation.
        """
        query = db.query(self.model)
        
        # Apply tenant filtering if model has company_id
        if self.has_company_id:
            tenant_id = get_current_tenant_id()
            if tenant_id:
                query = query.filter(self.model.company_id == tenant_id)
        
        return query.offset(skip).limit(limit).all()
    
    def create(self, db: Session, *, obj_in: CreateSchemaType) -> ModelType:
        """
        Create new record with tenant ID.
        """
        obj_in_data = jsonable_encoder(obj_in)
        db_obj = self.model(**obj_in_data)
        
        # Add company_id if model has it
        if self.has_company_id:
            tenant_id = get_current_tenant_id()
            if tenant_id and not getattr(db_obj, "company_id", None):
                db_obj.company_id = tenant_id
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def update(
        self,
        db: Session,
        *,
        db_obj: ModelType,
        obj_in: Union[UpdateSchemaType, Dict[str, Any]]
    ) -> ModelType:
        """
        Update a record, ensuring it belongs to current tenant.
        """
        # Check tenant isolation
        if self.has_company_id:
            tenant_id = get_current_tenant_id()
            if tenant_id and db_obj.company_id != tenant_id:
                raise ValueError("Cannot update object from different tenant")
        
        # Update object
        obj_data = jsonable_encoder(db_obj)
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.dict(exclude_unset=True)
        
        # Prevent company_id modification
        if "company_id" in update_data and self.has_company_id:
            tenant_id = get_current_tenant_id()
            if tenant_id and update_data["company_id"] != tenant_id:
                raise ValueError("Cannot change company_id to different tenant")
        
        # Apply updates
        for field in obj_data:
            if field in update_data:
                setattr(db_obj, field, update_data[field])
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def remove(self, db: Session, *, id: int) -> ModelType:
        """
        Delete a record, ensuring it belongs to current tenant.
        """
        obj = self.get(db, id=id)
        if not obj:
            return None
        
        # Check tenant isolation
        if self.has_company_id:
            tenant_id = get_current_tenant_id()
            if tenant_id and obj.company_id != tenant_id:
                raise ValueError("Cannot delete object from different tenant")
        
        db.delete(obj)
        db.commit()
        return obj
    
    def exists(self, db: Session, *, id: int) -> bool:
        """
        Check if a record exists, respecting tenant isolation.
        """
        query = db.query(self.model).filter(self.model.id == id)
        
        # Apply tenant filtering if model has company_id
        if self.has_company_id:
            tenant_id = get_current_tenant_id()
            if tenant_id:
                query = query.filter(self.model.company_id == tenant_id)
        
        return db.query(query.exists()).scalar()
    
    def count(self, db: Session) -> int:
        """
        Count records, respecting tenant isolation.
        """
        query = db.query(self.model)
        
        # Apply tenant filtering if model has company_id
        if self.has_company_id:
            tenant_id = get_current_tenant_id()
            if tenant_id:
                query = query.filter(self.model.company_id == tenant_id)
        
        return query.count()
    
    def get_by_field(
        self, db: Session, *, field: str, value: Any
    ) -> Optional[ModelType]:
        """
        Get record by arbitrary field, respecting tenant isolation.
        """
        query = db.query(self.model).filter(getattr(self.model, field) == value)
        
        # Apply tenant filtering if model has company_id
        if self.has_company_id:
            tenant_id = get_current_tenant_id()
            if tenant_id:
                query = query.filter(self.model.company_id == tenant_id)
        
        return query.first()
    
    def get_multi_by_filter(
        self, db: Session, *, filters: Dict[str, Any], skip: int = 0, limit: int = 100
    ) -> List[ModelType]:
        """
        Get records by multiple filters, respecting tenant isolation.
        """
        query = db.query(self.model)
        
        # Apply provided filters
        for field, value in filters.items():
            if hasattr(self.model, field):
                query = query.filter(getattr(self.model, field) == value)
        
        # Apply tenant filtering if model has company_id
        if self.has_company_id:
            tenant_id = get_current_tenant_id()
            if tenant_id:
                query = query.filter(self.model.company_id == tenant_id)
        
        return query.offset(skip).limit(limit).all()
```

### 5.2 Update Example CRUD Module (GL Accounts)

```python
# filepath: backend/app/crud/gl.py

from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from app.crud.base import CRUDBase
from app.models.gl import GLAccount, GLJournalEntry, GLJournalEntryLine
from app.schemas.gl import (
    GLAccountCreate, 
    GLAccountUpdate, 
    GLJournalEntryCreate,
    GLJournalEntryUpdate
)
from app.core.tenant_context import get_current_tenant_id

class CRUDGLAccount(CRUDBase[GLAccount, GLAccountCreate, GLAccountUpdate]):
    def get_by_code(self, db: Session, *, code: str) -> Optional[GLAccount]:
        """Get GL account by code within current tenant."""
        tenant_id = get_current_tenant_id()
        return db.query(GLAccount).filter(
            and_(
                GLAccount.account_code == code,
                GLAccount.company_id == tenant_id
            )
        ).first()
    
    def get_all_active(self, db: Session, *, skip: int = 0, limit: int = 100) -> List[GLAccount]:
        """Get all active GL accounts for current tenant."""
        tenant_id = get_current_tenant_id()
        return db.query(GLAccount).filter(
            and_(
                GLAccount.is_active == True,
                GLAccount.company_id == tenant_id
            )
        ).order_by(GLAccount.account_code).offset(skip).limit(limit).all()
    
    def create_with_tenant(self, db: Session, *, obj_in: GLAccountCreate) -> GLAccount:
        """Create GL account with current tenant ID."""
        tenant_id = get_current_tenant_id()
        
        # Check for duplicate account code
        existing = self.get_by_code(db, code=obj_in.account_code)
        if existing:
            raise ValueError(f"Account code {obj_in.account_code} already exists")
        
        db_obj = GLAccount(
            company_id=tenant_id,
            account_code=obj_in.account_code,
            account_name=obj_in.account_name,
            account_type=obj_in.account_type,
            description=obj_in.description,
            is_active=obj_in.is_active,
            parent_account_id=obj_in.parent_account_id,
            balance_sheet_section=obj_in.balance_sheet_section,
            income_statement_section=obj_in.income_statement_section,
            allow_manual_entries=obj_in.allow_manual_entries,
        )
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

class CRUDGLJournalEntry(CRUDBase[GLJournalEntry, GLJournalEntryCreate, GLJournalEntryUpdate]):
    def create_with_lines(self, db: Session, *, obj_in: GLJournalEntryCreate) -> GLJournalEntry:
        """
        Create journal entry with lines, enforcing tenant isolation for all accounts.
        """
        tenant_id = get_current_tenant_id()
        
        # Create the journal entry
        db_obj = GLJournalEntry(
            company_id=tenant_id,
            entry_date=obj_in.entry_date,
            posting_date=obj_in.posting_date,
            reference=obj_in.reference,
            source=obj_in.source,
            memo=obj_in.memo,
            status=obj_in.status,
            currency_code=obj_in.currency_code,
            exchange_rate=obj_in.exchange_rate,
        )
        
        db.add(db_obj)
        db.flush()  # Get ID without committing
        
        # Process journal lines
        total_debit = 0
        total_credit = 0
        
        for line in obj_in.lines:
            # Verify account belongs to current tenant
            account = db.query(GLAccount).filter(
                and_(
                    GLAccount.id == line.account_id,
                    GLAccount.company_id == tenant_id
                )
            ).first()
            
            if not account:
                db.rollback()
                raise ValueError(f"Account ID {line.account_id} not found or not accessible")
            
            # Create journal line
            journal_line = GLJournalEntryLine(
                journal_entry_id=db_obj.id,
                account_id=line.account_id,
                debit_amount=line.debit_amount,
                credit_amount=line.credit_amount,
                memo=line.memo,
                reference=line.reference,
            )
            
            db.add(journal_line)
            
            # Track totals
            total_debit += line.debit_amount
            total_credit += line.credit_amount
        
        # Verify balanced entry
        if round(total_debit, 2) != round(total_credit, 2):
            db.rollback()
            raise ValueError(f"Journal entry not balanced: Debit {total_debit} != Credit {total_credit}")
        
        db_obj.total_amount = total_debit
        
        db.commit()
        db.refresh(db_obj)
        return db_obj

gl_account = CRUDGLAccount(GLAccount)
gl_journal_entry = CRUDGLJournalEntry(GLJournalEntry)
```

### 5.3 Example API Endpoint with Tenant Isolation

```python
# filepath: backend/app/api/v1/endpoints/gl.py

from typing import Any, List
from fastapi import APIRouter, Body, Depends, HTTPException, Path, Query
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.api import deps
from app.core.permissions import Permission, check_permissions
from app.core.tenant_context import require_tenant

router = APIRouter()

@router.get("/accounts", response_model=List[schemas.GLAccount])
def read_gl_accounts(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    is_active: bool = Query(True),
    current_user: models.User = Depends(deps.get_current_tenant_user),
    _: bool = Depends(check_permissions([Permission.GL_ACCOUNT_READ])),
) -> Any:
    """
    Retrieve GL accounts for current tenant.
    """
    # Tenant isolation is applied automatically in CRUD methods
    if is_active:
        gl_accounts = crud.gl.gl_account.get_all_active(db, skip=skip, limit=limit)
    else:
        gl_accounts = crud.gl.gl_account.get_multi(db, skip=skip, limit=limit)
    
    return gl_accounts

@router.post("/accounts", response_model=schemas.GLAccount)
def create_gl_account(
    *,
    db: Session = Depends(deps.get_db),
    account_in: schemas.GLAccountCreate,
    current_user: models.User = Depends(deps.get_current_tenant_user),
    _: bool = Depends(check_permissions([Permission.GL_ACCOUNT_CREATE])),
) -> Any:
    """
    Create new GL account for current tenant.
    """
    try:
        gl_account = crud.gl.gl_account.create_with_tenant(db=db, obj_in=account_in)
        return gl_account
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/accounts/{id}", response_model=schemas.GLAccount)
def read_gl_account(
    *,
    db: Session = Depends(deps.get_db),
    id: int = Path(...),
    current_user: models.User = Depends(deps.get_current_tenant_user),
    _: bool = Depends(check_permissions([Permission.GL_ACCOUNT_READ])),
) -> Any:
    """
    Get specific GL account by ID, enforcing tenant isolation.
    """
    # Tenant isolation happens in get() method
    gl_account = crud.gl.gl_account.get(db=db, id=id)
    if not gl_account:
        raise HTTPException(status_code=404, detail="GL account not found")
    
    return gl_account

@router.put("/accounts/{id}", response_model=schemas.GLAccount)
def update_gl_account(
    *,
    db: Session = Depends(deps.get_db),
    i

Similar code found with 2 license types

jibu7: continue but make edits in #file:week2_implementation.md file.

GitHub Copilot: I'll now continue the `week2_implementation.md` file with the remaining sections for days 6 and 7.

### [week2_implementation.md](vscode-remote://wsl/home/ubuntu24/proj/biwi/week2_implementation.md)

```markdown
# Week 2: Authentication and Middleware Implementation for Multi-Tenant Isolation

// ...existing code...

## Day 6: Frontend Authentication Updates

### 6.1 Update Authentication Store

```typescript
// filepath: frontend/src/store/authStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types/user';
import { Company } from '../types/company';

interface AuthState {
  token: string | null;
  user: User | null;
  company: Company | null;
  isPlatformAdmin: boolean;
  loading: boolean;
  initialized: boolean;
  error: string | null;
}

interface AuthActions {
  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  setCompany: (company: Company | null) => void;
  setPlatformAdmin: (isPlatformAdmin: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState: AuthState = {
  token: null,
  user: null,
  company: null,
  isPlatformAdmin: false,
  loading: false,
  initialized: false,
  error: null,
};

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      ...initialState,
      setToken: (token) => set({ token }),
      setUser: (user) => set({ user }),
      setCompany: (company) => set({ company }),
      setPlatformAdmin: (isPlatformAdmin) => set({ isPlatformAdmin }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      reset: () => set(initialState),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        company: state.company,
        isPlatformAdmin: state.isPlatformAdmin,
      }),
    }
  )
);
```

### 6.2 Create Authentication Service with Multi-Tenant Support

```typescript
// filepath: frontend/src/services/authService.ts

import { AxiosError } from 'axios';
import { axiosInstance } from '../lib/axiosInstance';
import { useAuthStore } from '../store/authStore';

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
  is_platform_admin: boolean;
}

interface PlatformLoginCredentials extends LoginCredentials {
  otp_code?: string;
}

export const authService = {
  login: async (credentials: LoginCredentials) => {
    try {
      const response = await axiosInstance.post<LoginResponse>(
        '/api/v1/auth/login',
        new URLSearchParams({
          username: credentials.email,
          password: credentials.password,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
      
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 401) {
        throw new Error('Invalid email or password');
      }
      throw error;
    }
  },
  
  platformLogin: async (credentials: PlatformLoginCredentials) => {
    try {
      const response = await axiosInstance.post<LoginResponse>(
        '/api/v1/platform-login',
        credentials
      );
      
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 401) {
        // Check for MFA required header
        if (axiosError.response.headers['x-mfa-required']) {
          throw new Error('MFA_REQUIRED');
        }
        throw new Error('Invalid email or password');
      }
      throw error;
    }
  },
  
  getCurrentUser: async () => {
    const response = await axiosInstance.get('/api/v1/users/me');
    return response.data;
  },
  
  getCurrentCompany: async () => {
    const response = await axiosInstance.get('/api/v1/companies/current');
    return response.data;
  },
  
  logout: () => {
    useAuthStore.getState().reset();
  },
  
  impersonateCompany: async (companyId: number) => {
    // Set the X-Target-Company-ID header for this request
    const response = await axiosInstance.post(
      `/api/v1/platform/companies/${companyId}/impersonate`
    );
    
    return response.data;
  },
  
  stopImpersonating: async () => {
    const response = await axiosInstance.post('/api/v1/platform/stop-impersonation');
    return response.data;
  }
};
```

### 6.3 Update HTTP Client to Include Tenant Headers

```typescript
// filepath: frontend/src/lib/axiosInstance.ts

import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// Create axios instance
export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token and tenant context
axiosInstance.interceptors.request.use(
  (config) => {
    const { token, company, isPlatformAdmin } = useAuthStore.getState();
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add tenant context for platform admins if they're impersonating a company
    if (isPlatformAdmin && company) {
      config.headers['X-Target-Company-ID'] = company.id.toString();
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      if (window.location.pathname !== '/login' && 
          window.location.pathname !== '/platform-login') {
        useAuthStore.getState().reset();
        window.location.href = '/login';
      }
    }
    
    if (error.response?.status === 403) {
      // Check if we're trying to access company resources without tenant context
      if (error.response.data?.detail?.includes('Target company')) {
        console.error('Tenant context missing in platform admin request');
      }
    }
    
    return Promise.reject(error);
  }
);
```

### 6.4 Create Platform Admin Login Page

```typescript
// filepath: frontend/src/app/platform-login/page.tsx

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';

type FormData = {
  email: string;
  password: string;
  otp_code?: string;
};

const PlatformLoginPage = () => {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();
  const { setToken, setUser, setPlatformAdmin, setLoading, setError } = useAuthStore();
  const [mfaRequired, setMfaRequired] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  
  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      setLoginError(null);
      
      const response = await authService.platformLogin({
        email: data.email,
        password: data.password,
        otp_code: data.otp_code,
      });
      
      setToken(response.access_token);
      setPlatformAdmin(true);
      
      // Fetch user profile
      const user = await authService.getCurrentUser();
      setUser(user);
      
      // Redirect to platform dashboard
      router.push('/platform/dashboard');
    } catch (error) {
      if ((error as Error).message === 'MFA_REQUIRED') {
        setMfaRequired(true);
        setLoginError('Please enter your MFA code');
      } else {
        setLoginError((error as Error).message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Platform Administration</h2>
          <p className="text-gray-400">Log in to access platform controls</p>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-4">
            <label className="block text-gray-300 mb-2">Email Address</label>
            <input
              {...register('email', { required: 'Email is required' })}
              type="email"
              className="w-full px-4 py-2 rounded bg-gray-700 text-white"
              placeholder="admin@example.com"
            />
            {errors.email && (
              <p className="text-red-500 mt-1">{errors.email.message}</p>
            )}
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-300 mb-2">Password</label>
            <input
              {...register('password', { required: 'Password is required' })}
              type="password"
              className="w-full px-4 py-2 rounded bg-gray-700 text-white"
            />
            {errors.password && (
              <p className="text-red-500 mt-1">{errors.password.message}</p>
            )}
          </div>
          
          {mfaRequired && (
            <div className="mb-6">
              <label className="block text-gray-300 mb-2">MFA Code</label>
              <input
                {...register('otp_code', { required: 'MFA code is required' })}
                type="text"
                className="w-full px-4 py-2 rounded bg-gray-700 text-white"
                placeholder="6-digit code"
              />
              {errors.otp_code && (
                <p className="text-red-500 mt-1">{errors.otp_code.message}</p>
              )}
            </div>
          )}
          
          {loginError && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded">
              <p className="text-red-400">{loginError}</p>
            </div>
          )}
          
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 transition-colors"
          >
            Log In
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <a href="/login" className="text-indigo-400 hover:underline">
            Return to company login
          </a>
        </div>
      </div>
    </div>
  );
};

export default PlatformLoginPage;
```

### 6.5 Create Company Context Provider

```typescript
// filepath: frontend/src/contexts/CompanyContext.tsx

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { Company } from '../types/company';
import { axiosInstance } from '../lib/axiosInstance';

interface CompanyContextType {
  currentCompany: Company | null;
  isLoading: boolean;
  error: string | null;
  setCurrentCompany: (company: Company | null) => void;
  fetchCompanyDetails: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const CompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isPlatformAdmin } = useAuthStore();
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchCompanyDetails = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // For platform admin, the currentCompany might be the impersonated one
      // For regular users, it's always their assigned company
      const response = await axiosInstance.get('/api/v1/companies/current');
      setCurrentCompany(response.data);
    } catch (err) {
      setError('Failed to fetch company details');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (user && !isPlatformAdmin) {
      fetchCompanyDetails();
    }
  }, [user, isPlatformAdmin]);
  
  const value = {
    currentCompany,
    isLoading,
    error,
    setCurrentCompany,
    fetchCompanyDetails,
  };
  
  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>;
};

export const useCompanyContext = (): CompanyContextType => {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompanyContext must be used within a CompanyProvider');
  }
  return context;
};
```

### 6.6 Create Tenant-Aware Navigation Component

```typescript
// filepath: frontend/src/components/navigation/MainNavigation.tsx

import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { useCompanyContext } from '../../contexts/CompanyContext';
import Link from 'next/link';

export const MainNavigation = () => {
  const { user, isPlatformAdmin } = useAuthStore();
  const { currentCompany } = useCompanyContext();
  
  // Render platform admin navigation if user is platform admin
  if (isPlatformAdmin) {
    return (
      <nav className="bg-gray-900 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="font-bold text-xl">Platform Admin</span>
              </div>
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  <Link href="/platform/dashboard" className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md">
                    Dashboard
                  </Link>
                  <Link href="/platform/companies" className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md">
                    Companies
                  </Link>
                  <Link href="/platform/users" className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md">
                    Users
                  </Link>
                  <Link href="/platform/audit-logs" className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md">
                    Audit Logs
                  </Link>
                  <Link href="/platform/settings" className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md">
                    Settings
                  </Link>
                </div>
              </div>
            </div>
            
            {/* Company Impersonation Status */}
            {currentCompany && (
              <div className="bg-red-900/60 px-3 py-1 rounded-md flex items-center">
                <span className="text-red-200 mr-2">Impersonating:</span>
                <span className="font-bold">{currentCompany.name}</span>
                <button 
                  onClick={stopImpersonation} 
                  className="ml-3 text-xs bg-red-700 px-2 py-1 rounded hover:bg-red-600"
                >
                  Exit
                </button>
              </div>
            )}
            
            {/* User Profile Dropdown */}
            <div className="ml-4 flex items-center md:ml-6">
              <div className="relative">
                <div>
                  <span className="mr-2">{user?.full_name}</span>
                  <button className="bg-gray-800 p-1 rounded-full">
                    {/* Profile icon */}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>
    );
  }
  
  // Regular tenant user navigation
  return (
    <nav className="bg-blue-800 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="font-bold text-xl">
                {currentCompany?.name || 'Company'}
              </span>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link href="/dashboard" className="text-white hover:bg-blue-700 px-3 py-2 rounded-md">
                  Dashboard
                </Link>
                <Link href="/gl" className="text-blue-200 hover:bg-blue-700 hover:text-white px-3 py-2 rounded-md">
                  General Ledger
                </Link>
                {/* Add other modules here */}
              </div>
            </div>
          </div>
          
          {/* User Profile */}
          <div className="ml-4 flex items-center md:ml-6">
            <div className="relative">
              <div>
                <span className="mr-2">{user?.full_name}</span>
                <button className="bg-blue-700 p-1 rounded-full">
                  {/* Profile icon */}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

// Helper function to stop impersonation
const stopImpersonation = async () => {
  try {
    await authService.stopImpersonating();
    window.location.href = '/platform/dashboard';
  } catch (error) {
    console.error('Failed to stop impersonation:', error);
  }
};
```

## Day 7: Testing and Validation

### 7.1 Create Test Scripts for Multi-Tenant Validation

```python
# filepath: backend/scripts/test_tenant_isolation.py

#!/usr/bin/env python3
import sys
import os
from pathlib import Path
import requests
import json
import argparse
import time

sys.path.append(str(Path(__file__).parent.parent))

class TenantIsolationTester:
    def __init__(self, base_url, verbose=False):
        self.base_url = base_url
        self.verbose = verbose
        self.tokens = {}
        self.success_count = 0
        self.failure_count = 0

    def log(self, message):
        if self.verbose:
            print(message)

    def authenticate_user(self, email, password, platform_admin=False):
        """Authenticate a user and store their token"""
        
        if platform_admin:
            url = f"{self.base_url}/api/v1/platform-login"
            data = {"username": email, "password": password}
            headers = {"Content-Type": "application/json"}
            response = requests.post(url, json=data, headers=headers)
        else:
            url = f"{self.base_url}/api/v1/auth/login"
            data = {"username": email, "password": password}
            headers = {"Content-Type": "application/x-www-form-urlencoded"}
            response = requests.post(url, data=data, headers=headers)
        
        if response.status_code != 200:
            print(f"Authentication failed for {email}: {response.text}")
            return None
        
        token_data = response.json()
        self.tokens[email] = token_data["access_token"]
        return token_data["access_token"]

    def make_request(self, email, endpoint, method="GET", data=None, target_company_id=None):
        """Make a request as a specific user"""
        if email not in self.tokens:
            print(f"No token available for {email}")
            return None
        
        headers = {
            "Authorization": f"Bearer {self.tokens[email]}",
            "Content-Type": "application/json"
        }
        
        if target_company_id:
            headers["X-Target-Company-ID"] = str(target_company_id)
        
        url = f"{self.base_url}{endpoint}"
        self.log(f"Making {method} request to {url} as {email}")
        
        if method == "GET":
            response = requests.get(url, headers=headers)
        elif method == "POST":
            response = requests.post(url, json=data, headers=headers)
        elif method == "PUT":
            response = requests.put(url, json=data, headers=headers)
        elif method == "DELETE":
            response = requests.delete(url, headers=headers)
        else:
            raise ValueError(f"Unsupported method: {method}")
        
        return response

    def run_test(self, name, email, endpoint, method="GET", data=None, target_company_id=None, 
                 expected_status=200, expected_content=None):
        """Run a test case and check results"""
        print(f"Running test: {name}")
        
        response = self.make_request(email, endpoint, method, data, target_company_id)
        if not response:
            self.failure_count += 1
            return False
        
        # Check status code
        status_match = response.status_code == expected_status
        
        # Check content if specified
        content_match = True
        if expected_content and status_match:
            resp_json = response.json()
            for key, value in expected_content.items():
                if key not in resp_json or resp_json[key] != value:
                    content_match = False
                    break
        
        result = status_match and content_match
        
        if result:
            print(f"✓ PASS: {name}")
            self.success_count += 1
        else:
            print(f"✗ FAIL: {name}")
            print(f"  Expected status {expected_status}, got {response.status_code}")
            if expected_content and not content_match:
                print(f"  Content mismatch: {response.text}")
            self.failure_count += 1
        
        return result

    def test_platform_admin_access(self):
        """Test platform admin access to various endpoints"""
        admin_email = "admin@platform.com"
        admin_password = "secure_password"
        
        # Authenticate platform admin
        token = self.authenticate_user(admin_email, admin_password, platform_admin=True)
        if not token:
            return False
        
        # Test accessing platform endpoints
        self.run_test(
            "Platform Admin - List Companies", 
            admin_email, 
            "/api/v1/platform/companies", 
            expected_status=200
        )
        
        # Test accessing company data without target company
        self.run_test(
            "Platform Admin - Access GL Accounts Without Target Company",
            admin_email,
            "/api/v1/gl/accounts",
            expected_status=403
        )
        
        # Test accessing company data with target company
        self.run_test(
            "Platform Admin - Access GL Accounts With Target Company",
            admin_email,
            "/api/v1/gl/accounts",
            target_company_id=1,
            expected_status=200
        )

    def test_tenant_isolation(self):
        """Test tenant isolation between companies"""
        # Authenticate users from different companies
        company1_user = "user1@company1.com"
        company2_user = "user2@company2.com"
        password = "password123"
        
        self.authenticate_user(company1_user, password)
        self.authenticate_user(company2_user, password)
        
        # User 1 creates a GL account
        gl_account_data = {
            "account_code": "TEST001",
            "account_name": "Test Account",
            "account_type": "ASSET",
            "is_active": True
        }
        
        self.run_test(
            "Company 1 - Create GL Account",
            company1_user,
            "/api/v1/gl/accounts",
            method="POST",
            data=gl_account_data,
            expected_status=200
        )
        
        # User 1 can see the account
        self.run_test(
            "Company 1 - View Own GL Account",
            company1_user,
            "/api/v1/gl/accounts?account_code=TEST001",
            expected_status=200
        )
        
        # User 2 cannot see company 1's account
        self.run_test(
            "Company 2 - Cannot See Company 1's GL Account",
            company2_user,
            "/api/v1/gl/accounts?account_code=TEST001",
            expected_status=404  # Or empty list (200 with [])
        )

    def test_cross_tenant_references(self):
        """Test validation of cross-tenant references"""
        company1_user = "user1@company1.com"
        
        # Try to create a sales order with customer from another company
        invalid_order = {
            "customer_id": 999,  # Assuming this ID belongs to company 2
            "order_date": "2023-11-01",
            "lines": [
                {
                    "item_id": 1,
                    "quantity": 1,
                    "unit_price": 100
                }
            ]
        }
        
        self.run_test(
            "Cross-Tenant Reference Validation",
            company1_user,
            "/api/v1/oe/sales-orders",
            method="POST",
            data=invalid_order,
            expected_status=400  # Bad request, should not allow cross-tenant reference
        )

    def run_all_tests(self):
        print("="*50)
        print("MULTI-TENANT ISOLATION TEST SUITE")
        print("="*50)
        
        start_time = time.time()
        
        self.test_platform_admin_access()
        self.test_tenant_isolation()
        self.test_cross_tenant_references()
        
        duration = time.time() - start_time
        
        print("\n" + "="*50)
        print(f"TESTS COMPLETE: {self.success_count} passed, {self.failure_count} failed")
        print(f"Time taken: {duration:.2f} seconds")
        print("="*50)
        
        return self.failure_count == 0

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Test multi-tenant isolation")
    parser.add_argument("--url", default="http://localhost:8000", help="API base URL")
    parser.add_argument("--verbose", "-v", action="store_true", help="Verbose output")
    args = parser.parse_args()
    
    tester = TenantIsolationTester(args.url, args.verbose)
    success = tester.run_all_tests()
    
    sys.exit(0 if success else 1)
```

### 7.2 Create Platform Admin Dashboard and Company List Components

```typescript
// filepath: frontend/src/app/platform/dashboard/page.tsx

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/authStore';
import { platformService } from '../../../services/platformService';

interface CompanyStats {
  id: number;
  name: string;
  code: string;
  userCount: number;
  transactionCount: number;
  lastActivity: string;
  status: string;
  subscription: {
    plan: string;
    expiresAt: string;
    status: string;
  };
}

const PlatformDashboard = () => {
  const { user, isPlatformAdmin } = useAuthStore();
  const router = useRouter();
  const [companies, setCompanies] = useState<CompanyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!isPlatformAdmin) {
      router.push('/login');
      return;
    }
    
    const fetchCompanies = async () => {
      try {
        setLoading(true);
        const data = await platformService.getCompanyStats();
        setCompanies(data);
      } catch (err) {
        setError('Failed to load company statistics');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCompanies();
  }, [isPlatformAdmin, router]);
  
  const handleImpersonate = async (companyId: number) => {
    try {
      await platformService.impersonateCompany(companyId);
      // Redirect to company dashboard
      router.push('/dashboard');
    } catch (err) {
      console.error('Failed to impersonate company:', err);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-8">
          <p>{error}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Retry
        </button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Platform Dashboard</h1>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Companies</h3>
          <p className="text-3xl font-bold">{companies.length}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Active Companies</h3>
          <p className="text-3xl font-bold">{
            companies.filter(c => c.status === 'active').length
          }</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Users</h3>
          <p className="text-3xl font-bold">{
            companies.reduce((sum, company) => sum + company.userCount, 0)
          }</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Transactions</h3>
          <p className="text-3xl font-bold">{
            companies.reduce((sum, company) => sum + company.transactionCount, 0)
          }</p>
        </div>
      </div>
      
      {/* Companies Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <h2 className="text-xl font-semibold p-6 border-b">Companies</h2>
        
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Users</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Activity</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {companies.map((company) => (
              <tr key={company.id}>
                <td className="px-6 py-4 whitespace-nowrap">{company.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{company.code}</td>
                <td className="px-6 py-4 whitespace-nowrap">{company.userCount}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    company.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : company.status === 'suspended' 
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {company.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{company.subscription.plan}</td>
                <td className="px-6 py-4 whitespace-nowrap">{company.lastActivity}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <button
                    onClick={() => handleImpersonate(company.id)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    Impersonate
                  </button>
                  <button
                    onClick={() => router.push(`/platform/companies/${company.id}`)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Details
                  </button>
                </td>
              </tr>
            ))}
            
            {companies.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  No companies found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PlatformDashboard;
```

### 7.3 Create Backend Test for Authentication and Tenant Context

```python
# filepath: backend/app/tests/test_tenant_isolation.py

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.core.security import create_access_token
from app.models.core import Company, User, UserType
from app.core.tenant_context import get_current_tenant_id, set_tenant_id

client = TestClient(app)

def test_tenant_context_middleware(db: Session):
    # Create test companies
    company1 = Company(name="Test Company 1", code="TST1")
    company2 = Company(name="Test Company 2", code="TST2")
    db.add(company1)
    db.add(company2)
    db.flush()
    
    # Create test users
    user1 = User(
        email="user1@example.com",
        hashed_password="hashed_password",
        company_id=company1.id,
        user_type=UserType.COMPANY_USER,
        is_active=True
    )
    user2 = User(
        email="user2@example.com",
        hashed_password="hashed_password",
        company_id=company2.id,
        user_type=UserType.COMPANY_USER,
        is_active=True
    )
    platform_admin = User(
        email="admin@platform.com",
        hashed_password="hashed_password",
        user_type=UserType.PLATFORM_ADMIN,
        is_active=True
    )
    
    db.add(user1)
    db.add(user2)
    db.add(platform_admin)
    db.commit()
    
    # Create tokens
    token1 = create_access_token(user1.id, UserType.COMPANY_USER, company_id=company1.id)
    token2 = create_access_token(user2.id, UserType.COMPANY_USER, company_id=company2.id)
    admin_token = create_access_token(platform_admin.id, UserType.PLATFORM_ADMIN)
    
    # Test user1 has correct tenant context
    response = client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {token1}"}
    )
    assert response.status_code == 200
    assert get_current_tenant_id() is None  # Context is reset after request
    
    # Add a GL account for company 1
    response = client.post(
        "/api/v1/gl/accounts",
        headers={"Authorization": f"Bearer {token1}"},
        json={
            "account_code": "1000",
            "account_name": "Test Account",
            "account_type": "ASSET",
            "is_active": True
        }
    )
    assert response.status_code == 200
    account_id = response.json()["id"]
    
    # Test user1 can see the account
    response = client.get(
        f"/api/v1/gl/accounts/{account_id}",
        headers={"Authorization": f"Bearer {token1}"}
    )
    assert response.status_code == 200
    
    # Test user2 cannot see company1's account
    response = client.get(
        f"/api/v1/gl/accounts/{account_id}",
        headers={"Authorization": f"Bearer {token2}"}
    )
    assert response.status_code == 404
    
    # Test platform admin can see with proper target company
    response = client.get(
        f"/api/v1/gl/accounts/{account_id}",
        headers={
            "Authorization": f"Bearer {admin_token}",
            "X-Target-Company-ID": str(company1.id)
        }
    )
    assert response.status_code == 200
    
    # Test platform admin without target company
    response = client.get(
        f"/api/v1/gl/accounts/{account_id}",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 403  # Forbidden without target company
    
    # Clean up
    db.query(User).filter(User.id.in_([user1.id, user2.id, platform_admin.id])).delete()
    db.query(Company).filter(Company.id.in_([company1.id, company2.id])).delete()
    db.commit()
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Missing Tenant Context

**Symptom:** API calls return 403 errors with message "Tenant context required for this operation"

**Solution:**
- For company users, ensure their token has correct company_id
- For platform admins, ensure X-Target-Company-ID header is set
- Check TenantIsolationMiddleware for proper context extraction

#### 2. Cross-Tenant References

**Symptom:** Creating or updating resources fails with validation errors

**Solution:**
- Run the validation script: `python backend/scripts/validate_tenant_data.py`
- Fix any cross-tenant references using the fix script
- Update CRUD operations to validate that all referenced entities belong to same company

#### 3. Platform Admin MFA Issues

**Symptom:** Platform admins cannot log in after MFA is enabled

**Solution:**
- Temporarily disable MFA in the database: `UPDATE users SET mfa_secret = NULL WHERE id = <admin_id>;`
- Ensure TOTP library is correctly installed: `pip install pyotp`
- Check frontend is sending the correct MFA code format

#### 4. JWT Token Verification Errors

**Symptom:** Valid tokens are being rejected with "Could not validate credentials"

**Solution:**
- Check SECRET_KEY consistency across environments
- Verify token expiration time is adequate
- Confirm algorithm used for encoding/decoding is the same
- Check for clock skew between servers

#### 5. Performance Issues with Tenant Filtering

**Symptom:** API requests become slow after adding tenant isolation

**Solution:**
- Add proper indexes on company_id columns: `CREATE INDEX idx_table_company ON table (company_id);`
- Optimize queries to filter by company_id early
- Consider adding caching with tenant-aware cache keys
- Monitor database query performance with tenant filtering

#### 6. Debugging Tenant Context

To debug tenant context issues, add this temporary endpoint:

```python
@router.get("/debug/tenant-context")
def debug_tenant_context(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """Debug endpoint to check tenant context."""
    from app.core.tenant_context import get_current_tenant_id
    from app.core.platform_context import is_in_platform_admin_context, get_target_company
    
    return {
        "user_id": current_user.id,
        "user_email": current_user.email,
        "user_type": current_user.user_type,
        "company_id": current_user.company_id,
        "current_tenant_id": get_current_tenant_id(),
        "is_platform_admin": is_in_platform_admin_context(),
        "target_company_id": get_target_company()
    }
```

### Support Resources

- **Documentation:** Full API documentation is available at `/docs` endpoint
- **Logs:** Check application logs for detailed error messages
- **Validation:** Run `python backend/scripts/validate_tenant_data.py` regularly
- **Tests:** Run `pytest -xvs app/tests/test_tenant_isolation.py` to verify isolation
```

Similar code found with 1 license type