from typing import Callable
from fastapi import Request, Response
from fastapi.routing import APIRoute
import json
import time
from datetime import datetime
from app.database.database import SessionLocal
from app.models import PlatformAuditLog, User, UserType
from app.core.security import decode_access_token
import logging

logger = logging.getLogger(__name__)

class AuditRoute(APIRoute):
    """Custom route class that logs platform admin actions"""
    
    def get_route_handler(self) -> Callable:
        original_route_handler = super().get_route_handler()
        
        async def custom_route_handler(request: Request) -> Response:
            # Start timing
            start_time = time.time()
            
            # Check if this is a platform admin route
            if request.url.path.startswith("/api/v1/platform"):
                # Extract user information from token
                user_info = await self._extract_user_info(request)
                
                # Log the request
                audit_log_id = await self._log_platform_action_start(
                    request, user_info, start_time
                )
                
                try:
                    # Execute the original route handler
                    response = await original_route_handler(request)
                    
                    # Log successful completion
                    await self._log_platform_action_complete(
                        audit_log_id, response, time.time() - start_time
                    )
                    
                    return response
                
                except Exception as e:
                    # Log error
                    await self._log_platform_action_error(
                        audit_log_id, e, time.time() - start_time
                    )
                    raise
            
            else:
                # Regular route - no special logging
                return await original_route_handler(request)
        
        return custom_route_handler
    
    async def _extract_user_info(self, request: Request) -> dict:
        """Extract user information from the request"""
        user_info = {"user_id": None, "email": None, "user_type": None}
        
        try:
            auth_header = request.headers.get("authorization")
            if auth_header and auth_header.startswith("Bearer "):
                token = auth_header.replace("Bearer ", "")
                payload = decode_access_token(token)
                
                user_info["user_id"] = payload.get("user_id")
                user_info["email"] = payload.get("email")
                
                # Get user type from database
                if user_info["user_id"]:
                    db = SessionLocal()
                    try:
                        user = db.query(User).filter(User.id == user_info["user_id"]).first()
                        if user:
                            user_info["user_type"] = user.user_type
                    finally:
                        db.close()
        
        except Exception as e:
            logger.error(f"Error extracting user info: {str(e)}")
        
        return user_info
    
    async def _log_platform_action_start(
        self, request: Request, user_info: dict, start_time: float
    ) -> int:
        """Log the start of a platform action"""
        db = SessionLocal()
        try:
            # Determine action from request
            action = self._determine_action(request)
            
            # Extract additional details
            details = {
                "method": request.method,
                "url": str(request.url),
                "query_params": dict(request.query_params),
                "start_time": start_time,
                "user_agent": request.headers.get("User-Agent"),
                "referer": request.headers.get("Referer")
            }
            
            # Try to extract company_id from various sources
            company_id = self._extract_company_id(request)
            
            # Create audit log
            audit_log = PlatformAuditLog(
                user_id=user_info["user_id"],
                company_id=company_id,
                action=action,
                resource_type=self._extract_resource_type(request),
                details=details,
                ip_address=request.client.host,
                user_agent=request.headers.get("User-Agent"),
                timestamp=datetime.utcnow()
            )
            
            db.add(audit_log)
            db.commit()
            
            return audit_log.id
        
        except Exception as e:
            logger.error(f"Error logging platform action start: {str(e)}")
            return None
        finally:
            db.close()
    
    async def _log_platform_action_complete(
        self, audit_log_id: int, response: Response, duration: float
    ):
        """Log the completion of a platform action"""
        if audit_log_id is None:
            return
        
        db = SessionLocal()
        try:
            audit_log = db.query(PlatformAuditLog).filter(
                PlatformAuditLog.id == audit_log_id
            ).first()
            
            if audit_log:
                # Update details with completion info
                if audit_log.details:
                    audit_log.details.update({
                        "status": "completed",
                        "duration_seconds": duration,
                        "response_status": response.status_code,
                        "completed_at": datetime.utcnow().isoformat()
                    })
                
                db.commit()
        
        except Exception as e:
            logger.error(f"Error logging platform action completion: {str(e)}")
        finally:
            db.close()
    
    async def _log_platform_action_error(
        self, audit_log_id: int, error: Exception, duration: float
    ):
        """Log an error in platform action"""
        if audit_log_id is None:
            return
        
        db = SessionLocal()
        try:
            audit_log = db.query(PlatformAuditLog).filter(
                PlatformAuditLog.id == audit_log_id
            ).first()
            
            if audit_log:
                # Update details with error info
                if audit_log.details:
                    audit_log.details.update({
                        "status": "error",
                        "duration_seconds": duration,
                        "error_type": type(error).__name__,
                        "error_message": str(error),
                        "error_at": datetime.utcnow().isoformat()
                    })
                
                db.commit()
        
        except Exception as e:
            logger.error(f"Error logging platform action error: {str(e)}")
        finally:
            db.close()
    
    def _determine_action(self, request: Request) -> str:
        """Determine the action based on request details"""
        path = request.url.path
        method = request.method
        
        # Map common patterns to actions
        action_map = {
            ("GET", "/api/v1/platform/companies"): "viewed_companies",
            ("POST", "/api/v1/platform/companies"): "created_company",
            ("GET", "/api/v1/platform/companies/{id}"): "viewed_company_details",
            ("PUT", "/api/v1/platform/companies/{id}"): "updated_company",
            ("DELETE", "/api/v1/platform/companies/{id}"): "deleted_company",
            ("POST", "/api/v1/platform/companies/{id}/suspend"): "suspended_company",
            ("POST", "/api/v1/platform/companies/{id}/activate"): "activated_company",
            ("POST", "/api/v1/platform/companies/{id}/impersonate"): "impersonated_company",
            ("GET", "/api/v1/platform/audit-logs"): "viewed_audit_logs",
            ("GET", "/api/v1/platform/metrics/summary"): "viewed_platform_metrics",
            ("GET", "/api/v1/platform/reports/audit-summary"): "generated_audit_report",
            ("GET", "/api/v1/platform/reports/compliance-report"): "generated_compliance_report",
            ("GET", "/api/v1/platform/reports/usage-analytics"): "viewed_usage_analytics",
            ("GET", "/api/v1/platform/reports/financial-summary"): "viewed_financial_summary",
            ("POST", "/api/v1/platform/bulk-actions/suspend"): "bulk_suspended_companies",
            ("POST", "/api/v1/platform/bulk-actions/activate"): "bulk_activated_companies"
        }
        
        # Replace path parameters with placeholder
        normalized_path = path
        if "/companies/" in path and path.count("/") >= 4:
            # Replace company ID with placeholder
            parts = path.split("/")
            if len(parts) >= 5 and parts[4].isdigit():
                parts[4] = "{id}"
                normalized_path = "/".join(parts)
        
        action_key = (method, normalized_path)
        return action_map.get(action_key, f"{method.lower()}_{normalized_path.replace('/api/v1/platform/', '').replace('/', '_')}")
    
    def _extract_resource_type(self, request: Request) -> str:
        """Extract resource type from request"""
        path = request.url.path
        
        if "/companies" in path:
            return "company"
        elif "/users" in path:
            return "user"
        elif "/audit-logs" in path:
            return "audit_log"
        elif "/reports" in path:
            return "report"
        elif "/metrics" in path:
            return "metrics"
        else:
            return "platform"
    
    def _extract_company_id(self, request: Request) -> int:
        """Extract company ID from request"""
        # Try to get from path parameters
        path = request.url.path
        if "/companies/" in path:
            parts = path.split("/")
            for i, part in enumerate(parts):
                if part == "companies" and i + 1 < len(parts):
                    try:
                        return int(parts[i + 1])
                    except ValueError:
                        pass
        
        # Try to get from headers
        company_id = request.headers.get("X-Target-Company-ID")
        if company_id:
            try:
                return int(company_id)
            except ValueError:
                pass
        
        # Try to get from query parameters
        company_id = request.query_params.get("company_id")
        if company_id:
            try:
                return int(company_id)
            except ValueError:
                pass
        
        return None

