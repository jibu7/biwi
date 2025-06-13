from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import Optional, List
from datetime import date, timedelta
from decimal import Decimal
from fastapi import HTTPException
from app import models, schemas
from app.crud import gl as crud_gl

# Customer CRUD
def create_customer(db: Session, customer: schemas.CustomerCreate, company_id: int) -> models.Customer:
    # Check if customer code already exists
    existing = db.query(models.Customer).filter(
        models.Customer.customer_code == customer.customer_code,
        models.Customer.company_id == company_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Customer code already exists")
    
    db_customer = models.Customer(
        **customer.model_dump(),
        company_id=company_id,
        current_balance=Decimal('0.00')
    )
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

def get_customers_by_company(
    db: Session, 
    company_id: int, 
    skip: int = 0, 
    limit: int = 100,
    include_inactive: bool = False
) -> List[models.Customer]:
    query = db.query(models.Customer).filter(models.Customer.company_id == company_id)
    if not include_inactive:
        query = query.filter(models.Customer.is_active == True)
    return query.order_by(models.Customer.customer_code).offset(skip).limit(limit).all()

def get_customer(db: Session, customer_id: int, company_id: int) -> Optional[models.Customer]:
    return db.query(models.Customer).filter(
        models.Customer.id == customer_id,
        models.Customer.company_id == company_id
    ).first()

def update_customer(
    db: Session, 
    customer_db_obj: models.Customer, 
    customer_in: schemas.CustomerUpdate
) -> models.Customer:
    update_data = customer_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(customer_db_obj, field, value)
    db.add(customer_db_obj)
    db.commit()
    db.refresh(customer_db_obj)
    return customer_db_obj

def delete_customer(db: Session, customer_id: int, company_id: int) -> Optional[models.Customer]:
    customer = get_customer(db, customer_id, company_id)
    if customer:
        # Check if customer has transactions
        has_transactions = db.query(models.ARTransaction).filter(
            models.ARTransaction.customer_id == customer_id
        ).first()
        if has_transactions:
            # Soft delete only
            customer.is_active = False
            db.commit()
        else:
            db.delete(customer)
            db.commit()
    return customer

# Sales Representative CRUD
def create_sales_representative(
    db: Session, 
    sales_rep: schemas.SalesRepresentativeCreate, 
    company_id: int
) -> models.SalesRepresentative:
    db_sales_rep = models.SalesRepresentative(
        **sales_rep.model_dump(),
        company_id=company_id
    )
    db.add(db_sales_rep)
    db.commit()
    db.refresh(db_sales_rep)
    return db_sales_rep

def get_sales_representatives_by_company(
    db: Session, 
    company_id: int, 
    skip: int = 0, 
    limit: int = 100
) -> List[models.SalesRepresentative]:
    return db.query(models.SalesRepresentative).filter(
        models.SalesRepresentative.company_id == company_id
    ).offset(skip).limit(limit).all()

def get_sales_representative(
    db: Session, 
    sales_rep_id: int, 
    company_id: int
) -> Optional[models.SalesRepresentative]:
    return db.query(models.SalesRepresentative).filter(
        models.SalesRepresentative.id == sales_rep_id,
        models.SalesRepresentative.company_id == company_id
    ).first()

def update_sales_representative(
    db: Session,
    sales_rep_db_obj: models.SalesRepresentative,
    sales_rep_in: schemas.SalesRepresentativeUpdate
) -> models.SalesRepresentative:
    update_data = sales_rep_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(sales_rep_db_obj, field, value)
    db.add(sales_rep_db_obj)
    db.commit()
    db.refresh(sales_rep_db_obj)
    return sales_rep_db_obj

def delete_sales_representative(
    db: Session, 
    sales_rep_id: int, 
    company_id: int
) -> Optional[models.SalesRepresentative]:
    sales_rep = get_sales_representative(db, sales_rep_id, company_id)
    if sales_rep:
        db.delete(sales_rep)
        db.commit()
    return sales_rep

# AR Transaction Type CRUD
def create_ar_transaction_type(
    db: Session, 
    trans_type: schemas.ARTransactionTypeCreate, 
    company_id: int
) -> models.ARTransactionType:
    db_type = models.ARTransactionType(
        **trans_type.model_dump(),
        company_id=company_id
    )
    db.add(db_type)
    db.commit()
    db.refresh(db_type)
    return db_type

def get_ar_transaction_types_by_company(
    db: Session, 
    company_id: int, 
    skip: int = 0, 
    limit: int = 100
) -> List[models.ARTransactionType]:
    return db.query(models.ARTransactionType).filter(
        models.ARTransactionType.company_id == company_id
    ).offset(skip).limit(limit).all()

def get_ar_transaction_type(
    db: Session, 
    type_id: int, 
    company_id: int
) -> Optional[models.ARTransactionType]:
    return db.query(models.ARTransactionType).filter(
        models.ARTransactionType.id == type_id,
        models.ARTransactionType.company_id == company_id
    ).first()

def update_ar_transaction_type(
    db: Session,
    type_db_obj: models.ARTransactionType,
    type_in: schemas.ARTransactionTypeUpdate
) -> models.ARTransactionType:
    update_data = type_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(type_db_obj, field, value)
    db.add(type_db_obj)
    db.commit()
    db.refresh(type_db_obj)
    return type_db_obj

def delete_ar_transaction_type(
    db: Session, 
    type_id: int, 
    company_id: int
) -> Optional[models.ARTransactionType]:
    trans_type = get_ar_transaction_type(db, type_id, company_id)
    if trans_type:
        db.delete(trans_type)
        db.commit()
    return trans_type

# AR Defaults CRUD
def get_ar_defaults(db: Session, company_id: int) -> Optional[models.ARDefaults]:
    return db.query(models.ARDefaults).filter(
        models.ARDefaults.company_id == company_id
    ).first()

def create_or_update_ar_defaults(
    db: Session,
    defaults_in: schemas.ARDefaultsCreate,
    company_id: int
) -> models.ARDefaults:
    db_defaults = get_ar_defaults(db, company_id)
    if db_defaults:
        # Update existing
        update_data = defaults_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_defaults, field, value)
    else:
        # Create new
        db_defaults = models.ARDefaults(
            **defaults_in.model_dump(),
            company_id=company_id
        )
        db.add(db_defaults)
    
    db.commit()
    db.refresh(db_defaults)
    return db_defaults

