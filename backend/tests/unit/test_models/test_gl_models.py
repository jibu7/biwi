import pytest
from decimal import Decimal
from datetime import date
from sqlalchemy.exc import IntegrityError
from app.models.gl import GLAccount, GLJournalEntry, GLJournalEntryLine

class TestGLAccountModel:
    def test_create_gl_account(self, db, test_company):
        account = GLAccount(
            company_id=test_company.id,
            account_code="1000",
            account_name="Cash",
            account_type="Asset",
            is_active=True,
            current_balance=Decimal("1000.00")
        )
        db.add(account)
        db.commit()
        
        assert account.id is not None
        assert account.account_code == "1000"
        assert account.account_name == "Cash"
        assert account.account_type == "Asset"
        assert account.current_balance == Decimal("1000.00")
    
    def test_gl_account_unique_code_per_company(self, db, test_company):
        account1 = GLAccount(company_id=test_company.id, account_code="1000", account_name="Cash")
        db.add(account1)
        db.commit()
        
        account2 = GLAccount(company_id=test_company.id, account_code="1000", account_name="Petty Cash")
        db.add(account2)
        with pytest.raises(IntegrityError):
            db.commit()

class TestGLJournalEntryModel:
    def test_create_gl_journal_entry(self, db, test_company, test_superuser):
        transaction = GLJournalEntry(
            company_id=test_company.id,
            reference="TXN-001",
            description="Test Transaction",
            entry_date=date.today(),
            posted_by_user_id=test_superuser.id
        )
        db.add(transaction)
        db.commit()
        
        assert transaction.id is not None
        assert transaction.reference == "TXN-001"

class TestGLJournalEntryLineModel:
    def test_create_gl_journal_entry_line(self, db, test_company, test_superuser):
        # Create GL Account first
        account = GLAccount(
            company_id=test_company.id,
            account_code="1000",
            account_name="Cash",
            account_type="Asset"
        )
        db.add(account)
        db.commit()
        
        # Create GL Journal Entry
        transaction = GLJournalEntry(
            company_id=test_company.id,
            reference="TXN-001",
            description="Test Transaction",
            entry_date=date.today(),
            posted_by_user_id=test_superuser.id
        )
        db.add(transaction)
        db.commit()
        
        # Create GL Entry
        entry = GLJournalEntryLine(
            journal_entry_id=transaction.id,
            gl_account_id=account.id,
            debit_amount=Decimal("500.00"),
            credit_amount=Decimal("0.00"),
            description="Cash debit entry"
        )
        db.add(entry)
        db.commit()
        
        assert entry.id is not None
        assert entry.debit_amount == Decimal("500.00")
        assert entry.credit_amount == Decimal("0.00")
        assert entry.gl_account_id == account.id
        assert entry.journal_entry_id == transaction.id
