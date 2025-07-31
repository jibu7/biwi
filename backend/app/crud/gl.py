from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import Optional, List, Dict
from datetime import date
from decimal import Decimal
from fastapi import HTTPException, status
from app import models, schemas
from app.crud.base import CRUDBase
from app.services.tax_calculator import TaxCalculator

class GLAccountCRUD(CRUDBase[models.GLAccount, schemas.GLAccountCreate, schemas.GLAccountUpdate]):
    def create_with_company(
        self, db: Session, *, obj_in: schemas.GLAccountCreate, company_id: int
    ) -> models.GLAccount:
        # Validate parent account belongs to same company
        if obj_in.parent_account_id:
            parent = db.query(models.GLAccount).filter(
                models.GLAccount.id == obj_in.parent_account_id,
                models.GLAccount.company_id == company_id
            ).first()
            if not parent:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Parent account not found or belongs to different company"
                )
        
        # Check for duplicate account code within company
        existing = db.query(models.GLAccount).filter(
            models.GLAccount.account_code == obj_in.account_code,
            models.GLAccount.company_id == company_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Account code {obj_in.account_code} already exists for this company"
            )
        
        db_obj = models.GLAccount(
            **obj_in.model_dump(),
            company_id=company_id
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def get_by_company(
        self, db: Session, *, company_id: int, skip: int = 0, limit: int = 100,
        account_type: Optional[str] = None, is_active: Optional[bool] = True
    ) -> List[models.GLAccount]:
        query = db.query(models.GLAccount).filter(
            models.GLAccount.company_id == company_id
        )
        
        if account_type:
            query = query.filter(models.GLAccount.account_type == account_type)
        if is_active is not None:
            query = query.filter(models.GLAccount.is_active == is_active)
        
        return query.offset(skip).limit(limit).all()
    
    def get_with_company_check(
        self, db: Session, *, id: int, company_id: int
    ) -> Optional[models.GLAccount]:
        return db.query(models.GLAccount).filter(
            models.GLAccount.id == id,
            models.GLAccount.company_id == company_id
        ).first()
    
    def update_with_company_check(
        self, db: Session, *, db_obj: models.GLAccount, obj_in: schemas.GLAccountUpdate,
        company_id: int
    ) -> models.GLAccount:
        if db_obj.company_id != company_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot update account from different company"
            )
        
        # Validate parent if being updated
        if obj_in.parent_account_id is not None:
            if obj_in.parent_account_id:  # Not null
                parent = self.get_with_company_check(
                    db, id=obj_in.parent_account_id, company_id=company_id
                )
                if not parent:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Parent account not found in same company"
                    )
        
        return super().update(db, db_obj=db_obj, obj_in=obj_in)
    
    def delete_with_company_check(
        self, db: Session, *, id: int, company_id: int
    ) -> models.GLAccount:
        obj = self.get_with_company_check(db, id=id, company_id=company_id)
        if not obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Account not found"
            )
        
        # Check if account has transactions
        has_transactions = db.query(models.GLJournalEntryLine).filter(
            models.GLJournalEntryLine.gl_account_id == id
        ).first()
        
        if has_transactions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete account with existing transactions"
            )
        
        return super().remove(db, id=id)

gl_account = GLAccountCRUD(models.GLAccount)