# AR Transaction CRUD
def generate_document_number(
    db: Session, 
    company_id: int, 
    transaction_type_id: int
) -> str:
    """Generate next document number for AR transaction"""
    # Get transaction type
    trans_type = db.query(models.ARTransactionType).filter(
        models.ARTransactionType.id == transaction_type_id
    ).first()
    
    if not trans_type:
        raise HTTPException(status_code=400, detail="Transaction type not found")
    
    # Get prefix based on base type
    prefix_map = {
        "Invoice": "INV",
        "Receipt": "RCT",
        "Credit Note": "CN",
        "Journal": "ARJ"
    }
    prefix = prefix_map.get(trans_type.base_type, "AR")
    
    # Get the last document number
    last_doc = db.query(models.ARTransaction).filter(
        models.ARTransaction.company_id == company_id,
        models.ARTransaction.ar_transaction_type_id == transaction_type_id
    ).order_by(models.ARTransaction.id.desc()).first()
    
    if last_doc and last_doc.document_number:
        # Extract number from last document
        try:
            last_num = int(last_doc.document_number.split('-')[-1])
            next_num = last_num + 1
        except:
            next_num = 1
    else:
        next_num = 1
    
    return f"{prefix}-{next_num:06d}"

def create_ar_transaction(
    db: Session, 
    ar_transaction_in: schemas.ARTransactionCreate, 
    company_id: int, 
    user_id: int
) -> models.ARTransaction:
    # Get transaction type
    trans_type = get_ar_transaction_type(db, ar_transaction_in.ar_transaction_type_id, company_id)
    if not trans_type:
        raise HTTPException(status_code=400, detail="Transaction type not found")
    
    # Get AR defaults
    ar_defaults = get_ar_defaults(db, company_id)
    if not ar_defaults:
        raise HTTPException(status_code=400, detail="AR defaults not configured")
    
    # Get customer
    customer = get_customer(db, ar_transaction_in.customer_id, company_id)
    if not customer:
        raise HTTPException(status_code=400, detail="Customer not found")
    
    # Generate document number
    doc_number = generate_document_number(db, company_id, ar_transaction_in.ar_transaction_type_id)
    
    # Create AR transaction
    db_transaction = models.ARTransaction(
        **ar_transaction_in.model_dump(),
        company_id=company_id,
        document_number=doc_number,
        open_amount=ar_transaction_in.total_amount,
        status="Posted",
        is_posted_to_gl=True
    )
    db.add(db_transaction)
    db.flush()
    
    # GL Posting Logic
    gl_lines = []
    
    if trans_type.base_type == "Invoice":
        # Debit: AR Control Account
        # Credit: Sales Account
        gl_lines.append(schemas.GLJournalEntryLineCreate(
            gl_account_id=ar_defaults.default_ar_control_gl_account_id,
            description=f"AR Invoice {doc_number}",
            debit_amount=ar_transaction_in.total_amount,
            credit_amount=Decimal('0.00')
        ))
        gl_lines.append(schemas.GLJournalEntryLineCreate(
            gl_account_id=trans_type.default_gl_account_id or ar_defaults.default_sales_gl_account_id,
            description=f"Sales - {customer.name}",
            debit_amount=Decimal('0.00'),
            credit_amount=ar_transaction_in.total_amount
        ))
    
    elif trans_type.base_type == "Receipt":
        # Debit: Bank/Cash Account
        # Credit: AR Control Account
        gl_lines.append(schemas.GLJournalEntryLineCreate(
            gl_account_id=trans_type.default_gl_account_id or ar_defaults.default_receipt_gl_account_id,
            description=f"Receipt {doc_number}",
            debit_amount=ar_transaction_in.total_amount,
            credit_amount=Decimal('0.00')
        ))
        gl_lines.append(schemas.GLJournalEntryLineCreate(
            gl_account_id=ar_defaults.default_ar_control_gl_account_id,
            description=f"AR Receipt - {customer.name}",
            debit_amount=Decimal('0.00'),
            credit_amount=ar_transaction_in.total_amount
        ))
    
    elif trans_type.base_type == "Credit Note":
        # Debit: Sales/Sales Returns Account
        # Credit: AR Control Account
        gl_lines.append(schemas.GLJournalEntryLineCreate(
            gl_account_id=trans_type.default_gl_account_id or ar_defaults.default_sales_gl_account_id,
            description=f"Credit Note {doc_number}",
            debit_amount=ar_transaction_in.total_amount,
            credit_amount=Decimal('0.00')
        ))
        gl_lines.append(schemas.GLJournalEntryLineCreate(
            gl_account_id=ar_defaults.default_ar_control_gl_account_id,
            description=f"AR Credit Note - {customer.name}",
            debit_amount=Decimal('0.00'),
            credit_amount=ar_transaction_in.total_amount
        ))
    
    # Create GL journal entry
    gl_entry_in = schemas.GLJournalEntryCreate(
        entry_date=ar_transaction_in.transaction_date,
        reference=doc_number,
        description=f"{trans_type.name} - {customer.name}",
        lines=gl_lines
    )
    
    gl_entry = crud_gl.create_journal_entry(db, gl_entry_in, company_id, user_id)
    db_transaction.linked_gl_journal_entry_id = gl_entry.id
    
    # Update customer balance
    if trans_type.affects_balance_direction == "Debit":
        customer.current_balance += ar_transaction_in.total_amount
    else:
        customer.current_balance -= ar_transaction_in.total_amount
    
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

