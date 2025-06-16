from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Date, Numeric, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.database.database import Base

class Company(Base):
    __tablename__ = "companies"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    address = Column(JSONB, nullable=True)
    contact_info = Column(JSONB, nullable=True)
    default_currency_code = Column(String(3), nullable=True)
    is_active = Column(Boolean, default=True)
    
    users = relationship("User", back_populates="company")
    roles = relationship("Role", back_populates="company")
    accounting_periods = relationship("AccountingPeriod", back_populates="company")
    
    # Reporting relationships
    report_templates = relationship("ReportTemplate", back_populates="company")
    report_schedules = relationship("ReportSchedule", back_populates="company")
    bank_reconciliations = relationship("BankReconciliation", back_populates="company")

class Role(Base):
    __tablename__ = "roles"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(String, nullable=True)
    permissions = Column(JSONB, nullable=True)  # List of permission strings
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    
    company = relationship("Company", back_populates="roles")
    users = relationship("UserRole", back_populates="role")
    
    __table_args__ = (UniqueConstraint('name', 'company_id', name='uq_role_name_company'),)

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    
    company = relationship("Company", back_populates="users")
    roles = relationship("UserRole", back_populates="user")

class UserRole(Base):
    __tablename__ = "user_roles"
    
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    role_id = Column(Integer, ForeignKey("roles.id"), primary_key=True)
    
    user = relationship("User", back_populates="roles")
    role = relationship("Role", back_populates="users")

class AccountingPeriod(Base):
    __tablename__ = "accounting_periods"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    name = Column(String, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(String, nullable=False)  # "Open", "Closed", "Future"
    
    company = relationship("Company", back_populates="accounting_periods")
    
    __table_args__ = (UniqueConstraint('name', 'company_id', name='uq_accountingperiod_name_company'),)
