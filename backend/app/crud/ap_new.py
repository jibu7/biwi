from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import Optional, List
from datetime import date, timedelta
from decimal import Decimal
from fastapi import HTTPException
from app import models, schemas
from app.crud import gl as crud_gl

# Supplier CRUD
def create_supplier(db: Session, supplier: schemas.SupplierCreate, company_id: int) -> models.Supplier:
    # Check if supplier code already exists
    existing = db.query(models.Supplier).filter(
        models.Supplier.supplier_code == supplier.supplier_code,
        models.Supplier.company_id == company_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Supplier code already exists")
    
    db_supplier = models.Supplier(
        **supplier.model_dump(),
        company_id=company_id,
        current_balance=Decimal('0.00')
    )
    db.add(db_supplier)
    db.commit()
    db.refresh(db_supplier)
    return db_supplier

def get_suppliers_by_company(
    db: Session, 
    company_id: int, 
    skip: int = 0, 
    limit: int = 100,
    include_inactive: bool = False
) -> List[models.Supplier]:
    query = db.query(models.Supplier).filter(models.Supplier.company_id == company_id)
    if not include_inactive:
        query = query.filter(models.Supplier.is_active == True)
    return query.order_by(models.Supplier.supplier_code).offset(skip).limit(limit).all()

def get_supplier(db: Session, supplier_id: int, company_id: int) -> Optional[models.Supplier]:
    return db.query(models.Supplier).filter(
        models.Supplier.id == supplier_id,
        models.Supplier.company_id == company_id
    ).first()

def update_supplier(
    db: Session, 
    supplier_db_obj: models.Supplier, 
    supplier_in: schemas.SupplierUpdate
) -> models.Supplier:
    update_data = supplier_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(supplier_db_obj, field, value)
    db.add(supplier_db_obj)
    db.commit()
    db.refresh(supplier_db_obj)
    return supplier_db_obj

def delete_supplier(db: Session, supplier_id: int, company_id: int) -> Optional[models.Supplier]:
    supplier = get_supplier(db, supplier_id, company_id)
    if supplier:
        # Check if supplier has transactions
        has_transactions = db.query(models.APTransaction).filter(
            models.APTransaction.supplier_id == supplier_id
        ).first()
        if has_transactions:
            # Soft delete only
            supplier.is_active = False
            db.commit()
        else:
            db.delete(supplier)
            db.commit()
    return supplier

# AP Transaction Type CRUD
def create_ap_transaction_type(
    db: Session, 
    trans_type: schemas.APTransactionTypeCreate, 
    company_id: int
) -> models.APTransactionType:
    db_type = models.APTransactionType(
        **trans_type.model_dump(),
        company_id=company_id
    )
    db.add(db_type)
    db.commit()
    db.refresh(db_type)
    return db_type

def get_ap_transaction_types_by_company(
    db: Session, 
    company_id: int, 
    skip: int = 0, 
    limit: int = 100
) -> List[models.APTransactionType]:
    return db.query(models.APTransactionType).filter(
        models.APTransactionType.company_id == company_id
    ).offset(skip).limit(limit).all()

def get_ap_transaction_type(
    db: Session, 
    type_id: int, 
    company_id: int
) -> Optional[models.APTransactionType]:
    return db.query(models.APTransactionType).filter(
        models.APTransactionType.id == type_id,
        models.APTransactionType.company_id == company_id
    ).first()

def update_ap_transaction_type(
    db: Session,
    type_db_obj: models.APTransactionType,
    type_in: schemas.APTransactionTypeUpdate
) -> models.APTransactionType:
    update_data = type_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(type_db_obj, field, value)
    db.add(type_db_obj)
    db.commit()
    db.refresh(type_db_obj)
    return type_db_obj

def delete_ap_transaction_type(
    db: Session, 
    type_id: int, 
    company_id: int
) -> Optional[models.APTransactionType]:
    trans_type = get_ap_transaction_type(db, type_id, company_id)
    if trans_type:
        db.delete(trans_type)
        db.commit()
    return trans_type

# AP Defaults CRUD
def get_ap_defaults(db: Session, company_id: int) -> Optional[models.APDefaults]:
    return db.query(models.APDefaults).filter(
        models.APDefaults.company_id == company_id
    ).first()

def create_or_update_ap_defaults(
    db: Session,
    defaults_in: schemas.APDefaultsCreate,
    company_id: int
) -> models.APDefaults:
    db_defaults = get_ap_defaults(db, company_id)
    if db_defaults:
        # Update existing
        update_data = defaults_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_defaults, field, value)
    else:
        # Create new
        db_defaults = models.APDefaults(
            **defaults_in.model_dump(),
            company_id=company_id
        )
        db.add(db_defaults)
    
    db.commit()
    db.refresh(db_defaults)
    return db_defaults