# Journal Entry CRUD with tenant isolation
def create_journal_entry(
    db: Session, 
    entry_in: schemas.GLJournalEntryCreate, 
    company_id: int, 
    user_id: int
) -> models.GLJournalEntry:
    # Validate all GL accounts belong to the same company
    account_ids = [line.gl_account_id for line in entry_in.lines]
    accounts = db.query(models.GLAccount).filter(
        models.GLAccount.id.in_(account_ids),
        models.GLAccount.company_id == company_id
    ).all()
    
    if len(accounts) != len(account_ids):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="One or more GL accounts not found or belong to different company"
        )
    
    # Validate debits equal credits
    total_debit = sum(line.debit_amount for line in entry_in.lines)
    total_credit = sum(line.credit_amount for line in entry_in.lines)
    
    if abs(total_debit - total_credit) > 0.01:  # Allow for rounding
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Journal entry not balanced. Debit: {total_debit}, Credit: {total_credit}"
        )
    
    # Create journal entry
    from datetime import datetime
    db_entry = models.GLJournalEntry(
        company_id=company_id,
        entry_date=entry_in.entry_date,
        reference=entry_in.reference,
        description=entry_in.description,
        posted_by_user_id=user_id,
        status=entry_in.status or "Draft",
        created_at=func.now(),
        updated_at=func.now()
    )
    db.add(db_entry)
    db.flush()  # Get the ID without committing
    
    # Create journal lines
    for line_in in entry_in.lines:
        db_line = models.GLJournalEntryLine(
            journal_entry_id=db_entry.id,
            gl_account_id=line_in.gl_account_id,
            description=line_in.description,
            debit_amount=line_in.debit_amount,
            credit_amount=line_in.credit_amount
        )
        db.add(db_line)
    
    # If posting immediately, update GL balances
    if db_entry.status == "Posted":
        db_entry.posting_date = func.now()
        post_journal_entry_to_gl(db, db_entry)
    
    db.commit()
    db.refresh(db_entry)
    return db_entry

def post_journal_entry_to_gl(db: Session, journal_entry: models.GLJournalEntry):
    """Update GL account balances for posted journal entry"""
    for line in journal_entry.lines:
        account = db.query(models.GLAccount).filter(
            models.GLAccount.id == line.gl_account_id
        ).with_for_update().first()  # Lock the row
        
        if not account:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"GL Account {line.gl_account_id} not found"
            )
        
        # Update balance based on account type and debit/credit
        if account.account_type in ["Asset", "Expense"]:
            # Debit increases, Credit decreases
            account.current_balance += line.debit_amount - line.credit_amount
        else:  # Liability, Equity, Income
            # Credit increases, Debit decreases
            account.current_balance += line.credit_amount - line.debit_amount
        
        db.add(account)

def get_journal_entries_by_company(
    db: Session, 
    company_id: int, 
    skip: int = 0, 
    limit: int = 100,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    status: Optional[str] = None
) -> List[models.GLJournalEntry]:
    query = db.query(models.GLJournalEntry).filter(
        models.GLJournalEntry.company_id == company_id
    )
    
    if start_date:
        query = query.filter(models.GLJournalEntry.entry_date >= start_date)
    if end_date:
        query = query.filter(models.GLJournalEntry.entry_date <= end_date)
    if status:
        query = query.filter(models.GLJournalEntry.status == status)
    
    return query.order_by(models.GLJournalEntry.entry_date.desc()).offset(skip).limit(limit).all()

def calculate_trial_balance(
    db: Session, 
    company_id: int, 
    end_date: date,
    only_active: bool = True
) -> List[Dict]:
    """Calculate trial balance ensuring company isolation using current_balance"""
    query = db.query(
        models.GLAccount.account_code,
        models.GLAccount.account_name,
        models.GLAccount.account_type,
        models.GLAccount.current_balance
    ).filter(
        models.GLAccount.company_id == company_id
    )
    
    if only_active:
        query = query.filter(models.GLAccount.is_active == True)
    
    accounts = query.all()
    
    trial_balance = []
    for account in accounts:
        if account.current_balance != 0:  # Only include accounts with balances
            debit = credit = 0
            if account.account_type in ["Asset", "Expense"]:
                if account.current_balance > 0:
                    debit = account.current_balance
                else:
                    credit = abs(account.current_balance)
            else:  # Liability, Equity, Income
                if account.current_balance > 0:
                    credit = account.current_balance
                else:
                    debit = abs(account.current_balance)
            
            trial_balance.append({
                "account_code": account.account_code,
                "account_name": account.account_name,
                "account_type": account.account_type,
                "debit": float(debit),
                "credit": float(credit)
            })
    
    return trial_balance

