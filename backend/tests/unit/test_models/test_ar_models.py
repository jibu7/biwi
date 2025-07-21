import pytest
from decimal import Decimal
from datetime import date, timedelta
from sqlalchemy.exc import IntegrityError
from app.models.ar import ARCustomer, ARInvoice, ARPayment, ARAllocation

class TestARCustomerModel:
    def test_create_ar_customer(self, db, test_company):
        customer = ARCustomer(
            company_id=test_company.id,
            customer_code="CUST001",
            name="Test Customer",
            email="customer@test.com",
            phone="555-0123",
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
        customer1 = ARCustomer(company_id=test_company.id, customer_code="CUST001", name="Customer 1")
        db.add(customer1)
        db.commit()
        
        customer2 = ARCustomer(company_id=test_company.id, customer_code="CUST001", name="Customer 2")
        db.add(customer2)
        with pytest.raises(IntegrityError):
            db.commit()

class TestARInvoiceModel:
    def test_create_ar_invoice(self, db, test_company):
        # Create customer first
        customer = ARCustomer(
            company_id=test_company.id,
            customer_code="CUST001",
            name="Test Customer"
        )
        db.add(customer)
        db.commit()
        
        invoice = ARInvoice(
            company_id=test_company.id,
            customer_id=customer.id,
            invoice_number="INV-001",
            invoice_date=date.today(),
            due_date=date.today() + timedelta(days=30),
            subtotal=Decimal("1000.00"),
            tax_amount=Decimal("100.00"),
            total_amount=Decimal("1100.00"),
            status="Draft"
        )
        db.add(invoice)
        db.commit()
        
        assert invoice.id is not None
        assert invoice.invoice_number == "INV-001"
        assert invoice.total_amount == Decimal("1100.00")
        assert invoice.status == "Draft"
        assert invoice.customer_id == customer.id

class TestARPaymentModel:
    def test_create_ar_payment(self, db, test_company):
        # Create customer and invoice first
        customer = ARCustomer(company_id=test_company.id, customer_code="CUST001", name="Test Customer")
        db.add(customer)
        db.commit()
        
        invoice = ARInvoice(
            company_id=test_company.id,
            customer_id=customer.id,
            invoice_number="INV-001",
            invoice_date=date.today(),
            total_amount=Decimal("1100.00")
        )
        db.add(invoice)
        db.commit()
        
        payment = ARPayment(
            company_id=test_company.id,
            customer_id=customer.id,
            payment_number="PAY-001",
            payment_date=date.today(),
            amount=Decimal("500.00"),
            payment_method="Bank Transfer",
            reference="REF123"
        )
        db.add(payment)
        db.commit()
        
        assert payment.id is not None
        assert payment.payment_number == "PAY-001"
        assert payment.amount == Decimal("500.00")
        assert payment.payment_method == "Bank Transfer"

class TestARAllocationModel:
    def test_create_ar_allocation(self, db, test_company):
        # Create customer, invoice, and payment
        customer = ARCustomer(company_id=test_company.id, customer_code="CUST001", name="Test Customer")
        db.add(customer)
        db.commit()
        
        invoice = ARInvoice(
            company_id=test_company.id,
            customer_id=customer.id,
            invoice_number="INV-001",
            invoice_date=date.today(),
            total_amount=Decimal("1100.00")
        )
        db.add(invoice)
        db.commit()
        
        payment = ARPayment(
            company_id=test_company.id,
            customer_id=customer.id,
            payment_number="PAY-001",
            payment_date=date.today(),
            amount=Decimal("500.00")
        )
        db.add(payment)
        db.commit()
        
        allocation = ARAllocation(
            company_id=test_company.id,
            invoice_id=invoice.id,
            payment_id=payment.id,
            allocated_amount=Decimal("500.00"),
            allocation_date=date.today()
        )
        db.add(allocation)
        db.commit()
        
        assert allocation.id is not None
        assert allocation.allocated_amount == Decimal("500.00")
        assert allocation.invoice_id == invoice.id
        assert allocation.payment_id == payment.id