# AP Transaction CRUD
def generate_document_number(
    db: Session, 
    company_id: int, 
    transaction_type_id: int
) -> str:
    """Generate next document number for AP transaction"""
    # Get transaction type
    trans_type = db.query(models.APTransactionType).filter(
        models.APTransactionType.id == transaction_type_id
    ).first()
    
    if not trans_type:
        raise HTTPException(status_code=400, detail="Transaction type not found")
    
    # Get prefix based on base type
    prefix_map = {
        "Supplier Invoice": "SINV",
        "Payment": "PAY",
        "Debit Note": "DN",
        "Journal": "APJ"
    }
    prefix = prefix_map.get(trans_type.base_type, "AP")
    
    # Get the last document number
    last_doc = db.query(models.APTransaction).filter(
        models.APTransaction.company_id == company_id,
        models.APTransaction.ap_transaction_type_id == transaction_type_id
    ).order_by(models.APTransaction.id.desc()).first()
    
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

def create_ap_transaction(
    db: Session, 
    ap_transaction_in: schemas.APTransactionCreate, 
    company_id: int, 
    user_id: int
) -> models.APTransaction:
    # Get transaction type
    trans_type = get_ap_transaction_type(db, ap_transaction_in.ap_transaction_type_id, company_id)
    if not trans_type:
        raise HTTPException(status_code=400, detail="Transaction type not found")
    
    # Get AP defaults
    ap_defaults = get_ap_defaults(db, company_id)
    if not ap_defaults:
        raise HTTPException(status_code=400, detail="AP defaults not configured")
    
    # Get supplier
    supplier = get_supplier(db, ap_transaction_in.supplier_id, company_id)
    if not supplier:
        raise HTTPException(status_code=400, detail="Supplier not found")
    
    # Generate document number
    doc_number = generate_document_number(db, company_id, ap_transaction_in.ap_transaction_type_id)
    
    # Create AP transaction
    db_transaction = models.APTransaction(
        **ap_transaction_in.model_dump(),
        company_id=company_id,
        document_number=doc_number,
        open_amount=ap_transaction_in.total_amount,
        status="Posted",
        is_posted_to_gl=True
    )
    db.add(db_transaction)
    db.flush()
    
    # GL Posting Logic
    gl_lines = []
    
    if trans_type.base_type == "Supplier Invoice":
        # Debit: Expense/Inventory Account
        # Credit: AP Control Account
        gl_lines.append(schemas.GLJournalEntryLineCreate(
            gl_account_id=trans_type.default_gl_account_id or ap_defaults.default_expense_gl_account_id,
            description=f"Purchase - {supplier.name}",
            debit_amount=ap_transaction_in.total_amount,
            credit_amount=Decimal('0.00')
        ))
        gl_lines.append(schemas.GLJournalEntryLineCreate(
            gl_account_id=ap_defaults.default_ap_control_gl_account_id,
            description=f"AP Invoice {doc_number}",
            debit_amount=Decimal('0.00'),
            credit_amount=ap_transaction_in.total_amount
        ))
    
    elif trans_type.base_type == "Payment":
        # Debit: AP Control Account
        # Credit: Bank/Cash Account
        gl_lines.append(schemas.GLJournalEntryLineCreate(
            gl_account_id=ap_defaults.default_ap_control_gl_account_id,
            description=f"AP Payment - {supplier.name}",
            debit_amount=ap_transaction_in.total_amount,
            credit_amount=Decimal('0.00')
        ))
        gl_lines.append(schemas.GLJournalEntryLineCreate(
            gl_account_id=trans_type.default_gl_account_id or ap_defaults.default_payment_gl_account_id,
            description=f"Payment {doc_number}",
            debit_amount=Decimal('0.00'),
            credit_amount=ap_transaction_in.total_amount
        ))
    
    elif trans_type.base_type == "Debit Note":
        # Debit: AP Control Account
        # Credit: Expense/Returns Account
        gl_lines.append(schemas.GLJournalEntryLineCreate(
            gl_account_id=ap_defaults.default_ap_control_gl_account_id,
            description=f"AP Debit Note - {supplier.name}",
            debit_amount=ap_transaction_in.total_amount,
            credit_amount=Decimal('0.00')
        ))
        gl_lines.append(schemas.GLJournalEntryLineCreate(
            gl_account_id=trans_type.default_gl_account_id or ap_defaults.default_expense_gl_account_id,
            description=f"Debit Note {doc_number}",
            debit_amount=Decimal('0.00'),
            credit_amount=ap_transaction_in.total_amount
        ))
    
    # Create GL journal entry
    gl_entry_in = schemas.GLJournalEntryCreate(
        entry_date=ap_transaction_in.transaction_date,
        reference=doc_number,
        description=f"{trans_type.name} - {supplier.name}",
        lines=gl_lines
    )
    
    gl_entry = crud_gl.create_journal_entry(db, gl_entry_in, company_id, user_id)
    db_transaction.linked_gl_journal_entry_id = gl_entry.id
    
    # Update supplier balance
    if trans_type.affects_balance_direction == "Credit":
        supplier.current_balance += ap_transaction_in.total_amount
    else:
        supplier.current_balance -= ap_transaction_in.total_amount
    
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

