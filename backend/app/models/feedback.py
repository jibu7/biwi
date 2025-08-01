from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, DateTime, Index
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.database import Base


class FeedbackRequest(Base):
    __tablename__ = "feedback_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    request_type = Column(String, nullable=False)  # "feature", "modification", "improvement", "bug_report"
    module = Column(String, nullable=True)  # "GL", "AR", "AP", "Inventory", "POS", etc.
    priority = Column(String, default="medium")  # "low", "medium", "high", "critical"
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String, default="open")  # "open", "in_review", "planned", "in_progress", "completed", "rejected"
    attachments = Column(JSONB, nullable=True)  # Store file URLs or references
    assigned_to_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    estimated_hours = Column(Integer, nullable=True)
    actual_hours = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    
    # Relationships
    company = relationship("Company")
    user = relationship("User", foreign_keys=[user_id], back_populates="feedback_requests")
    assigned_to = relationship("User", foreign_keys=[assigned_to_user_id])
    comments = relationship("FeedbackComment", back_populates="request", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('ix_feedback_company_status', 'company_id', 'status'),
        Index('ix_feedback_company_type', 'company_id', 'request_type'),
        Index('ix_feedback_company_module', 'company_id', 'module'),
        Index('ix_feedback_user', 'user_id'),
        Index('ix_feedback_assigned', 'assigned_to_user_id'),
    )


class FeedbackComment(Base):
    __tablename__ = "feedback_comments"
    
    id = Column(Integer, primary_key=True, index=True)
    feedback_request_id = Column(Integer, ForeignKey("feedback_requests.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    comment = Column(Text, nullable=False)
    is_internal = Column(Boolean, default=False)  # Internal team comments vs user-visible
    attachments = Column(JSONB, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    request = relationship("FeedbackRequest", back_populates="comments")
    user = relationship("User")
    
    __table_args__ = (
        Index('ix_comment_request', 'feedback_request_id'),
        Index('ix_comment_user', 'user_id'),
    )


class FeedbackCategory(Base):
    __tablename__ = "feedback_categories"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)  # Null for system-wide categories
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    color = Column(String, nullable=True)  # Hex color for UI
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    company = relationship("Company")
    
    __table_args__ = (
        Index('ix_category_company', 'company_id'),
    )