def get_ar_transactions_by_company(
    db: Session,
    company_id: int,
    skip: int = 0,
    limit: int = 100,
    customer_id: Optional[int] = None,
    transaction_type_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
) -> List[models.ARTransaction]:
    query = db.query(models.ARTransaction).filter(
        models.ARTransaction.company_id == company_id
    )
    
    if customer_id:
        query = query.filter(models.ARTransaction.customer_id == customer_id)
    if transaction_type_id:
        query = query.filter(models.ARTransaction.ar_transaction_type_id == transaction_type_id)
    if start_date:
        query = query.filter(models.ARTransaction.transaction_date >= start_date)
    if end_date:
        query = query.filter(models.ARTransaction.transaction_date <= end_date)
    
    return query.order_by(models.ARTransaction.transaction_date.desc()).offset(skip).limit(limit).all()

def get_ar_transaction(db: Session, transaction_id: int, company_id: int) -> Optional[models.ARTransaction]:
    return db.query(models.ARTransaction).filter(
        models.ARTransaction.id == transaction_id,
        models.ARTransaction.company_id == company_id
    ).first()

def update_ar_transaction(
    db: Session,
    transaction_db_obj: models.ARTransaction,
    transaction_in: schemas.ARTransactionUpdate
) -> models.ARTransaction:
    # Don't allow updates to posted transactions
    if transaction_db_obj.is_posted_to_gl:
        raise HTTPException(status_code=400, detail="Cannot update posted transaction")
    
    update_data = transaction_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(transaction_db_obj, field, value)
    db.add(transaction_db_obj)
    db.commit()
    db.refresh(transaction_db_obj)
    return transaction_db_obj

