from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from app.database.database import get_db
from app.core.security import get_current_active_user
from app.core.permissions import (
    AR_SETUP_MANAGE, AR_TRANSACTIONS_POST, AR_REPORTS_VIEW, AR_WRITEOFF_APPROVE,
    require_permission, PermissionChecker
)
from app import crud, schemas, models
from app.crud import ar_new
from app.middleware.tenant import get_current_tenant_id

router = APIRouter()

# Customer endpoints
@router.get("/customers", response_model=List[schemas.Customer])
async def list_customers(
    request: Request,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([AR_SETUP_MANAGE]))
):
    """Get all customers for the company"""
    company_id = get_current_tenant_id(request)
    customers = crud.ar.get_customers(db, company_id, skip=skip, limit=limit)
    
    # Add related data to response
    for customer in customers:
        if customer.sales_representative:
            customer.sales_representative_name = customer.sales_representative.name
        if customer.default_ar_gl_account:
            customer.default_ar_gl_account_name = customer.default_ar_gl_account.account_name
    
    return customers

@router.post("/customers", response_model=schemas.Customer)
async def create_customer(
    request: Request,
    customer: schemas.CustomerCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([AR_SETUP_MANAGE]))
):
    """Create a new customer"""
    company_id = get_current_tenant_id(request)
    
    # Check if customer code already exists
    existing_customer = crud.ar.get_customer_by_code(db, customer.customer_code, company_id)
    if existing_customer:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Customer code already exists"
        )
    
    return crud.ar.create_customer(db, customer, company_id)

@router.get("/customers/{customer_id}", response_model=schemas.Customer)
async def get_customer(
    customer_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([AR_SETUP_MANAGE]))
):
    """Get a specific customer"""
    company_id = get_current_tenant_id(request)
    customer = crud.ar.get_customer(db, customer_id, company_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Add related data to response
    if customer.sales_representative:
        customer.sales_representative_name = customer.sales_representative.name
    if customer.default_ar_gl_account:
        customer.default_ar_gl_account_name = customer.default_ar_gl_account.account_name
    
    return customer

@router.put("/customers/{customer_id}", response_model=schemas.Customer)
async def update_customer(
    customer_id: int,
    customer_update: schemas.CustomerUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([AR_SETUP_MANAGE]))
):
    """Update a customer"""
    company_id = get_current_tenant_id(request)
    
    # Check if customer code already exists (if being updated)
    if customer_update.customer_code:
        existing_customer = crud.ar.get_customer_by_code(db, customer_update.customer_code, company_id)
        if existing_customer and existing_customer.id != customer_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Customer code already exists"
            )
    
    customer = crud.ar.update_customer(db, customer_id, company_id, customer_update)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@router.delete("/customers/{customer_id}")
def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([AR_SETUP_MANAGE]))
):
    """Delete a customer"""
    
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
    current_user: models.User = Depends(PermissionChecker([AR_SETUP_MANAGE]))
):
    """Get all sales representatives for the company"""
    return crud.ar.get_sales_representatives(db, current_user.company_id, skip=skip, limit=limit)

@router.post("/sales-representatives", response_model=schemas.SalesRepresentative)
def create_sales_representative(
    sales_rep: schemas.SalesRepresentativeCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([AR_SETUP_MANAGE]))
):
    """Create a new sales representative"""
    return crud.ar.create_sales_representative(db, sales_rep, current_user.company_id)

@router.get("/sales-representatives/{sales_rep_id}", response_model=schemas.SalesRepresentative)
def get_sales_representative(
    sales_rep_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([AR_SETUP_MANAGE]))
):
    """Get a specific sales representative"""
    sales_rep = crud.ar.get_sales_representative(db, sales_rep_id, current_user.company_id)
    if not sales_rep:
        raise HTTPException(status_code=404, detail="Sales representative not found")
    return sales_rep

@router.put("/sales-representatives/{sales_rep_id}", response_model=schemas.SalesRepresentative)
def update_sales_representative(
    sales_rep_id: int,
    sales_rep_update: schemas.SalesRepresentativeUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([AR_SETUP_MANAGE]))
):
    """Update a sales representative"""
    sales_rep = crud.ar.update_sales_representative(db, sales_rep_id, current_user.company_id, sales_rep_update)
    if not sales_rep:
        raise HTTPException(status_code=404, detail="Sales representative not found")
    return sales_rep

