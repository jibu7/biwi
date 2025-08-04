from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal
from app import models, schemas
from app.crud import inventory as crud_inventory
from app.crud import ar as crud_ar
from app.crud import gl as crud_gl
from fastapi import HTTPException, status

# Till CRUD
def create_till(db: Session, till: schemas.TillCreate, company_id: int) -> models.Till:
    db_till = models.Till(**till.model_dump(), company_id=company_id)
    db.add(db_till)
    db.commit()
    db.refresh(db_till)
    return db_till

def get_tills(db: Session, company_id: int, skip: int = 0, limit: int = 100) -> List[models.Till]:
    return db.query(models.Till).filter(
        models.Till.company_id == company_id
    ).offset(skip).limit(limit).all()

def get_till(db: Session, till_id: int, company_id: int) -> Optional[models.Till]:
    return db.query(models.Till).filter(
        models.Till.id == till_id,
        models.Till.company_id == company_id
    ).first()

# Till Session Management
def open_till_session(
    db: Session, 
    session_data: schemas.TillSessionOpen, 
    company_id: int, 
    user_id: int
) -> models.TillSession:
    # Check if till has an open session
    existing_session = db.query(models.TillSession).filter(
        models.TillSession.till_id == session_data.till_id,
        models.TillSession.status == "Open"
    ).first()
    
    if existing_session:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Till already has an open session"
        )
    
    db_session = models.TillSession(
        company_id=company_id,
        till_id=session_data.till_id,
        user_id=user_id,
        opening_balance=session_data.opening_balance,
        status="Open"
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session

def get_current_till_session(
    db: Session, 
    till_id: int, 
    company_id: int
) -> Optional[models.TillSession]:
    return db.query(models.TillSession).filter(
        models.TillSession.till_id == till_id,
        models.TillSession.company_id == company_id,
        models.TillSession.status == "Open"
    ).first()

def close_till_session(
    db: Session,
    session_id: int,
    close_data: schemas.TillSessionClose,
    company_id: int
) -> models.TillSession:
    session = db.query(models.TillSession).filter(
        models.TillSession.id == session_id,
        models.TillSession.company_id == company_id,
        models.TillSession.status == "Open"
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Open session not found"
        )
    
    # Calculate expected closing balance
    total_sales = db.query(func.sum(models.POSTransaction.total_amount)).filter(
        models.POSTransaction.till_session_id == session_id,
        models.POSTransaction.status == "Completed",
        models.POSTransaction.payment_method == "Cash"
    ).scalar() or Decimal(0)
    
    expected_closing = session.opening_balance + total_sales
    variance = close_data.actual_closing_balance - expected_closing
    
    session.closing_date = datetime.utcnow()
    session.expected_closing_balance = expected_closing
    session.actual_closing_balance = close_data.actual_closing_balance
    session.variance = variance
    session.reconciliation_notes = close_data.reconciliation_notes
    session.status = "Closed"
    
    db.commit()
    db.refresh(session)
    return session

# POS Transaction Processing
def create_pos_transaction(
    db: Session,
    transaction_data: schemas.POSTransactionCreate,
    till_session_id: int,
    company_id: int,
    user_id: int
) -> models.POSTransaction:
    # Validate session is open
    session = db.query(models.TillSession).filter(
        models.TillSession.id == till_session_id,
        models.TillSession.status == "Open"
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No open till session found"
        )
    
    # Get till and defaults
    till = db.query(models.Till).filter(models.Till.id == session.till_id).first()
    pos_defaults = db.query(models.POSDefaults).filter(
        models.POSDefaults.company_id == company_id
    ).first()
    
    # Generate transaction number
    transaction_number = generate_pos_transaction_number(db, company_id)
    
    # Calculate totals
    subtotal = Decimal(0)
    tax_amount = Decimal(0)
    
    # Create transaction
    db_transaction = models.POSTransaction(
        company_id=company_id,
        till_session_id=till_session_id,
        transaction_number=transaction_number,
        transaction_type_id=transaction_data.transaction_type_id,
        customer_id=transaction_data.customer_id or (pos_defaults.default_walk_in_customer_id if pos_defaults else None),
        subtotal=subtotal,
        tax_amount=tax_amount,
        discount_amount=transaction_data.discount_amount,
        total_amount=Decimal(0),
        payment_method="Mixed" if len(transaction_data.payments) > 1 else transaction_data.payments[0].payment_method,
        status="Completed"
    )
    db.add(db_transaction)
    db.flush()
    
    # Process lines
    for line_data in transaction_data.lines:
        item = db.query(models.InventoryItem).filter(
            models.InventoryItem.id == line_data.item_id
        ).first()
        
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Item {line_data.item_id} not found"
            )
        
        # Calculate line amounts
        line_subtotal = line_data.quantity * line_data.unit_price
        line_discount = (line_subtotal * line_data.discount_percentage / 100) + line_data.discount_amount
        line_after_discount = line_subtotal - line_discount
        
        # Calculate tax
        line_tax = Decimal(0)
        if line_data.tax_type_id:
            tax_type = db.query(models.TaxType).filter(
                models.TaxType.id == line_data.tax_type_id
            ).first()
            if tax_type:
                line_tax = line_after_discount * tax_type.rate_percentage / 100
        
        line_total = line_after_discount + line_tax
        
        # Create line
        db_line = models.POSTransactionLine(
            transaction_id=db_transaction.id,
            item_id=item.id,
            description=item.description,
            quantity=line_data.quantity,
            unit_price=line_data.unit_price,
            discount_percentage=line_data.discount_percentage,
            discount_amount=line_data.discount_amount,
            tax_type_id=line_data.tax_type_id,
            tax_amount=line_tax,
            line_total=line_total
        )
        db.add(db_line)
        
        subtotal += line_subtotal
        tax_amount += line_tax
        
        # Update inventory
        inventory_transaction_type = db.query(models.InventoryTransactionType).filter(
            models.InventoryTransactionType.company_id == company_id,
            models.InventoryTransactionType.base_type == "SaleToCustomer"
        ).first()
        
        if inventory_transaction_type:
            crud_inventory.process_inventory_adjustment(
                db=db,
                adjustment_in=schemas.InventoryAdjustmentCreate(
                    item_id=item.id,
                    warehouse_id=till.default_warehouse_id,
                    quantity=-line_data.quantity,  # Negative for sales
                    unit_cost=item.average_cost,
                    inventory_transaction_type_id=inventory_transaction_type.id,
                    reference_document_type="POS_Sale",
                    reference_document_id=db_transaction.id
                ),
                company_id=company_id,
                user_id=user_id
            )
    
    # Update transaction totals
    db_transaction.subtotal = subtotal
    db_transaction.tax_amount = tax_amount
    db_transaction.total_amount = subtotal + tax_amount - db_transaction.discount_amount
    
    # Process payments
    total_payment = Decimal(0)
    for payment_data in transaction_data.payments:
        db_payment = models.POSPayment(
            transaction_id=db_transaction.id,
            **payment_data.model_dump()
        )
        db.add(db_payment)
        total_payment += payment_data.amount
    
    # Validate payment matches total
    if abs(total_payment - db_transaction.total_amount) > Decimal("0.01"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment amount does not match transaction total"
        )
    
    # Create AR transaction if not cash sale
    if db_transaction.customer_id and pos_defaults and db_transaction.customer_id != pos_defaults.default_walk_in_customer_id:
        ar_transaction_type = db.query(models.ARTransactionType).filter(
            models.ARTransactionType.company_id == company_id,
            models.ARTransactionType.base_type == "Invoice"
        ).first()
        
        if ar_transaction_type:
            ar_transaction = crud_ar.create_ar_transaction(
                db=db,
                ar_transaction_in=schemas.ARTransactionCreate(
                    customer_id=db_transaction.customer_id,
                    ar_transaction_type_id=ar_transaction_type.id,
                    transaction_date=db_transaction.transaction_date,
                    reference=f"POS-{db_transaction.transaction_number}",
                    document_number=db_transaction.transaction_number,
                    total_amount=db_transaction.total_amount,
                    open_amount=db_transaction.total_amount if any(p.payment_method == "Credit" for p in transaction_data.payments) else Decimal(0)
                ),
                company_id=company_id,
                user_id=user_id
            )
            db_transaction.linked_ar_transaction_id = ar_transaction.id
    
    # GL Posting
    gl_entries = prepare_pos_gl_entries(db, db_transaction, company_id)
    if gl_entries:
        journal_entry = crud_gl.create_journal_entry(
            db=db,
            entry_in=schemas.GLJournalEntryCreate(
                entry_date=db_transaction.transaction_date.date(),
                reference=f"POS-{db_transaction.transaction_number}",
                description=f"POS Sale - {db_transaction.transaction_number}",
                lines=gl_entries
            ),
            company_id=company_id,
            user_id=user_id
        )
        db_transaction.linked_gl_journal_entry_id = journal_entry.id
    
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

