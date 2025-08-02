from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class FrontendErrorPayload(BaseModel):
    error: str
    stack: Optional[str] = None
    componentStack: Optional[str] = None
    url: str
    userAgent: str
    timestamp: str


class BugReportResponse(BaseModel):
    id: int
    company_id: Optional[int]
    user_id: Optional[int]
    error_id: str
    error_type: Optional[str]
    severity: Optional[str]
    module: Optional[str]
    error_message: Optional[str]
    stack_trace: Optional[str]
    user_agent: Optional[str]
    url: Optional[str]
    request_data: Optional[Dict[str, Any]]
    response_data: Optional[Dict[str, Any]]
    status: Optional[str]
    occurrence_count: Optional[int]
    first_seen: Optional[datetime]
    last_seen: Optional[datetime]
    resolved_at: Optional[datetime]
    resolution_notes: Optional[str]

    class Config:
        from_attributes = True


class BugReportStatusUpdate(BaseModel):
    status: str
    resolution_notes: Optional[str] = None


class BugReportStats(BaseModel):
    total: int
    by_status: Dict[str, int]
    by_severity: Dict[str, int]
    by_type: Dict[str, int]
