from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models, schemas, crud
from app.core.permissions import (
    POS_SETUP_MANAGE, POS_TILL_MANAGE, POS_SESSION_OPEN, POS_SESSION_CLOSE,
    POS_SALES_PROCESS, POS_RETURNS_PROCESS, POS_CASH_MANAGE, POS_REPORTS_VIEW,
    PermissionChecker
)
from app.database.database import get_db
from datetime import date

router = APIRouter()

# Till Management
@router.post("/tills", response_model=schemas.Till)
def create_till(
    till_in: schemas.TillCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        PermissionChecker([POS_TILL_MANAGE])
    )
):
    return crud.pos.create_till(db, till_in, current_user.company_id)

@router.get("/tills", response_model=List[schemas.Till])
def list_tills(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        PermissionChecker([POS_TILL_MANAGE])
    )
):
    return crud.pos.get_tills_by_company(db, current_user.company_id)

@router.get("/tills/{till_id}", response_model=schemas.Till)
def get_till(
    till_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        PermissionChecker([POS_TILL_MANAGE])
    )
):
    till = crud.pos.get_till(db, till_id, current_user.company_id)
    if not till:
        raise HTTPException(404, "Till not found")
    return till

# POS Transaction Types
@router.post("/transaction-types", response_model=schemas.POSTransactionType)
def create_transaction_type(
    type_in: schemas.POSTransactionTypeCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        PermissionChecker([POS_SETUP_MANAGE])
    )
):
    return crud.pos.create_pos_transaction_type(db, type_in, current_user.company_id)

@router.get("/transaction-types", response_model=List[schemas.POSTransactionType])
def list_transaction_types(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        PermissionChecker([POS_SETUP_MANAGE, POS_SALES_PROCESS])
    )
):
    return crud.pos.get_pos_transaction_types_by_company(db, current_user.company_id)

# POS Defaults
@router.get("/defaults", response_model=schemas.POSDefaults)
def get_pos_defaults(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        PermissionChecker([POS_SETUP_MANAGE])
    )
):
    defaults = crud.pos.get_pos_defaults(db, current_user.company_id)
    if not defaults:
        raise HTTPException(404, "POS defaults not configured")
    return defaults

@router.put("/defaults", response_model=schemas.POSDefaults)
def update_pos_defaults(
    defaults_in: schemas.POSDefaultsUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        PermissionChecker([POS_SETUP_MANAGE])
    )
):
    return crud.pos.update_pos_defaults(db, defaults_in, current_user.company_id)

# Session Management
@router.post("/sessions/open", response_model=schemas.POSSession)
def open_session(
    session_in: schemas.POSSessionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        PermissionChecker([POS_SESSION_OPEN])
    )
):
    return crud.pos.open_pos_session(
        db, session_in, current_user.company_id, current_user.id
    )

@router.get("/sessions/active", response_model=schemas.POSSession)
def get_active_session(
    till_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        PermissionChecker([POS_SALES_PROCESS])
    )
):
    session = crud.pos.get_active_session(db, till_id, current_user.company_id)
    if not session:
        raise HTTPException(404, "No active session for this till")
    return session

@router.post("/sessions/{session_id}/close", response_model=schemas.POSSession)
def close_session(
    session_id: int,
    close_data: schemas.POSSessionClose,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        PermissionChecker([POS_SESSION_CLOSE])
    )
):
    return crud.pos.close_pos_session(
        db, session_id, close_data.closing_cash, 
        current_user.company_id, current_user.id
    )

# Sales Processing
@router.post("/sessions/{session_id}/sales", response_model=schemas.POSTransaction)
def process_sale(
    session_id: int,
    sale_in: schemas.POSTransactionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        PermissionChecker([POS_SALES_PROCESS])
    )
):
    return crud.pos.process_pos_sale(
        db, sale_in, session_id, current_user.company_id, current_user.id
    )

@router.post("/sessions/{session_id}/returns", response_model=schemas.POSTransaction)
def process_return(
    session_id: int,
    return_in: schemas.POSTransactionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        PermissionChecker([POS_RETURNS_PROCESS])
    )
):
    return crud.pos.process_pos_return(
        db, return_in, session_id, current_user.company_id, current_user.id
    )

@router.get("/transactions/{transaction_id}", response_model=schemas.POSTransaction)
def get_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        PermissionChecker([POS_SALES_PROCESS])
    )
):
    transaction = crud.pos.get_pos_transaction(
        db, transaction_id, current_user.company_id
    )
    if not transaction:
        raise HTTPException(404, "Transaction not found")
    return transaction

# Cash Management
@router.post("/sessions/{session_id}/cash-movements", response_model=schemas.POSCashMovement)
def record_cash_movement(
    session_id: int,
    movement_in: schemas.POSCashMovementCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        PermissionChecker([POS_CASH_MANAGE])
    )
):
    return crud.pos.record_cash_movement(
        db, movement_in, session_id, current_user.company_id, current_user.id
    )

# Reports
@router.get("/reports/cashier-sales", response_model=List[schemas.CashierSalesReport])
def cashier_sales_report(
    start_date: date,
    end_date: date,
    cashier_id: int = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        PermissionChecker([POS_REPORTS_VIEW])
    )
):
    return crud.pos.get_cashier_sales_report(
        db, current_user.company_id, start_date, end_date, cashier_id
    )

@router.get("/reports/inventory-sales", response_model=List[schemas.InventorySalesReport])
def inventory_sales_report(
    start_date: date,
    end_date: date,
    warehouse_id: int = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        PermissionChecker([POS_REPORTS_VIEW])
    )
):
    return crud.pos.get_inventory_sales_report(
        db, current_user.company_id, start_date, end_date, warehouse_id
    )