def process_pos_return(
    db: Session,
    return_data: schemas.POSReturnCreate,
    till_session_id: int,
    company_id: int,
    user_id: int
) -> models.POSTransaction:
    # Get original transaction
    original_transaction = db.query(models.POSTransaction).filter(
        models.POSTransaction.id == return_data.reference_transaction_id,
        models.POSTransaction.company_id == company_id
    ).first()
    
    if not original_transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Original transaction not found"
        )
    
    # Create return transaction
    return_type = db.query(models.POSTransactionType).filter(
        models.POSTransactionType.company_id == company_id,
        models.POSTransactionType.base_type == "Return"
    ).first()
    
    # Process similar to create_pos_transaction but with negative amounts
    # and inventory adjustment in opposite direction
    # Implementation details omitted for brevity
    
    return original_transaction  # Placeholder

# Reconciliation
def reconcile_till_session(
    db: Session,
    session_id: int,
    reconciliation_data: schemas.TillSessionReconcile,
    company_id: int
) -> models.TillSession:
    session = db.query(models.TillSession).filter(
        models.TillSession.id == session_id,
        models.TillSession.company_id == company_id,
        models.TillSession.status == "Closed"
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Closed session not found"
        )
    
    # Calculate expected amounts by payment method
    payment_totals = db.query(
        models.POSPayment.payment_method,
        func.sum(models.POSPayment.amount).label("total")
    ).join(
        models.POSTransaction
    ).filter(
        models.POSTransaction.till_session_id == session_id,
        models.POSTransaction.status == "Completed"
    ).group_by(
        models.POSPayment.payment_method
    ).all()
    
    expected_by_method = {pt.payment_method: pt.total for pt in payment_totals}
    
    # Add opening balance to cash
    if "Cash" in expected_by_method:
        expected_by_method["Cash"] += session.opening_balance
    else:
        expected_by_method["Cash"] = session.opening_balance
    
    # Create reconciliation details
    for detail in reconciliation_data.reconciliation_details:
        expected = expected_by_method.get(detail.payment_method, Decimal(0))
        variance = detail.counted_amount - expected
        
        db_reconciliation = models.TillReconciliation(
            till_session_id=session_id,
            payment_method=detail.payment_method,
            expected_amount=expected,
            counted_amount=detail.counted_amount,
            variance=variance,
            notes=detail.notes
        )
        db.add(db_reconciliation)
    
    session.status = "Reconciled"
    db.commit()
    db.refresh(session)
    return session

