from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class FeedbackRequestType(str, Enum):
    FEATURE = "feature"
    MODIFICATION = "modification"
    IMPROVEMENT = "improvement"
    BUG_REPORT = "bug_report"


class FeedbackPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class FeedbackStatus(str, Enum):
    OPEN = "open"
    IN_REVIEW = "in_review"
    PLANNED = "planned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    REJECTED = "rejected"


class FeedbackModule(str, Enum):
    GL = "GL"
    AR = "AR"
    AP = "AP"
    INVENTORY = "Inventory"
    POS = "POS"
    ORDER_ENTRY = "Order Entry"
    BOM = "BOM"
    REPORTING = "Reporting"
    PLATFORM = "Platform"
    OTHER = "Other"


# Base schemas
class FeedbackRequestBase(BaseModel):
    request_type: FeedbackRequestType
    module: Optional[FeedbackModule] = None
    priority: FeedbackPriority = FeedbackPriority.MEDIUM
    title: str = Field(..., min_length=5, max_length=200)
    description: str = Field(..., min_length=10, max_length=5000)
    attachments: Optional[List[Dict[str, Any]]] = None


class FeedbackRequestCreate(FeedbackRequestBase):
    pass


class FeedbackRequestUpdate(BaseModel):
    request_type: Optional[FeedbackRequestType] = None
    module: Optional[FeedbackModule] = None
    priority: Optional[FeedbackPriority] = None
    title: Optional[str] = Field(None, min_length=5, max_length=200)
    description: Optional[str] = Field(None, min_length=10, max_length=5000)
    status: Optional[FeedbackStatus] = None
    assigned_to_user_id: Optional[int] = None
    estimated_hours: Optional[int] = None
    actual_hours: Optional[int] = None
    attachments: Optional[List[Dict[str, Any]]] = None


class FeedbackRequestResponse(FeedbackRequestBase):
    id: int
    company_id: int
    user_id: int
    status: FeedbackStatus
    assigned_to_user_id: Optional[int] = None
    estimated_hours: Optional[int] = None
    actual_hours: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None
    
    # Nested user info
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    assigned_to_name: Optional[str] = None
    
    # Comment count
    comment_count: Optional[int] = 0

    class Config:
        from_attributes = True


# Comment schemas
class FeedbackCommentBase(BaseModel):
    comment: str = Field(..., min_length=1, max_length=2000)
    is_internal: bool = False
    attachments: Optional[List[Dict[str, Any]]] = None


class FeedbackCommentCreate(FeedbackCommentBase):
    feedback_request_id: int


class FeedbackCommentUpdate(BaseModel):
    comment: Optional[str] = Field(None, min_length=1, max_length=2000)
    is_internal: Optional[bool] = None
    attachments: Optional[List[Dict[str, Any]]] = None


class FeedbackCommentResponse(FeedbackCommentBase):
    id: int
    feedback_request_id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    
    # User info
    user_name: Optional[str] = None
    user_email: Optional[str] = None

    class Config:
        from_attributes = True


# Category schemas
class FeedbackCategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    is_active: bool = True


class FeedbackCategoryCreate(FeedbackCategoryBase):
    pass


class FeedbackCategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    is_active: Optional[bool] = None


class FeedbackCategoryResponse(FeedbackCategoryBase):
    id: int
    company_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


# Detailed request with comments
class FeedbackRequestDetail(FeedbackRequestResponse):
    comments: List[FeedbackCommentResponse] = []


# Dashboard/Summary schemas
class FeedbackSummary(BaseModel):
    total_requests: int
    open_requests: int
    in_review_requests: int
    planned_requests: int
    in_progress_requests: int
    completed_requests: int
    rejected_requests: int
    
    # By priority
    low_priority: int
    medium_priority: int
    high_priority: int
    critical_priority: int
    
    # By type
    feature_requests: int
    modification_requests: int
    improvement_requests: int
    bug_reports: int
    
    # By module
    module_breakdown: Dict[str, int]


class FeedbackTrend(BaseModel):
    date: str
    total_created: int
    total_completed: int
    total_open: int


# Filter schemas
class FeedbackFilters(BaseModel):
    status: Optional[List[FeedbackStatus]] = None
    request_type: Optional[List[FeedbackRequestType]] = None
    priority: Optional[List[FeedbackPriority]] = None
    module: Optional[List[FeedbackModule]] = None
    assigned_to_user_id: Optional[int] = None
    user_id: Optional[int] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    search: Optional[str] = None


# Pagination
class FeedbackListResponse(BaseModel):
    items: List[FeedbackRequestResponse]
    total: int
    page: int
    size: int
    total_pages: int
