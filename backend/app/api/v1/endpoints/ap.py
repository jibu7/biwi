from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from datetime import date
from app import crud, models, schemas
from app.core.permissions import PermissionChecker, AP_SETUP_MANAGE, AP_TRANSACTIONS_POST, AP_REPORTS_VIEW
from app.core.security import get_current_active_user
from app.database.database import get_db
from app.middleware.tenant import get_current_tenant_id

router = APIRouter()

# Supplier endpoints
@router.post("/suppliers", response_model=schemas.Supplier, dependencies=[Depends(PermissionChecker([AP_SETUP_MANAGE]))])
async def create_supplier(
    *,
    request: Request,
    db: Session = Depends(get_db),
    supplier_in: schemas.SupplierCreate,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Create new supplier"""
    company_id = get_current_tenant_id(request)
    return crud.ap.create_supplier(db, supplier=supplier_in, company_id=company_id)

@router.get("/suppliers", response_model=List[schemas.Supplier])
async def read_suppliers(
    request: Request,
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    include_inactive: bool = False,
    current_user: models.User = Depends(PermissionChecker([AP_SETUP_MANAGE, AP_TRANSACTIONS_POST, AP_REPORTS_VIEW])),
) -> Any:
    """Retrieve suppliers"""
    company_id = get_current_tenant_id(request)
    return crud.ap.get_suppliers_by_company(
        db, company_id=company_id, skip=skip, limit=limit, include_inactive=include_inactive
    )

@router.get("/suppliers/{supplier_id}", response_model=schemas.Supplier)
async def read_supplier(
    supplier_id: int,
    request: Request,
    current_user: models.User = Depends(PermissionChecker([AP_SETUP_MANAGE, AP_TRANSACTIONS_POST, AP_REPORTS_VIEW])),
    db: Session = Depends(get_db),
) -> Any:
    """Get supplier by ID"""
    company_id = get_current_tenant_id(request)
    supplier = crud.ap.get_supplier(db, supplier_id=supplier_id, company_id=company_id)
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return supplier

@router.put("/suppliers/{supplier_id}", response_model=schemas.Supplier, dependencies=[Depends(PermissionChecker([AP_SETUP_MANAGE]))])
async def update_supplier(
    *,
    request: Request,
    db: Session = Depends(get_db),
    supplier_id: int,
    supplier_in: schemas.SupplierUpdate,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Update supplier"""
    company_id = get_current_tenant_id(request)
    supplier = crud.ap.get_supplier(db, supplier_id=supplier_id, company_id=company_id)
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return crud.ap.update_supplier(db, supplier_db_obj=supplier, supplier_in=supplier_in)

@router.delete("/suppliers/{supplier_id}", response_model=schemas.Supplier, dependencies=[Depends(PermissionChecker([AP_SETUP_MANAGE]))])
def delete_supplier(
    *,
    db: Session = Depends(get_db),
    supplier_id: int,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Delete supplier"""
    supplier = crud.ap.delete_supplier(db, supplier_id=supplier_id, company_id=current_user.company_id)
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return supplier

# AP Transaction Type endpoints
@router.post("/transaction-types", response_model=schemas.APTransactionType, dependencies=[Depends(PermissionChecker([AP_SETUP_MANAGE]))])
def create_ap_transaction_type(
    *,
    db: Session = Depends(get_db),
    type_in: schemas.APTransactionTypeCreate,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Create new AP transaction type"""
    return crud.ap.create_ap_transaction_type(db, trans_type=type_in, company_id=current_user.company_id)

@router.get("/transaction-types", response_model=List[schemas.APTransactionType], dependencies=[Depends(PermissionChecker([AP_SETUP_MANAGE]))])
def read_ap_transaction_types(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Retrieve AP transaction types"""
    return crud.ap.get_ap_transaction_types_by_company(
        db, company_id=current_user.company_id, skip=skip, limit=limit
    )

@router.get("/transaction-types/{type_id}", response_model=schemas.APTransactionType, dependencies=[Depends(PermissionChecker([AP_SETUP_MANAGE]))])
def read_ap_transaction_type(
    type_id: int,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """Get AP transaction type by ID"""
    trans_type = crud.ap.get_ap_transaction_type(db, type_id=type_id, company_id=current_user.company_id)
    if not trans_type:
        raise HTTPException(status_code=404, detail="AP transaction type not found")
    return trans_type

@router.put("/transaction-types/{type_id}", response_model=schemas.APTransactionType, dependencies=[Depends(PermissionChecker([AP_SETUP_MANAGE]))])
def update_ap_transaction_type(
    *,
    db: Session = Depends(get_db),
    type_id: int,
    type_in: schemas.APTransactionTypeUpdate,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Update AP transaction type"""
    trans_type = crud.ap.get_ap_transaction_type(db, type_id=type_id, company_id=current_user.company_id)
    if not trans_type:
        raise HTTPException(status_code=404, detail="AP transaction type not found")
    return crud.ap.update_ap_transaction_type(db, type_db_obj=trans_type, type_in=type_in)

@router.delete("/transaction-types/{type_id}", response_model=schemas.APTransactionType, dependencies=[Depends(PermissionChecker([AP_SETUP_MANAGE]))])
def delete_ap_transaction_type(
    *,
    db: Session = Depends(get_db),
    type_id: int,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Delete AP transaction type"""
    trans_type = crud.ap.delete_ap_transaction_type(db, type_id=type_id, company_id=current_user.company_id)
    if not trans_type:
        raise HTTPException(status_code=404, detail="AP transaction type not found")
    return trans_type

# AP Defaults endpoints
@router.get("/defaults", response_model=schemas.APDefaults, dependencies=[Depends(PermissionChecker([AP_SETUP_MANAGE]))])
def read_ap_defaults(
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """Get AP defaults for company"""
    defaults = crud.ap.get_ap_defaults(db, company_id=current_user.company_id)
    if not defaults:
        return schemas.APDefaults(id=0, company_id=current_user.company_id)
    return defaults

@router.put("/defaults", response_model=schemas.APDefaults, dependencies=[Depends(PermissionChecker([AP_SETUP_MANAGE]))])
def update_ap_defaults(
    *,
    db: Session = Depends(get_db),
    defaults_in: schemas.APDefaultsUpdate,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Update AP defaults"""
    return crud.ap.create_or_update_ap_defaults(db, defaults_in=defaults_in, company_id=current_user.company_id)

# AP Transaction endpoints
@router.post("/transactions", response_model=schemas.APTransaction, dependencies=[Depends(PermissionChecker([AP_TRANSACTIONS_POST]))])
async def create_ap_transaction(
    *,
    request: Request,
    db: Session = Depends(get_db),
    transaction_in: schemas.APTransactionCreate,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Create AP transaction (Supplier Invoice, Payment, Debit Note)"""
    company_id = get_current_tenant_id(request)
    return crud.ap.create_ap_transaction(
        db, ap_transaction_in=transaction_in, company_id=company_id, user_id=current_user.id
    )

@router.get("/transactions", response_model=List[schemas.APTransaction], dependencies=[Depends(PermissionChecker([AP_REPORTS_VIEW]))])
async def read_ap_transactions(
    request: Request,
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    supplier_id: Optional[int] = None,
    transaction_type_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Retrieve AP transactions"""
    company_id = get_current_tenant_id(request)
    return crud.ap.get_ap_transactions(
        db, company_id=company_id, skip=skip, limit=limit,
        supplier_id=supplier_id
    )

@router.get("/transactions/{transaction_id}", response_model=schemas.APTransaction, dependencies=[Depends(PermissionChecker([AP_REPORTS_VIEW]))])
def read_ap_transaction(
    transaction_id: int,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """Get AP transaction by ID"""
    transaction = crud.ap.get_ap_transaction(db, transaction_id=transaction_id, company_id=current_user.company_id)
    if not transaction:
        raise HTTPException(status_code=404, detail="AP transaction not found")
    return transaction

# AP Allocation endpoints
@router.post("/allocations", response_model=schemas.APAllocation, dependencies=[Depends(PermissionChecker([AP_TRANSACTIONS_POST]))])
def create_ap_allocation(
    *,
    db: Session = Depends(get_db),
    allocation_in: schemas.APAllocationCreate,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Create AP allocation"""
    return crud.ap.create_ap_allocation(
        db, allocation_in=allocation_in, company_id=current_user.company_id, user_id=current_user.id
    )

@router.get("/allocations", response_model=List[schemas.APAllocation], dependencies=[Depends(PermissionChecker([AP_REPORTS_VIEW]))])
def read_ap_allocations(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    supplier_id: Optional[int] = None,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Retrieve AP allocations"""
    return crud.ap.get_ap_allocations_by_company(
        db, company_id=current_user.company_id, skip=skip, limit=limit, supplier_id=supplier_id
    )

# AP Reports endpoints
@router.get("/reports/ageing", response_model=List[schemas.SupplierAgeing], dependencies=[Depends(PermissionChecker([AP_REPORTS_VIEW]))])
def get_supplier_ageing(
    as_of_date: date = Query(..., description="As of date for ageing"),
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """Get supplier ageing report"""
    return crud.ap.get_supplier_ageing(db, company_id=current_user.company_id, as_of_date=as_of_date)

@router.get("/reports/supplier-listing", response_model=List[schemas.Supplier], dependencies=[Depends(PermissionChecker([AP_REPORTS_VIEW]))])
def get_supplier_listing(
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """Get supplier listing with balances"""
    return crud.ap.get_suppliers_by_company(db, company_id=current_user.company_id, include_inactive=False)

@router.get("/reports/statement", response_model=dict, dependencies=[Depends(PermissionChecker([AP_REPORTS_VIEW]))])
def get_supplier_statement(
    supplier_id: int = Query(..., description="Supplier ID"),
    start_date: date = Query(..., description="Start date"),
    end_date: date = Query(..., description="End date"),
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """Get supplier statement"""
    return crud.ap.get_supplier_statement_data(
        db, company_id=current_user.company_id, supplier_id=supplier_id,
        start_date=start_date, end_date=end_date
    )
