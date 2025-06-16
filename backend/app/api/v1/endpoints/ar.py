from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from app.database.database import get_db
from app.core.security import get_current_active_user
from app.core.permissions import (
    AR_SETUP_MANAGE, AR_TRANSACTIONS_POST, AR_REPORTS_VIEW,
    require_permission
)
from app import crud, schemas, models

router = APIRouter()

# Customer endpoints
@router.get("/customers", response_model=List[schemas.Customer])
def get_customers(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get all customers for the company"""
    require_permission(current_user, AR_SETUP_MANAGE)
    customers = crud.ar.get_customers(db, current_user.company_id, skip=skip, limit=limit)
    
    # Add related data to response
    for customer in customers:
        if customer.sales_representative:
            customer.sales_representative_name = customer.sales_representative.name
        if customer.default_ar_gl_account:
            customer.default_ar_gl_account_name = customer.default_ar_gl_account.account_name
    
    return customers

@router.post("/customers", response_model=schemas.Customer)
def create_customer(
    customer: schemas.CustomerCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Create a new customer"""
    require_permission(current_user, AR_SETUP_MANAGE)
    
    # Check if customer code already exists
    existing_customer = crud.ar.get_customer_by_code(db, customer.customer_code, current_user.company_id)
    if existing_customer:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Customer code already exists"
        )
    
    return crud.ar.create_customer(db, customer, current_user.company_id)

@router.get("/customers/{customer_id}", response_model=schemas.Customer)
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get a specific customer"""
    require_permission(current_user, AR_SETUP_MANAGE)
    customer = crud.ar.get_customer(db, customer_id, current_user.company_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Add related data to response
    if customer.sales_representative:
        customer.sales_representative_name = customer.sales_representative.name
    if customer.default_ar_gl_account:
        customer.default_ar_gl_account_name = customer.default_ar_gl_account.account_name
    
    return customer

@router.put("/customers/{customer_id}", response_model=schemas.Customer)
def update_customer(
    customer_id: int,
    customer_update: schemas.CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Update a customer"""
    require_permission(current_user, AR_SETUP_MANAGE)
    
    # Check if customer code already exists (if being updated)
    if customer_update.customer_code:
        existing_customer = crud.ar.get_customer_by_code(db, customer_update.customer_code, current_user.company_id)
        if existing_customer and existing_customer.id != customer_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Customer code already exists"
            )
    
    customer = crud.ar.update_customer(db, customer_id, current_user.company_id, customer_update)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@router.delete("/customers/{customer_id}")
def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Delete a customer"""
    require_permission(current_user, AR_SETUP_MANAGE)
    
    # Check if customer has transactions
    transactions = crud.ar.get_ar_transactions(db, current_user.company_id, customer_id=customer_id, limit=1)
    if transactions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete customer with existing transactions"
        )
    
    success = crud.ar.delete_customer(db, customer_id, current_user.company_id)
    if not success:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {"message": "Customer deleted successfully"}

# Sales Representative endpoints
@router.get("/sales-representatives", response_model=List[schemas.SalesRepresentative])
def get_sales_representatives(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get all sales representatives for the company"""
    require_permission(current_user, AR_SETUP_MANAGE)
    return crud.ar.get_sales_representatives(db, current_user.company_id, skip=skip, limit=limit)

