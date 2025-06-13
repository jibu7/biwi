from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func, desc
from typing import List, Optional
from app.models.ar import (
    Customer, SalesRepresentative, ARTransactionType, ARTransaction,
    ARAllocation, ARAllocationLine, ARDefaults
)
from app.models.gl import GLAccount, GLJournalEntry, GLJournalEntryLine
from app.schemas.ar import (
    CustomerCreate, CustomerUpdate,
    SalesRepresentativeCreate, SalesRepresentativeUpdate,
    ARTransactionTypeCreate, ARTransactionTypeUpdate,
    ARTransactionCreate, ARTransactionUpdate,
    ARAllocationCreate, ARDefaultsCreate, ARDefaultsUpdate
)
from datetime import date
from decimal import Decimal

# Customer CRUD
def get_customers(db: Session, company_id: int, skip: int = 0, limit: int = 100) -> List[Customer]:
    return db.query(Customer)\
        .filter(Customer.company_id == company_id)\
        .options(
            joinedload(Customer.sales_representative),
            joinedload(Customer.default_ar_gl_account)
        )\
        .offset(skip).limit(limit).all()

def get_customer(db: Session, customer_id: int, company_id: int) -> Optional[Customer]:
    return db.query(Customer)\
        .filter(and_(Customer.id == customer_id, Customer.company_id == company_id))\
        .options(
            joinedload(Customer.sales_representative),
            joinedload(Customer.default_ar_gl_account)
        )\
        .first()

def get_customer_by_code(db: Session, customer_code: str, company_id: int) -> Optional[Customer]:
    return db.query(Customer)\
        .filter(and_(Customer.customer_code == customer_code, Customer.company_id == company_id))\
        .first()

def create_customer(db: Session, customer: CustomerCreate, company_id: int) -> Customer:
    db_customer = Customer(**customer.dict(), company_id=company_id)
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

def update_customer(db: Session, customer_id: int, company_id: int, customer_update: CustomerUpdate) -> Optional[Customer]:
    db_customer = get_customer(db, customer_id, company_id)
    if db_customer:
        update_data = customer_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_customer, field, value)
        db.commit()
        db.refresh(db_customer)
    return db_customer

def delete_customer(db: Session, customer_id: int, company_id: int) -> bool:
    db_customer = get_customer(db, customer_id, company_id)
    if db_customer:
        db.delete(db_customer)
        db.commit()
        return True
    return False

def update_customer_balance(db: Session, customer_id: int, amount: Decimal, increase: bool = True):
    """Update customer balance when transactions are posted"""
    db_customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if db_customer:
        if increase:
            db_customer.current_balance += amount
        else:
            db_customer.current_balance -= amount
        db.commit()

# Sales Representative CRUD
def get_sales_representatives(db: Session, company_id: int, skip: int = 0, limit: int = 100) -> List[SalesRepresentative]:
    return db.query(SalesRepresentative)\
        .filter(SalesRepresentative.company_id == company_id)\
        .offset(skip).limit(limit).all()

def get_sales_representative(db: Session, sales_rep_id: int, company_id: int) -> Optional[SalesRepresentative]:
    return db.query(SalesRepresentative)\
        .filter(and_(SalesRepresentative.id == sales_rep_id, SalesRepresentative.company_id == company_id))\
        .first()

def create_sales_representative(db: Session, sales_rep: SalesRepresentativeCreate, company_id: int) -> SalesRepresentative:
    db_sales_rep = SalesRepresentative(**sales_rep.dict(), company_id=company_id)
    db.add(db_sales_rep)
    db.commit()
    db.refresh(db_sales_rep)
    return db_sales_rep

def update_sales_representative(db: Session, sales_rep_id: int, company_id: int, 
                              sales_rep_update: SalesRepresentativeUpdate) -> Optional[SalesRepresentative]:
    db_sales_rep = get_sales_representative(db, sales_rep_id, company_id)
    if db_sales_rep:
        update_data = sales_rep_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_sales_rep, field, value)
        db.commit()
        db.refresh(db_sales_rep)
    return db_sales_rep

