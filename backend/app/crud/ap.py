from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import Optional, List
from datetime import date, timedelta
from decimal import Decimal
from fastapi import HTTPException
from app import models, schemas
from sqlalchemy.orm import Session, joinedload
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

# AP Transaction CRUD
def get_ap_transactions(db: Session, company_id: int, supplier_id: Optional[int] = None, 
                       skip: int = 0, limit: int = 100) -> List[models.APTransaction]:
    query = db.query(models.APTransaction)\
        .filter(models.APTransaction.company_id == company_id)\
        .options(
            joinedload(models.APTransaction.supplier),
            joinedload(models.APTransaction.ap_transaction_type),
            joinedload(models.APTransaction.linked_gl_journal_entry)
        )
    
    if supplier_id:
        query = query.filter(models.APTransaction.supplier_id == supplier_id)
    
    return query.offset(skip).limit(limit).all()

def get_ap_transaction(db: Session, transaction_id: int, company_id: int) -> Optional[models.APTransaction]:
    return db.query(models.APTransaction)\
        .filter(and_(models.APTransaction.id == transaction_id, models.APTransaction.company_id == company_id))\
        .options(
            joinedload(models.APTransaction.supplier),
            joinedload(models.APTransaction.ap_transaction_type),
            joinedload(models.APTransaction.linked_gl_journal_entry)
        )\
        .first()

def get_ap_transaction_by_document_number(db: Session, document_number: str, 
                                         company_id: int, transaction_type_id: int) -> Optional[models.APTransaction]:
    return db.query(models.APTransaction)\
        .filter(and_(
            models.APTransaction.document_number == document_number,
            models.APTransaction.company_id == company_id,
            models.APTransaction.ap_transaction_type_id == transaction_type_id
        ))\
        .first()

def create_ap_transaction(db: Session, transaction: schemas.APTransactionCreate, company_id: int) -> models.APTransaction:
    transaction_data = transaction.model_dump()
    transaction_data['open_amount'] = transaction_data['total_amount']  # Initially open amount equals total
    
    # Generate document number if not provided
    if 'document_number' not in transaction_data or not transaction_data['document_number']:
        # Get transaction type for prefix
        transaction_type = db.query(models.APTransactionType).filter(
            models.APTransactionType.id == transaction_data['ap_transaction_type_id']
        ).first()
        
        if transaction_type:
            # Generate prefix based on type
            if transaction_type.base_type == "Supplier Invoice":
                prefix = "SI"
            elif transaction_type.base_type == "Payment":
                prefix = "PAY"
            elif transaction_type.base_type == "Debit Note":
                prefix = "DN"
            else:
                prefix = "AP"
            
            # Get count of existing transactions of this type for simple numbering
            count = db.query(models.APTransaction).filter(
                models.APTransaction.company_id == company_id,
                models.APTransaction.ap_transaction_type_id == transaction_data['ap_transaction_type_id']
            ).count()
            
            next_number = count + 1
            transaction_data['document_number'] = f"{prefix}-{next_number:06d}"
    
    db_transaction = models.APTransaction(**transaction_data, company_id=company_id)
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

def update_ap_transaction(db: Session, transaction_id: int, company_id: int, 
                         transaction_update: schemas.APTransactionUpdate) -> Optional[models.APTransaction]:
    db_transaction = get_ap_transaction(db, transaction_id, company_id)
    if db_transaction:
        update_data = transaction_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_transaction, field, value)
        db.commit()
        db.refresh(db_transaction)
    return db_transaction

def delete_ap_transaction(db: Session, transaction_id: int, company_id: int) -> bool:
    db_transaction = get_ap_transaction(db, transaction_id, company_id)
    if db_transaction:
        db.delete(db_transaction)
        db.commit()
        return True
    return False

def post_ap_transaction_to_gl(db: Session, transaction_id: int, company_id: int) -> Optional[models.APTransaction]:
    """Post AP transaction to GL and update the status"""
    db_transaction = get_ap_transaction(db, transaction_id, company_id)
    if db_transaction and not db_transaction.is_posted_to_gl:
        # Here you would implement the GL posting logic
        # For now, just mark as posted
        db_transaction.is_posted_to_gl = True
        db_transaction.status = "Posted"
        db.commit()
        db.refresh(db_transaction)
    return db_transaction

# AP Allocation CRUD
def get_ap_allocations(db: Session, company_id: int, supplier_id: Optional[int] = None,
                      skip: int = 0, limit: int = 100) -> List[models.APAllocation]:
    query = db.query(models.APAllocation)\
        .filter(models.APAllocation.company_id == company_id)\
        .options(
            joinedload(models.APAllocation.supplier),
            joinedload(models.APAllocation.lines)
        )
    
    if supplier_id:
        query = query.filter(models.APAllocation.supplier_id == supplier_id)
    
    return query.offset(skip).limit(limit).all()

def get_ap_allocation(db: Session, allocation_id: int, company_id: int) -> Optional[models.APAllocation]:
    return db.query(models.APAllocation)\
        .filter(and_(models.APAllocation.id == allocation_id, models.APAllocation.company_id == company_id))\
        .options(
            joinedload(models.APAllocation.supplier),
            joinedload(models.APAllocation.lines)
        )\
        .first()

def create_ap_allocation(db: Session, allocation: schemas.APAllocationCreate, company_id: int) -> models.APAllocation:
    allocation_data = allocation.model_dump(exclude={'lines'})
    db_allocation = models.APAllocation(**allocation_data, company_id=company_id)
    db.add(db_allocation)
    db.flush()  # Get the ID before adding lines
    
    # Add allocation lines
    for line_data in allocation.lines:
        db_line = models.APAllocationLine(**line_data.model_dump(), ap_allocation_id=db_allocation.id)
        db.add(db_line)
    
    db.commit()
    db.refresh(db_allocation)
    return db_allocation

