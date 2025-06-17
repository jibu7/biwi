from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, desc, func
from typing import Optional, List
from decimal import Decimal
from datetime import date
from app import models, schemas
from fastapi import HTTPException

# GL Account CRUD
def create_gl_account(db: Session, account: schemas.GLAccountCreate, company_id: int) -> models.GLAccount:
    # Check if parent account exists if specified
    if account.parent_account_id:
        parent = db.query(models.GLAccount).filter(
            models.GLAccount.id == account.parent_account_id,
            models.GLAccount.company_id == company_id
        ).first()
        if not parent:
            raise HTTPException(status_code=400, detail="Parent account not found")
    
    db_account = models.GLAccount(
        **account.model_dump(),
        company_id=company_id,
        current_balance=Decimal('0.00')
    )
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    return db_account

def get_gl_account(db: Session, account_id: int, company_id: int) -> Optional[models.GLAccount]:
    return db.query(models.GLAccount).filter(
        models.GLAccount.id == account_id,
        models.GLAccount.company_id == company_id
    ).first()

def get_gl_account_by_code(db: Session, account_code: str, company_id: int) -> Optional[models.GLAccount]:
    return db.query(models.GLAccount).filter(
        models.GLAccount.account_code == account_code,
        models.GLAccount.company_id == company_id
    ).first()

def get_gl_accounts_by_company(
    db: Session, 
    company_id: int, 
    skip: int = 0, 
    limit: int = 100,
    account_type: Optional[str] = None,
    include_inactive: bool = False
) -> List[models.GLAccount]:
    query = db.query(models.GLAccount).filter(models.GLAccount.company_id == company_id)
    
    if account_type:
        query = query.filter(models.GLAccount.account_type == account_type)
    
    if not include_inactive:
        query = query.filter(models.GLAccount.is_active == True)
    
    return query.order_by(models.GLAccount.account_code).offset(skip).limit(limit).all()

def update_gl_account(
    db: Session, 
    account_db_obj: models.GLAccount, 
    account_in: schemas.GLAccountUpdate
) -> models.GLAccount:
    update_data = account_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(account_db_obj, field, value)
    db.add(account_db_obj)
    db.commit()
    db.refresh(account_db_obj)
    return account_db_obj

def delete_gl_account(db: Session, account_id: int, company_id: int) -> Optional[models.GLAccount]:
    account = get_gl_account(db, account_id, company_id)
    if account:
        # Check if account has transactions
        has_transactions = db.query(models.GLJournalEntryLine).filter(
            models.GLJournalEntryLine.gl_account_id == account_id
        ).first()
        if has_transactions:
            # Soft delete only
            account.is_active = False
            db.commit()
        else:
            db.delete(account)
            db.commit()
    return account

def update_account_balance(db: Session, account_id: int, amount: Decimal, is_debit: bool) -> models.GLAccount:
    """Update GL account balance based on debit/credit transaction"""
    account = db.query(models.GLAccount).filter(models.GLAccount.id == account_id).first()
    if account:
        if is_debit:
            # For Asset and Expense accounts, debits increase balance
            # For Liability, Equity, and Income accounts, debits decrease balance
            if account.account_type in ["Asset", "Expense"]:
                account.current_balance += amount
            else:
                account.current_balance -= amount
        else:
            # For Asset and Expense accounts, credits decrease balance
            # For Liability, Equity, and Income accounts, credits increase balance
            if account.account_type in ["Asset", "Expense"]:
                account.current_balance -= amount
            else:
                account.current_balance += amount
        
        db.add(account)
        db.commit()
        db.refresh(account)
    return account

# GL Journal Entry CRUD
def create_gl_journal_entry(db: Session, entry: schemas.GLJournalEntryCreate, company_id: int, posted_by_user_id: int) -> models.GLJournalEntry:
    # Validate that debits equal credits
    total_debits = sum(line.debit_amount for line in entry.lines)
    total_credits = sum(line.credit_amount for line in entry.lines)
    
    if total_debits != total_credits:
        raise ValueError("Total debits must equal total credits")
    
    db_entry = models.GLJournalEntry(
        company_id=company_id,
        entry_date=entry.entry_date,
        reference=entry.reference,
        description=entry.description,
        posted_by_user_id=posted_by_user_id,
        status="Draft"  # Start as Draft, can be posted later
    )
    db.add(db_entry)
    db.flush()  # Get the ID before adding lines
    
    # Add journal entry lines
    for line_data in entry.lines:
        db_line = models.GLJournalEntryLine(
            journal_entry_id=db_entry.id,
            gl_account_id=line_data.gl_account_id,
            description=line_data.description,
            debit_amount=line_data.debit_amount,
            credit_amount=line_data.credit_amount
        )
        db.add(db_line)
    
    db.commit()
    db.refresh(db_entry)
    return db_entry

def get_gl_journal_entry(db: Session, entry_id: int, company_id: int) -> Optional[models.GLJournalEntry]:
    return db.query(models.GLJournalEntry).options(
        joinedload(models.GLJournalEntry.lines).joinedload(models.GLJournalEntryLine.gl_account)
    ).filter(
        models.GLJournalEntry.id == entry_id,
        models.GLJournalEntry.company_id == company_id
    ).first()