def delete_sales_representative(db: Session, sales_rep_id: int, company_id: int) -> bool:
    db_sales_rep = get_sales_representative(db, sales_rep_id, company_id)
    if db_sales_rep:
        db.delete(db_sales_rep)
        db.commit()
        return True
    return False

# AR Transaction Type CRUD
def get_ar_transaction_types(db: Session, company_id: int, skip: int = 0, limit: int = 100) -> List[ARTransactionType]:
    return db.query(ARTransactionType)\
        .filter(ARTransactionType.company_id == company_id)\
        .options(
            joinedload(ARTransactionType.default_gl_account),
            joinedload(ARTransactionType.default_ar_control_gl_account)
        )\
        .offset(skip).limit(limit).all()

def get_ar_transaction_type(db: Session, transaction_type_id: int, company_id: int) -> Optional[ARTransactionType]:
    return db.query(ARTransactionType)\
        .filter(and_(ARTransactionType.id == transaction_type_id, ARTransactionType.company_id == company_id))\
        .options(
            joinedload(ARTransactionType.default_gl_account),
            joinedload(ARTransactionType.default_ar_control_gl_account)
        )\
        .first()

def get_ar_transaction_type_by_name(db: Session, name: str, company_id: int) -> Optional[ARTransactionType]:
    return db.query(ARTransactionType)\
        .filter(and_(ARTransactionType.name == name, ARTransactionType.company_id == company_id))\
        .first()

def create_ar_transaction_type(db: Session, transaction_type: ARTransactionTypeCreate, company_id: int) -> ARTransactionType:
    db_transaction_type = ARTransactionType(**transaction_type.dict(), company_id=company_id)
    db.add(db_transaction_type)
    db.commit()
    db.refresh(db_transaction_type)
    return db_transaction_type

def update_ar_transaction_type(db: Session, transaction_type_id: int, company_id: int, 
                             transaction_type_update: ARTransactionTypeUpdate) -> Optional[ARTransactionType]:
    db_transaction_type = get_ar_transaction_type(db, transaction_type_id, company_id)
    if db_transaction_type:
        update_data = transaction_type_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_transaction_type, field, value)
        db.commit()
        db.refresh(db_transaction_type)
    return db_transaction_type

def delete_ar_transaction_type(db: Session, transaction_type_id: int, company_id: int) -> bool:
    db_transaction_type = get_ar_transaction_type(db, transaction_type_id, company_id)
    if db_transaction_type:
        db.delete(db_transaction_type)
        db.commit()
        return True
    return False

# AR Transaction CRUD
def get_ar_transactions(db: Session, company_id: int, customer_id: Optional[int] = None,
                       from_date: Optional[date] = None, to_date: Optional[date] = None,
                       skip: int = 0, limit: int = 100) -> List[ARTransaction]:
    query = db.query(ARTransaction)\
        .filter(ARTransaction.company_id == company_id)\
        .options(
            joinedload(ARTransaction.customer),
            joinedload(ARTransaction.ar_transaction_type)
        )
    
    if customer_id:
        query = query.filter(ARTransaction.customer_id == customer_id)
    
    if from_date:
        query = query.filter(ARTransaction.transaction_date >= from_date)
    
    if to_date:
        query = query.filter(ARTransaction.transaction_date <= to_date)
    
    return query.order_by(desc(ARTransaction.transaction_date)).offset(skip).limit(limit).all()

def get_ar_transaction(db: Session, transaction_id: int, company_id: int) -> Optional[ARTransaction]:
    return db.query(ARTransaction)\
        .filter(and_(ARTransaction.id == transaction_id, ARTransaction.company_id == company_id))\
        .options(
            joinedload(ARTransaction.customer),
            joinedload(ARTransaction.ar_transaction_type),
            joinedload(ARTransaction.linked_gl_journal_entry)
        )\
        .first()

