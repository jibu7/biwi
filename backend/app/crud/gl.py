from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from datetime import date

from app.crud.base import CRUDBase
from app.models.gl import GLAccount, GLJournalEntry, GLJournalEntryLine, GLTransactionType, GLDefaults
from app.schemas.gl import (
    GLAccountCreate, 
    GLAccountUpdate, 
    GLJournalEntryCreate,
    GLJournalEntryUpdate,
    GLTransactionTypeCreate,
    GLTransactionTypeUpdate,
    GLDefaultsCreate,
    GLDefaultsUpdate
)
from app.core.tenant_context import get_current_tenant_id
from app.core.platform_context import is_in_platform_admin_context, get_target_company

class CRUDGLAccount(CRUDBase[GLAccount, GLAccountCreate, GLAccountUpdate]):
    def get_by_code(self, db: Session, *, code: str, company_id: Optional[int] = None) -> Optional[GLAccount]:
        """Get GL account by code within accessible tenant."""
        if company_id is None:
            company_id = self._get_effective_company_id()
        
        if company_id is None:
            # Platform admin without target company - search all companies
            return db.query(GLAccount).filter(GLAccount.account_code == code).first()
        
        return db.query(GLAccount).filter(
            and_(
                GLAccount.account_code == code,
                GLAccount.company_id == company_id
            )
        ).first()
    
    def get_all_active(self, db: Session, *, skip: int = 0, limit: int = 100) -> List[GLAccount]:
        """Get all active GL accounts for accessible tenant."""
        query = db.query(GLAccount).filter(GLAccount.is_active == True)
        query = self._apply_tenant_filter(query)
        return query.order_by(GLAccount.account_code).offset(skip).limit(limit).all()
    
    def create_with_validation(self, db: Session, *, obj_in: GLAccountCreate) -> GLAccount:
        """Create GL account with validation."""
        # Determine target company
        company_id = self._get_effective_company_id()
        if is_in_platform_admin_context():
            target_company = get_target_company()
            if not target_company:
                raise ValueError("Platform admin must specify target company")
            company_id = target_company
        
        if not company_id:
            raise ValueError("No company context available")
        
        # Check for duplicate account code
        existing = self.get_by_code(db, code=obj_in.account_code, company_id=company_id)
        if existing:
            raise ValueError(f"Account code {obj_in.account_code} already exists")
        
        # Create the account
        db_obj = GLAccount(
            company_id=company_id,
            account_code=obj_in.account_code,
            account_name=obj_in.account_name,
            account_type=obj_in.account_type,
            description=obj_in.description,
            is_active=obj_in.is_active,
            parent_account_id=obj_in.parent_account_id,
            balance_sheet_section=obj_in.balance_sheet_section,
            income_statement_section=obj_in.income_statement_section,
            allow_manual_entries=obj_in.allow_manual_entries,
        )
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def get_chart_of_accounts(self, db: Session) -> List[GLAccount]:
        """Get complete chart of accounts for accessible tenant."""
        query = db.query(GLAccount).filter(GLAccount.is_active == True)
        query = self._apply_tenant_filter(query)
        return query.order_by(GLAccount.account_code).all()

