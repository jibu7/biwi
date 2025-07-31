import pytest
from decimal import Decimal
from datetime import date
from app.services.ar_service import ARService
from app.schemas.ar import CustomerCreate, ARTransactionCreate

class TestARService:
    def test_create_customer(self, db, test_company):
        ar_service = ARService(db)
        
        customer_data = ARCustomerCreate(
            company_id=test_company.id,
            customer_code="CUST001",
            name="Test Customer",
            email="customer@test.com",
            credit_limit=Decimal("10000.00")
        )
        
        customer = ar_service.create_customer(customer_data)
        
        assert customer.customer_code == "CUST001"
        assert customer.name == "Test Customer"
        assert customer.email == "customer@test.com"
        assert customer.credit_limit == Decimal("10000.00")
    
    def test_create_invoice(self, db, test_company):
        ar_service = ARService(db)
        
        # Create customer first
        customer_data = ARCustomerCreate(
            company_id=test_company.id,
            customer_code="CUST001",
            name="Test Customer"
        )
        customer = ar_service.create_customer(customer_data)
        
        # Create invoice
        invoice_data = ARInvoiceCreate(
            company_id=test_company.id,
            customer_id=customer.id,
            invoice_number="INV-001",
            invoice_date=date.today(),
            subtotal=Decimal("1000.00"),
            tax_amount=Decimal("100.00"),
            total_amount=Decimal("1100.00")
        )
        
        invoice = ar_service.create_invoice(invoice_data)
        
        assert invoice.invoice_number == "INV-001"
        assert invoice.total_amount == Decimal("1100.00")
        assert invoice.customer_id == customer.id
    
    def test_apply_payment(self, db, test_company):
        ar_service = ARService(db)
        
        # Create customer and invoice
        customer_data = ARCustomerCreate(
            company_id=test_company.id,
            customer_code="CUST001",
            name="Test Customer"
        )
        customer = ar_service.create_customer(customer_data)
        
        invoice_data = ARInvoiceCreate(
            company_id=test_company.id,
            customer_id=customer.id,
            invoice_number="INV-001",
            invoice_date=date.today(),
            total_amount=Decimal("1100.00")
        )
        invoice = ar_service.create_invoice(invoice_data)
        
        # Create payment
        payment_data = ARPaymentCreate(
            company_id=test_company.id,
            customer_id=customer.id,
            payment_number="PAY-001",
            payment_date=date.today(),
            amount=Decimal("500.00"),
            payment_method="Bank Transfer"
        )
        payment = ar_service.create_payment(payment_data)
        
        # Apply payment to invoice
        allocation = ar_service.allocate_payment(
            payment_id=payment.id,
            invoice_id=invoice.id,
            amount=Decimal("500.00")
        )
        
        assert allocation.allocated_amount == Decimal("500.00")
        assert allocation.payment_id == payment.id
        assert allocation.invoice_id == invoice.id
    
    def test_customer_aging_report(self, db, test_company):
        ar_service = ARService(db)
        
        # Create customer with invoices
        customer_data = ARCustomerCreate(
            company_id=test_company.id,
            customer_code="CUST001",
            name="Test Customer"
        )
        customer = ar_service.create_customer(customer_data)
        
        # Get aging report (should handle empty case)
        aging_report = ar_service.get_customer_aging_report(test_company.id)
        
        assert aging_report is not None
        assert isinstance(aging_report, list)