@router.delete("/sales-representatives/{sales_rep_id}")
def delete_sales_representative(
    sales_rep_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([AR_SETUP_MANAGE]))
):
    """Delete a sales representative"""
    
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
    current_user: models.User = Depends(PermissionChecker([AR_SETUP_MANAGE]))
):
    """Get all AR transaction types for the company"""
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
    current_user: models.User = Depends(PermissionChecker([AR_SETUP_MANAGE]))
):
    """Create a new AR transaction type"""
    
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
    current_user: models.User = Depends(PermissionChecker([AR_SETUP_MANAGE]))
):
    """Get a specific AR transaction type"""
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
    current_user: models.User = Depends(PermissionChecker([AR_SETUP_MANAGE]))
):
    """Update an AR transaction type"""
    
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
    current_user: models.User = Depends(PermissionChecker([AR_SETUP_MANAGE]))
):
    """Delete an AR transaction type"""
    
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
async def get_ar_transactions(
    request: Request,
    customer_id: Optional[int] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    base_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([AR_REPORTS_VIEW]))
):
    """Get AR transactions with optional filtering"""
    company_id = get_current_tenant_id(request)
    transactions = crud.ar.get_ar_transactions(
        db, company_id, customer_id, from_date, to_date, base_type, skip, limit
    )
    
    # Add related data to response
    for transaction in transactions:
        if transaction.customer:
            transaction.customer_name = transaction.customer.name
        if transaction.ar_transaction_type:
            transaction.ar_transaction_type_name = transaction.ar_transaction_type.name
    
    return transactions

@router.post("/transactions", response_model=schemas.ARTransaction)
async def create_ar_transaction(
    request: Request,
    transaction: schemas.ARTransactionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([AR_TRANSACTIONS_POST]))
):
    """Create a new AR transaction"""
    company_id = get_current_tenant_id(request)
    return crud.ar.create_ar_transaction(db, transaction, company_id, current_user.id)

@router.get("/transactions/{transaction_id}", response_model=schemas.ARTransaction)
def get_ar_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([AR_REPORTS_VIEW]))
):
    """Get a specific AR transaction"""
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
    current_user: models.User = Depends(PermissionChecker([AR_TRANSACTIONS_POST]))
):
    """Update an AR transaction"""
    
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
    current_user: models.User = Depends(PermissionChecker([AR_TRANSACTIONS_POST]))
):
    """Post an AR transaction to GL"""
    
    try:
        transaction = crud.ar.post_ar_transaction_to_gl(db, transaction_id, current_user.company_id, current_user.id)
        if not transaction:
            raise HTTPException(status_code=404, detail="Transaction not found or already posted")
        return transaction
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

# AR Payment endpoints
@router.post("/payments", response_model=schemas.ARTransaction)
def create_ar_payment(
    payment_in: schemas.ARPaymentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([AR_TRANSACTIONS_POST]))
):
    """Create an AR payment with forex support"""
    return crud.ar.process_ar_payment_with_forex(
        db, payment_in, current_user.company_id, current_user.id
    )

# AR Allocation endpoints
@router.get("/allocations", response_model=List[schemas.ARAllocation])
def get_ar_allocations(
    customer_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([AR_REPORTS_VIEW]))
):
    """Get AR allocations"""
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
    current_user: models.User = Depends(PermissionChecker([AR_TRANSACTIONS_POST]))
):
    """Create a new AR allocation"""
    return crud.ar.create_ar_allocation(db, allocation, current_user.company_id)

# AR Defaults endpoints
@router.get("/defaults", response_model=schemas.ARDefaults)
def get_ar_defaults(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([AR_SETUP_MANAGE]))
):
    """Get AR defaults for the company"""
    ar_defaults = crud.ar.get_ar_defaults(db, current_user.company_id)
    if not ar_defaults:
        # Return empty defaults if none exist
        from app.models.ar import ARDefaults
        ar_defaults = ARDefaults(
            id=0,
            company_id=current_user.company_id,
            default_ar_control_gl_account_id=None,
            default_sales_gl_account_id=None,
            default_receipt_gl_account_id=None,
            default_sales_discount_gl_account_id=None,
            default_bad_debt_gl_account_id=None,
            default_payment_terms=None,
            default_credit_limit=None
        )
    
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
    current_user: models.User = Depends(PermissionChecker([AR_SETUP_MANAGE]))
):
    """Update AR defaults for the company"""
    return crud.ar.create_or_update_ar_defaults(db, ar_defaults_update, current_user.company_id)

# AR Reports endpoints
@router.get("/reports/customer-aging", response_model=List[schemas.CustomerAgingReportItem])
def get_customer_aging_report(
    as_of_date: date,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([AR_REPORTS_VIEW]))
):
    """Get customer aging report"""
    aging_data = ar_new.get_customer_aging_report(db, current_user.company_id, as_of_date)
    # Convert to frontend-compatible format
    return [schemas.CustomerAgingReportItem.from_customer_ageing(item) for item in aging_data]

@router.get("/reports/customer-statement/{customer_id}")
def get_customer_statement(
    customer_id: int,
    from_date: date,
    to_date: date,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([AR_REPORTS_VIEW]))
):
    """Get customer statement"""
    return crud.ar.get_customer_statement(db, current_user.company_id, customer_id, from_date, to_date)

