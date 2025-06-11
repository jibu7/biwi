from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import crud, models, schemas
from app.core.permissions import PermissionChecker, ACCOUNTING_PERIOD_MANAGE
from app.core.security import get_current_active_user
from app.database.database import get_db

router = APIRouter()

@router.post("/", response_model=schemas.AccountingPeriod, dependencies=[Depends(PermissionChecker([ACCOUNTING_PERIOD_MANAGE]))])
def create_accounting_period(
    *,
    db: Session = Depends(get_db),
    period_in: schemas.AccountingPeriodCreate,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Create new accounting period"""
    period = crud.core.create_accounting_period(
        db, period=period_in, company_id=current_user.company_id
    )
    return period

@router.get("/", response_model=List[schemas.AccountingPeriod], dependencies=[Depends(PermissionChecker([ACCOUNTING_PERIOD_MANAGE]))])
def read_accounting_periods(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Retrieve accounting periods"""
    periods = crud.core.get_accounting_periods_by_company(
        db, company_id=current_user.company_id, skip=skip, limit=limit
    )
    return periods

@router.put("/{period_id}", response_model=schemas.AccountingPeriod, dependencies=[Depends(PermissionChecker([ACCOUNTING_PERIOD_MANAGE]))])
def update_accounting_period(
    *,
    db: Session = Depends(get_db),
    period_id: int,
    period_in: schemas.AccountingPeriodUpdate,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Update accounting period"""
    period = db.query(models.AccountingPeriod).filter(
        models.AccountingPeriod.id == period_id,
        models.AccountingPeriod.company_id == current_user.company_id
    ).first()
    if not period:
        raise HTTPException(status_code=404, detail="Accounting period not found")
    period = crud.core.update_accounting_period(db, period_db_obj=period, period_in=period_in)
    return period