@router.post("/sales-representatives", response_model=schemas.SalesRepresentative)
def create_sales_representative(
    sales_rep: schemas.SalesRepresentativeCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Create a new sales representative"""
    require_permission(current_user, AR_SETUP_MANAGE)
    return crud.ar.create_sales_representative(db, sales_rep, current_user.company_id)

@router.get("/sales-representatives/{sales_rep_id}", response_model=schemas.SalesRepresentative)
def get_sales_representative(
    sales_rep_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get a specific sales representative"""
    require_permission(current_user, AR_SETUP_MANAGE)
    sales_rep = crud.ar.get_sales_representative(db, sales_rep_id, current_user.company_id)
    if not sales_rep:
        raise HTTPException(status_code=404, detail="Sales representative not found")
    return sales_rep

@router.put("/sales-representatives/{sales_rep_id}", response_model=schemas.SalesRepresentative)
def update_sales_representative(
    sales_rep_id: int,
    sales_rep_update: schemas.SalesRepresentativeUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Update a sales representative"""
    require_permission(current_user, AR_SETUP_MANAGE)
    sales_rep = crud.ar.update_sales_representative(db, sales_rep_id, current_user.company_id, sales_rep_update)
    if not sales_rep:
        raise HTTPException(status_code=404, detail="Sales representative not found")
    return sales_rep

@router.delete("/sales-representatives/{sales_rep_id}")
def delete_sales_representative(
    sales_rep_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Delete a sales representative"""
    require_permission(current_user, AR_SETUP_MANAGE)
    
    # Check if sales rep has customers
    customers = crud.ar.get_customers(db, current_user.company_id)
    has_customers = any(c.sales_representative_id == sales_rep_id for c in customers)
    if has_customers:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete sales representative with assigned customers"
        )
    
    success = crud.ar.delete_sales_representative(db, sales_rep_id, current_user.company_id)
    if not success:
        raise HTTPException(status_code=404, detail="Sales representative not found")
    return {"message": "Sales representative deleted successfully"}

# AR Transaction Type endpoints
@router.get("/transaction-types", response_model=List[schemas.ARTransactionType])
def get_ar_transaction_types(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get all AR transaction types for the company"""
    require_permission(current_user, AR_SETUP_MANAGE)
    transaction_types = crud.ar.get_ar_transaction_types(db, current_user.company_id, skip=skip, limit=limit)
    
    # Add related data to response
    for transaction_type in transaction_types:
        if transaction_type.default_gl_account:
            transaction_type.default_gl_account_name = transaction_type.default_gl_account.account_name
        if transaction_type.default_ar_control_gl_account:
            transaction_type.default_ar_control_gl_account_name = transaction_type.default_ar_control_gl_account.account_name
    
    return transaction_types

@router.post("/transaction-types", response_model=schemas.ARTransactionType)
def create_ar_transaction_type(
    transaction_type: schemas.ARTransactionTypeCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Create a new AR transaction type"""
    require_permission(current_user, AR_SETUP_MANAGE)
    
    # Check if transaction type name already exists
    existing_type = crud.ar.get_ar_transaction_type_by_name(db, transaction_type.name, current_user.company_id)
    if existing_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transaction type name already exists"
        )
    
    return crud.ar.create_ar_transaction_type(db, transaction_type, current_user.company_id)

@router.get("/transaction-types/{transaction_type_id}", response_model=schemas.ARTransactionType)
def get_ar_transaction_type(
    transaction_type_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get a specific AR transaction type"""
    require_permission(current_user, AR_SETUP_MANAGE)
    transaction_type = crud.ar.get_ar_transaction_type(db, transaction_type_id, current_user.company_id)
    if not transaction_type:
        raise HTTPException(status_code=404, detail="Transaction type not found")
    
    # Add related data to response
    if transaction_type.default_gl_account:
        transaction_type.default_gl_account_name = transaction_type.default_gl_account.account_name
    if transaction_type.default_ar_control_gl_account:
        transaction_type.default_ar_control_gl_account_name = transaction_type.default_ar_control_gl_account.account_name
    
    return transaction_type

@router.put("/transaction-types/{transaction_type_id}", response_model=schemas.ARTransactionType)
def update_ar_transaction_type(
    transaction_type_id: int,
    transaction_type_update: schemas.ARTransactionTypeUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Update an AR transaction type"""
    require_permission(current_user, AR_SETUP_MANAGE)
    
    # Check if transaction type name already exists (if being updated)
    if transaction_type_update.name:
        existing_type = crud.ar.get_ar_transaction_type_by_name(db, transaction_type_update.name, current_user.company_id)
        if existing_type and existing_type.id != transaction_type_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Transaction type name already exists"
            )
    
    transaction_type = crud.ar.update_ar_transaction_type(db, transaction_type_id, current_user.company_id, transaction_type_update)
    if not transaction_type:
        raise HTTPException(status_code=404, detail="Transaction type not found")
    return transaction_type

@router.delete("/transaction-types/{transaction_type_id}")
def delete_ar_transaction_type(
    transaction_type_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Delete an AR transaction type"""
    require_permission(current_user, AR_SETUP_MANAGE)
    
    # Check if transaction type has transactions
    transactions = crud.ar.get_ar_transactions(db, current_user.company_id)
    has_transactions = any(t.ar_transaction_type_id == transaction_type_id for t in transactions)
    if has_transactions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete transaction type with existing transactions"
        )
    
    success = crud.ar.delete_ar_transaction_type(db, transaction_type_id, current_user.company_id)
    if not success:
        raise HTTPException(status_code=404, detail="Transaction type not found")
    return {"message": "Transaction type deleted successfully"}

# AR Transaction endpoints
@router.get("/transactions", response_model=List[schemas.ARTransaction])
def get_ar_transactions(
    customer_id: Optional[int] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    base_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get AR transactions with optional filtering"""
    require_permission(current_user, AR_TRANSACTIONS_POST)
    transactions = crud.ar.get_ar_transactions(
        db, current_user.company_id, customer_id, from_date, to_date, base_type, skip, limit
    )
    
    # Add related data to response
    for transaction in transactions:
        if transaction.customer:
            transaction.customer_name = transaction.customer.name
        if transaction.ar_transaction_type:
            transaction.ar_transaction_type_name = transaction.ar_transaction_type.name
    
    return transactions

@router.post("/transactions", response_model=schemas.ARTransaction)
def create_ar_transaction(
    transaction: schemas.ARTransactionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Create a new AR transaction"""
    require_permission(current_user, AR_TRANSACTIONS_POST)
    return crud.ar.create_ar_transaction(db, transaction, current_user.company_id)

@router.get("/transactions/{transaction_id}", response_model=schemas.ARTransaction)
def get_ar_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get a specific AR transaction"""
    require_permission(current_user, AR_TRANSACTIONS_POST)
    transaction = crud.ar.get_ar_transaction(db, transaction_id, current_user.company_id)
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Add related data to response
    if transaction.customer:
        transaction.customer_name = transaction.customer.name
    if transaction.ar_transaction_type:
        transaction.ar_transaction_type_name = transaction.ar_transaction_type.name
    
    return transaction

@router.put("/transactions/{transaction_id}", response_model=schemas.ARTransaction)
def update_ar_transaction(
    transaction_id: int,
    transaction_update: schemas.ARTransactionUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Update an AR transaction"""
    require_permission(current_user, AR_TRANSACTIONS_POST)
    
    # Check if transaction is already posted
    existing_transaction = crud.ar.get_ar_transaction(db, transaction_id, current_user.company_id)
    if existing_transaction and existing_transaction.is_posted_to_gl:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot update posted transaction"
        )
    
    transaction = crud.ar.update_ar_transaction(db, transaction_id, current_user.company_id, transaction_update)
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return transaction

@router.post("/transactions/{transaction_id}/post", response_model=schemas.ARTransaction)
def post_ar_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Post an AR transaction to GL"""
    require_permission(current_user, AR_TRANSACTIONS_POST)
    
    try:
        transaction = crud.ar.post_ar_transaction_to_gl(db, transaction_id, current_user.company_id)
        if not transaction:
            raise HTTPException(status_code=404, detail="Transaction not found or already posted")
        return transaction
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

# AR Allocation endpoints
@router.get("/allocations", response_model=List[schemas.ARAllocation])
def get_ar_allocations(
    customer_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get AR allocations"""
    require_permission(current_user, AR_TRANSACTIONS_POST)
    allocations = crud.ar.get_ar_allocations(db, current_user.company_id, customer_id, skip, limit)
    
    # Add related data to response
    for allocation in allocations:
        if allocation.customer:
            allocation.customer_name = allocation.customer.name
        for line in allocation.lines:
            if line.debit_transaction:
                line.debit_transaction_document_number = line.debit_transaction.document_number
            if line.credit_transaction:
                line.credit_transaction_document_number = line.credit_transaction.document_number
    
    return allocations

@router.post("/allocations", response_model=schemas.ARAllocation)
def create_ar_allocation(
    allocation: schemas.ARAllocationCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Create a new AR allocation"""
    require_permission(current_user, AR_TRANSACTIONS_POST)
    return crud.ar.create_ar_allocation(db, allocation, current_user.company_id)

# AR Defaults endpoints
@router.get("/defaults", response_model=schemas.ARDefaults)
def get_ar_defaults(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get AR defaults for the company"""
    require_permission(current_user, AR_SETUP_MANAGE)
    ar_defaults = crud.ar.get_ar_defaults(db, current_user.company_id)
    if not ar_defaults:
        raise HTTPException(status_code=404, detail="AR defaults not found")
    
    # Add related data to response
    if ar_defaults.default_ar_control_gl_account:
        ar_defaults.default_ar_control_gl_account_name = ar_defaults.default_ar_control_gl_account.account_name
    if ar_defaults.default_sales_gl_account:
        ar_defaults.default_sales_gl_account_name = ar_defaults.default_sales_gl_account.account_name
    if ar_defaults.default_receipt_gl_account:
        ar_defaults.default_receipt_gl_account_name = ar_defaults.default_receipt_gl_account.account_name
    if ar_defaults.default_sales_discount_gl_account:
        ar_defaults.default_sales_discount_gl_account_name = ar_defaults.default_sales_discount_gl_account.account_name
    
    return ar_defaults

@router.put("/defaults", response_model=schemas.ARDefaults)
def update_ar_defaults(
    ar_defaults_update: schemas.ARDefaultsUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Update AR defaults for the company"""
    require_permission(current_user, AR_SETUP_MANAGE)
    return crud.ar.create_or_update_ar_defaults(db, ar_defaults_update, current_user.company_id)

# AR Reports endpoints
@router.get("/reports/customer-aging")
def get_customer_aging_report(
    as_of_date: date,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get customer aging report"""
    require_permission(current_user, AR_REPORTS_VIEW)
    return crud.ar.get_customer_aging_report(db, current_user.company_id, as_of_date)

@router.get("/reports/customer-statement/{customer_id}")
def get_customer_statement(
    customer_id: int,
    from_date: date,
    to_date: date,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get customer statement"""
    require_permission(current_user, AR_REPORTS_VIEW)
    return crud.ar.get_customer_statement(db, current_user.company_id, customer_id, from_date, to_date)
