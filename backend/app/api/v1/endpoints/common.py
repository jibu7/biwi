from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.core.security import get_current_active_user
from app.core.permissions import PermissionChecker, COMMON_SETUP_CURRENCIES, COMMON_SETUP_TAXES, COMMON_SETUP_BRANCHES
from app import models, schemas
from app.crud import common as crud_common

router = APIRouter()


# Currency endpoints
@router.post("/currencies/", response_model=schemas.Currency)
async def create_currency(
    currency: schemas.CurrencyCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([COMMON_SETUP_CURRENCIES]))
):
    return crud_common.create_currency(db=db, currency=currency, company_id=current_user.company_id)


@router.get("/currencies/", response_model=List[schemas.Currency])
async def read_currencies(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    return crud_common.get_currencies_by_company(
        db=db, company_id=current_user.company_id, skip=skip, limit=limit
    )


@router.get("/currencies/{currency_id}", response_model=schemas.Currency)
async def read_currency(
    currency_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    currency = crud_common.get_currency(db=db, currency_id=currency_id, company_id=current_user.company_id)
    if currency is None:
        raise HTTPException(status_code=404, detail="Currency not found")
    return currency


@router.put("/currencies/{currency_id}", response_model=schemas.Currency)
async def update_currency(
    currency_id: int,
    currency: schemas.CurrencyUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([COMMON_SETUP_CURRENCIES]))
):
    db_currency = crud_common.get_currency(db=db, currency_id=currency_id, company_id=current_user.company_id)
    if db_currency is None:
        raise HTTPException(status_code=404, detail="Currency not found")
    return crud_common.update_currency(db=db, currency_db_obj=db_currency, currency_in=currency)


@router.delete("/currencies/{currency_id}", response_model=schemas.Currency)
async def delete_currency(
    currency_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([COMMON_SETUP_CURRENCIES]))
):
    currency = crud_common.delete_currency(db=db, currency_id=currency_id, company_id=current_user.company_id)
    if currency is None:
        raise HTTPException(status_code=404, detail="Currency not found")
    return currency


@router.get("/currencies/base", response_model=schemas.Currency)
async def read_base_currency(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get the base currency for the company"""
    currency = crud_common.get_base_currency(db, current_user.company_id)
    if currency is None:
        raise HTTPException(status_code=404, detail="Base currency not found")
    return currency


# Tax Type endpoints
@router.post("/tax-types/", response_model=schemas.TaxType)
async def create_tax_type(
    tax_type: schemas.TaxTypeCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([COMMON_SETUP_TAXES]))
):
    return crud_common.create_tax_type(db=db, tax_type=tax_type, company_id=current_user.company_id)


@router.get("/tax-types/", response_model=List[schemas.TaxType])
async def read_tax_types(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([COMMON_SETUP_TAXES]))
):
    return crud_common.get_tax_types_by_company(
        db=db, company_id=current_user.company_id, skip=skip, limit=limit
    )


@router.get("/tax-types/{tax_type_id}", response_model=schemas.TaxType)
async def read_tax_type(
    tax_type_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([COMMON_SETUP_TAXES]))
):
    tax_type = crud_common.get_tax_type(db=db, tax_type_id=tax_type_id, company_id=current_user.company_id)
    if tax_type is None:
        raise HTTPException(status_code=404, detail="Tax type not found")
    return tax_type


@router.put("/tax-types/{tax_type_id}", response_model=schemas.TaxType)
async def update_tax_type(
    tax_type_id: int,
    tax_type: schemas.TaxTypeUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([COMMON_SETUP_TAXES]))
):
    db_tax_type = crud_common.get_tax_type(db=db, tax_type_id=tax_type_id, company_id=current_user.company_id)
    if db_tax_type is None:
        raise HTTPException(status_code=404, detail="Tax type not found")
    return crud_common.update_tax_type(db=db, tax_type_db_obj=db_tax_type, tax_type_in=tax_type)


@router.delete("/tax-types/{tax_type_id}", response_model=schemas.TaxType)
async def delete_tax_type(
    tax_type_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([COMMON_SETUP_TAXES]))
):
    tax_type = crud_common.delete_tax_type(db=db, tax_type_id=tax_type_id, company_id=current_user.company_id)
    if tax_type is None:
        raise HTTPException(status_code=404, detail="Tax type not found")
    return tax_type


# Branch endpoints
@router.post("/branches/", response_model=schemas.Branch)
async def create_branch(
    branch: schemas.BranchCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([COMMON_SETUP_BRANCHES]))
):
    return crud_common.create_branch(db=db, branch=branch, company_id=current_user.company_id)


@router.get("/branches/", response_model=List[schemas.Branch])
async def read_branches(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([COMMON_SETUP_BRANCHES]))
):
    return crud_common.get_branches_by_company(
        db=db, company_id=current_user.company_id, skip=skip, limit=limit
    )


@router.get("/branches/{branch_id}", response_model=schemas.Branch)
async def read_branch(
    branch_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([COMMON_SETUP_BRANCHES]))
):
    branch = crud_common.get_branch(db=db, branch_id=branch_id, company_id=current_user.company_id)
    if branch is None:
        raise HTTPException(status_code=404, detail="Branch not found")
    return branch


@router.put("/branches/{branch_id}", response_model=schemas.Branch)
async def update_branch(
    branch_id: int,
    branch: schemas.BranchUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([COMMON_SETUP_BRANCHES]))
):
    db_branch = crud_common.get_branch(db=db, branch_id=branch_id, company_id=current_user.company_id)
    if db_branch is None:
        raise HTTPException(status_code=404, detail="Branch not found")
    return crud_common.update_branch(db=db, branch_db_obj=db_branch, branch_in=branch)


@router.delete("/branches/{branch_id}", response_model=schemas.Branch)
async def delete_branch(
    branch_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([COMMON_SETUP_BRANCHES]))
):
    branch = crud_common.delete_branch(db=db, branch_id=branch_id, company_id=current_user.company_id)
    if branch is None:
        raise HTTPException(status_code=404, detail="Branch not found")
    return branch
