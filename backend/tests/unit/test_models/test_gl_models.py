import pytest
from decimal import Decimal
from datetime import date
from sqlalchemy.exc import IntegrityError
from app.models.gl import GLAccount, GLTransaction, GLEntry, ChartOfAccounts

class TestGLAccountModel:
    def test_create_gl_account(self, db, test_company):
        account = GLAccount(
            company_id=test_company.id,
            code="1000",
            name="Cash",
            account_type="Asset",
            is_active=True,
            balance=Decimal("1000.00")
        )
        db.add(account)
        db.commit()
        
        assert account.id is not None
        assert account.code == "1000"
        assert account.name == "Cash"
        assert account.account_type == "Asset"
        assert account.balance == Decimal("1000.00")
    
    def test_gl_account_unique_code_per_company(self, db, test_company):
        account1 = GLAccount(company_id=test_company.id, code="1000", name="Cash")
        db.add(account1)
        db.commit()
        
        account2 = GLAccount(company_id=test_company.id, code="1000", name="Petty Cash")
        db.add(account2)
        with pytest.raises(IntegrityError):
            db.commit()

class TestGLTransactionModel:
    def test_create_gl_transaction(self, db, test_company):
        transaction = GLTransaction(
            company_id=test_company.id,
            reference="TXN-001",
            description="Test Transaction",
            transaction_date=date.today(),
            total_amount=Decimal("500.00")
        )
        db.add(transaction)
        db.commit()
        
        assert transaction.id is not None
        assert transaction.reference == "TXN-001"
        assert transaction.total_amount == Decimal("500.00")

class TestGLEntryModel:
    def test_create_gl_entry(self, db, test_company):
        # Create GL Account first
        account = GLAccount(
            company_id=test_company.id,
            code="1000",
            name="Cash",
            account_type="Asset"
        )
        db.add(account)
        db.commit()
        
        # Create GL Transaction
        transaction = GLTransaction(
            company_id=test_company.id,
            reference="TXN-001",
            description="Test Transaction",
            transaction_date=date.today()
        )
        db.add(transaction)
        db.commit()
        
        # Create GL Entry
        entry = GLEntry(
            company_id=test_company.id,
            transaction_id=transaction.id,
            account_id=account.id,
            debit_amount=Decimal("500.00"),
            credit_amount=Decimal("0.00"),
            description="Cash debit entry"
        )
        db.add(entry)
        db.commit()
        
        assert entry.id is not None
        assert entry.debit_amount == Decimal("500.00")
        assert entry.credit_amount == Decimal("0.00")
        assert entry.account_id == account.id
        assert entry.transaction_id == transaction.id

class TestChartOfAccountsModel:
    def test_create_chart_of_accounts(self, db, test_company):
        chart = ChartOfAccounts(
            company_id=test_company.id,
            name="Standard Chart",
            description="Standard chart of accounts",
            is_active=True
        )
        db.add(chart)
        db.commit()
        
        assert chart.id is not None
        assert chart.name == "Standard Chart"
        assert chart.is_active == True
