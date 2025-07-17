from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.api import deps
from app.core.permissions import Permission, check_permissions
from app.core.tenant_context import require_tenant_context
from app.core.platform_context import is_in_platform_admin_context

router = APIRouter()

@router.get("/accounts", response_model=List[schemas.GLAccount])
def read_gl_accounts(
    db: Session = Depends(deps.get_db),
    skip: int = Query(0),
    limit: int = Query(100),
    is_active: bool = Query(True),
    current_user: models.User = Depends(deps.get_current_tenant_user),
    _: bool = Depends(check_permissions([Permission.GL_ACCOUNT_READ])),
) -> Any:
    """
    Retrieve GL accounts for accessible tenant.
    """
    if is_active:
        gl_accounts = crud.gl.gl_account.get_all_active(db, skip=skip, limit=limit)
    else:
        gl_accounts = crud.gl.gl_account.get_multi(db, skip=skip, limit=limit)
    
    return gl_accounts

@router.post("/accounts", response_model=schemas.GLAccount)
def create_gl_account(
    *,
    db: Session = Depends(deps.get_db),
    account_in: schemas.GLAccountCreate,
    current_user: models.User = Depends(deps.get_current_tenant_user),
    _: bool = Depends(check_permissions([Permission.GL_ACCOUNT_CREATE])),
) -> Any:
    """
    Create new GL account for accessible tenant.
    """
    try:
        gl_account = crud.gl.gl_account.create_with_validation(db=db, obj_in=account_in)
        return gl_account
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/accounts/{account_id}", response_model=schemas.GLAccount)
def read_gl_account(
    *,
    db: Session = Depends(deps.get_db),
    account_id: int = Path(...),
    current_user: models.User = Depends(deps.get_current_tenant_user),
    _: bool = Depends(check_permissions([Permission.GL_ACCOUNT_READ])),
) -> Any:
    """
    Get specific GL account by ID, enforcing tenant isolation.
    """
    gl_account = crud.gl.gl_account.get(db=db, id=account_id)
    if not gl_account:
        raise HTTPException(status_code=404, detail="GL account not found")
    
    return gl_account

@router.put("/accounts/{account_id}", response_model=schemas.GLAccount)
def update_gl_account(
    *,
    db: Session = Depends(deps.get_db),
    account_id: int = Path(...),
    account_in: schemas.GLAccountUpdate,
    current_user: models.User = Depends(deps.get_current_tenant_user),
    _: bool = Depends(check_permissions([Permission.GL_ACCOUNT_UPDATE])),
) -> Any:
    """
    Update GL account, enforcing tenant isolation.
    """
    gl_account = crud.gl.gl_account.get(db=db, id=account_id)
    if not gl_account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="GL account not found")
    
    try:
        gl_account = crud.gl.gl_account.update(db=db, db_obj=gl_account, obj_in=account_in)
        return gl_account
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.delete("/accounts/{account_id}", response_model=schemas.GLAccount)
def delete_gl_account(
    *,
    db: Session = Depends(deps.get_db),
    account_id: int = Path(...),
    current_user: models.User = Depends(deps.get_current_tenant_user),
    _: bool = Depends(check_permissions([Permission.GL_ACCOUNT_DELETE])),
) -> Any:
    """
    Delete GL account, enforcing tenant isolation.
    """
    gl_account = crud.gl.gl_account.get(db=db, id=account_id)
    if not gl_account:
        raise HTTPException(status_code=404, detail="GL account not found")
    
    try:
        crud.gl.gl_account.remove(db=db, id=account_id)
        return gl_account
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/journal-entries", response_model=schemas.GLJournalEntry)
def create_journal_entry(
    *,
    db: Session = Depends(deps.get_db),
    entry_in: schemas.GLJournalEntryCreate,
    current_user: models.User = Depends(deps.get_current_tenant_user),
    _: bool = Depends(check_permissions([Permission.GL_JOURNAL_POST])),
) -> Any:
    """
    Create and post journal entry with tenant validation.
    """
    try:
        journal_entry = crud.gl.gl_journal_entry.create_with_lines(db=db, obj_in=entry_in)
        return journal_entry
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/reports/trial-balance", response_model=List[dict])
def get_trial_balance(
    *,
    db: Session = Depends(deps.get_db),
    as_of_date: str = Query(..., description="Date in YYYY-MM-DD format"),
    current_user: models.User = Depends(deps.get_current_tenant_user),
    _: bool = Depends(check_permissions([Permission.GL_REPORTS_VIEW])),
) -> Any:
    """
    Generate trial balance report for accessible tenant.
    """
    from datetime import datetime
    
    try:
        report_date = datetime.strptime(as_of_date, "%Y-%m-%d").date()
        trial_balance = crud.gl.gl_journal_entry.get_trial_balance(db=db, as_of_date=report_date)
        return trial_balance
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid date format: {e}")
    """Get GL account by ID"""
    account = crud.gl.get_gl_account(db, account_id=account_id, company_id=current_user.company_id)
    if not account:
        raise HTTPException(status_code=404, detail="GL Account not found")
    return account