# AR Allocation CRUD
def create_ar_allocation(
    db: Session,
    allocation_in: schemas.ARAllocationCreate,
    company_id: int
) -> models.ARAllocation:
    # Create allocation header
    db_allocation = models.ARAllocation(
        **allocation_in.model_dump(exclude={'lines'}),
        company_id=company_id
    )
    db.add(db_allocation)
    db.flush()
    
    # Create allocation lines and update transaction open amounts
    for line_in in allocation_in.lines:
        db_line = models.ARAllocationLine(
            ar_allocation_id=db_allocation.id,
            **line_in.model_dump()
        )
        db.add(db_line)
        
        # Update open amounts
        debit_trans = get_ar_transaction(db, line_in.debit_transaction_id, company_id)
        credit_trans = get_ar_transaction(db, line_in.credit_transaction_id, company_id)
        
        if debit_trans:
            debit_trans.open_amount -= line_in.allocated_amount
            if debit_trans.open_amount <= 0:
                debit_trans.status = "Paid"
            elif debit_trans.open_amount < debit_trans.total_amount:
                debit_trans.status = "Partially Paid"
        
        if credit_trans:
            credit_trans.open_amount -= line_in.allocated_amount
            if credit_trans.open_amount <= 0:
                credit_trans.status = "Paid"
            elif credit_trans.open_amount < credit_trans.total_amount:
                credit_trans.status = "Partially Paid"
    
    db.commit()
    db.refresh(db_allocation)
    return db_allocation

def get_ar_allocations_by_company(
    db: Session,
    company_id: int,
    skip: int = 0,
    limit: int = 100,
    customer_id: Optional[int] = None
) -> List[models.ARAllocation]:
    query = db.query(models.ARAllocation).filter(
        models.ARAllocation.company_id == company_id
    )
    
    if customer_id:
        query = query.filter(models.ARAllocation.customer_id == customer_id)
    
    return query.order_by(models.ARAllocation.allocation_date.desc()).offset(skip).limit(limit).all()

