from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import date, datetime
from app import models, schemas, crud
from app.api import deps
from app.core import permissions
from app.core.permissions import PermissionChecker
from app.database.database import get_db

router = APIRouter()

# Till Management
@router.post("/tills", response_model=schemas.Till)
def create_till(
    till_in: schemas.TillCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        PermissionChecker([permissions.POS_SETUP_MANAGE])
    )
):
    """Create new POS till"""
    return crud.pos.create_till(db, till_in, current_user.company_id)

@router.get("/tills", response_model=List[schemas.Till])
def list_tills(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        PermissionChecker([permissions.POS_TILL_OPERATE])
    )
):
    """List all tills for the company"""
    return crud.pos.get_tills(db, current_user.company_id, skip, limit)

@router.get("/tills/{till_id}", response_model=schemas.Till)
def get_till(
    till_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        PermissionChecker([permissions.POS_TILL_OPERATE])
    )
):
    """Get specific till details"""
    till = crud.pos.get_till(db, till_id, current_user.company_id)
    if not till:
        raise HTTPException(status_code=404, detail="Till not found")
    return till

# Till Session Management
@router.post("/sessions/open", response_model=schemas.TillSession)
def open_till_session(
    session_data: schemas.TillSessionOpen,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        PermissionChecker([permissions.POS_TILL_OPERATE])
    )
):
    """Open a new till session"""
    return crud.pos.open_till_session(
        db, session_data, current_user.company_id, current_user.id
    )

@router.get("/sessions/current/{till_id}", response_model=schemas.TillSession)
def get_current_session(
    till_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        PermissionChecker([permissions.POS_TILL_OPERATE])
    )
):
    """Get current open session for a till"""
    session = crud.pos.get_current_till_session(
        db, till_id, current_user.company_id
    )
    if not session:
        raise HTTPException(status_code=404, detail="No open session found")
    return session

@router.post("/sessions/{session_id}/close", response_model=schemas.TillSession)
def close_till_session(
    session_id: int,
    close_data: schemas.TillSessionClose,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        PermissionChecker([permissions.POS_TILL_OPERATE])
    )
):
    """Close till session with cash count"""
    return crud.pos.close_till_session(
        db, session_id, close_data, current_user.company_id
    )

@router.post("/sessions/{session_id}/reconcile", response_model=schemas.TillSession)
def reconcile_session(
    session_id: int,
    reconciliation_data: schemas.TillSessionReconcile,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        PermissionChecker([permissions.POS_RECONCILE])
    )
):
    """Reconcile closed till session"""
    return crud.pos.reconcile_till_session(
        db, session_id, reconciliation_data, current_user.company_id
    )

# POS Transactions
@router.post("/transactions", response_model=schemas.POSTransactionRead)
def create_sale(
    transaction_data: schemas.POSTransactionCreate,
    till_session_id: int = Query(..., description="Active till session ID"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        PermissionChecker([permissions.POS_SALES_CREATE])
    )
):
    """Create new POS sale transaction"""
    return crud.pos.create_pos_transaction(
        db, transaction_data, till_session_id, 
        current_user.company_id, current_user.id
    )

@router.post("/transactions/return", response_model=schemas.POSTransactionRead)
def process_return(
    return_data: schemas.POSReturnCreate,
    till_session_id: int = Query(..., description="Active till session ID"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        PermissionChecker([permissions.POS_RETURNS_PROCESS])
    )
):
    """Process POS return transaction"""
    return crud.pos.process_pos_return(
        db, return_data, till_session_id,
        current_user.company_id, current_user.id
    )

@router.get("/transactions/{transaction_id}", response_model=schemas.POSTransactionRead)
def get_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        PermissionChecker([permissions.POS_REPORTS_VIEW])
    )
):
    """Get specific transaction details"""
    transaction = db.query(models.POSTransaction).filter(
        models.POSTransaction.id == transaction_id,
        models.POSTransaction.company_id == current_user.company_id
    ).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return transaction

