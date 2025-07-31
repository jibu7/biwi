import pytest
from decimal import Decimal
from app.services.gl_service import GLService
from app.schemas.gl import GLAccountCreate, GLJournalEntryCreate

class TestGLService:
    def test_create_chart_of_accounts(self, db, test_company):
        gl_service = GLService(db)
        
        # Test creating a basic chart of accounts
        chart = gl_service.create_basic_chart_of_accounts(test_company.id)
        
        assert chart is not None
        assert chart.company_id == test_company.id
        assert chart.name == "Standard Chart of Accounts"
    
    def test_create_gl_account(self, db, test_company):
        gl_service = GLService(db)
        
        account_data = GLAccountCreate(
            company_id=test_company.id,
            code="1000",
            name="Cash",
            account_type="Asset",
            balance=Decimal("0.00")
        )
        
        account = gl_service.create_account(account_data)
        
        assert account.code == "1000"
        assert account.name == "Cash"
        assert account.account_type == "Asset"
        assert account.company_id == test_company.id
    
    def test_create_gl_transaction(self, db, test_company):
        gl_service = GLService(db)
        
        # First create accounts
        cash_account = gl_service.create_account(GLAccountCreate(
            company_id=test_company.id,
            code="1000",
            name="Cash",
            account_type="Asset"
        ))
        
        sales_account = gl_service.create_account(GLAccountCreate(
            company_id=test_company.id,
            code="4000",
            name="Sales",
            account_type="Revenue"
        ))
        
        # Create transaction
        transaction_data = GLTransactionCreate(
            company_id=test_company.id,
            reference="TXN-001",
            description="Test Sale",
            entries=[
                {
                    "account_id": cash_account.id,
                    "debit_amount": Decimal("100.00"),
                    "credit_amount": Decimal("0.00")
                },
                {
                    "account_id": sales_account.id,
                    "debit_amount": Decimal("0.00"),
                    "credit_amount": Decimal("100.00")
                }
            ]
        )
        
        transaction = gl_service.create_transaction(transaction_data)
        
        assert transaction.reference == "TXN-001"
        assert transaction.description == "Test Sale"
        assert len(transaction.entries) == 2
        assert transaction.total_amount == Decimal("100.00")
    
    def test_account_balance_calculation(self, db, test_company):
        gl_service = GLService(db)
        
        # Create account
        account = gl_service.create_account(GLAccountCreate(
            company_id=test_company.id,
            code="1000",
            name="Cash",
            account_type="Asset",
            balance=Decimal("0.00")
        ))
        
        # Get initial balance
        initial_balance = gl_service.get_account_balance(account.id)
        assert initial_balance == Decimal("0.00")
        
        # Add some transactions and verify balance updates
        # (This would require more complex setup with actual transactions)
        # For now, just verify the method works
        assert gl_service.get_account_balance(account.id) is not None
