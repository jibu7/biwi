from sqlalchemy.orm import Session
from sqlalchemy import func, case, distinct
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal
from app import models, schemas
from app.crud import inventory as crud_inventory
from app.crud import ar as crud_ar
from app.crud import gl as crud_gl
from fastapi import HTTPException

# Till CRUD
def create_till(db: Session, till: schemas.TillCreate, company_id: int) -> models.Till:
    db_till = models.Till(
        **till.model_dump(),
        company_id=company_id
    )
    db.add(db_till)
    db.commit()
    db.refresh(db_till)
    return db_till

def get_tills_by_company(db: Session, company_id: int) -> List[models.Till]:
    return db.query(models.Till).filter(
        models.Till.company_id == company_id
    ).all()

def get_till(db: Session, till_id: int, company_id: int) -> Optional[models.Till]:
    return db.query(models.Till).filter(
        models.Till.id == till_id,
        models.Till.company_id == company_id
    ).first()

# POS Transaction Type CRUD
def create_pos_transaction_type(db: Session, trans_type: schemas.POSTransactionTypeCreate, company_id: int) -> models.POSTransactionType:
    db_type = models.POSTransactionType(
        **trans_type.model_dump(),
        company_id=company_id
    )
    db.add(db_type)
    db.commit()
    db.refresh(db_type)
    return db_type

def get_pos_transaction_types_by_company(db: Session, company_id: int) -> List[models.POSTransactionType]:
    return db.query(models.POSTransactionType).filter(
        models.POSTransactionType.company_id == company_id,
        models.POSTransactionType.is_active == True
    ).all()

# POS Defaults CRUD
def get_pos_defaults(db: Session, company_id: int) -> Optional[models.POSDefaults]:
    return db.query(models.POSDefaults).filter(
        models.POSDefaults.company_id == company_id
    ).first()

def update_pos_defaults(db: Session, defaults_in: schemas.POSDefaultsUpdate, company_id: int) -> models.POSDefaults:
    defaults = get_pos_defaults(db, company_id)
    if not defaults:
        # Create if doesn't exist
        defaults = models.POSDefaults(
            **defaults_in.model_dump(exclude_unset=True),
            company_id=company_id
        )
        db.add(defaults)
    else:
        # Update existing
        for field, value in defaults_in.model_dump(exclude_unset=True).items():
            setattr(defaults, field, value)
        db.add(defaults)
    
    db.commit()
    db.refresh(defaults)
    return defaults

# Till CRUD
def create_till(db: Session, till: schemas.TillCreate, company_id: int) -> models.Till:
    db_till = models.Till(
        **till.model_dump(),
        company_id=company_id
    )
    db.add(db_till)
    db.commit()
    db.refresh(db_till)
    return db_till

def get_tills_by_company(db: Session, company_id: int) -> List[models.Till]:
    return db.query(models.Till).filter(
        models.Till.company_id == company_id
    ).all()

def get_till(db: Session, till_id: int, company_id: int) -> Optional[models.Till]:
    return db.query(models.Till).filter(
        models.Till.id == till_id,
        models.Till.company_id == company_id
    ).first()

