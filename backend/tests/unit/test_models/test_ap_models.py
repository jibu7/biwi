import pytest
from decimal import Decimal
from datetime import date, timedelta
from sqlalchemy.exc import IntegrityError
from app.models.ap import Supplier, APTransaction, APAllocation

class TestSupplierModel:
    def test_create_supplier(self, db, test_company):
        supplier = Supplier(
            company_id=test_company.id,
            supplier_code="VEND001",
            name="Test Vendor",
            contact_info={"email": "vendor@test.com", "phone": "555-0456"},
            address={"street": "789 Vendor Ave"},
            payment_terms="Net 30",
            is_active=True
        )
        db.add(supplier)
        db.commit()
        
        assert supplier.id is not None
        assert supplier.supplier_code == "VEND001"
        assert supplier.name == "Test Vendor"
        assert supplier.payment_terms == "Net 30"
    
    def test_supplier_unique_code_per_company(self, db, test_company):
        supplier1 = Supplier(company_id=test_company.id, supplier_code="VEND001", name="Vendor 1")
        db.add(supplier1)
        db.commit()
        
        supplier2 = Supplier(company_id=test_company.id, supplier_code="VEND001", name="Vendor 2")
        db.add(supplier2)
        with pytest.raises(IntegrityError):
            db.commit()

class TestAPTransactionModel:
    def test_create_ap_transaction(self, db, test_company):
        # Create supplier first
        supplier = Supplier(
            company_id=test_company.id,
            supplier_code="VEND001",
            name="Test Vendor"
        )
        db.add(supplier)
        db.commit()
        
        transaction = APTransaction(
            company_id=test_company.id,
            supplier_id=supplier.id,
            document_number="AP-001",
            transaction_date=date.today(),
            due_date=date.today() + timedelta(days=30),
            total_amount=Decimal("2200.00"),
            open_amount=Decimal("2200.00"),
            status="Pending"
        )
        db.add(transaction)
        db.commit()
        
        assert transaction.id is not None
        assert transaction.document_number == "AP-001"
        assert transaction.total_amount == Decimal("2200.00")
        assert transaction.status == "Pending"
        assert transaction.supplier_id == supplier.id