def create_ar_transaction(db: Session, transaction: ARTransactionCreate, company_id: int) -> ARTransaction:
    # Generate document number if not provided
    transaction_type = get_ar_transaction_type(db, transaction.ar_transaction_type_id, company_id)
    if not transaction_type:
        raise ValueError("Invalid transaction type")
    
    # Generate sequential document number
    last_transaction = db.query(ARTransaction)\
        .filter(and_(
            ARTransaction.company_id == company_id,
            ARTransaction.ar_transaction_type_id == transaction.ar_transaction_type_id
        ))\
        .order_by(desc(ARTransaction.id))\
        .first()
    
    if last_transaction and last_transaction.document_number.isdigit():
        next_number = int(last_transaction.document_number) + 1
    else:
        next_number = 1
    
    document_number = f"{next_number:06d}"  # 6-digit padded number
    
    db_transaction = ARTransaction(
        company_id=company_id,
        customer_id=transaction.customer_id,
        ar_transaction_type_id=transaction.ar_transaction_type_id,
        transaction_date=transaction.transaction_date,
        due_date=transaction.due_date,
        reference=transaction.reference,
        document_number=document_number,
        total_amount=transaction.total_amount,
        open_amount=transaction.total_amount  # Initially, open amount equals total amount
    )
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

def update_ar_transaction(db: Session, transaction_id: int, company_id: int, 
                         transaction_update: ARTransactionUpdate) -> Optional[ARTransaction]:
    db_transaction = get_ar_transaction(db, transaction_id, company_id)
    if db_transaction:
        update_data = transaction_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_transaction, field, value)
        db.commit()
        db.refresh(db_transaction)
    return db_transaction

def post_ar_transaction_to_gl(db: Session, transaction_id: int, company_id: int) -> Optional[ARTransaction]:
    """Post an AR transaction to GL and update customer balance"""
    from app.crud.gl import create_gl_journal_entry
    from app.schemas.gl import GLJournalEntryCreate, GLJournalEntryLineCreate
    
    db_transaction = get_ar_transaction(db, transaction_id, company_id)
    if not db_transaction or db_transaction.is_posted_to_gl:
        return None
    
    # Get AR defaults for default accounts
    ar_defaults = get_ar_defaults(db, company_id)
    
    # Determine GL accounts based on transaction type
    ar_control_account_id = (
        db_transaction.ar_transaction_type.default_ar_control_gl_account_id or
        ar_defaults.default_ar_control_gl_account_id if ar_defaults else None
    )
    
    sales_account_id = (
        db_transaction.ar_transaction_type.default_gl_account_id or
        ar_defaults.default_sales_gl_account_id if ar_defaults else None
    )
    
    if not ar_control_account_id or not sales_account_id:
        raise ValueError("Default GL accounts not configured")
    
    # Create journal entry lines
    lines = []
    if db_transaction.ar_transaction_type.base_type == "Invoice":
        # Debit AR Control, Credit Sales
        lines = [
            GLJournalEntryLineCreate(
                gl_account_id=ar_control_account_id,
                debit_amount=db_transaction.total_amount,
                credit_amount=Decimal('0.00'),
                description=f"Invoice {db_transaction.document_number}"
            ),
            GLJournalEntryLineCreate(
                gl_account_id=sales_account_id,
                debit_amount=Decimal('0.00'),
                credit_amount=db_transaction.total_amount,
                description=f"Invoice {db_transaction.document_number}"
            )
        ]
    elif db_transaction.ar_transaction_type.base_type == "Receipt":
        # Debit Cash, Credit AR Control
        cash_account_id = ar_defaults.default_receipt_gl_account_id if ar_defaults else None
        if not cash_account_id:
            raise ValueError("Default cash account not configured")
        
        lines = [
            GLJournalEntryLineCreate(
                gl_account_id=cash_account_id,
                debit_amount=db_transaction.total_amount,
                credit_amount=Decimal('0.00'),
                description=f"Receipt {db_transaction.document_number}"
            ),
            GLJournalEntryLineCreate(
                gl_account_id=ar_control_account_id,
                debit_amount=Decimal('0.00'),
                credit_amount=db_transaction.total_amount,
                description=f"Receipt {db_transaction.document_number}"
            )
        ]
    elif db_transaction.ar_transaction_type.base_type == "Credit Note":
        # Credit AR Control, Debit Sales Returns or relevant account
        lines = [
            GLJournalEntryLineCreate(
                gl_account_id=sales_account_id,
                debit_amount=db_transaction.total_amount,
                credit_amount=Decimal('0.00'),
                description=f"Credit Note {db_transaction.document_number}"
            ),
            GLJournalEntryLineCreate(
                gl_account_id=ar_control_account_id,
                debit_amount=Decimal('0.00'),
                credit_amount=db_transaction.total_amount,
                description=f"Credit Note {db_transaction.document_number}"
            )
        ]
    
    # Create GL journal entry
    journal_entry_data = GLJournalEntryCreate(
        transaction_date=db_transaction.transaction_date,
        reference=f"AR {db_transaction.ar_transaction_type.base_type} {db_transaction.document_number}",
        description=f"{db_transaction.ar_transaction_type.base_type} for {db_transaction.customer.name}",
        lines=lines
    )
    
    gl_entry = create_gl_journal_entry(db, journal_entry_data, company_id)
    
    # Link the GL entry to AR transaction
    db_transaction.linked_gl_journal_entry_id = gl_entry.id
    db_transaction.is_posted_to_gl = True
    db_transaction.status = "Posted"
    
    # Update customer balance
    if db_transaction.ar_transaction_type.affects_balance_direction == "Debit":
        update_customer_balance(db, db_transaction.customer_id, db_transaction.total_amount, True)
    else:
        update_customer_balance(db, db_transaction.customer_id, db_transaction.total_amount, False)
    
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