# POS Session Management
def open_pos_session(
    db: Session, 
    session_in: schemas.POSSessionCreate, 
    company_id: int,
    user_id: int
) -> models.POSSession:
    # Check if till has open session
    existing_session = db.query(models.POSSession).filter(
        models.POSSession.till_id == session_in.till_id,
        models.POSSession.status == "Open"
    ).first()
    
    if existing_session:
        raise HTTPException(400, "Till already has an open session")
    
    db_session = models.POSSession(
        **session_in.model_dump(),
        company_id=company_id,
        cashier_id=user_id,
        opening_time=datetime.utcnow(),
        expected_cash=session_in.opening_cash,
        status="Open"
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session

def close_pos_session(
    db: Session,
    session_id: int,
    closing_cash: Decimal,
    company_id: int,
    user_id: int
) -> models.POSSession:
    session = db.query(models.POSSession).filter(
        models.POSSession.id == session_id,
        models.POSSession.company_id == company_id,
        models.POSSession.status == "Open"
    ).first()
    
    if not session:
        raise HTTPException(404, "Open session not found")
    
    # Calculate expected cash
    # Start with opening cash
    expected = session.opening_cash
    
    # Add cash sales
    cash_sales = db.query(
        func.sum(models.POSTransaction.total_amount)
    ).filter(
        models.POSTransaction.session_id == session_id,
        models.POSTransaction.payment_method == "Cash",
        models.POSTransaction.status == "Completed"
    ).scalar() or Decimal("0")
    
    expected += cash_sales
    
    # Add cash movements
    cash_movements = db.query(
        func.sum(
            case(
                (models.POSCashMovement.movement_type == "CashIn", models.POSCashMovement.amount),
                (models.POSCashMovement.movement_type == "CashOut", -models.POSCashMovement.amount),
                else_=0
            )
        )
    ).filter(
        models.POSCashMovement.session_id == session_id
    ).scalar() or Decimal("0")
    
    expected += cash_movements
    
    # Update session
    session.closing_time = datetime.utcnow()
    session.closing_cash = closing_cash
    session.expected_cash = expected
    session.cash_variance = closing_cash - expected
    session.status = "Closed"
    
    db.add(session)
    db.commit()
    db.refresh(session)
    
    # Post cash variance to GL if any
    if session.cash_variance != 0:
        till = db.query(models.Till).filter(models.Till.id == session.till_id).first()
        variance_account = db.query(models.GLAccount).filter(
            models.GLAccount.account_code == "CASH_VARIANCE",
            models.GLAccount.company_id == company_id
        ).first()
        
        if variance_account:
            # Create journal entry for variance
            journal_lines = []
            if session.cash_variance > 0:
                # Cash over
                journal_lines.append({
                    "gl_account_id": till.cash_gl_account_id,
                    "debit_amount": session.cash_variance,
                    "credit_amount": 0
                })
                journal_lines.append({
                    "gl_account_id": variance_account.id,
                    "debit_amount": 0,
                    "credit_amount": session.cash_variance
                })
            else:
                # Cash short
                journal_lines.append({
                    "gl_account_id": variance_account.id,
                    "debit_amount": abs(session.cash_variance),
                    "credit_amount": 0
                })
                journal_lines.append({
                    "gl_account_id": till.cash_gl_account_id,
                    "debit_amount": 0,
                    "credit_amount": abs(session.cash_variance)
                })
            
            crud_gl.create_journal_entry(
                db,
                schemas.GLJournalEntryCreate(
                    entry_date=date.today(),
                    reference=f"POS_VARIANCE_{session_id}",
                    description=f"Cash variance for POS session {session_id}",
                    lines=journal_lines
                ),
                company_id,
                user_id
            )
    
    return session

def get_active_session(
    db: Session,
    till_id: int,
    company_id: int
) -> Optional[models.POSSession]:
    """Get the currently active (open) POS session for a till"""
    return db.query(models.POSSession).filter(
        models.POSSession.till_id == till_id,
        models.POSSession.company_id == company_id,
        models.POSSession.status == "Open"
    ).first()

# POS Transaction Processing
def process_pos_sale(
    db: Session,
    sale_in: schemas.POSTransactionCreate,
    session_id: int,
    company_id: int,
    user_id: int
) -> models.POSTransaction:
    # Get session and validate
    session = db.query(models.POSSession).filter(
        models.POSSession.id == session_id,
        models.POSSession.company_id == company_id,
        models.POSSession.status == "Open"
    ).first()
    
    if not session:
        raise HTTPException(404, "Active session not found")
    
    # Get POS defaults
    pos_defaults = db.query(models.POSDefaults).filter(
        models.POSDefaults.company_id == company_id
    ).first()
    
    # Calculate totals
    subtotal = Decimal("0")
    tax_total = Decimal("0")
    discount_total = Decimal("0")
    
    for line in sale_in.lines:
        line_subtotal = line.quantity * line.unit_price
        line_discount = line_subtotal * (line.discount_percentage / 100) + line.discount_amount
        line_net = line_subtotal - line_discount
        
        subtotal += line_net
        tax_total += line.tax_amount
        discount_total += line_discount
    
    total = subtotal + tax_total
    
    # Calculate change for cash payments
    change_amount = Decimal("0")
    if sale_in.payment_method == "Cash" and sale_in.cash_tendered:
        change_amount = sale_in.cash_tendered - total
        if change_amount < 0:
            raise HTTPException(400, "Insufficient cash tendered")
    
    # Generate transaction number
    trans_date = datetime.now()
    trans_number = f"POS-{trans_date.strftime('%Y%m%d')}-{pos_defaults.next_transaction_number:04d}"
    
    # Create transaction
    db_transaction = models.POSTransaction(
        company_id=company_id,
        session_id=session_id,
        transaction_type_id=sale_in.transaction_type_id,
        transaction_number=trans_number,
        transaction_datetime=trans_date,
        customer_id=sale_in.customer_id or pos_defaults.default_customer_id,
        payment_method=sale_in.payment_method,
        subtotal_amount=subtotal,
        tax_amount=tax_total,
        discount_amount=discount_total,
        total_amount=total,
        cash_tendered=sale_in.cash_tendered,
        change_amount=change_amount,
        reference_transaction_id=sale_in.reference_transaction_id,
        status="Completed",
        notes=sale_in.notes
    )
    db.add(db_transaction)
    db.flush()  # Get transaction ID
    
    # Create transaction lines
    for line_in in sale_in.lines:
        db_line = models.POSTransactionLine(
            transaction_id=db_transaction.id,
            **line_in.model_dump()
        )
        db.add(db_line)
    
    # Update POS defaults transaction number
    pos_defaults.next_transaction_number += 1
    db.add(pos_defaults)
    
    # Process inventory movements
    trans_type = db.query(models.POSTransactionType).filter(
        models.POSTransactionType.id == sale_in.transaction_type_id
    ).first()
    
    if trans_type.affects_inventory:
        till = db.query(models.Till).filter(models.Till.id == session.till_id).first()
        
        for line in sale_in.lines:
            # For sales, decrease inventory; for returns, increase
            quantity = -line.quantity if trans_type.base_type == "Sale" else line.quantity
            
            crud_inventory.process_inventory_adjustment(
                db,
                schemas.InventoryAdjustmentCreate(
                    item_id=line.item_id,
                    warehouse_id=till.default_warehouse_id,
                    quantity=quantity,
                    inventory_transaction_type_id=1,  # Should be mapped properly
                    reference_document_type="POS_Transaction",
                    reference_document_id=db_transaction.id
                ),
                company_id,
                user_id
            )
    
    # Create AR transaction if customer sale
    if trans_type.affects_ar and sale_in.customer_id and sale_in.payment_method == "Credit":
        ar_trans = crud_ar.create_ar_transaction(
            db,
            schemas.ARTransactionCreate(
                customer_id=sale_in.customer_id,
                ar_transaction_type_id=1,  # Should be mapped to POS Invoice type
                transaction_date=date.today(),
                reference=trans_number,
                document_number=trans_number,
                total_amount=total,
                open_amount=total
            ),
            company_id,
            user_id
        )
        db_transaction.linked_ar_transaction_id = ar_trans.id
    
    # GL Posting
    till = db.query(models.Till).filter(models.Till.id == session.till_id).first()
    journal_lines = []
    
    # Debit: Cash/Bank/AR account
    if sale_in.payment_method == "Cash":
        debit_account_id = till.cash_gl_account_id
    elif sale_in.payment_method == "Credit" and db_transaction.linked_ar_transaction_id:
        # AR Control account
        ar_defaults = db.query(models.ARDefaults).filter(
            models.ARDefaults.company_id == company_id
        ).first()
        debit_account_id = ar_defaults.default_ar_control_gl_account_id
    else:
        # Card/EFT - use bank account from POS defaults
        debit_account_id = till.cash_gl_account_id  # Should have separate card GL account
    
    journal_lines.append({
        "gl_account_id": debit_account_id,
        "debit_amount": total,
        "credit_amount": 0,
        "description": f"POS Sale {trans_number}"
    })
    
    # Credit: Sales accounts (could be multiple based on items)
    # Simplified - using default sales account
    inv_defaults = db.query(models.InventoryDefaults).filter(
        models.InventoryDefaults.company_id == company_id
    ).first()
    
    journal_lines.append({
        "gl_account_id": inv_defaults.default_sales_revenue_gl_account_id,
        "debit_amount": 0,
        "credit_amount": subtotal,
        "description": f"POS Sale {trans_number}"
    })
    
    # Tax if applicable
    if tax_total > 0:
        # Get tax GL account from tax type
        journal_lines.append({
            "gl_account_id": 1,  # Should get from tax type
            "debit_amount": 0,
            "credit_amount": tax_total,
            "description": f"Tax for POS Sale {trans_number}"
        })
    
    # Create GL journal entry
    gl_entry = crud_gl.create_journal_entry(
        db,
        schemas.GLJournalEntryCreate(
            entry_date=date.today(),
            reference=trans_number,
            description=f"POS {trans_type.base_type} - {trans_number}",
            lines=journal_lines
        ),
        company_id,
        user_id
    )
    
    db_transaction.linked_gl_journal_entry_id = gl_entry.id
    
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    
    return db_transaction

def process_pos_return(
    db: Session,
    return_in: schemas.POSTransactionCreate,
    session_id: int,
    company_id: int,
    user_id: int
) -> models.POSTransaction:
    # Validate original transaction
    if not return_in.reference_transaction_id:
        raise HTTPException(400, "Original transaction reference required for returns")
    
    original_trans = db.query(models.POSTransaction).filter(
        models.POSTransaction.id == return_in.reference_transaction_id,
        models.POSTransaction.company_id == company_id
    ).first()
    
    if not original_trans:
        raise HTTPException(404, "Original transaction not found")
    
    # Process as negative sale
    return process_pos_sale(db, return_in, session_id, company_id, user_id)

def get_pos_transaction(
    db: Session,
    transaction_id: int,
    company_id: int
) -> Optional[models.POSTransaction]:
    """Get a specific POS transaction by ID"""
    return db.query(models.POSTransaction).filter(
        models.POSTransaction.id == transaction_id,
        models.POSTransaction.company_id == company_id
    ).first()

# Cash Management
def record_cash_movement(
    db: Session,
    movement_in: schemas.POSCashMovementCreate,
    session_id: int,
    company_id: int,
    user_id: int
) -> models.POSCashMovement:
    # Validate session
    session = db.query(models.POSSession).filter(
        models.POSSession.id == session_id,
        models.POSSession.company_id == company_id,
        models.POSSession.status == "Open"
    ).first()
    
    if not session:
        raise HTTPException(404, "Active session not found")
    
    db_movement = models.POSCashMovement(
        **movement_in.model_dump(),
        company_id=company_id,
        session_id=session_id,
        movement_datetime=datetime.utcnow()
    )
    db.add(db_movement)
    db.commit()
    db.refresh(db_movement)
    
    return db_movement

# Reporting
def get_cashier_sales_report(
    db: Session,
    company_id: int,
    start_date: date,
    end_date: date,
    cashier_id: Optional[int] = None
) -> List[dict]:
    query = db.query(
        models.POSSession.cashier_id,
        models.User.full_name.label("cashier_name"),
        func.count(distinct(models.POSSession.id)).label("session_count"),
        func.sum(
            case(
                (models.POSTransaction.transaction_type.has(base_type="Sale"), 
                 models.POSTransaction.total_amount),
                else_=0
            )
        ).label("total_sales"),
        func.sum(
            case(
                (models.POSTransaction.transaction_type.has(base_type="Return"), 
                 models.POSTransaction.total_amount),
                else_=0
            )
        ).label("total_returns")
    ).join(
        models.User,
        models.POSSession.cashier_id == models.User.id
    ).join(
        models.POSTransaction,
        models.POSSession.id == models.POSTransaction.session_id
    ).filter(
        models.POSSession.company_id == company_id,
        models.POSSession.session_date >= start_date,
        models.POSSession.session_date <= end_date,
        models.POSTransaction.status == "Completed"
    )
    
    if cashier_id:
        query = query.filter(models.POSSession.cashier_id == cashier_id)
    
    query = query.group_by(models.POSSession.cashier_id, models.User.full_name)
    
    results = []
    for row in query.all():
        results.append({
            "cashier_id": row.cashier_id,
            "cashier_name": row.cashier_name,
            "session_count": row.session_count,
            "total_sales": row.total_sales or Decimal("0"),
            "total_returns": row.total_returns or Decimal("0"),
            "net_sales": (row.total_sales or 0) - (row.total_returns or 0),
            "cash_sales": Decimal("0"),  # Would need separate query by payment method
            "card_sales": Decimal("0"),
            "other_sales": Decimal("0")
        })
    
    return results

def get_inventory_sales_report(
    db: Session,
    company_id: int,
    start_date: date,
    end_date: date,
    warehouse_id: Optional[int] = None
) -> List[dict]:
    # Query item sales from POS transactions
    query = db.query(
        models.POSTransactionLine.item_id,
        models.InventoryItem.item_code,
        models.InventoryItem.description,
        func.sum(
            case(
                (models.POSTransaction.transaction_type.has(base_type="Sale"),
                 models.POSTransactionLine.quantity),
                else_=0
            )
        ).label("quantity_sold"),
        func.sum(
            case(
                (models.POSTransaction.transaction_type.has(base_type="Return"),
                 models.POSTransactionLine.quantity),
                else_=0
            )
        ).label("quantity_returned"),
        func.sum(
            case(
                (models.POSTransaction.transaction_type.has(base_type="Sale"),
                 models.POSTransactionLine.line_total),
                else_=0
            )
        ).label("sales_amount"),
        func.sum(
            case(
                (models.POSTransaction.transaction_type.has(base_type="Return"),
                 models.POSTransactionLine.line_total),
                else_=0
            )
        ).label("return_amount")
    ).join(
        models.POSTransaction,
        models.POSTransactionLine.transaction_id == models.POSTransaction.id
    ).join(
        models.InventoryItem,
        models.POSTransactionLine.item_id == models.InventoryItem.id
    ).filter(
        models.POSTransaction.company_id == company_id,
        models.POSTransaction.transaction_datetime >= start_date,
        models.POSTransaction.transaction_datetime <= end_date,
        models.POSTransaction.status == "Completed"
    )
    
    if warehouse_id:
        query = query.join(
            models.POSSession,
            models.POSTransaction.session_id == models.POSSession.id
        ).join(
            models.Till,
            models.POSSession.till_id == models.Till.id
        ).filter(
            models.Till.default_warehouse_id == warehouse_id
        )
    
    query = query.group_by(
        models.POSTransactionLine.item_id,
        models.InventoryItem.item_code,
        models.InventoryItem.description
    )
    
    results = []
    for row in query.all():
        results.append({
            "item_id": row.item_id,
            "item_code": row.item_code,
            "description": row.description,
            "quantity_sold": row.quantity_sold or Decimal("0"),
            "quantity_returned": row.quantity_returned or Decimal("0"),
            "net_quantity": (row.quantity_sold or 0) - (row.quantity_returned or 0),
            "sales_amount": row.sales_amount or Decimal("0"),
            "return_amount": row.return_amount or Decimal("0"),
            "net_amount": (row.sales_amount or 0) - (row.return_amount or 0)
        })
    
    return results
