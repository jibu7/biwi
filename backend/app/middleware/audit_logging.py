from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import logging
import time
import json
from typing import Optional
from datetime import datetime
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
        
        # Initialize variables
        body = None
        status_code = 500
        success = False
        user_id = None
        
        # Try to extract body for certain operations (POST, PUT, PATCH)
        if method in ["POST", "PUT", "PATCH"]:
            try:
                body_bytes = await request.body()
                
                # Try to parse as JSON if possible
                try:
                    body = json.loads(body_bytes.decode())
                    # Redact sensitive fields
                    if body and isinstance(body, dict):
                        sensitive_fields = ["password", "hashed_password", "mfa_secret", "secret"]
                        for field in sensitive_fields:
                            if field in body:
                                body[field] = "***REDACTED***"
                except:
                    body = {"raw_size_bytes": len(body_bytes)}
            except:
                pass
        
        # Store user_id in request state for logging
        authorization = request.headers.get("Authorization")
        if authorization and authorization.startswith("Bearer "):
            try:
                from jose import jwt
                from app.config import settings
                
                token = authorization.replace("Bearer ", "")
                payload = jwt.decode(
                    token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
                )
                user_id = payload.get("sub")
                request.state.user_id = user_id
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
                
                company_id = get_current_tenant_id()
                
                # Create audit log entry
                try:
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
                            "ip_address": self._get_client_ip(request),
                            "user_agent": request.headers.get("User-Agent", "unknown")
                        }
                    )
                except Exception as e:
                    logger.exception(f"Error logging audit information: {e}")
        
        return response
    
    def _should_skip_audit_logging(self, path: str) -> bool:
        """Determine if audit logging should be skipped for this path."""
        skip_paths = [
            "/docs",
            "/redoc",
            "/openapi.json",
            "/static",
            "/health",
            "/favicon.ico",
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
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
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
        # For now, only log authenticated requests to avoid constraint violations
        # TODO: Update database schema to properly support nullable user_id
        if user_id is None:
            logger.debug(f"Skipping database audit log for unauthenticated request: {action}")
            return
            
        db = None
        try:
            db = SessionLocal()
            db.add(PlatformAuditLog(
                user_id=user_id,
                company_id=company_id,
                action=action,
                resource_type=resource_type,
                details=details,
                ip_address=details.get("ip_address"),
                user_agent=details.get("user_agent")
            ))
            db.commit()
        except Exception as e:
            logger.exception(f"Failed to log to database: {e}")
            if db:
                db.rollback()
        finally:
            if db:
                db.close()
