from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func, case, desc, asc
from datetime import datetime, timedelta

from app.crud.base import CRUDBase
from app.models.feedback import FeedbackRequest, FeedbackComment, FeedbackCategory
from app.models.core import User
from app.schemas.feedback import (
    FeedbackRequestCreate, FeedbackRequestUpdate, FeedbackFilters,
    FeedbackCommentCreate, FeedbackCommentUpdate,
    FeedbackCategoryCreate, FeedbackCategoryUpdate,
    FeedbackSummary, FeedbackTrend
)
from app.core.tenant_context import get_current_tenant_id


class CRUDFeedbackRequest(CRUDBase[FeedbackRequest, FeedbackRequestCreate, FeedbackRequestUpdate]):
    def create_with_user(
        self, 
        db: Session, 
        *, 
        obj_in: FeedbackRequestCreate, 
        user_id: int,
        company_id: Optional[int] = None
    ) -> FeedbackRequest:
        """Create a new feedback request with user and company context."""
        if not company_id:
            company_id = get_current_tenant_id()
        
        obj_in_data = obj_in.model_dump()
        db_obj = FeedbackRequest(
            **obj_in_data,
            user_id=user_id,
            company_id=company_id
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_by_company(
        self,
        db: Session,
        *,
        company_id: Optional[int] = None,
        skip: int = 0,
        limit: int = 100,
        filters: Optional[FeedbackFilters] = None,
        order_by: str = "created_at",
        order_direction: str = "desc"
    ) -> tuple[List[FeedbackRequest], int]:
        """Get feedback requests for a company with filtering and pagination."""
        if not company_id:
            company_id = get_current_tenant_id()
        
        query = db.query(FeedbackRequest).filter(
            FeedbackRequest.company_id == company_id
        ).options(
            joinedload(FeedbackRequest.user),
            joinedload(FeedbackRequest.assigned_to)
        )
        
        # Apply filters
        if filters:
            if filters.status:
                query = query.filter(FeedbackRequest.status.in_([s.value for s in filters.status]))
            
            if filters.request_type:
                query = query.filter(FeedbackRequest.request_type.in_([t.value for t in filters.request_type]))
            
            if filters.priority:
                query = query.filter(FeedbackRequest.priority.in_([p.value for p in filters.priority]))
            
            if filters.module:
                query = query.filter(FeedbackRequest.module.in_([m.value for m in filters.module]))
            
            if filters.assigned_to_user_id:
                query = query.filter(FeedbackRequest.assigned_to_user_id == filters.assigned_to_user_id)
            
            if filters.user_id:
                query = query.filter(FeedbackRequest.user_id == filters.user_id)
            
            if filters.date_from:
                query = query.filter(FeedbackRequest.created_at >= filters.date_from)
            
            if filters.date_to:
                query = query.filter(FeedbackRequest.created_at <= filters.date_to)
            
            if filters.search:
                search_term = f"%{filters.search}%"
                query = query.filter(
                    or_(
                        FeedbackRequest.title.ilike(search_term),
                        FeedbackRequest.description.ilike(search_term)
                    )
                )
        
        # Apply ordering
        if order_direction.lower() == "desc":
            query = query.order_by(desc(getattr(FeedbackRequest, order_by)))
        else:
            query = query.order_by(asc(getattr(FeedbackRequest, order_by)))
        
        # Get total count
        total = query.count()
        
        # Apply pagination
        items = query.offset(skip).limit(limit).all()
        
        return items, total

    def get_with_comments(
        self, 
        db: Session, 
        id: int, 
        company_id: Optional[int] = None
    ) -> Optional[FeedbackRequest]:
        """Get a feedback request with all its comments."""
        if not company_id:
            company_id = get_current_tenant_id()
        
        return db.query(FeedbackRequest).filter(
            and_(
                FeedbackRequest.id == id,
                FeedbackRequest.company_id == company_id
            )
        ).options(
            joinedload(FeedbackRequest.user),
            joinedload(FeedbackRequest.assigned_to),
            joinedload(FeedbackRequest.comments).joinedload(FeedbackComment.user)
        ).first()

    def get_summary(
        self, 
        db: Session, 
        company_id: Optional[int] = None
    ) -> FeedbackSummary:
        """Get feedback summary statistics for a company."""
        if not company_id:
            company_id = get_current_tenant_id()
        
        # Status counts
        status_counts = db.query(
            FeedbackRequest.status,
            func.count(FeedbackRequest.id).label('count')
        ).filter(
            FeedbackRequest.company_id == company_id
        ).group_by(FeedbackRequest.status).all()
        
        status_dict = {status: count for status, count in status_counts}
        
        # Priority counts
        priority_counts = db.query(
            FeedbackRequest.priority,
            func.count(FeedbackRequest.id).label('count')
        ).filter(
            FeedbackRequest.company_id == company_id
        ).group_by(FeedbackRequest.priority).all()
        
        priority_dict = {priority: count for priority, count in priority_counts}
        
        # Type counts
        type_counts = db.query(
            FeedbackRequest.request_type,
            func.count(FeedbackRequest.id).label('count')
        ).filter(
            FeedbackRequest.company_id == company_id
        ).group_by(FeedbackRequest.request_type).all()
        
        type_dict = {req_type: count for req_type, count in type_counts}
        
        # Module counts
        module_counts = db.query(
            FeedbackRequest.module,
            func.count(FeedbackRequest.id).label('count')
        ).filter(
            and_(
                FeedbackRequest.company_id == company_id,
                FeedbackRequest.module.isnot(None)
            )
        ).group_by(FeedbackRequest.module).all()
        
        module_dict = {module: count for module, count in module_counts}
        
        # Total count
        total = db.query(func.count(FeedbackRequest.id)).filter(
            FeedbackRequest.company_id == company_id
        ).scalar() or 0
        
        return FeedbackSummary(
            total_requests=total,
            open_requests=status_dict.get("open", 0),
            in_review_requests=status_dict.get("in_review", 0),
            planned_requests=status_dict.get("planned", 0),
            in_progress_requests=status_dict.get("in_progress", 0),
            completed_requests=status_dict.get("completed", 0),
            rejected_requests=status_dict.get("rejected", 0),
            
            low_priority=priority_dict.get("low", 0),
            medium_priority=priority_dict.get("medium", 0),
            high_priority=priority_dict.get("high", 0),
            critical_priority=priority_dict.get("critical", 0),
            
            feature_requests=type_dict.get("feature", 0),
            modification_requests=type_dict.get("modification", 0),
            improvement_requests=type_dict.get("improvement", 0),
            bug_reports=type_dict.get("bug_report", 0),
            
            module_breakdown=module_dict
        )

    def get_trends(
        self, 
        db: Session, 
        days: int = 30, 
        company_id: Optional[int] = None
    ) -> List[FeedbackTrend]:
        """Get feedback trends over the specified number of days."""
        if not company_id:
            company_id = get_current_tenant_id()
        
        end_date = datetime.utcnow().date()
        start_date = end_date - timedelta(days=days-1)
        
        # Query for daily trends
        trends = db.query(
            func.date(FeedbackRequest.created_at).label('date'),
            func.count(FeedbackRequest.id).label('total_created'),
            func.sum(
                case(
                    (FeedbackRequest.status == 'completed', 1),
                    else_=0
                )
            ).label('total_completed'),
            func.sum(
                case(
                    (FeedbackRequest.status.in_(['open', 'in_review', 'planned', 'in_progress']), 1),
                    else_=0
                )
            ).label('total_open')
        ).filter(
            and_(
                FeedbackRequest.company_id == company_id,
                func.date(FeedbackRequest.created_at) >= start_date,
                func.date(FeedbackRequest.created_at) <= end_date
            )
        ).group_by(
            func.date(FeedbackRequest.created_at)
        ).order_by(
            func.date(FeedbackRequest.created_at)
        ).all()
        
        return [
            FeedbackTrend(
                date=trend.date.strftime('%Y-%m-%d'),
                total_created=trend.total_created or 0,
                total_completed=trend.total_completed or 0,
                total_open=trend.total_open or 0
            )
            for trend in trends
        ]

    def assign_to_user(
        self,
        db: Session,
        *,
        feedback_id: int,
        assigned_to_user_id: Optional[int] = None,
        company_id: Optional[int] = None
    ) -> Optional[FeedbackRequest]:
        """Assign a feedback request to a user."""
        if not company_id:
            company_id = get_current_tenant_id()
        
        feedback = db.query(FeedbackRequest).filter(
            and_(
                FeedbackRequest.id == feedback_id,
                FeedbackRequest.company_id == company_id
            )
        ).first()
        
        if feedback:
            feedback.assigned_to_user_id = assigned_to_user_id
            feedback.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(feedback)
        
        return feedback

    def update_status(
        self,
        db: Session,
        *,
        feedback_id: int,
        status: str,
        company_id: Optional[int] = None
    ) -> Optional[FeedbackRequest]:
        """Update the status of a feedback request."""
        if not company_id:
            company_id = get_current_tenant_id()
        
        feedback = db.query(FeedbackRequest).filter(
            and_(
                FeedbackRequest.id == feedback_id,
                FeedbackRequest.company_id == company_id
            )
        ).first()
        
        if feedback:
            feedback.status = status
            feedback.updated_at = datetime.utcnow()
            
            if status == "completed":
                feedback.completed_at = datetime.utcnow()
            
            db.commit()
            db.refresh(feedback)
        
        return feedback


class CRUDFeedbackComment(CRUDBase[FeedbackComment, FeedbackCommentCreate, FeedbackCommentUpdate]):
    def create_with_user(
        self, 
        db: Session, 
        *, 
        obj_in: FeedbackCommentCreate, 
        user_id: int
    ) -> FeedbackComment:
        """Create a new feedback comment with user context."""
        obj_in_data = obj_in.model_dump()
        db_obj = FeedbackComment(
            **obj_in_data,
            user_id=user_id
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_by_request(
        self,
        db: Session,
        *,
        feedback_request_id: int,
        include_internal: bool = False
    ) -> List[FeedbackComment]:
        """Get all comments for a feedback request."""
        query = db.query(FeedbackComment).filter(
            FeedbackComment.feedback_request_id == feedback_request_id
        ).options(
            joinedload(FeedbackComment.user)
        )
        
        if not include_internal:
            query = query.filter(FeedbackComment.is_internal == False)
        
        return query.order_by(FeedbackComment.created_at).all()


class CRUDFeedbackCategory(CRUDBase[FeedbackCategory, FeedbackCategoryCreate, FeedbackCategoryUpdate]):
    def create_with_company(
        self, 
        db: Session, 
        *, 
        obj_in: FeedbackCategoryCreate, 
        company_id: Optional[int] = None
    ) -> FeedbackCategory:
        """Create a new feedback category with company context."""
        if not company_id:
            company_id = get_current_tenant_id()
        
        obj_in_data = obj_in.model_dump()
        db_obj = FeedbackCategory(
            **obj_in_data,
            company_id=company_id
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_by_company(
        self,
        db: Session,
        *,
        company_id: Optional[int] = None,
        include_system: bool = True
    ) -> List[FeedbackCategory]:
        """Get feedback categories for a company."""
        if not company_id:
            company_id = get_current_tenant_id()
        
        query = db.query(FeedbackCategory).filter(
            FeedbackCategory.is_active == True
        )
        
        if include_system:
            query = query.filter(
                or_(
                    FeedbackCategory.company_id == company_id,
                    FeedbackCategory.company_id.is_(None)
                )
            )
        else:
            query = query.filter(FeedbackCategory.company_id == company_id)
        
        return query.order_by(FeedbackCategory.name).all()


# Create instances
feedback_request = CRUDFeedbackRequest(FeedbackRequest)
feedback_comment = CRUDFeedbackComment(FeedbackComment)
feedback_category = CRUDFeedbackCategory(FeedbackCategory)