def get_gl_journal_entries_by_company(
    db: Session, 
    company_id: int, 
    skip: int = 0, 
    limit: int = 100, 
    status: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
) -> List[models.GLJournalEntry]:
    query = db.query(models.GLJournalEntry).options(
        joinedload(models.GLJournalEntry.lines).joinedload(models.GLJournalEntryLine.gl_account)
    ).filter(models.GLJournalEntry.company_id == company_id)
    
    if status:
        query = query.filter(models.GLJournalEntry.status == status)
    if start_date:
        query = query.filter(models.GLJournalEntry.entry_date >= start_date)
    if end_date:
        query = query.filter(models.GLJournalEntry.entry_date <= end_date)
    
    return query.order_by(desc(models.GLJournalEntry.entry_date)).offset(skip).limit(limit).all()

def update_gl_journal_entry(db: Session, entry_db_obj: models.GLJournalEntry, entry_in: schemas.GLJournalEntryUpdate) -> models.GLJournalEntry:
    # Only allow updates if status is Draft
    if entry_db_obj.status != "Draft":
        raise ValueError("Cannot update posted journal entries")
    
    update_data = entry_in.model_dump(exclude_unset=True, exclude={'lines'})
    for field, value in update_data.items():
        setattr(entry_db_obj, field, value)
    
    # Handle lines update if provided
    if entry_in.lines is not None:
        # Validate debits equal credits
        total_debits = sum(line.debit_amount for line in entry_in.lines)
        total_credits = sum(line.credit_amount for line in entry_in.lines)
        
        if total_debits != total_credits:
            raise ValueError("Total debits must equal total credits")
        
        # Delete existing lines
        db.query(models.GLJournalEntryLine).filter(
            models.GLJournalEntryLine.journal_entry_id == entry_db_obj.id
        ).delete()
        
        # Add new lines
        for line_data in entry_in.lines:
            db_line = models.GLJournalEntryLine(
                journal_entry_id=entry_db_obj.id,
                gl_account_id=line_data.gl_account_id,
                description=line_data.description,
                debit_amount=line_data.debit_amount,
                credit_amount=line_data.credit_amount
            )
            db.add(db_line)
    
    db.add(entry_db_obj)
    db.commit()
    db.refresh(entry_db_obj)
    return entry_db_obj

def post_gl_journal_entry(db: Session, entry_id: int, company_id: int) -> models.GLJournalEntry:
    """Post a journal entry and update account balances"""
    entry = get_gl_journal_entry(db, entry_id, company_id)
    if not entry:
        raise ValueError("Journal entry not found")
    
    if entry.status != "Draft":
        raise ValueError("Only draft entries can be posted")
    
    # Update account balances
    for line in entry.lines:
        if line.debit_amount > 0:
            update_account_balance(db, line.gl_account_id, line.debit_amount, True)
        if line.credit_amount > 0:
            update_account_balance(db, line.gl_account_id, line.credit_amount, False)
    
    # Update entry status
    entry.status = "Posted"
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry

def delete_gl_journal_entry(db: Session, entry_id: int, company_id: int) -> Optional[models.GLJournalEntry]:
    entry = get_gl_journal_entry(db, entry_id, company_id)
    if entry:
        if entry.status != "Draft":
            raise ValueError("Cannot delete posted journal entries")
        db.delete(entry)
        db.commit()
    return entry

# GL Transaction Type CRUD
def create_gl_transaction_type(db: Session, transaction_type: schemas.GLTransactionTypeCreate, company_id: int) -> models.GLTransactionType:
    db_type = models.GLTransactionType(
        company_id=company_id,
        name=transaction_type.name,
        description=transaction_type.description,
        default_debit_account_id=transaction_type.default_debit_account_id,
        default_credit_account_id=transaction_type.default_credit_account_id,
        is_active=transaction_type.is_active
    )
    db.add(db_type)
    db.commit()
    db.refresh(db_type)
    return db_type

def get_gl_transaction_type(db: Session, type_id: int, company_id: int) -> Optional[models.GLTransactionType]:
    return db.query(models.GLTransactionType).options(
        joinedload(models.GLTransactionType.default_debit_account),
        joinedload(models.GLTransactionType.default_credit_account)
    ).filter(
        models.GLTransactionType.id == type_id,
        models.GLTransactionType.company_id == company_id
    ).first()

def get_gl_transaction_types_by_company(db: Session, company_id: int, skip: int = 0, limit: int = 100) -> List[models.GLTransactionType]:
    return db.query(models.GLTransactionType).options(
        joinedload(models.GLTransactionType.default_debit_account),
        joinedload(models.GLTransactionType.default_credit_account)
    ).filter(
        models.GLTransactionType.company_id == company_id
    ).offset(skip).limit(limit).all()

def update_gl_transaction_type(db: Session, type_db_obj: models.GLTransactionType, type_in: schemas.GLTransactionTypeUpdate) -> models.GLTransactionType:
    update_data = type_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(type_db_obj, field, value)
    
    db.add(type_db_obj)
    db.commit()
    db.refresh(type_db_obj)
    return type_db_obj