@router.put("/accounts/{account_id}", response_model=schemas.GLAccount, dependencies=[Depends(PermissionChecker([GL_SETUP_MANAGE]))])
def update_gl_account(
    *,
    db: Session = Depends(get_db),
    account_id: int,
    account_in: schemas.GLAccountUpdate,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Update GL account"""
    account = crud.gl.get_gl_account(db, account_id=account_id, company_id=current_user.company_id)
    if not account:
        raise HTTPException(status_code=404, detail="GL Account not found")
    return crud.gl.update_gl_account(db, account_db_obj=account, account_in=account_in)

@router.delete("/accounts/{account_id}", response_model=schemas.GLAccount, dependencies=[Depends(PermissionChecker([GL_SETUP_MANAGE]))])
def delete_gl_account(
    *,
    db: Session = Depends(get_db),
    account_id: int,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Delete GL account"""
    account = crud.gl.delete_gl_account(db, account_id=account_id, company_id=current_user.company_id)
    if not account:
        raise HTTPException(status_code=404, detail="GL Account not found")
    return account

# Journal Entries endpoints
@router.post("/journal-entries", response_model=schemas.GLJournalEntry, dependencies=[Depends(PermissionChecker([GL_JOURNAL_POST]))])
def create_journal_entry(
    *,
    db: Session = Depends(get_db),
    entry_in: schemas.GLJournalEntryCreate,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Create and post journal entry"""
    try:
        return crud.gl.create_gl_journal_entry(
            db, entry=entry_in, company_id=current_user.company_id, posted_by_user_id=current_user.id
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/journal-entries", response_model=List[schemas.GLJournalEntry], dependencies=[Depends(PermissionChecker([GL_REPORTS_VIEW]))])
def read_journal_entries(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Retrieve journal entries"""
    return crud.gl.get_gl_journal_entries_by_company(
        db, company_id=current_user.company_id, skip=skip, limit=limit,
        start_date=start_date, end_date=end_date
    )

@router.get("/journal-entries/{entry_id}", response_model=schemas.GLJournalEntry, dependencies=[Depends(PermissionChecker([GL_REPORTS_VIEW]))])
def read_journal_entry(
    entry_id: int,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """Get journal entry by ID"""
    entry = crud.gl.get_gl_journal_entry(db, entry_id=entry_id, company_id=current_user.company_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Journal entry not found")
    return entry

@router.post("/journal-entries/{entry_id}/post", response_model=schemas.GLJournalEntry, dependencies=[Depends(PermissionChecker([GL_JOURNAL_POST]))])
def post_journal_entry(
    *,
    db: Session = Depends(get_db),
    entry_id: int,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Post a journal entry and update account balances"""
    try:
        entry = crud.gl.post_gl_journal_entry(db, entry_id=entry_id, company_id=current_user.company_id)
        return entry
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/journal-entries/{entry_id}", response_model=schemas.GLJournalEntry, dependencies=[Depends(PermissionChecker([GL_JOURNAL_POST]))])
def update_journal_entry(
    *,
    db: Session = Depends(get_db),
    entry_id: int,
    entry_in: schemas.GLJournalEntryUpdate,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Update journal entry"""
    entry = crud.gl.get_gl_journal_entry(db, entry_id=entry_id, company_id=current_user.company_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Journal entry not found")
    
    try:
        entry = crud.gl.update_gl_journal_entry(db, entry_db_obj=entry, entry_in=entry_in)
        return entry
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/journal-entries/{entry_id}", dependencies=[Depends(PermissionChecker([GL_JOURNAL_POST]))])
def delete_journal_entry(
    *,
    db: Session = Depends(get_db),
    entry_id: int,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Delete journal entry"""
    try:
        entry = crud.gl.delete_gl_journal_entry(db, entry_id=entry_id, company_id=current_user.company_id)
        if not entry:
            raise HTTPException(status_code=404, detail="Journal entry not found")
        return {"message": "Journal entry deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# GL Transaction Types endpoints
@router.post("/transaction-types", response_model=schemas.GLTransactionType, dependencies=[Depends(PermissionChecker([GL_SETUP_MANAGE]))])
def create_gl_transaction_type(
    *,
    db: Session = Depends(get_db),
    type_in: schemas.GLTransactionTypeCreate,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Create new GL transaction type"""
    return crud.gl.create_gl_transaction_type(db, transaction_type=type_in, company_id=current_user.company_id)

@router.get("/transaction-types", response_model=List[schemas.GLTransactionType], dependencies=[Depends(PermissionChecker([GL_SETUP_MANAGE]))])
def read_gl_transaction_types(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Retrieve GL transaction types"""
    return crud.gl.get_gl_transaction_types_by_company(
        db, company_id=current_user.company_id, skip=skip, limit=limit
    )

@router.get("/transaction-types/{type_id}", response_model=schemas.GLTransactionType, dependencies=[Depends(PermissionChecker([GL_SETUP_MANAGE]))])
def read_gl_transaction_type(
    type_id: int,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """Get GL transaction type by ID"""
    trans_type = crud.gl.get_gl_transaction_type(db, type_id=type_id, company_id=current_user.company_id)
    if not trans_type:
        raise HTTPException(status_code=404, detail="GL Transaction Type not found")
    return trans_type

@router.put("/transaction-types/{type_id}", response_model=schemas.GLTransactionType, dependencies=[Depends(PermissionChecker([GL_SETUP_MANAGE]))])
def update_gl_transaction_type(
    *,
    db: Session = Depends(get_db),
    type_id: int,
    type_in: schemas.GLTransactionTypeUpdate,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Update GL transaction type"""
    trans_type = crud.gl.get_gl_transaction_type(db, type_id=type_id, company_id=current_user.company_id)
    if not trans_type:
        raise HTTPException(status_code=404, detail="GL Transaction Type not found")
    return crud.gl.update_gl_transaction_type(db, type_db_obj=trans_type, type_in=type_in)

@router.delete("/transaction-types/{type_id}", response_model=schemas.GLTransactionType, dependencies=[Depends(PermissionChecker([GL_SETUP_MANAGE]))])
def delete_gl_transaction_type(
    *,
    db: Session = Depends(get_db),
    type_id: int,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Delete GL transaction type"""
    trans_type = crud.gl.delete_gl_transaction_type(db, type_id=type_id, company_id=current_user.company_id)
    if not trans_type:
        raise HTTPException(status_code=404, detail="GL Transaction Type not found")
    return trans_type

# GL Defaults endpoints
@router.get("/defaults", response_model=schemas.GLDefaults, dependencies=[Depends(PermissionChecker([GL_SETUP_MANAGE]))])
def read_gl_defaults(
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """Get GL defaults for company"""
    defaults = crud.gl.get_gl_defaults(db, company_id=current_user.company_id)
    if not defaults:
        # Return empty defaults
        return schemas.GLDefaults(id=0, company_id=current_user.company_id)
    return defaults

@router.put("/defaults", response_model=schemas.GLDefaults, dependencies=[Depends(PermissionChecker([GL_SETUP_MANAGE]))])
def update_gl_defaults(
    *,
    db: Session = Depends(get_db),
    defaults_in: schemas.GLDefaultsUpdate,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Update GL defaults"""
    return crud.gl.create_or_update_gl_defaults(db, defaults_in=defaults_in, company_id=current_user.company_id)

# GL Reports endpoints
@router.get("/reports/trial-balance", response_model=List[schemas.TrialBalanceItem], dependencies=[Depends(PermissionChecker([GL_REPORTS_VIEW]))])
def get_trial_balance(
    end_date: date = Query(..., description="As of date for trial balance"),
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """Get trial balance report"""
    trial_balance = crud.gl.get_trial_balance(db, company_id=current_user.company_id, as_of_date=end_date)
    return trial_balance.accounts

@router.get("/reports/account-transactions", response_model=List[schemas.AccountTransaction], dependencies=[Depends(PermissionChecker([GL_REPORTS_VIEW]))])
def get_account_transactions(
    account_id: int = Query(..., description="GL Account ID"),
    start_date: date = Query(..., description="Start date"),
    end_date: date = Query(..., description="End date"),
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """Get account transaction details"""
    return crud.gl.get_account_transactions(
        db, company_id=current_user.company_id, account_id=account_id,
        start_date=start_date, end_date=end_date
    )
