from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Numeric, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.database.database import Base


class Currency(Base):
    __tablename__ = "currencies"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    code = Column(String(3), nullable=False)  # e.g., "USD", "EUR"
    name = Column(String, nullable=False)  # e.g., "US Dollar"
    symbol = Column(String(5), nullable=True)  # e.g., "$", "€"
    exchange_rate_to_base = Column(Numeric(15, 6), default=1.000000)  # Rate to base currency
    is_base_currency = Column(Boolean, default=False)  # Only one per company
    is_active = Column(Boolean, default=True)
    
    company = relationship("Company", foreign_keys=[company_id])
    
    __table_args__ = (
        UniqueConstraint('code', 'company_id', name='uq_currency_code_company'),
    )


class TaxType(Base):
    __tablename__ = "tax_types"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    name = Column(String, nullable=False)  # e.g., "VAT Standard Rate"
    rate_percentage = Column(Numeric(5, 2), nullable=False)  # e.g., 18.00
    tax_authority_gl_account_id = Column(Integer, ForeignKey("gl_accounts.id"), nullable=True)
    tax_code = Column(String, nullable=True)  # For external systems
    tax_nature = Column(String, nullable=False)  # "Sales", "Purchases", "Exempt", "ZeroRated"
    is_active = Column(Boolean, default=True)
    
    company = relationship("Company", foreign_keys=[company_id])
    tax_authority_gl_account = relationship("GLAccount", foreign_keys=[tax_authority_gl_account_id])
    
    __table_args__ = (
        UniqueConstraint('name', 'company_id', name='uq_taxtype_name_company'),
    )


class Branch(Base):
    __tablename__ = "branches"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    name = Column(String, nullable=False)
    address = Column(JSONB, nullable=True)
    contact_info = Column(JSONB, nullable=True)
    default_gl_segment_code = Column(String, nullable=True)  # For segmented GL reporting
    is_active = Column(Boolean, default=True)
    
    company = relationship("Company", foreign_keys=[company_id])
    
    __table_args__ = (
        UniqueConstraint('name', 'company_id', name='uq_branch_name_company'),
    )
