from typing import List, Optional, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.core.tenant_context import get_current_tenant_id
from app.crud import feedback_request, feedback_comment, feedback_category
from app.models.core import User
from app.schemas.feedback import (
    FeedbackRequestCreate,
    FeedbackRequestUpdate,
    FeedbackRequestResponse,
    FeedbackRequestDetail,
    FeedbackListResponse,
    FeedbackCommentCreate,
    FeedbackCommentUpdate,
    FeedbackCommentResponse,
    FeedbackCategoryCreate,
    FeedbackCategoryUpdate,
    FeedbackCategoryResponse,
    FeedbackSummary,
    FeedbackTrend,
    FeedbackFilters,
    FeedbackStatus,
    FeedbackRequestType,
    FeedbackPriority,
    FeedbackModule
)

router = APIRouter()


@router.post("/requests", response_model=FeedbackRequestResponse)
def create_feedback_request(
    *,
    db: Session = Depends(get_db),
    feedback_in: FeedbackRequestCreate,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Create a new feedback request.
    """
    company_id = get_current_tenant_id()
    feedback = feedback_request.create_with_user(
        db=db, 
        obj_in=feedback_in, 
        user_id=current_user.id,
        company_id=company_id
    )
    
    # Convert to response format
    return FeedbackRequestResponse(
        **feedback.__dict__,
        user_name=current_user.full_name,
        user_email=current_user.email,
        comment_count=0
    )


@router.get("/requests", response_model=FeedbackListResponse)
def list_feedback_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status: Optional[List[FeedbackStatus]] = Query(None),
    request_type: Optional[List[FeedbackRequestType]] = Query(None),
    priority: Optional[List[FeedbackPriority]] = Query(None),
    module: Optional[List[FeedbackModule]] = Query(None),
    assigned_to_user_id: Optional[int] = Query(None),
    user_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    order_by: str = Query("created_at"),
    order_direction: str = Query("desc")
) -> Any:
    """
    Get feedback requests with filtering and pagination.
    """
    company_id = get_current_tenant_id()
    
    # Create filters
    filters = FeedbackFilters(
        status=status,
        request_type=request_type,
        priority=priority,
        module=module,
        assigned_to_user_id=assigned_to_user_id,
        user_id=user_id,
        search=search
    )
    
    # If user is not admin, only show their own requests
    if current_user.user_type == "company_user":
        filters.user_id = current_user.id
    
    items, total = feedback_request.get_by_company(
        db=db,
        company_id=company_id,
        skip=skip,
        limit=limit,
        filters=filters,
        order_by=order_by,
        order_direction=order_direction
    )
    
    # Convert to response format
    response_items = []
    for item in items:
        response_items.append(FeedbackRequestResponse(
            **item.__dict__,
            user_name=item.user.full_name if item.user else None,
            user_email=item.user.email if item.user else None,
            assigned_to_name=item.assigned_to.full_name if item.assigned_to else None,
            comment_count=len(item.comments) if hasattr(item, 'comments') else 0
        ))
    
    total_pages = (total + limit - 1) // limit
    
    return FeedbackListResponse(
        items=response_items,
        total=total,
        page=skip // limit + 1,
        size=limit,
        total_pages=total_pages
    )


@router.get("/requests/{feedback_id}", response_model=FeedbackRequestDetail)
def get_feedback_request(
    *,
    db: Session = Depends(get_db),
    feedback_id: int,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get a specific feedback request with comments.
    """
    company_id = get_current_tenant_id()
    feedback = feedback_request.get_with_comments(
        db=db, 
        id=feedback_id, 
        company_id=company_id
    )
    
    if not feedback:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feedback request not found"
        )
    
    # Check permissions - users can only view their own requests unless admin
    if (current_user.user_type == "company_user" and 
        feedback.user_id != current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Convert comments to response format
    comments = []
    for comment in feedback.comments:
        # Hide internal comments from regular users
        if comment.is_internal and current_user.user_type == "company_user":
            continue
        
        comments.append(FeedbackCommentResponse(
            **comment.__dict__,
            user_name=comment.user.full_name if comment.user else None,
            user_email=comment.user.email if comment.user else None
        ))
    
    return FeedbackRequestDetail(
        **feedback.__dict__,
        user_name=feedback.user.full_name if feedback.user else None,
        user_email=feedback.user.email if feedback.user else None,
        assigned_to_name=feedback.assigned_to.full_name if feedback.assigned_to else None,
        comment_count=len(comments),
        comments=comments
    )


@router.put("/requests/{feedback_id}", response_model=FeedbackRequestResponse)
def update_feedback_request(
    *,
    db: Session = Depends(get_db),
    feedback_id: int,
    feedback_in: FeedbackRequestUpdate,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Update a feedback request.
    """
    company_id = get_current_tenant_id()
    feedback = feedback_request.get(db=db, id=feedback_id)
    
    if not feedback or feedback.company_id != company_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feedback request not found"
        )
    
    # Check permissions
    if current_user.user_type == "company_user":
        # Regular users can only update their own requests and only specific fields
        if feedback.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        
        # Restrict fields that regular users can update
        allowed_fields = {"title", "description", "attachments", "request_type", "module", "priority"}
        update_data = feedback_in.model_dump(exclude_unset=True)
        restricted_fields = set(update_data.keys()) - allowed_fields
        if restricted_fields:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Cannot update fields: {restricted_fields}"
            )
    
    feedback = feedback_request.update(db=db, db_obj=feedback, obj_in=feedback_in)
    
    return FeedbackRequestResponse(
        **feedback.__dict__,
        user_name=feedback.user.full_name if hasattr(feedback, 'user') and feedback.user else None,
        user_email=feedback.user.email if hasattr(feedback, 'user') and feedback.user else None,
        assigned_to_name=feedback.assigned_to.full_name if hasattr(feedback, 'assigned_to') and feedback.assigned_to else None,
        comment_count=0
    )


@router.post("/requests/{feedback_id}/assign")
def assign_feedback_request(
    *,
    db: Session = Depends(get_db),
    feedback_id: int,
    assigned_to_user_id: Optional[int] = None,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Assign a feedback request to a user. Only admins can do this.
    """
    if current_user.user_type == "company_user":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    company_id = get_current_tenant_id()
    feedback = feedback_request.assign_to_user(
        db=db,
        feedback_id=feedback_id,
        assigned_to_user_id=assigned_to_user_id,
        company_id=company_id
    )
    
    if not feedback:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feedback request not found"
        )
    
    return {"message": "Assignment updated successfully"}


@router.post("/requests/{feedback_id}/status")
def update_feedback_status(
    *,
    db: Session = Depends(get_db),
    feedback_id: int,
    status: FeedbackStatus,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Update feedback request status. Only admins can do this.
    """
    if current_user.user_type == "company_user":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    company_id = get_current_tenant_id()
    feedback = feedback_request.update_status(
        db=db,
        feedback_id=feedback_id,
        status=status.value,
        company_id=company_id
    )
    
    if not feedback:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feedback request not found"
        )
    
    return {"message": "Status updated successfully"}


@router.delete("/requests/{feedback_id}")
def delete_feedback_request(
    *,
    db: Session = Depends(get_db),
    feedback_id: int,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Delete a feedback request.
    """
    company_id = get_current_tenant_id()
    feedback = feedback_request.get(db=db, id=feedback_id)
    
    if not feedback or feedback.company_id != company_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feedback request not found"
        )
    
    # Check permissions - users can only delete their own requests
    if (current_user.user_type == "company_user" and 
        feedback.user_id != current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    feedback_request.remove(db=db, id=feedback_id)
    return {"message": "Feedback request deleted successfully"}


# Comments endpoints
@router.post("/requests/{feedback_id}/comments", response_model=FeedbackCommentResponse)
def create_feedback_comment(
    *,
    db: Session = Depends(get_db),
    feedback_id: int,
    comment_in: FeedbackCommentCreate,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Add a comment to a feedback request.
    """
    company_id = get_current_tenant_id()
    
    # Verify feedback request exists and user has access
    feedback = feedback_request.get(db=db, id=feedback_id)
    if not feedback or feedback.company_id != company_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feedback request not found"
        )
    
    # Check permissions for viewing the feedback
    if (current_user.user_type == "company_user" and 
        feedback.user_id != current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Regular users cannot create internal comments
    if current_user.user_type == "company_user" and comment_in.is_internal:
        comment_in.is_internal = False
    
    comment_in.feedback_request_id = feedback_id
    comment = feedback_comment.create_with_user(
        db=db, 
        obj_in=comment_in, 
        user_id=current_user.id
    )
    
    return FeedbackCommentResponse(
        **comment.__dict__,
        user_name=current_user.full_name,
        user_email=current_user.email
    )


@router.get("/requests/{feedback_id}/comments", response_model=List[FeedbackCommentResponse])
def list_feedback_comments(
    *,
    db: Session = Depends(get_db),
    feedback_id: int,
    current_user: User = Depends(get_current_user),
    include_internal: bool = Query(False)
) -> Any:
    """
    Get comments for a feedback request.
    """
    company_id = get_current_tenant_id()
    
    # Verify feedback request exists and user has access
    feedback = feedback_request.get(db=db, id=feedback_id)
    if not feedback or feedback.company_id != company_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feedback request not found"
        )
    
    # Check permissions
    if (current_user.user_type == "company_user" and 
        feedback.user_id != current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Regular users cannot see internal comments
    if current_user.user_type == "company_user":
        include_internal = False
    
    comments = feedback_comment.get_by_request(
        db=db,
        feedback_request_id=feedback_id,
        include_internal=include_internal
    )
    
    return [
        FeedbackCommentResponse(
            **comment.__dict__,
            user_name=comment.user.full_name if comment.user else None,
            user_email=comment.user.email if comment.user else None
        )
        for comment in comments
    ]


# Dashboard/Analytics endpoints
@router.get("/summary", response_model=FeedbackSummary)
def get_feedback_summary(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get feedback summary statistics.
    """
    if current_user.user_type == "company_user":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    company_id = get_current_tenant_id()
    return feedback_request.get_summary(db=db, company_id=company_id)


@router.get("/trends", response_model=List[FeedbackTrend])
def get_feedback_trends(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    days: int = Query(30, ge=1, le=365)
) -> Any:
    """
    Get feedback trends over time.
    """
    if current_user.user_type == "company_user":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    company_id = get_current_tenant_id()
    return feedback_request.get_trends(db=db, days=days, company_id=company_id)


# Categories endpoints (for future use)
@router.post("/categories", response_model=FeedbackCategoryResponse)
def create_feedback_category(
    *,
    db: Session = Depends(get_db),
    category_in: FeedbackCategoryCreate,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Create a feedback category. Only admins can do this.
    """
    if current_user.user_type == "company_user":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    company_id = get_current_tenant_id()
    category = feedback_category.create_with_company(
        db=db, 
        obj_in=category_in, 
        company_id=company_id
    )
    
    return FeedbackCategoryResponse(**category.__dict__)


@router.get("/categories", response_model=List[FeedbackCategoryResponse])
def list_feedback_categories(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    include_system: bool = Query(True)
) -> Any:
    """
    Get feedback categories.
    """
    company_id = get_current_tenant_id()
    categories = feedback_category.get_by_company(
        db=db,
        company_id=company_id,
        include_system=include_system
    )
    
    return [
        FeedbackCategoryResponse(**category.__dict__)
        for category in categories
    ]
