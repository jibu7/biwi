from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from app.models.common import Currency, TaxType, Branch
from app.schemas.common import (
    CurrencyCreate, CurrencyUpdate,
    TaxTypeCreate, TaxTypeUpdate,
    BranchCreate, BranchUpdate
)


# Currency CRUD Operations
def get_currencies_by_company(db: Session, company_id: int, skip: int = 0, limit: int = 100) -> List[Currency]:
    """Get all currencies for a company"""
    return db.query(Currency).filter(
        Currency.company_id == company_id
    ).offset(skip).limit(limit).all()


def get_currency(db: Session, currency_id: int, company_id: int) -> Optional[Currency]:
    """Get a specific currency by ID"""
    return db.query(Currency).filter(
        Currency.id == currency_id,
        Currency.company_id == company_id
    ).first()


def get_currency_by_code(db: Session, code: str, company_id: int) -> Optional[Currency]:
    """Get a currency by code"""
    return db.query(Currency).filter(
        Currency.code == code,
        Currency.company_id == company_id
    ).first()


def get_base_currency(db: Session, company_id: int) -> Optional[Currency]:
    """Get the base currency for a company"""
    return db.query(Currency).filter(
        Currency.company_id == company_id,
        Currency.is_base_currency == True
    ).first()


def create_currency(db: Session, currency: CurrencyCreate, company_id: int) -> Currency:
    """Create a new currency"""
    try:
        # Ensure only one base currency per company
        if currency.is_base_currency:
            existing_base = get_base_currency(db, company_id)
            if existing_base:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="A base currency already exists for this company"
                )
            # Base currency must have exchange rate of 1
            currency.exchange_rate_to_base = 1.000000
        
        db_currency = Currency(
            **currency.model_dump(),
            company_id=company_id
        )
        db.add(db_currency)
        db.commit()
        db.refresh(db_currency)
        return db_currency
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Currency code already exists for this company"
        )


def update_currency(db: Session, currency_db_obj: Currency, currency_in: CurrencyUpdate) -> Currency:
    """Update a currency"""
    # Validate base currency constraint
    if currency_in.is_base_currency is True and not currency_db_obj.is_base_currency:
        existing_base = get_base_currency(db, currency_db_obj.company_id)
        if existing_base:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A base currency already exists for this company"
            )
    
    update_data = currency_in.model_dump(exclude_unset=True)
    
    # Handle base currency logic
    if "is_base_currency" in update_data and update_data["is_base_currency"]:
        update_data["exchange_rate_to_base"] = 1.000000
    
    for field, value in update_data.items():
        setattr(currency_db_obj, field, value)
    
    db.commit()
    db.refresh(currency_db_obj)
    return currency_db_obj


def delete_currency(db: Session, currency_id: int, company_id: int) -> Optional[Currency]:
    """Delete a currency"""
    currency = get_currency(db, currency_id, company_id)
    if not currency:
        return None
    
    if currency.is_base_currency:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete the base currency"
        )
    
    db.delete(currency)
    db.commit()
    return currency


# Tax Type CRUD Operations
def get_tax_types_by_company(db: Session, company_id: int, skip: int = 0, limit: int = 100) -> List[TaxType]:
    """Get all tax types for a company"""
    return db.query(TaxType).filter(
        TaxType.company_id == company_id
    ).offset(skip).limit(limit).all()


def get_tax_type(db: Session, tax_type_id: int, company_id: int) -> Optional[TaxType]:
    """Get a specific tax type by ID"""
    return db.query(TaxType).filter(
        TaxType.id == tax_type_id,
        TaxType.company_id == company_id
    ).first()


def get_tax_type_by_name(db: Session, name: str, company_id: int) -> Optional[TaxType]:
    """Get a tax type by name"""
    return db.query(TaxType).filter(
        TaxType.name == name,
        TaxType.company_id == company_id
    ).first()


def create_tax_type(db: Session, tax_type: TaxTypeCreate, company_id: int) -> TaxType:
    """Create a new tax type"""
    try:
        db_tax_type = TaxType(
            **tax_type.model_dump(),
            company_id=company_id
        )
        db.add(db_tax_type)
        db.commit()
        db.refresh(db_tax_type)
        return db_tax_type
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tax type name already exists for this company"
        )


def update_tax_type(db: Session, tax_type_db_obj: TaxType, tax_type_in: TaxTypeUpdate) -> TaxType:
    """Update a tax type"""
    update_data = tax_type_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(tax_type_db_obj, field, value)
    
    db.commit()
    db.refresh(tax_type_db_obj)
    return tax_type_db_obj


def delete_tax_type(db: Session, tax_type_id: int, company_id: int) -> Optional[TaxType]:
    """Delete a tax type"""
    tax_type = get_tax_type(db, tax_type_id, company_id)
    if not tax_type:
        return None
    
    db.delete(tax_type)
    db.commit()
    return tax_type


# Branch CRUD Operations
def get_branches_by_company(db: Session, company_id: int, skip: int = 0, limit: int = 100) -> List[Branch]:
    """Get all branches for a company"""
    return db.query(Branch).filter(
        Branch.company_id == company_id
    ).offset(skip).limit(limit).all()


def get_branch(db: Session, branch_id: int, company_id: int) -> Optional[Branch]:
    """Get a specific branch by ID"""
    return db.query(Branch).filter(
        Branch.id == branch_id,
        Branch.company_id == company_id
    ).first()


def get_branch_by_name(db: Session, name: str, company_id: int) -> Optional[Branch]:
    """Get a branch by name"""
    return db.query(Branch).filter(
        Branch.name == name,
        Branch.company_id == company_id
    ).first()


def create_branch(db: Session, branch: BranchCreate, company_id: int) -> Branch:
    """Create a new branch"""
    try:
        db_branch = Branch(
            **branch.model_dump(),
            company_id=company_id
        )
        db.add(db_branch)
        db.commit()
        db.refresh(db_branch)
        return db_branch
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Branch name already exists for this company"
        )


def update_branch(db: Session, branch_db_obj: Branch, branch_in: BranchUpdate) -> Branch:
    """Update a branch"""
    update_data = branch_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(branch_db_obj, field, value)
    
    db.commit()
    db.refresh(branch_db_obj)
    return branch_db_obj


def delete_branch(db: Session, branch_id: int, company_id: int) -> Optional[Branch]:
    """Delete a branch"""
    branch = get_branch(db, branch_id, company_id)
    if not branch:
        return None
    
    db.delete(branch)
    db.commit()
    return branch
