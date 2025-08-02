from fastapi import APIRouter, Depends, Request, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import traceback
import hashlib
import datetime

from app.database.database import get_db
from app.models.error_tracking import BugReport
from app.schemas.error_tracking import (
    FrontendErrorPayload, 
    BugReportResponse, 
    BugReportStatusUpdate,
    BugReportStats
)
from app.crud import error_tracking
from app.core.permissions import PermissionChecker
from app.core.error_handler import CriticalException

router = APIRouter()

@router.post("/frontend")
async def report_frontend_error(
    payload: FrontendErrorPayload,
    request: Request,
    db: Session = Depends(get_db)
):
    """Report a frontend error."""
    error_signature = f"frontend:{payload.error}:{payload.stack}"
    error_id = hashlib.md5(error_signature.encode()).hexdigest()[:8]

    existing_bug = db.query(BugReport).filter_by(error_id=error_id).first()

    if existing_bug:
        existing_bug.occurrence_count += 1
        existing_bug.last_seen = datetime.datetime.utcnow()
    else:
        bug_report = BugReport(
            error_id=error_id,
            error_type="frontend",
            error_message=payload.error,
            stack_trace=payload.stack,
            module=payload.componentStack,
            url=payload.url,
            user_agent=payload.userAgent,
            first_seen=datetime.datetime.fromisoformat(payload.timestamp.replace("Z", "+00:00")),
            last_seen=datetime.datetime.fromisoformat(payload.timestamp.replace("Z", "+00:00")),
            user_id=request.state.user.id if hasattr(request.state, 'user') else None,
            company_id=request.state.company_id if hasattr(request.state, 'company_id') else None
        )
        db.add(bug_report)
    
    db.commit()

    return {"error_id": error_id}


@router.get("/", response_model=List[BugReportResponse])
async def get_bug_reports(
    request: Request,
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    error_type: Optional[str] = Query(None),
    _: None = Depends(PermissionChecker(["system:admin"]))
):
    """Get all bug reports (admin only)."""
    company_id = getattr(request.state, 'company_id', None)
    
    bug_reports = error_tracking.get_bug_reports(
        db=db,
        company_id=company_id,
        skip=skip,
        limit=limit,
        status=status,
        severity=severity,
        error_type=error_type
    )
    
    return bug_reports


@router.get("/stats", response_model=BugReportStats)
async def get_bug_report_stats(
    request: Request,
    db: Session = Depends(get_db),
    _: None = Depends(PermissionChecker(["system:admin"]))
):
    """Get bug report statistics (admin only)."""
    company_id = getattr(request.state, 'company_id', None)
    
    stats = error_tracking.get_bug_report_stats(db=db, company_id=company_id)
    return stats


@router.get("/{bug_report_id}", response_model=BugReportResponse)
async def get_bug_report(
    bug_report_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(PermissionChecker(["system:admin"]))
):
    """Get a specific bug report (admin only)."""
    bug_report = error_tracking.get_bug_report_by_id(db=db, bug_report_id=bug_report_id)
    if not bug_report:
        raise HTTPException(status_code=404, detail="Bug report not found")
    return bug_report


@router.patch("/{bug_report_id}/status", response_model=BugReportResponse)
async def update_bug_report_status(
    bug_report_id: int,
    status_update: BugReportStatusUpdate,
    db: Session = Depends(get_db),
    _: None = Depends(PermissionChecker(["system:admin"]))
):
    """Update bug report status (admin only)."""
    bug_report = error_tracking.update_bug_report_status(
        db=db,
        bug_report_id=bug_report_id,
        status=status_update.status,
        resolution_notes=status_update.resolution_notes
    )
    
    if not bug_report:
        raise HTTPException(status_code=404, detail="Bug report not found")
    
    return bug_report


@router.delete("/{bug_report_id}")
async def delete_bug_report(
    bug_report_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(PermissionChecker(["system:admin"]))
):
    """Delete a bug report (admin only)."""
    success = error_tracking.delete_bug_report(db=db, bug_report_id=bug_report_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Bug report not found")
    
    return {"message": "Bug report deleted successfully"}


@router.post("/test/critical")
async def test_critical_error():
    """Test endpoint to trigger a critical error for testing alerts."""
    raise CriticalException("This is a test critical error for alert system testing")


@router.post("/test/regular")
async def test_regular_error():
    """Test endpoint to trigger a regular error for testing error capture."""
    raise Exception("This is a test regular error for error capture testing")


@router.post("/test/frequency")
async def test_frequency_error():
    """Test endpoint to trigger frequent errors for testing frequency alerts."""
    raise Exception("Test frequent error - this should trigger frequency alerts after 5 occurrences")
