import pytest
from decimal import Decimal
from datetime import date, timedelta
from sqlalchemy.exc import IntegrityError
from app.models.ap import APVendor, APInvoice, APPayment, APAllocation

class TestAPVendorModel:
    def test_create_ap_vendor(self, db, test_company):
        vendor = APVendor(
            company_id=test_company.id,
            vendor_code="VEND001",
            name="Test Vendor",
            email="vendor@test.com",
            phone="555-0456",
            address={"street": "789 Vendor Ave"},
            payment_terms="Net 30",
            is_active=True
        )
        db.add(vendor)
        db.commit()
        
        assert vendor.id is not None
        assert vendor.vendor_code == "VEND001"
        assert vendor.name == "Test Vendor"
        assert vendor.payment_terms == "Net 30"
    
    def test_vendor_unique_code_per_company(self, db, test_company):
        vendor1 = APVendor(company_id=test_company.id, vendor_code="VEND001", name="Vendor 1")
        db.add(vendor1)
        db.commit()
        
        vendor2 = APVendor(company_id=test_company.id, vendor_code="VEND001", name="Vendor 2")
        db.add(vendor2)
        with pytest.raises(IntegrityError):
            db.commit()

class TestAPInvoiceModel:
    def test_create_ap_invoice(self, db, test_company):
        # Create vendor first
        vendor = APVendor(
            company_id=test_company.id,
            vendor_code="VEND001",
            name="Test Vendor"
        )
        db.add(vendor)
        db.commit()
        
        invoice = APInvoice(
            company_id=test_company.id,
            vendor_id=vendor.id,
            invoice_number="AP-001",
            vendor_invoice_number="VEND-INV-001",
            invoice_date=date.today(),
            due_date=date.today() + timedelta(days=30),
            subtotal=Decimal("2000.00"),
            tax_amount=Decimal("200.00"),
            total_amount=Decimal("2200.00"),
            status="Pending"
        )
        db.add(invoice)
        db.commit()
        
        assert invoice.id is not None
        assert invoice.invoice_number == "AP-001"
        assert invoice.vendor_invoice_number == "VEND-INV-001"
        assert invoice.total_amount == Decimal("2200.00")
        assert invoice.status == "Pending"
        assert invoice.vendor_id == vendor.id

class TestAPPaymentModel:
    def test_create_ap_payment(self, db, test_company):
        # Create vendor and invoice first
        vendor = APVendor(company_id=test_company.id, vendor_code="VEND001", name="Test Vendor")
        db.add(vendor)
        db.commit()
        
        invoice = APInvoice(
            company_id=test_company.id,
            vendor_id=vendor.id,
            invoice_number="AP-001",
            invoice_date=date.today(),
            total_amount=Decimal("2200.00")
        )
        db.add(invoice)
        db.commit()
        
        payment = APPayment(
            company_id=test_company.id,
            vendor_id=vendor.id,
            payment_number="APPAY-001",
            payment_date=date.today(),
            amount=Decimal("1000.00"),
            payment_method="Check",
            check_number="CHK001",
            reference="Payment for services"
        )
        db.add(payment)
        db.commit()
        
        assert payment.id is not None
        assert payment.payment_number == "APPAY-001"
        assert payment.amount == Decimal("1000.00")
        assert payment.payment_method == "Check"
        assert payment.check_number == "CHK001"

class TestAPAllocationModel:
    def test_create_ap_allocation(self, db, test_company):
        # Create vendor, invoice, and payment
        vendor = APVendor(company_id=test_company.id, vendor_code="VEND001", name="Test Vendor")
        db.add(vendor)
        db.commit()
        
        invoice = APInvoice(
            company_id=test_company.id,
            vendor_id=vendor.id,
            invoice_number="AP-001",
            invoice_date=date.today(),
            total_amount=Decimal("2200.00")
        )
        db.add(invoice)
        db.commit()
        
        payment = APPayment(
            company_id=test_company.id,
            vendor_id=vendor.id,
            payment_number="APPAY-001",
            payment_date=date.today(),
            amount=Decimal("1000.00")
        )
        db.add(payment)
        db.commit()
        
        allocation = APAllocation(
            company_id=test_company.id,
            invoice_id=invoice.id,
            payment_id=payment.id,
            allocated_amount=Decimal("1000.00"),
            allocation_date=date.today()
        )
        db.add(allocation)
        db.commit()
        
        assert allocation.id is not None
        assert allocation.allocated_amount == Decimal("1000.00")
        assert allocation.invoice_id == invoice.id
        assert allocation.payment_id == payment.id