# GL Defaults CRUD operations
def get_gl_defaults(db: Session, company_id: int) -> Optional[models.GLDefaults]:
    """Get GL defaults for a company"""
    return db.query(models.GLDefaults).filter(
        models.GLDefaults.company_id == company_id
    ).first()

def create_or_update_gl_defaults(
    db: Session, 
    defaults: schemas.GLDefaultsCreate, 
    company_id: int
) -> models.GLDefaults:
    """Create or update GL defaults for a company"""
    # Check if defaults already exist
    existing = get_gl_defaults(db, company_id)
    
    if existing:
        # Update existing defaults
        update_data = defaults.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(existing, field, value)
        db.add(existing)
        db.commit()
        db.refresh(existing)
        return existing
    else:
        # Create new defaults
        db_defaults = models.GLDefaults(
            **defaults.model_dump(),
            company_id=company_id
        )
        db.add(db_defaults)
        db.commit()
        db.refresh(db_defaults)
        return db_defaults

# Alias for compatibility with other modules
def create_gl_journal_entry(
    db: Session, 
    entry_in: schemas.GLJournalEntryCreate, 
    company_id: int, 
    user_id: int
) -> models.GLJournalEntry:
    """Alias for create_journal_entry to maintain compatibility"""
    return create_journal_entry(db, entry_in, company_id, user_id)

def get_account_transactions(
    db: Session,
    company_id: int,
    account_id: int,
    start_date: date,
    end_date: date
) -> List[schemas.AccountTransaction]:
    """Get account transactions for a specific GL account within date range"""
    
    # Get journal entry lines for the specified account and date range
    query = db.query(
        models.GLJournalEntryLine,
        models.GLJournalEntry
    ).join(
        models.GLJournalEntry,
        models.GLJournalEntryLine.journal_entry_id == models.GLJournalEntry.id
    ).filter(
        models.GLJournalEntryLine.gl_account_id == account_id,
        models.GLJournalEntry.company_id == company_id,
        models.GLJournalEntry.entry_date >= start_date,
        models.GLJournalEntry.entry_date <= end_date,
        models.GLJournalEntry.status == "Posted"  # Only posted entries
    ).order_by(
        models.GLJournalEntry.entry_date.asc(),
        models.GLJournalEntry.id.asc()
    )
    
    transactions = []
    running_balance = Decimal('0')
    
    # Get the account to determine its type for balance calculation
    account = db.query(models.GLAccount).filter(
        models.GLAccount.id == account_id,
        models.GLAccount.company_id == company_id
    ).first()
    
    if not account:
        return []
    
    for line, entry in query.all():
        # Calculate running balance based on account type
        if account.account_type in ["Asset", "Expense"]:
            # For assets/expenses: debit increases balance, credit decreases
            running_balance += (line.debit_amount or Decimal('0')) - (line.credit_amount or Decimal('0'))
        else:
            # For liabilities/equity/income: credit increases balance, debit decreases
            running_balance += (line.credit_amount or Decimal('0')) - (line.debit_amount or Decimal('0'))
        
        transaction = schemas.AccountTransaction(
            transaction_date=entry.entry_date,
            reference_number=entry.reference or f"JE-{entry.id}",
            description=line.description or entry.description or "",
            debit_amount=line.debit_amount if line.debit_amount and line.debit_amount > 0 else None,
            credit_amount=line.credit_amount if line.credit_amount and line.credit_amount > 0 else None,
            running_balance=running_balance,
            journal_entry_id=entry.id
        )
        
        transactions.append(transaction)
    
    return transactions


