from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc, func, and_

from app.models.error_tracking import BugReport


def get_bug_reports(
    db: Session,
    company_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    severity: Optional[str] = None,
    error_type: Optional[str] = None
) -> List[BugReport]:
    """Get bug reports with optional filtering."""
    query = db.query(BugReport)
    
    if company_id is not None:
        query = query.filter(BugReport.company_id == company_id)
    
    if status:
        query = query.filter(BugReport.status == status)
    
    if severity:
        query = query.filter(BugReport.severity == severity)
        
    if error_type:
        query = query.filter(BugReport.error_type == error_type)
    
    return query.order_by(desc(BugReport.last_seen)).offset(skip).limit(limit).all()


def get_bug_report_by_id(db: Session, bug_report_id: int) -> Optional[BugReport]:
    """Get a specific bug report by ID."""
    return db.query(BugReport).filter(BugReport.id == bug_report_id).first()


def get_bug_report_by_error_id(db: Session, error_id: str) -> Optional[BugReport]:
    """Get a bug report by error ID."""
    return db.query(BugReport).filter(BugReport.error_id == error_id).first()


def update_bug_report_status(
    db: Session, 
    bug_report_id: int, 
    status: str, 
    resolution_notes: Optional[str] = None
) -> Optional[BugReport]:
    """Update bug report status and resolution notes."""
    bug_report = db.query(BugReport).filter(BugReport.id == bug_report_id).first()
    if bug_report:
        bug_report.status = status
        if resolution_notes:
            bug_report.resolution_notes = resolution_notes
        if status in ["fixed", "cannot_reproduce"]:
            from datetime import datetime
            bug_report.resolved_at = datetime.utcnow()
        db.commit()
        db.refresh(bug_report)
    return bug_report


def get_bug_report_stats(db: Session, company_id: Optional[int] = None) -> dict:
    """Get bug report statistics."""
    query = db.query(BugReport)
    
    if company_id is not None:
        query = query.filter(BugReport.company_id == company_id)
    
    total = query.count()
    new_count = query.filter(BugReport.status == "new").count()
    investigating = query.filter(BugReport.status == "investigating").count()
    fixed = query.filter(BugReport.status == "fixed").count()
    cannot_reproduce = query.filter(BugReport.status == "cannot_reproduce").count()
    
    # Get counts by severity
    critical = query.filter(BugReport.severity == "critical").count()
    high = query.filter(BugReport.severity == "high").count()
    medium = query.filter(BugReport.severity == "medium").count()
    low = query.filter(BugReport.severity == "low").count()
    
    # Get counts by type
    frontend_errors = query.filter(BugReport.error_type == "frontend").count()
    backend_errors = query.filter(BugReport.error_type == "backend").count()
    integration_errors = query.filter(BugReport.error_type == "integration").count()
    
    return {
        "total": total,
        "by_status": {
            "new": new_count,
            "investigating": investigating,
            "fixed": fixed,
            "cannot_reproduce": cannot_reproduce
        },
        "by_severity": {
            "critical": critical,
            "high": high,
            "medium": medium,
            "low": low
        },
        "by_type": {
            "frontend": frontend_errors,
            "backend": backend_errors,
            "integration": integration_errors
        }
    }


def delete_bug_report(db: Session, bug_report_id: int) -> bool:
    """Delete a bug report."""
    bug_report = db.query(BugReport).filter(BugReport.id == bug_report_id).first()
    if bug_report:
        db.delete(bug_report)
        db.commit()
        return True
    return False