def get_ap_transactions_by_company(
    db: Session,
    company_id: int,
    skip: int = 0,
    limit: int = 100,
    supplier_id: Optional[int] = None,
    transaction_type_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
) -> List[models.APTransaction]:
    query = db.query(models.APTransaction).filter(
        models.APTransaction.company_id == company_id
    )
    
    if supplier_id:
        query = query.filter(models.APTransaction.supplier_id == supplier_id)
    if transaction_type_id:
        query = query.filter(models.APTransaction.ap_transaction_type_id == transaction_type_id)
    if start_date:
        query = query.filter(models.APTransaction.transaction_date >= start_date)
    if end_date:
        query = query.filter(models.APTransaction.transaction_date <= end_date)
    
    return query.order_by(models.APTransaction.transaction_date.desc()).offset(skip).limit(limit).all()

def get_ap_transaction(
    db: Session,
    transaction_id: int,
    company_id: int
) -> Optional[models.APTransaction]:
    return db.query(models.APTransaction).filter(
        models.APTransaction.id == transaction_id,
        models.APTransaction.company_id == company_id
    ).first()

# AP Allocation CRUD
def create_ap_allocation(
    db: Session,
    allocation_in: schemas.APAllocationCreate,
    company_id: int,
    user_id: int
) -> models.APAllocation:
    # Verify supplier
    supplier = get_supplier(db, allocation_in.supplier_id, company_id)
    if not supplier:
        raise HTTPException(status_code=400, detail="Supplier not found")
    
    # Create allocation
    db_allocation = models.APAllocation(
        company_id=company_id,
        allocation_date=allocation_in.allocation_date,
        supplier_id=allocation_in.supplier_id
    )
    db.add(db_allocation)
    db.flush()
    
    # Process allocation lines
    for line_in in allocation_in.lines:
        # Get transactions
        credit_trans = get_ap_transaction(db, line_in.credit_transaction_id, company_id)
        debit_trans = get_ap_transaction(db, line_in.debit_transaction_id, company_id)
        
        if not credit_trans or not debit_trans:
            raise HTTPException(status_code=400, detail="Transaction not found")
        
        # Verify same supplier
        if credit_trans.supplier_id != debit_trans.supplier_id:
            raise HTTPException(status_code=400, detail="Transactions must be for the same supplier")
        
        # Verify allocation amount doesn't exceed open amounts
        if line_in.allocated_amount > credit_trans.open_amount:
            raise HTTPException(status_code=400, detail=f"Allocation exceeds open amount for transaction {credit_trans.document_number}")
        if line_in.allocated_amount > debit_trans.open_amount:
            raise HTTPException(status_code=400, detail=f"Allocation exceeds open amount for transaction {debit_trans.document_number}")
        
        # Create allocation line
        db_line = models.APAllocationLine(
            ap_allocation_id=db_allocation.id,
            credit_transaction_id=line_in.credit_transaction_id,
            debit_transaction_id=line_in.debit_transaction_id,
            allocated_amount=line_in.allocated_amount
        )
        db.add(db_line)
        
        # Update open amounts
        credit_trans.open_amount -= line_in.allocated_amount
        debit_trans.open_amount -= line_in.allocated_amount
        
        # Update status
        if credit_trans.open_amount == 0:
            credit_trans.status = "Paid"
        elif credit_trans.open_amount < credit_trans.total_amount:
            credit_trans.status = "PartiallyPaid"
        
        if debit_trans.open_amount == 0:
            debit_trans.status = "Paid"
        elif debit_trans.open_amount < debit_trans.total_amount:
            debit_trans.status = "PartiallyPaid"
    
    db.commit()
    db.refresh(db_allocation)
    return db_allocation

def get_ap_allocations_by_company(
    db: Session,
    company_id: int,
    skip: int = 0,
    limit: int = 100
) -> List[models.APAllocation]:
    return db.query(models.APAllocation).filter(
        models.APAllocation.company_id == company_id
    ).offset(skip).limit(limit).all()