# Transaction Type CRUD Operations
class GLTransactionTypeCRUD(CRUDBase[models.GLTransactionType, schemas.GLTransactionTypeCreate, schemas.GLTransactionTypeUpdate]):
    def create_with_company(
        self, db: Session, *, obj_in: schemas.GLTransactionTypeCreate, company_id: int
    ) -> models.GLTransactionType:
        # Check for duplicate name within company
        existing = db.query(models.GLTransactionType).filter(
            models.GLTransactionType.name == obj_in.name,
            models.GLTransactionType.company_id == company_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Transaction type '{obj_in.name}' already exists for this company"
            )
        
        # Validate tax control account if tax is applicable
        if obj_in.is_tax_applicable and obj_in.default_tax_control_account_id:
            tax_account = db.query(models.GLAccount).filter(
                models.GLAccount.id == obj_in.default_tax_control_account_id,
                models.GLAccount.company_id == company_id
            ).first()
            if not tax_account:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Tax control account not found or belongs to different company"
                )
        
        # Validate tax type if specified
        if obj_in.tax_type_id:
            tax_type = db.query(models.TaxType).filter(
                models.TaxType.id == obj_in.tax_type_id,
                models.TaxType.company_id == company_id
            ).first()
            if not tax_type:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Tax type not found or belongs to different company"
                )
        
        # Create the transaction type
        db_obj = models.GLTransactionType(
            **obj_in.model_dump(),
            company_id=company_id
        )
        
        # Validate tax configuration using TaxCalculator
        try:
            TaxCalculator.validate_tax_configuration(db_obj, raise_on_error=True)
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Tax configuration validation failed: {str(e)}"
            )
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def get_by_company(
        self, db: Session, *, company_id: int, skip: int = 0, limit: int = 100,
        is_active: Optional[bool] = True
    ) -> List[models.GLTransactionType]:
        query = db.query(models.GLTransactionType).filter(
            models.GLTransactionType.company_id == company_id
        )
        
        if is_active is not None:
            query = query.filter(models.GLTransactionType.is_active == is_active)
        
        return query.offset(skip).limit(limit).all()
    
    def get_with_company_check(
        self, db: Session, *, id: int, company_id: int
    ) -> Optional[models.GLTransactionType]:
        return db.query(models.GLTransactionType).filter(
            models.GLTransactionType.id == id,
            models.GLTransactionType.company_id == company_id
        ).first()
    
    def update_with_company_check(
        self, db: Session, *, db_obj: models.GLTransactionType, obj_in: schemas.GLTransactionTypeUpdate, company_id: int
    ) -> models.GLTransactionType:
        # Verify ownership
        if db_obj.company_id != company_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Transaction type not found"
            )
        
        # Validate name uniqueness if changing name
        if hasattr(obj_in, 'name') and obj_in.name and obj_in.name != db_obj.name:
            existing = db.query(models.GLTransactionType).filter(
                models.GLTransactionType.name == obj_in.name,
                models.GLTransactionType.company_id == company_id,
                models.GLTransactionType.id != db_obj.id
            ).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Transaction type '{obj_in.name}' already exists for this company"
                )
        
        # Validate tax control account if being updated
        if hasattr(obj_in, 'default_tax_control_account_id') and obj_in.default_tax_control_account_id:
            tax_account = db.query(models.GLAccount).filter(
                models.GLAccount.id == obj_in.default_tax_control_account_id,
                models.GLAccount.company_id == company_id
            ).first()
            if not tax_account:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Tax control account not found or belongs to different company"
                )
        
        # Validate tax type if being updated
        if hasattr(obj_in, 'tax_type_id') and obj_in.tax_type_id:
            tax_type = db.query(models.TaxType).filter(
                models.TaxType.id == obj_in.tax_type_id,
                models.TaxType.company_id == company_id
            ).first()
            if not tax_type:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Tax type not found or belongs to different company"
                )
        
        # Update the object
        updated_obj = super().update(db, db_obj=db_obj, obj_in=obj_in)
        
        # Validate tax configuration after update
        try:
            TaxCalculator.validate_tax_configuration(updated_obj, raise_on_error=True)
        except ValueError as e:
            # Rollback the changes
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Tax configuration validation failed: {str(e)}"
            )
        
        return updated_obj


