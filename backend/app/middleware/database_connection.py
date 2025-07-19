from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
import logging
from app.database.database import SessionLocal
from sqlalchemy.exc import SQLAlchemyError

logger = logging.getLogger(__name__)

class DatabaseConnectionMiddleware(BaseHTTPMiddleware):
    """
    Middleware to handle database connection health and ensure proper cleanup
    """
    
    async def dispatch(self, request: Request, call_next):
        try:
            # Test database connection health for critical endpoints
            if self._is_critical_endpoint(request.url.path):
                await self._check_db_health()
            
            response = await call_next(request)
            return response
            
        except SQLAlchemyError as e:
            logger.error(f"Database error in middleware: {e}")
            return JSONResponse(
                status_code=503,
                content={"detail": "Database connection error"}
            )
        except Exception as e:
            logger.error(f"Unexpected error in database middleware: {e}")
            return JSONResponse(
                status_code=500,
                content={"detail": "Internal server error"}
            )
    
    def _is_critical_endpoint(self, path: str) -> bool:
        """Check if this is a critical endpoint that requires DB health check"""
        critical_paths = [
            "/api/v1/auth/login",
            "/api/v1/platform/",
            "/api/v1/health"
        ]
        return any(path.startswith(critical_path) for critical_path in critical_paths)
    
    async def _check_db_health(self):
        """Perform a simple database health check"""
        try:
            from sqlalchemy import text
            db = SessionLocal()
            # Simple query to test connection
            db.execute(text("SELECT 1"))
            db.close()
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            raise SQLAlchemyError("Database health check failed")