# Helper functions
def generate_pos_transaction_number(db: Session, company_id: int) -> str:
    """Generate unique POS transaction number"""
    today = date.today()
    prefix = f"POS-{today.strftime('%Y%m%d')}-"
    
    # Get the last transaction number for today
    last_transaction = db.query(models.POSTransaction).filter(
        models.POSTransaction.company_id == company_id,
        models.POSTransaction.transaction_number.like(f"{prefix}%")
    ).order_by(models.POSTransaction.id.desc()).first()
    
    if last_transaction:
        last_number = int(last_transaction.transaction_number.split("-")[-1])
        new_number = last_number + 1
    else:
        new_number = 1
    
    return f"{prefix}{new_number:04d}"

def prepare_pos_gl_entries(
    db: Session, 
    transaction: models.POSTransaction, 
    company_id: int
) -> List[schemas.GLJournalEntryLineCreate]:
    """Prepare GL journal entries for POS transaction"""
    entries = []
    pos_defaults = db.query(models.POSDefaults).filter(
        models.POSDefaults.company_id == company_id
    ).first()
    
    # Cash/Payment Method accounts (Debit)
    for payment in transaction.payments:
        payment_gl_account_id = None
        if payment.payment_method == "Cash":
            # Use default cash account from GL defaults
            gl_defaults = db.query(models.GLDefaults).filter(
                models.GLDefaults.company_id == company_id
            ).first()
            payment_gl_account_id = gl_defaults.default_cash_account_id if gl_defaults else None
        else:
            # Get payment method specific GL account
            # This would need to be configured in payment method setup
            pass
        
        if payment_gl_account_id:
            entries.append(schemas.GLJournalEntryLineCreate(
                gl_account_id=payment_gl_account_id,
                description=f"POS Sale - {payment.payment_method}",
                debit_amount=payment.amount,
                credit_amount=Decimal(0)
            ))
    
    # Sales Revenue (Credit)
    for line in transaction.lines:
        item = db.query(models.InventoryItem).filter(
            models.InventoryItem.id == line.item_id
        ).first()
        
        sales_gl_account_id = item.default_sales_gl_account_id if hasattr(item, 'default_sales_gl_account_id') else None
        if not sales_gl_account_id:
            inv_defaults = db.query(models.InventoryDefaults).filter(
                models.InventoryDefaults.company_id == company_id
            ).first()
            sales_gl_account_id = inv_defaults.default_sales_revenue_gl_account_id if inv_defaults else None
        
        if sales_gl_account_id:
            entries.append(schemas.GLJournalEntryLineCreate(
                gl_account_id=sales_gl_account_id,
                description=f"POS Sale - {item.description}",
                debit_amount=Decimal(0),
                credit_amount=line.line_total - line.tax_amount
            ))
    
    # Tax (Credit)
    if transaction.tax_amount > 0:
        tax_lines = db.query(
            models.POSTransactionLine.tax_type_id,
            func.sum(models.POSTransactionLine.tax_amount).label("total_tax")
        ).filter(
            models.POSTransactionLine.transaction_id == transaction.id,
            models.POSTransactionLine.tax_type_id.isnot(None)
        ).group_by(
            models.POSTransactionLine.tax_type_id
        ).all()
        
        for tax_line in tax_lines:
            tax_type = db.query(models.TaxType).filter(
                models.TaxType.id == tax_line.tax_type_id
            ).first()
            
            if tax_type and hasattr(tax_type, 'tax_authority_gl_account_id') and tax_type.tax_authority_gl_account_id:
                entries.append(schemas.GLJournalEntryLineCreate(
                    gl_account_id=tax_type.tax_authority_gl_account_id,
                    description=f"POS Sale - {tax_type.name}",
                    debit_amount=Decimal(0),
                    credit_amount=tax_line.total_tax
                ))
    
    return entries