def create_transaction_type(
    db: Session,
    transaction_type_in: schemas.GLTransactionTypeCreate,
    company_id: int
) -> models.GLTransactionType:
    """Create a new transaction type with validation"""
    return gl_transaction_type.create_with_company(
        db=db, obj_in=transaction_type_in, company_id=company_id
    )


def update_transaction_type(
    db: Session,
    transaction_type_id: int,
    transaction_type_in: schemas.GLTransactionTypeUpdate,
    company_id: int
) -> models.GLTransactionType:
    """Update a transaction type with validation"""
    db_obj = gl_transaction_type.get_with_company_check(
        db=db, id=transaction_type_id, company_id=company_id
    )
    if not db_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction type not found"
        )
    
    return gl_transaction_type.update_with_company_check(
        db=db, db_obj=db_obj, obj_in=transaction_type_in, company_id=company_id
    )


def create_journal_entry_with_tax(
    db: Session,
    entry_in: schemas.GLJournalEntryCreateWithTax,
    company_id: int,
    user_id: int
) -> models.GLJournalEntry:
    """Create a journal entry with automatic tax calculations"""
    
    # If no transaction type specified, fall back to regular creation
    if not entry_in.transaction_type_id:
        return create_journal_entry(
            db=db, 
            entry_in=schemas.GLJournalEntryCreate(**entry_in.model_dump()), 
            company_id=company_id, 
            user_id=user_id
        )
    
    # Get and validate transaction type
    transaction_type = db.query(models.GLTransactionType).filter(
        models.GLTransactionType.id == entry_in.transaction_type_id,
        models.GLTransactionType.company_id == company_id
    ).first()
    
    if not transaction_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transaction type not found or belongs to different company"
        )
    
    # Validate transaction type tax configuration
    TaxCalculator.validate_tax_configuration(transaction_type, raise_on_error=True)
    
    # Process lines and calculate tax if applicable
    processed_lines = []
    total_tax_amount = Decimal('0.00')
    
    for line_in in entry_in.lines:
        # Validate GL account belongs to company
        account = db.query(models.GLAccount).filter(
            models.GLAccount.id == line_in.gl_account_id,
            models.GLAccount.company_id == company_id
        ).first()
        
        if not account:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"GL account {line_in.gl_account_id} not found or belongs to different company"
            )
        
        # Add the original line
        processed_lines.append(line_in)
        
        # Calculate tax if applicable and not on tax control account
        if (transaction_type.is_tax_applicable and 
            account.id != transaction_type.default_tax_control_account_id):
            
            # Determine the amount to tax (debit or credit)
            amount_to_tax = line_in.debit_amount or line_in.credit_amount or Decimal('0.00')
            
            if amount_to_tax > 0:
                tax_calc = TaxCalculator.calculate_tax(
                    amount=amount_to_tax,
                    tax_rate=transaction_type.tax_rate,
                    method=transaction_type.tax_calculation_method
                )
                
                tax_amount = tax_calc['tax_amount']
                if tax_amount > 0:
                    total_tax_amount += tax_amount
                    
                    # Create tax line entry (opposite side of the original line)
                    tax_line = schemas.GLJournalEntryLineCreate(
                        gl_account_id=transaction_type.default_tax_control_account_id,
                        description=f"Tax on {line_in.description or 'transaction'}",
                        debit_amount=tax_amount if line_in.credit_amount else Decimal('0.00'),
                        credit_amount=tax_amount if line_in.debit_amount else Decimal('0.00')
                    )
                    processed_lines.append(tax_line)
    
    # Create the journal entry with processed lines
    journal_entry_data = schemas.GLJournalEntryCreate(
        entry_date=entry_in.entry_date,
        reference=entry_in.reference,
        description=entry_in.description,
        status=entry_in.status,
        lines=processed_lines
    )
    
    return create_journal_entry(
        db=db,
        entry_in=journal_entry_data,
        company_id=company_id,
        user_id=user_id
    )


# Initialize CRUD instances
gl_transaction_type = GLTransactionTypeCRUD(models.GLTransactionType)
