from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.postgresql import JSONB
import datetime

Base = declarative_base()

class BugReport(Base):
    __tablename__ = "bug_reports"
    
    id = Column(Integer, primary_key=True)
    company_id = Column(Integer, ForeignKey("companies.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    error_id = Column(String, unique=True)  # Unique identifier for grouping similar errors
    error_type = Column(String)  # "frontend", "backend", "integration"
    severity = Column(String)  # "low", "medium", "high", "critical"
    module = Column(String)
    error_message = Column(Text)
    stack_trace = Column(Text)
    user_agent = Column(String)
    url = Column(String)
    request_data = Column(JSONB)
    response_data = Column(JSONB)
    status = Column(String, default="new")  # "new", "investigating", "fixed", "cannot_reproduce"
    occurrence_count = Column(Integer, default=1)
    first_seen = Column(DateTime, default=datetime.datetime.utcnow)
    last_seen = Column(DateTime, default=datetime.datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    resolution_notes = Column(Text, nullable=True)