class PlatformAuditMiddleware:
    """Middleware for comprehensive platform audit logging"""
    
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            request = Request(scope, receive)
            
            # Only audit platform routes
            if request.url.path.startswith("/api/v1/platform"):
                await self._audit_request(request)
        
        await self.app(scope, receive, send)
    
    async def _audit_request(self, request: Request):
        """Audit platform request"""
        try:
            # Extract request body for POST/PUT requests
            body = None
            if request.method in ["POST", "PUT", "PATCH"]:
                body = await request.body()
                if body:
                    try:
                        body = json.loads(body.decode())
                    except:
                        body = body.decode()
            
            # Log request details
            logger.info(f"Platform API Request: {request.method} {request.url.path}")
            logger.info(f"Headers: {dict(request.headers)}")
            logger.info(f"Query Params: {dict(request.query_params)}")
            if body:
                logger.info(f"Request Body: {body}")
        
        except Exception as e:
            logger.error(f"Error auditing request: {str(e)}")

# Function to set up audit logging for platform routes
def setup_platform_audit_logging(app):
    """Set up comprehensive audit logging for platform routes"""
    
    # Override route class for platform routes
    for route in app.routes:
        if hasattr(route, 'path') and route.path.startswith("/api/v1/platform"):
            route.__class__ = AuditRoute
    
    # Add audit middleware
    app.add_middleware(PlatformAuditMiddleware)
    
    return app