def post_ar_transaction(db: Session, transaction_id: int, company_id: int) -> Optional[ARTransaction]:
    """Post AR transaction to GL and update customer balance"""
    from app.crud.gl import create_gl_journal_entry
    from app.schemas.gl import GLJournalEntryCreate, GLJournalEntryLineCreate
    
    # Get the transaction
    db_transaction = get_ar_transaction(db, transaction_id, company_id)
    if not db_transaction or db_transaction.is_posted_to_gl:
        return db_transaction
    
    # Get AR defaults for GL account mapping
    ar_defaults = get_ar_defaults(db, company_id)
    if not ar_defaults or not ar_defaults.default_ar_control_gl_account_id:
        # Can't post without AR control account setup
        return db_transaction
    
    # Create GL journal entry lines
    lines = []
    
    if db_transaction.ar_transaction_type.base_type == "Invoice":
        # Debit AR Control, Credit Sales
        lines.append(GLJournalEntryLineCreate(
            gl_account_id=ar_defaults.default_ar_control_gl_account_id,
            debit_amount=db_transaction.total_amount,
            credit_amount=Decimal('0.00'),
            description=f"AR Invoice {db_transaction.document_number}"
        ))
        
        sales_account_id = ar_defaults.default_sales_gl_account_id or ar_defaults.default_ar_control_gl_account_id
        lines.append(GLJournalEntryLineCreate(
            gl_account_id=sales_account_id,
            debit_amount=Decimal('0.00'),
            credit_amount=db_transaction.total_amount,
            description=f"Sales - Invoice {db_transaction.document_number}"
        ))
        
    elif db_transaction.ar_transaction_type.base_type == "Receipt":
        # Debit Cash/Bank, Credit AR Control
        cash_account_id = ar_defaults.default_receipt_gl_account_id or ar_defaults.default_ar_control_gl_account_id
        lines.append(GLJournalEntryLineCreate(
            gl_account_id=cash_account_id,
            debit_amount=db_transaction.total_amount,
            credit_amount=Decimal('0.00'),
            description=f"Receipt {db_transaction.document_number}"
        ))
        
        lines.append(GLJournalEntryLineCreate(
            gl_account_id=ar_defaults.default_ar_control_gl_account_id,
            debit_amount=Decimal('0.00'),
            credit_amount=db_transaction.total_amount,
            description=f"AR Receipt {db_transaction.document_number}"
        ))
        
    elif db_transaction.ar_transaction_type.base_type == "Credit Note":
        # Credit AR Control, Debit Sales Returns or Sales
        lines.append(GLJournalEntryLineCreate(
            gl_account_id=ar_defaults.default_ar_control_gl_account_id,
            debit_amount=Decimal('0.00'),
            credit_amount=db_transaction.total_amount,
            description=f"AR Credit Note {db_transaction.document_number}"
        ))
        
        sales_account_id = ar_defaults.default_sales_gl_account_id or ar_defaults.default_ar_control_gl_account_id
        lines.append(GLJournalEntryLineCreate(
            gl_account_id=sales_account_id,
            debit_amount=db_transaction.total_amount,
            credit_amount=Decimal('0.00'),
            description=f"Sales Return - Credit Note {db_transaction.document_number}"
        ))
    
    if lines:
        # Create GL journal entry
        gl_entry_data = GLJournalEntryCreate(
            entry_date=db_transaction.transaction_date,
            reference=f"AR-{db_transaction.document_number}",
            description=f"{db_transaction.ar_transaction_type.name} {db_transaction.document_number}",
            lines=lines
        )
        
        try:
            gl_entry = create_gl_journal_entry(db, gl_entry_data, company_id)
            
            # Update transaction
            db_transaction.linked_gl_journal_entry_id = gl_entry.id
            db_transaction.is_posted_to_gl = True
            db_transaction.status = "Posted"
            
            # Update customer balance
            if db_transaction.ar_transaction_type.affects_balance_direction == "Debit":
                update_customer_balance(db, db_transaction.customer_id, db_transaction.total_amount, increase=True)
            else:
                update_customer_balance(db, db_transaction.customer_id, db_transaction.total_amount, increase=False)
            
            db.commit()
            db.refresh(db_transaction)
            
        except Exception as e:
            db.rollback()
            raise e
    
    return db_transaction