def delete_ap_allocation(db: Session, allocation_id: int, company_id: int) -> bool:
    db_allocation = get_ap_allocation(db, allocation_id, company_id)
    if db_allocation:
        db.delete(db_allocation)
        db.commit()
        return True
    return False

def get_ap_allocations_by_company(
    db: Session,
    company_id: int,
    skip: int = 0,
    limit: int = 100,
    supplier_id: Optional[int] = None
) -> List[models.APAllocation]:
    query = db.query(models.APAllocation).filter(
        models.APAllocation.company_id == company_id
    )
    
    if supplier_id:
        query = query.filter(models.APAllocation.supplier_id == supplier_id)
    
    return query.order_by(models.APAllocation.allocation_date.desc()).offset(skip).limit(limit).all()

# AP Reports
def get_supplier_ageing(
    db: Session,
    company_id: int,
    as_of_date: date
) -> List[dict]:
    """Calculate supplier ageing report"""
    suppliers = db.query(models.Supplier).filter(
        models.Supplier.company_id == company_id,
        models.Supplier.is_active == True
    ).all()
    
    ageing_data = []
    
    for supplier in suppliers:
        # Get all open invoices for the supplier
        open_transactions = db.query(models.APTransaction).join(
            models.APTransactionType
        ).filter(
            models.APTransaction.supplier_id == supplier.id,
            models.APTransaction.open_amount > 0,
            models.APTransactionType.base_type == "Supplier Invoice"
        ).all()
        
        current = Decimal('0.00')
        days_30 = Decimal('0.00')
        days_60 = Decimal('0.00')
        days_90 = Decimal('0.00')
        days_120_plus = Decimal('0.00')
        
        for trans in open_transactions:
            days_overdue = (as_of_date - trans.due_date).days if trans.due_date else 0
            
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
        
        total_due = current + days_30 + days_60 + days_90 + days_120_plus
        
        if total_due > 0:
            ageing_data.append({
                'supplier_id': supplier.id,
                'supplier_code': supplier.supplier_code,
                'supplier_name': supplier.name,
                'current': current,
                'days_30': days_30,
                'days_60': days_60,
                'days_90': days_90,
                'days_120_plus': days_120_plus,
                'total_due': total_due
            })
    
    return ageing_data

def get_supplier_statement_data(
    db: Session,
    company_id: int,
    supplier_id: int,
    start_date: date,
    end_date: date
) -> dict:
    """Get supplier statement data"""
    supplier = get_supplier(db, supplier_id, company_id)
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    # Get opening balance (sum of transactions before start_date)
    opening_balance_result = db.query(
        func.sum(
            func.case(
                (models.APTransactionType.affects_balance_direction == "Credit", models.APTransaction.total_amount),
                else_=-models.APTransaction.total_amount
            )
        )
    ).join(
        models.APTransactionType
    ).filter(
        models.APTransaction.supplier_id == supplier_id,
        models.APTransaction.transaction_date < start_date
    ).scalar()
    
    opening_balance = opening_balance_result or Decimal('0.00')
    
    # Get transactions within the period
    transactions = db.query(models.APTransaction).filter(
        models.APTransaction.supplier_id == supplier_id,
        models.APTransaction.transaction_date >= start_date,
        models.APTransaction.transaction_date <= end_date
    ).order_by(models.APTransaction.transaction_date).all()
    
    # Calculate closing balance
    period_movement = Decimal('0.00')
    for trans in transactions:
        if trans.ap_transaction_type.affects_balance_direction == "Credit":
            period_movement += trans.total_amount
        else:
            period_movement -= trans.total_amount
    
    closing_balance = opening_balance + period_movement
    
    return {
        'supplier': supplier,
        'opening_balance': opening_balance,
        'transactions': transactions,
        'closing_balance': closing_balance,
        'period_start': start_date,
        'period_end': end_date
    }

def update_supplier_balance(db: Session, supplier_id: int, amount_change: Decimal):
    """Update supplier's current balance"""
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if supplier:
        supplier.current_balance = supplier.current_balance + amount_change
        db.commit()

def update_transaction_open_amount(db: Session, transaction_id: int, allocated_amount: Decimal):
    """Update transaction's open amount after allocation"""
    transaction = db.query(APTransaction).filter(APTransaction.id == transaction_id).first()
    if transaction:
        transaction.open_amount = transaction.open_amount - allocated_amount
        # Update status based on open amount
        if transaction.open_amount <= 0:
            transaction.status = "Paid"
        elif transaction.open_amount < transaction.total_amount:
            transaction.status = "PartiallyPaid"
        db.commit()

# AP Defaults CRUD
def get_ap_defaults(db: Session, company_id: int) -> Optional[models.APDefaults]:
    """Get AP defaults for a company"""
    return db.query(models.APDefaults).filter(
        models.APDefaults.company_id == company_id
    ).first()

def create_or_update_ap_defaults(
    db: Session, 
    defaults_in: schemas.APDefaultsCreate, 
    company_id: int
) -> models.APDefaults:
    """Create or update AP defaults for a company"""
    existing = get_ap_defaults(db, company_id)
    
    if existing:
        # Update existing defaults
        for field, value in defaults_in.model_dump(exclude_unset=True).items():
            setattr(existing, field, value)
        db.commit()
        db.refresh(existing)
        return existing
    else:
        # Create new defaults
        db_defaults = models.APDefaults(
            **defaults_in.model_dump(),
            company_id=company_id
        )
        db.add(db_defaults)
        db.commit()
        db.refresh(db_defaults)
        return db_defaults
