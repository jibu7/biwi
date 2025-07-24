from fastapi import APIRouter, Depends, HTTPException, status, Query, Header
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from app import crud, models, schemas
from app.api import deps
from app.core.permissions import PermissionChecker, GL_SETUP_MANAGE, GL_JOURNAL_POST, GL_REPORTS_VIEW

router = APIRouter()

def get_company_id(
    current_user: models.User = Depends(deps.get_current_active_user),
    x_company_id: Optional[int] = Header(None, description="Company ID for superadmin context switching")
) -> int:
    """Get the effective company ID for the request"""
    if current_user.is_superuser and x_company_id:
        # Verify the company exists
        # This would need a company validation check
        return x_company_id
    return current_user.company_id

# GL Accounts endpoints
@router.post("/accounts", response_model=schemas.GLAccount)
async def create_gl_account(
    *,
    db: Session = Depends(deps.get_db),
    account_in: schemas.GLAccountCreate,
    current_user: models.User = Depends(PermissionChecker([GL_SETUP_MANAGE])),
    company_id: int = Depends(get_company_id)
):
    """Create new GL account with company isolation"""
    return crud.gl_account.create_with_company(
        db=db, obj_in=account_in, company_id=company_id
    )

@router.get("/accounts", response_model=List[schemas.GLAccount])
async def list_gl_accounts(
    db: Session = Depends(deps.get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    account_type: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(True),
    current_user: models.User = Depends(PermissionChecker([GL_SETUP_MANAGE, GL_REPORTS_VIEW])),
    company_id: int = Depends(get_company_id)
):
    """List GL accounts for the company"""
    return crud.gl_account.get_by_company(
        db=db, 
        company_id=company_id,
        skip=skip,
        limit=limit,
        account_type=account_type,
        is_active=is_active
    )

@router.get("/accounts/{account_id}", response_model=schemas.GLAccount)
async def get_gl_account(
    *,
    db: Session = Depends(deps.get_db),
    account_id: int,
    current_user: models.User = Depends(PermissionChecker([GL_SETUP_MANAGE, GL_REPORTS_VIEW])),
    company_id: int = Depends(get_company_id)
):
    """Get specific GL account with company check"""
    account = crud.gl_account.get_with_company_check(
        db=db, id=account_id, company_id=company_id
    )
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="GL Account not found"
        )
    return account

@router.put("/accounts/{account_id}", response_model=schemas.GLAccount)
async def update_gl_account(
    *,
    db: Session = Depends(deps.get_db),
    account_id: int,
    account_in: schemas.GLAccountUpdate,
    current_user: models.User = Depends(PermissionChecker([GL_SETUP_MANAGE])),
    company_id: int = Depends(get_company_id)
):
    """Update GL account with company validation"""
    account = crud.gl_account.get_with_company_check(
        db=db, id=account_id, company_id=company_id
    )
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="GL Account not found"
        )
    
    return crud.gl_account.update_with_company_check(
        db=db, db_obj=account, obj_in=account_in, company_id=company_id
    )

@router.delete("/accounts/{account_id}")
async def delete_gl_account(
    *,
    db: Session = Depends(deps.get_db),
    account_id: int,
    current_user: models.User = Depends(PermissionChecker([GL_SETUP_MANAGE])),
    company_id: int = Depends(get_company_id)
):
    """Delete GL account with company validation"""
    account = crud.gl_account.delete_with_company_check(
        db=db, id=account_id, company_id=company_id
    )
    return {"success": True, "deleted_id": account_id}

# Journal Entry endpoints
@router.post("/journal-entries", response_model=schemas.GLJournalEntry)
async def create_journal_entry(
    *,
    db: Session = Depends(deps.get_db),
    journal_in: schemas.GLJournalEntryCreate,
    current_user: models.User = Depends(PermissionChecker([GL_JOURNAL_POST])),
    company_id: int = Depends(get_company_id)
):
    """Create and optionally post journal entry"""
    return crud.create_journal_entry(
        db=db,
        entry_in=journal_in,
        company_id=company_id,
        user_id=current_user.id
    )