# AR Allocation CRUD
def get_ar_allocations(db: Session, company_id: int, customer_id: Optional[int] = None,
                      skip: int = 0, limit: int = 100) -> List[ARAllocation]:
    query = db.query(ARAllocation)\
        .filter(ARAllocation.company_id == company_id)\
        .options(
            joinedload(ARAllocation.customer),
            joinedload(ARAllocation.lines)
        )
    
    if customer_id:
        query = query.filter(ARAllocation.customer_id == customer_id)
    
    return query.order_by(desc(ARAllocation.allocation_date)).offset(skip).limit(limit).all()

def create_ar_allocation(db: Session, allocation: ARAllocationCreate, company_id: int) -> ARAllocation:
    db_allocation = ARAllocation(
        company_id=company_id,
        allocation_date=allocation.allocation_date,
        customer_id=allocation.customer_id
    )
    db.add(db_allocation)
    db.flush()  # Flush to get the ID
    
    # Add allocation lines
    for line in allocation.lines:
        db_line = ARAllocationLine(
            ar_allocation_id=db_allocation.id,
            **line.dict()
        )
        db.add(db_line)
        
        # Update open amounts of allocated transactions
        debit_transaction = db.query(ARTransaction).filter(ARTransaction.id == line.debit_transaction_id).first()
        credit_transaction = db.query(ARTransaction).filter(ARTransaction.id == line.credit_transaction_id).first()
        
        if debit_transaction:
            debit_transaction.open_amount -= line.allocated_amount
            if debit_transaction.open_amount <= 0:
                debit_transaction.status = "Paid"
            else:
                debit_transaction.status = "PartiallyPaid"
        
        if credit_transaction:
            credit_transaction.open_amount -= line.allocated_amount
            if credit_transaction.open_amount <= 0:
                credit_transaction.status = "Paid"
            else:
                credit_transaction.status = "PartiallyPaid"
    
    db.commit()
    db.refresh(db_allocation)
    return db_allocation