# Receipt Operations
@router.get("/transactions/{transaction_id}/receipt", response_model=schemas.ReceiptData)
def get_receipt_data(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        PermissionChecker([permissions.POS_TILL_OPERATE])
    )
):
    """Get receipt data for printing"""
    transaction = db.query(models.POSTransaction).filter(
        models.POSTransaction.id == transaction_id,
        models.POSTransaction.company_id == current_user.company_id
    ).first()
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Get related data
    session = db.query(models.TillSession).filter(
        models.TillSession.id == transaction.till_session_id
    ).first()
    
    till = db.query(models.Till).filter(
        models.Till.id == session.till_id
    ).first()
    
    company = db.query(models.Company).filter(
        models.Company.id == current_user.company_id
    ).first()
    
    pos_defaults = db.query(models.POSDefaults).filter(
        models.POSDefaults.company_id == current_user.company_id
    ).first()
    
    cashier = db.query(models.User).filter(
        models.User.id == session.user_id
    ).first()
    
    return schemas.ReceiptData(
        transaction=transaction,
        company_info={
            "name": company.name,
            "address": company.address,
            "contact_info": company.contact_info
        },
        till_info={
            "till_number": till.till_number,
            "name": till.name
        },
        cashier_name=cashier.full_name,
        receipt_header=pos_defaults.receipt_header if pos_defaults else None,
        receipt_footer=pos_defaults.receipt_footer if pos_defaults else None
    )

@router.post("/transactions/{transaction_id}/receipt/print")
def mark_receipt_printed(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        PermissionChecker([permissions.POS_TILL_OPERATE])
    )
):
    """Mark receipt as printed"""
    transaction = db.query(models.POSTransaction).filter(
        models.POSTransaction.id == transaction_id,
        models.POSTransaction.company_id == current_user.company_id
    ).first()
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    transaction.receipt_printed = True
    db.commit()
    
    return {"status": "success", "message": "Receipt marked as printed"}

# POS Configuration
@router.get("/transaction-types", response_model=List[schemas.POSTransactionType])
def list_transaction_types(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        PermissionChecker([permissions.POS_SETUP_MANAGE])
    )
):
    """List POS transaction types"""
    return db.query(models.POSTransactionType).filter(
        models.POSTransactionType.company_id == current_user.company_id
    ).offset(skip).limit(limit).all()

@router.post("/transaction-types", response_model=schemas.POSTransactionType)
def create_transaction_type(
    type_in: schemas.POSTransactionTypeCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        PermissionChecker([permissions.POS_SETUP_MANAGE])
    )
):
    """Create POS transaction type"""
    db_type = models.POSTransactionType(
        **type_in.model_dump(),
        company_id=current_user.company_id
    )
    db.add(db_type)
    db.commit()
    db.refresh(db_type)
    return db_type

@router.get("/defaults", response_model=schemas.POSDefaults)
def get_pos_defaults(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        PermissionChecker([permissions.POS_SETUP_MANAGE])
    )
):
    """Get POS defaults for company"""
    defaults = db.query(models.POSDefaults).filter(
        models.POSDefaults.company_id == current_user.company_id
    ).first()
    
    if not defaults:
        # Create default settings
        defaults = models.POSDefaults(company_id=current_user.company_id)
        db.add(defaults)
        db.commit()
        db.refresh(defaults)
    
    return defaults

@router.put("/defaults", response_model=schemas.POSDefaults)
def update_pos_defaults(
    defaults_in: schemas.POSDefaultsUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        PermissionChecker([permissions.POS_SETUP_MANAGE])
    )
):
    """Update POS defaults"""
    defaults = db.query(models.POSDefaults).filter(
        models.POSDefaults.company_id == current_user.company_id
    ).first()
    
    if not defaults:
        defaults = models.POSDefaults(company_id=current_user.company_id)
        db.add(defaults)
    
    for field, value in defaults_in.model_dump(exclude_unset=True).items():
        setattr(defaults, field, value)
    
    db.commit()
    db.refresh(defaults)
    return defaults

# Reports
@router.get("/reports/daily-summary")
def get_daily_summary(
    date: date = Query(..., description="Date for summary"),
    till_id: Optional[int] = Query(None, description="Filter by till"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        PermissionChecker([permissions.POS_REPORTS_VIEW])
    )
):
    """Get daily sales summary"""
    return crud.pos.get_daily_sales_summary(
        db, current_user.company_id, till_id, date
    )

@router.get("/reports/cashier-sales")
def get_cashier_sales(
    start_date: date = Query(...),
    end_date: date = Query(...),
    user_id: Optional[int] = Query(None, description="Filter by cashier"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        PermissionChecker([permissions.POS_REPORTS_VIEW])
    )
):
    """Get sales by cashier report"""
    return crud.pos.get_cashier_sales_report(
        db, current_user.company_id, start_date, end_date, user_id
    )

@router.get("/reports/item-sales")
def get_item_sales(
    start_date: date = Query(...),
    end_date: date = Query(...),
    top_n: int = Query(50, description="Number of top items to return"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        PermissionChecker([permissions.POS_REPORTS_VIEW])
    )
):
    """Get top selling items report"""
    return crud.pos.get_item_sales_report(
        db, current_user.company_id, start_date, end_date, top_n
    )

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