def delete_gl_transaction_type(db: Session, type_id: int, company_id: int) -> Optional[models.GLTransactionType]:
    transaction_type = get_gl_transaction_type(db, type_id, company_id)
    if transaction_type:
        db.delete(transaction_type)
        db.commit()
    return transaction_type

# GL Defaults CRUD
def create_or_update_gl_defaults(db: Session, defaults: schemas.GLDefaultsCreate, company_id: int) -> models.GLDefaults:
    existing = db.query(models.GLDefaults).filter(models.GLDefaults.company_id == company_id).first()
    
    if existing:
        # Update existing
        update_data = defaults.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(existing, field, value)
        db.add(existing)
        db.commit()
        db.refresh(existing)
        return existing
    else:
        # Create new
        db_defaults = models.GLDefaults(
            company_id=company_id,
            retained_earnings_account_id=defaults.retained_earnings_account_id,
            default_cash_account_id=defaults.default_cash_account_id,
            default_ar_control_account_id=defaults.default_ar_control_account_id,
            default_ap_control_account_id=defaults.default_ap_control_account_id
        )
        db.add(db_defaults)
        db.commit()
        db.refresh(db_defaults)
        return db_defaults

def get_gl_defaults(db: Session, company_id: int) -> Optional[models.GLDefaults]:
    return db.query(models.GLDefaults).options(
        joinedload(models.GLDefaults.retained_earnings_account),
        joinedload(models.GLDefaults.default_cash_account),
        joinedload(models.GLDefaults.default_ar_control_account),
        joinedload(models.GLDefaults.default_ap_control_account)
    ).filter(models.GLDefaults.company_id == company_id).first()

# GL Reports
def get_trial_balance(db: Session, company_id: int, as_of_date: date) -> schemas.TrialBalance:
    """Generate trial balance as of a specific date"""
    accounts = db.query(models.GLAccount).filter(
        models.GLAccount.company_id == company_id,
        models.GLAccount.is_active == True
    ).all()
    
    trial_balance_items = []
    total_debits = Decimal('0.00')
    total_credits = Decimal('0.00')
    
    for account in accounts:
        balance = account.current_balance
        
        # Handle None balance by treating it as 0
        if balance is None:
            balance = Decimal('0.00')
        
        if balance == 0:
            continue
            
        # Determine if balance should be shown as debit or credit
        if account.account_type in ["Asset", "Expense"]:
            # Normal debit balance accounts
            if balance >= 0:
                debit_balance = balance
                credit_balance = Decimal('0.00')
                total_debits += balance
            else:
                debit_balance = Decimal('0.00')
                credit_balance = abs(balance)
                total_credits += abs(balance)
        else:
            # Normal credit balance accounts (Liability, Equity, Income)
            if balance >= 0:
                debit_balance = Decimal('0.00')
                credit_balance = balance
                total_credits += balance
            else:
                debit_balance = abs(balance)
                credit_balance = Decimal('0.00')
                total_debits += abs(balance)
        
        trial_balance_items.append(schemas.TrialBalanceItem(
            account_code=account.account_code,
            account_name=account.account_name,
            account_type=account.account_type,
            debit_balance=debit_balance,
            credit_balance=credit_balance
        ))
    
    return schemas.TrialBalance(
        company_id=company_id,
        as_of_date=as_of_date,
        accounts=trial_balance_items,
        total_debits=total_debits,
        total_credits=total_credits
    )

def get_account_transactions(
    db: Session,
    company_id: int,
    account_id: int,
    start_date: date,
    end_date: date
) -> List[dict]:
    """Get all transactions for a specific account within date range"""
    transactions = db.query(
        models.GLJournalEntry.entry_date,
        models.GLJournalEntry.reference,
        models.GLJournalEntry.description,
        models.GLJournalEntryLine.debit_amount,
        models.GLJournalEntryLine.credit_amount,
        models.GLJournalEntryLine.description.label('line_description')
    ).join(
        models.GLJournalEntryLine
    ).filter(
        models.GLJournalEntry.company_id == company_id,
        models.GLJournalEntryLine.gl_account_id == account_id,
        models.GLJournalEntry.entry_date >= start_date,
        models.GLJournalEntry.entry_date <= end_date,
        models.GLJournalEntry.status == 'Posted'
    ).order_by(
        models.GLJournalEntry.entry_date,
        models.GLJournalEntry.id
    ).all()
    
    # Calculate running balance
    account = db.query(models.GLAccount).filter(
        models.GLAccount.id == account_id
    ).first()
    
    result = []
    running_balance = Decimal('0.00')  # Should calculate opening balance
    
    for trans in transactions:
        if account.account_type in ['Asset', 'Expense']:
            running_balance += trans.debit_amount - trans.credit_amount
        else:
            running_balance += trans.credit_amount - trans.debit_amount
            
        result.append({
            'date': trans.entry_date,
            'reference': trans.reference or '',
            'description': trans.line_description or trans.description or '',
            'debit_amount': trans.debit_amount,
            'credit_amount': trans.credit_amount,
            'balance': running_balance
        })
    
    return result