# AR Defaults CRUD
def get_ar_defaults(db: Session, company_id: int) -> Optional[ARDefaults]:
    return db.query(ARDefaults)\
        .filter(ARDefaults.company_id == company_id)\
        .options(
            joinedload(ARDefaults.default_ar_control_gl_account),
            joinedload(ARDefaults.default_sales_gl_account),
            joinedload(ARDefaults.default_receipt_gl_account),
            joinedload(ARDefaults.default_sales_discount_gl_account)
        )\
        .first()

def create_or_update_ar_defaults(db: Session, ar_defaults_data: ARDefaultsCreate, company_id: int) -> ARDefaults:
    db_ar_defaults = get_ar_defaults(db, company_id)
    
    if db_ar_defaults:
        # Update existing
        update_data = ar_defaults_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_ar_defaults, field, value)
    else:
        # Create new
        db_ar_defaults = ARDefaults(**ar_defaults_data.dict(), company_id=company_id)
        db.add(db_ar_defaults)
    
    db.commit()
    db.refresh(db_ar_defaults)
    return db_ar_defaults

# AR Reports
def get_customer_aging_report(db: Session, company_id: int, as_of_date: date):
    """Generate customer aging report"""
    from sqlalchemy import case, text
    from datetime import timedelta
    
    # Calculate date boundaries
    date_30_ago = as_of_date - timedelta(days=30)
    date_60_ago = as_of_date - timedelta(days=60)
    date_90_ago = as_of_date - timedelta(days=90)
    
    # Calculate aging buckets
    aging_query = db.query(
        Customer.id.label('customer_id'),
        Customer.name.label('customer_name'),
        Customer.current_balance.label('current_balance'),
        func.sum(
            case(
                (ARTransaction.due_date >= as_of_date, ARTransaction.open_amount),
                else_=0
            )
        ).label('current'),
        func.sum(
            case(
                (and_(ARTransaction.due_date < as_of_date, 
                     ARTransaction.due_date >= date_30_ago),
                 ARTransaction.open_amount),
                else_=0
            )
        ).label('days_1_30'),
        func.sum(
            case(
                (and_(ARTransaction.due_date < date_30_ago,
                     ARTransaction.due_date >= date_60_ago),
                 ARTransaction.open_amount),
                else_=0
            )
        ).label('days_31_60'),
        func.sum(
            case(
                (and_(ARTransaction.due_date < date_60_ago,
                     ARTransaction.due_date >= date_90_ago),
                 ARTransaction.open_amount),
                else_=0
            )
        ).label('days_61_90'),
        func.sum(
            case(
                (ARTransaction.due_date < date_90_ago,
                 ARTransaction.open_amount),
                else_=0
            )
        ).label('over_90')
    ).select_from(
        Customer
    ).outerjoin(
        ARTransaction, and_(
            Customer.id == ARTransaction.customer_id,
            ARTransaction.open_amount > 0,
            ARTransaction.is_posted_to_gl == True
        )
    ).filter(
        Customer.company_id == company_id
    ).group_by(
        Customer.id, Customer.name, Customer.current_balance
    ).all()
    
    return aging_query

def get_customer_statement(db: Session, company_id: int, customer_id: int, 
                          from_date: date, to_date: date):
    """Generate customer statement"""
    transactions = db.query(ARTransaction)\
        .filter(and_(
            ARTransaction.company_id == company_id,
            ARTransaction.customer_id == customer_id,
            ARTransaction.transaction_date >= from_date,
            ARTransaction.transaction_date <= to_date,
            ARTransaction.is_posted_to_gl == True
        ))\
        .options(joinedload(ARTransaction.ar_transaction_type))\
        .order_by(ARTransaction.transaction_date, ARTransaction.id).all()
    
    return transactions
