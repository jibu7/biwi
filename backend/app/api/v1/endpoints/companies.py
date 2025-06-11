from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import crud, models, schemas
from app.core.permissions import PermissionChecker, COMPANY_CREATE, COMPANY_READ, COMPANY_UPDATE
from app.core.security import get_current_active_user, get_current_active_superuser
from app.database.database import get_db

router = APIRouter()

@router.post("/", response_model=schemas.Company)
def create_company(
    *,
    db: Session = Depends(get_db),
    company_in: schemas.CompanyCreate,
    current_user: models.User = Depends(get_current_active_superuser),
) -> Any:
    """Create new company (superuser only)"""
    company = crud.core.create_company(db, company=company_in)
    return company

@router.get("/", response_model=List[schemas.Company])
def read_companies(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(get_current_active_superuser),
) -> Any:
    """Retrieve companies (superuser only)"""
    companies = crud.core.get_companies(db, skip=skip, limit=limit)
    return companies

@router.get("/current", response_model=schemas.Company)
def read_current_company(
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """Get current user's company"""
    company = crud.core.get_company(db, company_id=current_user.company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company

@router.get("/{company_id}", response_model=schemas.Company, dependencies=[Depends(PermissionChecker([COMPANY_READ]))])
def read_company(
    company_id: int,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """Get company by ID"""
    company = crud.core.get_company(db, company_id=company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    if company.id != current_user.company_id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return company

@router.put("/{company_id}", response_model=schemas.Company, dependencies=[Depends(PermissionChecker([COMPANY_UPDATE]))])
def update_company(
    *,
    db: Session = Depends(get_db),
    company_id: int,
    company_in: schemas.CompanyUpdate,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Update company"""
    company = crud.core.get_company(db, company_id=company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    if company.id != current_user.company_id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    company = crud.core.update_company(db, company_db_obj=company, company_in=company_in)
    return company
