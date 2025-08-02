from fastapi import Request, status
from fastapi.responses import JSONResponse
import traceback
import hashlib
import datetime
from app.database.database import get_db
from app.models.error_tracking import BugReport

# Define a custom exception for critical errors if it doesn't exist
class CriticalException(Exception):
    pass

from app.core.alerts import send_critical_error_alert

async def send_platform_alert(error_id, exc, url=None, company_id=None, user_id=None, occurrence_count=1):
    """Send platform alert for critical errors."""
    await send_critical_error_alert(
        error_id=error_id,
        exception=exc,
        url=url,
        company_id=company_id,
        user_id=user_id,
        occurrence_count=occurrence_count
    )


async def global_exception_handler(request: Request, exc: Exception):
    # Generate unique error ID based on error type and location
    error_signature = f"{exc.__class__.__name__}:{traceback.extract_tb(exc.__traceback__)[-1].filename}:{traceback.extract_tb(exc.__traceback__)[-1].lineno}"
    error_id = hashlib.md5(error_signature.encode()).hexdigest()[:8]
    
    # Log to database
    async with get_db() as db:
        existing_bug = db.query(BugReport).filter_by(error_id=error_id).first()
        
        if existing_bug:
            existing_bug.occurrence_count += 1
            existing_bug.last_seen = datetime.datetime.utcnow()
        else:
            bug_report = BugReport(
                error_id=error_id,
                error_type="backend",
                error_message=str(exc),
                stack_trace=traceback.format_exc(),
                url=str(request.url),
                request_data={
                    "method": request.method,
                    "headers": dict(request.headers),
                    "path_params": request.path_params,
                    "query_params": dict(request.query_params)
                },
                user_id=request.state.user.id if hasattr(request.state, 'user') else None,
                company_id=request.state.company_id if hasattr(request.state, 'company_id') else None
            )
            db.add(bug_report)
        
        db.commit()
        
        # Send alert if critical or if it's a server error with high occurrence count
        should_alert = (
            isinstance(exc, CriticalException) or
            (existing_bug and existing_bug.occurrence_count >= 5) or  # Alert after 5 occurrences
            not existing_bug  # Alert on first occurrence of new errors
        )
        
        if should_alert:
            occurrence_count = existing_bug.occurrence_count if existing_bug else 1
            await send_platform_alert(
                error_id=error_id,
                exc=exc,
                url=str(request.url),
                company_id=request.state.company_id if hasattr(request.state, 'company_id') else None,
                user_id=request.state.user.id if hasattr(request.state, 'user') else None,
                occurrence_count=occurrence_count
            )
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "An error occurred",
            "error_id": error_id,
            "message": "Our team has been notified. Please reference error ID: " + error_id
        }
    )