# Reporting functions
def get_daily_sales_summary(
    db: Session,
    company_id: int,
    till_id: Optional[int],
    date: date
) -> dict:
    """Get daily sales summary for reporting"""
    query = db.query(
        func.count(models.POSTransaction.id).label("transaction_count"),
        func.sum(models.POSTransaction.total_amount).label("total_sales"),
        func.sum(models.POSTransaction.tax_amount).label("total_tax"),
        func.sum(models.POSTransaction.discount_amount).label("total_discount"),
        models.POSTransaction.payment_method
    ).join(
        models.TillSession
    ).filter(
        models.POSTransaction.company_id == company_id,
        func.date(models.POSTransaction.transaction_date) == date,
        models.POSTransaction.status == "Completed"
    )
    
    if till_id:
        query = query.filter(models.TillSession.till_id == till_id)
    
    results = query.group_by(models.POSTransaction.payment_method).all()
    
    summary = {
        "date": date,
        "total_transactions": sum(r.transaction_count for r in results),
        "gross_sales": sum(r.total_sales for r in results) or Decimal(0),
        "total_tax": sum(r.total_tax for r in results) or Decimal(0),
        "total_discount": sum(r.total_discount for r in results) or Decimal(0),
        "payment_breakdown": [
            {
                "method": r.payment_method,
                "count": r.transaction_count,
                "amount": r.total_sales or Decimal(0)
            } for r in results
        ]
    }
    
    return summary

