import pytest
from decimal import Decimal
from datetime import date, timedelta
from sqlalchemy.exc import IntegrityError
from app.models.ar import Customer, ARTransaction, ARAllocation

class TestCustomerModel:
    def test_create_customer(self, db, test_company):
        customer = Customer(
            company_id=test_company.id,
            customer_code="CUST001",
            name="Test Customer",
            contact_info={"email": "customer@test.com", "phone": "555-0123"},
            address={"street": "456 Customer St"},
            credit_limit=Decimal("10000.00"),
            is_active=True
        )
        db.add(customer)
        db.commit()
        
        assert customer.id is not None
        assert customer.customer_code == "CUST001"
        assert customer.name == "Test Customer"
        assert customer.credit_limit == Decimal("10000.00")
    
    def test_customer_unique_code_per_company(self, db, test_company):
        customer1 = Customer(company_id=test_company.id, customer_code="CUST001", name="Customer 1")
        db.add(customer1)
        db.commit()
        
        customer2 = Customer(company_id=test_company.id, customer_code="CUST001", name="Customer 2")
        db.add(customer2)
        with pytest.raises(IntegrityError):
            db.commit()

class TestARTransactionModel:
    def test_create_ar_transaction(self, db, test_company):
        # Create customer first
        customer = Customer(
            company_id=test_company.id,
            customer_code="CUST001",
            name="Test Customer"
        )
        db.add(customer)
        db.commit()
        
        transaction = ARTransaction(
            company_id=test_company.id,
            customer_id=customer.id,
            document_number="INV-001",
            transaction_date=date.today(),
            due_date=date.today() + timedelta(days=30),
            total_amount=Decimal("1100.00"),
            open_amount=Decimal("1100.00"),
            status="Draft"
        )
        db.add(transaction)
        db.commit()
        
        assert transaction.id is not None
        assert transaction.document_number == "INV-001"
        assert transaction.total_amount == Decimal("1100.00")
        assert transaction.status == "Draft"
        assert transaction.customer_id == customer.id