class CRUDGLJournalEntry(CRUDBase[GLJournalEntry, GLJournalEntryCreate, GLJournalEntryUpdate]):
    def create_with_lines(self, db: Session, *, obj_in: GLJournalEntryCreate) -> GLJournalEntry:
        """Create journal entry with lines, enforcing tenant isolation."""
        # Determine target company
        company_id = self._get_effective_company_id()
        if is_in_platform_admin_context():
            target_company = get_target_company()
            if not target_company:
                raise ValueError("Platform admin must specify target company")
            company_id = target_company
        
        if not company_id:
            raise ValueError("No company context available")
        
        # Create the journal entry
        db_obj = GLJournalEntry(
            company_id=company_id,
            entry_date=obj_in.entry_date,
            posting_date=obj_in.posting_date,
            reference=obj_in.reference,
            source=obj_in.source,
            memo=obj_in.memo,
            status=obj_in.status,
            currency_code=obj_in.currency_code,
            exchange_rate=obj_in.exchange_rate,
        )
        
        db.add(db_obj)
        db.flush()  # Get ID without committing
        
        # Process journal lines
        total_debit = 0
        total_credit = 0
        
        for line in obj_in.lines:
            # Verify account belongs to same company
            account = db.query(GLAccount).filter(
                and_(
                    GLAccount.id == line.account_id,
                    GLAccount.company_id == company_id
                )
            ).first()
            
            if not account:
                db.rollback()
                raise ValueError(f"Account ID {line.account_id} not found or not accessible")
            
            # Create journal line
            journal_line = GLJournalEntryLine(
                journal_entry_id=db_obj.id,
                account_id=line.account_id,
                debit_amount=line.debit_amount,
                credit_amount=line.credit_amount,
                memo=line.memo,
                reference=line.reference,
            )
            
            db.add(journal_line)
            
            # Track totals
            total_debit += line.debit_amount
            total_credit += line.credit_amount
        
        # Verify balanced entry
        if round(total_debit, 2) != round(total_credit, 2):
            db.rollback()
            raise ValueError(f"Journal entry not balanced: Debit {total_debit} != Credit {total_credit}")
        
        db_obj.total_amount = total_debit
        
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def get_trial_balance(self, db: Session, *, as_of_date: date) -> List[Dict[str, Any]]:
        """Generate trial balance for accessible tenant."""
        company_id = self._get_effective_company_id()
        if not company_id:
            raise ValueError("No company context available for trial balance")
        
        # Query to get account balances
        query = db.query(
            GLAccount.account_code,
            GLAccount.account_name,
            GLAccount.account_type,
            func.sum(GLJournalEntryLine.debit_amount).label('total_debit'),
            func.sum(GLJournalEntryLine.credit_amount).label('total_credit')
        ).join(
            GLJournalEntryLine, GLJournalEntryLine.account_id == GLAccount.id
        ).join(
            GLJournalEntry, GLJournalEntry.id == GLJournalEntryLine.journal_entry_id
        ).filter(
            and_(
                GLAccount.company_id == company_id,
                GLJournalEntry.entry_date <= as_of_date,
                GLJournalEntry.status == 'Posted'
            )
        ).group_by(
            GLAccount.id, GLAccount.account_code, GLAccount.account_name, GLAccount.account_type
        ).order_by(GLAccount.account_code)
        
        results = []
        for row in query.all():
            total_debit = float(row.total_debit or 0)
            total_credit = float(row.total_credit or 0)
            net_balance = total_debit - total_credit
            
            results.append({
                'account_code': row.account_code,
                'account_name': row.account_name,
                'account_type': row.account_type,
                'debit_balance': max(net_balance, 0),
                'credit_balance': max(-net_balance, 0),
                'total_debit': total_debit,
                'total_credit': total_credit
            })
        
        return results

class CRUDGLTransactionType(CRUDBase[GLTransactionType, GLTransactionTypeCreate, GLTransactionTypeUpdate]):
    def get_by_name(self, db: Session, *, name: str) -> Optional[GLTransactionType]:
        """Get transaction type by name within accessible tenant."""
        query = db.query(GLTransactionType).filter(GLTransactionType.name == name)
        query = self._apply_tenant_filter(query)
        return query.first()

class CRUDGLDefaults(CRUDBase[GLDefaults, GLDefaultsCreate, GLDefaultsUpdate]):
    def get_or_create(self, db: Session) -> GLDefaults:
        """Get or create GL defaults for accessible tenant."""
        company_id = self._get_effective_company_id()
        if not company_id:
            raise ValueError("No company context available")
        
        defaults = db.query(GLDefaults).filter(GLDefaults.company_id == company_id).first()
        if not defaults:
            defaults = GLDefaults(company_id=company_id)
            db.add(defaults)
            db.commit()
            db.refresh(defaults)
        
        return defaults

# Create instances
gl_account = CRUDGLAccount(GLAccount)
gl_journal_entry = CRUDGLJournalEntry(GLJournalEntry)
gl_transaction_type = CRUDGLTransactionType(GLTransactionType)
gl_defaults = CRUDGLDefaults(GLDefaults)