@router.get("/journal-entries", response_model=List[schemas.GLJournalEntry])
async def list_journal_entries(
    db: Session = Depends(deps.get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    status: Optional[str] = Query(None),
    current_user: models.User = Depends(PermissionChecker([GL_REPORTS_VIEW])),
    company_id: int = Depends(get_company_id)
):
    """List journal entries for the company"""
    return crud.get_journal_entries_by_company(
        db=db,
        company_id=company_id,
        skip=skip,
        limit=limit,
        start_date=start_date,
        end_date=end_date,
        status=status
    )

# Reports
@router.get("/reports/trial-balance")
async def get_trial_balance(
    db: Session = Depends(deps.get_db),
    end_date: date = Query(..., description="As of date for trial balance"),
    only_active: bool = Query(True, description="Include only active accounts"),
    current_user: models.User = Depends(PermissionChecker([GL_REPORTS_VIEW])),
    company_id: int = Depends(get_company_id)
):
    """Get trial balance for the company"""
    trial_balance = crud.calculate_trial_balance(
        db=db,
        company_id=company_id,
        end_date=end_date,
        only_active=only_active
    )
    
    # Calculate totals
    total_debit = sum(item["debit"] for item in trial_balance)
    total_credit = sum(item["credit"] for item in trial_balance)
    
    return {
        "as_of_date": end_date,
        "company_id": company_id,
        "accounts": trial_balance,
        "total_debit": total_debit,
        "total_credit": total_credit,
        "is_balanced": abs(total_debit - total_credit) < 0.01
    }

# Validation endpoint for account selection
@router.get("/accounts/validate/{account_code}")
async def validate_account_code(
    account_code: str,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
    company_id: int = Depends(get_company_id)
):
    """Validate if account code exists for the company"""
    account = db.query(models.GLAccount).filter(
        models.GLAccount.account_code == account_code,
        models.GLAccount.company_id == company_id,
        models.GLAccount.is_active == True
    ).first()
    
    if account:
        return {
            "valid": True,
            "account": {
                "id": account.id,
                "code": account.account_code,
                "name": account.account_name,
                "type": account.account_type
            }
        }
    return {"valid": False}

# GL Defaults endpoints
@router.get("/defaults", response_model=schemas.GLDefaults)
async def get_gl_defaults(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(PermissionChecker([GL_SETUP_MANAGE])),
    company_id: int = Depends(get_company_id)
):
    """Get GL defaults for the company"""
    defaults = crud.get_gl_defaults(db, company_id=company_id)
    if not defaults:
        # Return empty defaults if none exist
        return schemas.GLDefaults(
            id=0,
            company_id=company_id,
            retained_earnings_account_id=None,
            default_cash_account_id=None,
            default_ar_control_account_id=None,
            default_ap_control_account_id=None,
            forex_gain_account_id=None,
            forex_loss_account_id=None
        )
    return defaults

@router.put("/defaults", response_model=schemas.GLDefaults)
async def update_gl_defaults(
    *,
    db: Session = Depends(deps.get_db),
    defaults_in: schemas.GLDefaultsUpdate,
    current_user: models.User = Depends(PermissionChecker([GL_SETUP_MANAGE])),
    company_id: int = Depends(get_company_id)
):
    """Update GL defaults for the company"""
    # Validate that any referenced accounts belong to the company
    account_fields = [
        'retained_earnings_account_id',
        'default_cash_account_id', 
        'default_ar_control_account_id',
        'default_ap_control_account_id',
        'forex_gain_account_id',
        'forex_loss_account_id'
    ]
    
    for field in account_fields:
        account_id = getattr(defaults_in, field, None)
        if account_id:
            account = crud.gl_account.get_with_company_check(
                db, id=account_id, company_id=company_id
            )
            if not account:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Account with ID {account_id} not found or belongs to different company"
                )
    
    return crud.create_or_update_gl_defaults(
        db=db, defaults=defaults_in, company_id=company_id
    )