def get_cashier_sales_report(
    db: Session,
    company_id: int,
    start_date: date,
    end_date: date,
    user_id: Optional[int] = None
) -> List[dict]:
    """Get sales by cashier for reporting"""
    query = db.query(
        models.User.id,
        models.User.full_name,
        func.count(models.POSTransaction.id).label("transaction_count"),
        func.sum(models.POSTransaction.total_amount).label("total_sales")
    ).join(
        models.TillSession,
        models.TillSession.user_id == models.User.id
    ).join(
        models.POSTransaction,
        models.POSTransaction.till_session_id == models.TillSession.id
    ).filter(
        models.POSTransaction.company_id == company_id,
        func.date(models.POSTransaction.transaction_date) >= start_date,
        func.date(models.POSTransaction.transaction_date) <= end_date,
        models.POSTransaction.status == "Completed"
    )
    
    if user_id:
        query = query.filter(models.User.id == user_id)
    
    results = query.group_by(models.User.id, models.User.full_name).all()
    
    return [
        {
            "cashier_id": r.id,
            "cashier_name": r.full_name,
            "transaction_count": r.transaction_count,
            "total_sales": r.total_sales or Decimal(0)
        } for r in results
    ]

def get_item_sales_report(
    db: Session,
    company_id: int,
    start_date: date,
    end_date: date,
    top_n: int = 50
) -> List[dict]:
    """Get top selling items for reporting"""
    results = db.query(
        models.InventoryItem.id,
        models.InventoryItem.item_code,
        models.InventoryItem.description,
        func.sum(models.POSTransactionLine.quantity).label("quantity_sold"),
        func.sum(models.POSTransactionLine.line_total).label("total_revenue")
    ).join(
        models.POSTransactionLine,
        models.POSTransactionLine.item_id == models.InventoryItem.id
    ).join(
        models.POSTransaction,
        models.POSTransaction.id == models.POSTransactionLine.transaction_id
    ).filter(
        models.POSTransaction.company_id == company_id,
        func.date(models.POSTransaction.transaction_date) >= start_date,
        func.date(models.POSTransaction.transaction_date) <= end_date,
        models.POSTransaction.status == "Completed"
    ).group_by(
        models.InventoryItem.id,
        models.InventoryItem.item_code,
        models.InventoryItem.description
    ).order_by(
        func.sum(models.POSTransactionLine.line_total).desc()
    ).limit(top_n).all()
    
    return [
        {
            "item_id": r.id,
            "item_code": r.item_code,
            "description": r.description,
            "quantity_sold": float(r.quantity_sold),
            "total_revenue": r.total_revenue or Decimal(0)
        } for r in results
    ]

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
) -> models.TillSession:
    # Check if till has open session
    existing_session = db.query(models.TillSession).filter(
        models.TillSession.till_id == session_in.till_id,
        models.TillSession.status == "Open"
    ).first()
    
    if existing_session:
        raise HTTPException(400, "Till already has an open session")
    
    db_session = models.TillSession(
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
) -> models.TillSession:
    session = db.query(models.TillSession).filter(
        models.TillSession.id == session_id,
        models.TillSession.company_id == company_id,
        models.TillSession.status == "Open"
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
) -> Optional[models.TillSession]:
    """Get the currently active (open) POS session for a till"""
    return db.query(models.TillSession).filter(
        models.TillSession.till_id == till_id,
        models.TillSession.company_id == company_id,
        models.TillSession.status == "Open"
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
    session = db.query(models.TillSession).filter(
        models.TillSession.id == session_id,
        models.TillSession.company_id == company_id,
        models.TillSession.status == "Open"
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
    session = db.query(models.TillSession).filter(
        models.TillSession.id == session_id,
        models.TillSession.company_id == company_id,
        models.TillSession.status == "Open"
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
        models.TillSession.cashier_id,
        models.User.full_name.label("cashier_name"),
        func.count(distinct(models.TillSession.id)).label("session_count"),
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
        models.TillSession.cashier_id == models.User.id
    ).join(
        models.POSTransaction,
        models.TillSession.id == models.POSTransaction.session_id
    ).filter(
        models.TillSession.company_id == company_id,
        models.TillSession.session_date >= start_date,
        models.TillSession.session_date <= end_date,
        models.POSTransaction.status == "Completed"
    )
    
    if cashier_id:
        query = query.filter(models.TillSession.cashier_id == cashier_id)
    
    query = query.group_by(models.TillSession.cashier_id, models.User.full_name)
    
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
            models.TillSession,
            models.POSTransaction.session_id == models.TillSession.id
        ).join(
            models.Till,
            models.TillSession.till_id == models.Till.id
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