# Write-off endpoints
@router.get("/writeoffs", response_model=List[schemas.ARWriteOff])
def get_writeoffs(
    skip: int = 0,
    limit: int = 100,
    customer_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([AR_REPORTS_VIEW]))
):
    """Get write-offs with optional filters"""
    return ar_new.get_ar_writeoffs(
        db, current_user.company_id, skip=skip, limit=limit, 
        customer_id=customer_id, status=status
    )

@router.get("/writeoffs/{writeoff_id}", response_model=schemas.ARWriteOff)
def get_writeoff(
    writeoff_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([AR_REPORTS_VIEW]))
):
    """Get a specific write-off"""
    writeoff = ar_new.get_ar_writeoff(db, writeoff_id, current_user.company_id)
    if not writeoff:
        raise HTTPException(status_code=404, detail="Write-off not found")
    return writeoff

@router.post("/writeoffs", response_model=schemas.ARWriteOff)
def create_writeoff(
    writeoff: schemas.ARWriteOffCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([AR_TRANSACTIONS_POST]))
):
    """Create a new write-off request"""
    
    try:
        return ar_new.create_ar_writeoff(
            db, writeoff, current_user.company_id, current_user.id
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/writeoffs/{writeoff_id}", response_model=schemas.ARWriteOff)
def update_writeoff(
    writeoff_id: int,
    writeoff_update: schemas.ARWriteOffUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([AR_TRANSACTIONS_POST]))
):
    """Update a write-off (only if in Draft status)"""
    
    try:
        writeoff = ar_new.update_ar_writeoff(
            db, writeoff_id, writeoff_update, current_user.company_id
        )
        if not writeoff:
            raise HTTPException(status_code=404, detail="Write-off not found")
        return writeoff
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/writeoffs/{writeoff_id}/approve", response_model=schemas.ARWriteOff)
def approve_writeoff(
    writeoff_id: int,
    approval: schemas.ARWriteOffApproval,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([AR_WRITEOFF_APPROVE]))
):
    """Approve or reject a write-off"""  # New permission
    
    try:
        return ar_new.approve_ar_writeoff(
            db, writeoff_id, approval, current_user.company_id, current_user.id
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/writeoffs/{writeoff_id}")
def delete_writeoff(
    writeoff_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([AR_TRANSACTIONS_POST]))
):
    """Delete a write-off (only if in Draft status)"""
    
    try:
        success = ar_new.delete_ar_writeoff(db, writeoff_id, current_user.company_id)
        if not success:
            raise HTTPException(status_code=404, detail="Write-off not found")
        return {"message": "Write-off deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# Customer Analytics endpoints
@router.get("/customers/{customer_id}/analytics", response_model=schemas.CustomerWithAnalytics)
def get_customer_analytics(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([AR_REPORTS_VIEW]))
):
    """Get customer with write-off analytics and credit analysis"""
    
    try:
        return ar_new.get_customer_with_analytics(db, customer_id, current_user.company_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/customers/{customer_id}/writeoff-summary", response_model=schemas.CustomerWriteOffSummary)
def get_customer_writeoff_summary(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([AR_REPORTS_VIEW]))
):
    """Get write-off summary for a customer"""
    
    return ar_new.get_customer_writeoff_summary(db, customer_id, current_user.company_id)

@router.get("/customers/{customer_id}/credit-analysis", response_model=schemas.CustomerCreditAnalysis)
def get_customer_credit_analysis(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([AR_REPORTS_VIEW]))
):
    """Get credit analysis for a customer"""
    
    return ar_new.get_customer_credit_analysis(db, customer_id, current_user.company_id)

# Financial Reporting endpoints
@router.get("/reports/bad-debt-expense", response_model=schemas.BadDebtExpenseReport)
def get_bad_debt_expense_report(
    start_date: date,
    end_date: date,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([AR_REPORTS_VIEW]))
):
    """Get bad debt expense report for P&L"""
    return ar_new.get_bad_debt_expense_report(db, current_user.company_id, start_date, end_date)

@router.get("/reports/aging-with-writeoffs", response_model=List[schemas.ARAgingWithWriteoffs])
def get_ar_aging_with_writeoffs(
    as_of_date: date,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([AR_REPORTS_VIEW]))
):
    """Get AR aging report including write-off analysis"""
    return ar_new.get_ar_aging_with_writeoffs(db, current_user.company_id, as_of_date)

@router.get("/reports/writeoff-recoveries", response_model=List[schemas.WriteOffRecovery])
def get_writeoff_recoveries(
    start_date: date,
    end_date: date,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([AR_REPORTS_VIEW]))
):
    """Get write-off recovery tracking"""
    return ar_new.get_writeoff_recoveries(db, current_user.company_id, start_date, end_date)
