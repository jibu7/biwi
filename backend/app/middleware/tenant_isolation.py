from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
import logging
from app.core.tenant_context import reset_tenant_id
from app.core.platform_context import reset_platform_context
from jose import jwt, JWTError
from app.config import settings
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
        
        # Extract and log request info for debugging
        logger.debug(f"Processing request: {request.method} {request.url.path}")
        
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
                if user_type == UserType.PLATFORM_ADMIN.value and target_company_id:
                    logger.info(f"Platform admin impersonating company {target_company_id}")
                
                # Log tenant context for debugging
                company_id = payload.get("company_id")
                if company_id:
                    logger.debug(f"Tenant context set: {company_id}")
                
            except JWTError as e:
                logger.debug(f"JWT decode error: {e}")
        
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
        skip_paths = [
            "/api/v1/auth/login",
            "/api/v1/platform/auth/login",
            "/api/v1/platform/auth/login-mfa",
            "/docs",
            "/redoc",
            "/openapi.json",
            "/health",
            "/api/v1/health",
            "/favicon.ico",
            "/static/",
        ]
        
        return any(path.startswith(skip_p) for skip_p in skip_paths)