# AR Reports
def get_customer_aging_report(
    db: Session,
    company_id: int,
    as_of_date: date
) -> List[schemas.CustomerAgeing]:
    """Generate customer aging report"""
    
    # Get all customers with open transactions
    customers_query = db.query(models.Customer).filter(
        models.Customer.company_id == company_id,
        models.Customer.is_active == True
    ).all()
    
    aging_data = []
    
    for customer in customers_query:
        # Get open transactions for this customer
        open_transactions = db.query(models.ARTransaction).filter(
            models.ARTransaction.customer_id == customer.id,
            models.ARTransaction.open_amount > 0,
            models.ARTransaction.is_posted_to_gl == True
        ).all()
        
        current = Decimal('0.00')
        days_30 = Decimal('0.00')
        days_60 = Decimal('0.00')
        days_90 = Decimal('0.00')
        days_120_plus = Decimal('0.00')
        
        for trans in open_transactions:
            if trans.due_date:
                days_overdue = (as_of_date - trans.due_date).days
                if days_overdue <= 0:
                    current += trans.open_amount
                elif days_overdue <= 30:
                    days_30 += trans.open_amount
                elif days_overdue <= 60:
                    days_60 += trans.open_amount
                elif days_overdue <= 90:
                    days_90 += trans.open_amount
                else:
                    days_120_plus += trans.open_amount
            else:
                current += trans.open_amount
        
        total_due = current + days_30 + days_60 + days_90 + days_120_plus
        
        if total_due > 0:  # Only include customers with outstanding amounts
            aging_data.append(schemas.CustomerAgeing(
                customer_id=customer.id,
                customer_code=customer.customer_code,
                customer_name=customer.name,
                current=current,
                days_30=days_30,
                days_60=days_60,
                days_90=days_90,
                days_120_plus=days_120_plus,
                total_due=total_due
            ))
    
    return aging_data

def get_customer_statement(
    db: Session,
    company_id: int,
    customer_id: int,
    start_date: date,
    end_date: date
) -> schemas.CustomerStatement:
    """Generate customer statement for a period"""
    
    # Get customer
    customer = get_customer(db, customer_id, company_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Get opening balance (transactions before start_date)
    opening_transactions = db.query(models.ARTransaction).filter(
        models.ARTransaction.customer_id == customer_id,
        models.ARTransaction.transaction_date < start_date,
        models.ARTransaction.is_posted_to_gl == True
    ).all()
    
    opening_balance = Decimal('0.00')
    for trans in opening_transactions:
        trans_type = db.query(models.ARTransactionType).filter(
            models.ARTransactionType.id == trans.ar_transaction_type_id
        ).first()
        if trans_type:
            if trans_type.affects_balance_direction == "Debit":
                opening_balance += trans.total_amount
            else:
                opening_balance -= trans.total_amount
    
    # Get period transactions
    period_transactions = db.query(models.ARTransaction).filter(
        models.ARTransaction.customer_id == customer_id,
        models.ARTransaction.transaction_date >= start_date,
        models.ARTransaction.transaction_date <= end_date,
        models.ARTransaction.is_posted_to_gl == True
    ).order_by(models.ARTransaction.transaction_date).all()
    
    # Calculate closing balance
    closing_balance = opening_balance
    for trans in period_transactions:
        trans_type = db.query(models.ARTransactionType).filter(
            models.ARTransactionType.id == trans.ar_transaction_type_id
        ).first()
        if trans_type:
            if trans_type.affects_balance_direction == "Debit":
                closing_balance += trans.total_amount
            else:
                closing_balance -= trans.total_amount
    
    return schemas.CustomerStatement(
        customer=customer,
        opening_balance=opening_balance,
        transactions=period_transactions,
        closing_balance=closing_balance,
        period_start=start_date,
        period_end=end_date
    )
