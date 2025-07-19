from fastapi import Request, Response
from typing import Callable, Optional, Dict, Any
import time
import json
from functools import wraps
from starlette.middleware.base import BaseHTTPMiddleware
from app.database.database import SessionLocal
from app.crud.platform import create_audit_log, track_usage
from app.models.platform import UsageMetricType, AuditActionType
from app.schemas.platform import AuditLogCreate

class AuditMiddleware(BaseHTTPMiddleware):
    """Middleware for automatic audit logging"""
    
    async def dispatch(self, request: Request, call_next):
        # Skip audit for health checks and static files
        if request.url.path.startswith("/health") or request.url.path.startswith("/static"):
            return await call_next(request)
        
        # Capture request info
        request_info = {
            "ip_address": request.client.host if request.client else "unknown",
            "user_agent": request.headers.get("user-agent"),
            "request_method": request.method,
            "request_path": request.url.path
        }
        
        # Process request
        start_time = time.time()
        response = await call_next(request)
        duration = time.time() - start_time
        
        # Track API usage
        if hasattr(request.state, "user") and request.state.user:
            db = SessionLocal()
            try:
                track_usage(
                    db,
                    request.state.user.company_id,
                    UsageMetricType.API_CALLS,
                    1,
                    {
                        "endpoint": request.url.path,
                        "method": request.method,
                        "duration_ms": int(duration * 1000),
                        "status_code": response.status_code
                    }
                )
            except Exception as e:
                # Don't let usage tracking break the application
                pass
            finally:
                db.close()
        
        return response

def audit_log(action: str, resource_type: str):
    """Decorator for explicit audit logging"""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            request = kwargs.get("request")
            current_user = kwargs.get("current_user")
            db = kwargs.get("db")
            
            # Capture old values for updates
            old_values = None
            resource_id = None
            
            if action == "update" and "id" in kwargs:
                resource_id = str(kwargs["id"])
                # Fetch old values based on resource_type
                # This would need to be implemented based on your models
            
            # Execute the function
            try:
                result = await func(*args, **kwargs)
                status_code = 200
                error_message = None
                
                # Extract resource_id from result if not already set
                if not resource_id and hasattr(result, "id"):
                    resource_id = str(result.id)
                
                # Capture new values for creates/updates
                new_values = None
                if action in ["create", "update"] and hasattr(result, "dict"):
                    new_values = result.dict()
                
            except Exception as e:
                status_code = 500
                error_message = str(e)
                result = None
                raise
            
            finally:
                # Create audit log
                if db and current_user:
                    audit_data = AuditLogCreate(
                        action=AuditActionType(action),
                        resource_type=resource_type,
                        resource_id=resource_id,
                        old_values=old_values,
                        new_values=new_values,
                        status_code=status_code,
                        error_message=error_message
                    )
                    
                    user_id = current_user.id if hasattr(current_user, "id") else None
                    company_id = current_user.company_id if hasattr(current_user, "company_id") else None
                    platform_admin_id = current_user.id if hasattr(current_user, "permissions") else None
                    
                    try:
                        create_audit_log(
                            db,
                            audit_data,
                            company_id=company_id,
                            user_id=user_id,
                            platform_admin_id=platform_admin_id,
                            request_info=request_info if request else None
                        )
                    except Exception as e:
                        # Don't let audit logging break the application
                        pass
            
            return result
        
        return wrapper
    return decorator
