import pytest
from decimal import Decimal
from datetime import datetime, date
from sqlalchemy.exc import IntegrityError
from app.models.pos import POSTransaction, POSTransactionLine, Till

class TestPOSTransactionModel:
    def test_create_pos_transaction(self, db, test_company, test_superuser):
        # Create POS terminal first
        from app.models.inventory import Warehouse
        warehouse = Warehouse(company_id=test_company.id, name="Main Warehouse", location="Main")
        db.add(warehouse)
        db.commit()

        till = Till(
            company_id=test_company.id,
            till_code="TERM001",
            till_name="Main Terminal",
            location="Store Front",
            default_warehouse_id=warehouse.id
        )
        db.add(till)
        db.commit()
        
        transaction = POSTransaction(
            company_id=test_company.id,
            session_id=None, # This needs to be created
            transaction_number="POS-001",
            transaction_datetime=datetime.now(),
            subtotal_amount=Decimal("100.00"),
            tax_amount=Decimal("10.00"),
            total_amount=Decimal("110.00"),
            status="Completed",
        )
        db.add(transaction)
        db.commit()
        
        assert transaction.id is not None
        assert transaction.transaction_number == "POS-001"
        assert transaction.subtotal_amount == Decimal("100.00")
        assert transaction.tax_amount == Decimal("10.00")
        assert transaction.total_amount == Decimal("110.00")
        assert transaction.status == "Completed"
    
    def test_pos_transaction_unique_number_per_company(self, db, test_company):
        till = Till(company_id=test_company.id, till_code="TERM001", till_name="Main Terminal")
        db.add(till)
        db.commit()
        
        pos1 = POSTransaction(company_id=test_company.id, session_id=None, transaction_number="POS-001", total_amount=0)
        db.add(pos1)
        db.commit()
        
        pos2 = POSTransaction(company_id=test_company.id, session_id=None, transaction_number="POS-001", total_amount=0)
        db.add(pos2)
        with pytest.raises(IntegrityError):
            db.commit()

class TestPOSTransactionLineModel:
    def test_create_pos_transaction_line(self, db, test_company):
        # Create prerequisites
        from app.models.inventory import InventoryItem, UnitOfMeasure
        
        uom = UnitOfMeasure(company_id=test_company.id, name="Each", abbreviation="EA")
        db.add(uom)
        db.commit()
        
        item = InventoryItem(
            company_id=test_company.id,
            item_code="ITEM001",
            description="Test Item",
            unit_of_measure_id=uom.id,
            selling_price=Decimal("25.00")
        )
        db.add(item)
        db.commit()
        
        till = Till(company_id=test_company.id, till_code="TERM001", till_name="Main Terminal")
        db.add(till)
        db.commit()
        
        transaction = POSTransaction(
            company_id=test_company.id,
            session_id=None,
            transaction_number="POS-001",
            transaction_datetime=datetime.now(),
            total_amount=0
        )
        db.add(transaction)
        db.commit()
        
        transaction_line = POSTransactionLine(
            transaction_id=transaction.id,
            item_id=item.id,
            quantity=Decimal("2"),
            unit_price=Decimal("25.00"),
            line_total=Decimal("50.00"),
            discount_amount=Decimal("0.00"),
            tax_amount=Decimal("5.00"),
            description="line item"
        )
        db.add(transaction_line)
        db.commit()
        
        assert transaction_line.id is not None
        assert transaction_line.quantity == Decimal("2")
        assert transaction_line.unit_price == Decimal("25.00")
        assert transaction_line.line_total == Decimal("50.00")
        assert transaction_line.transaction_id == transaction.id
        assert transaction_line.item_id == item.id

class TestTillModel:
    def test_create_till(self, db, test_company):
        till = Till(
            company_id=test_company.id,
            till_code="TERM001",
            till_name="Main Cash Register",
            location="Store Front",
            is_active=True,
        )
        db.add(till)
        db.commit()
        
        assert till.id is not None
        assert till.till_code == "TERM001"
        assert till.till_name == "Main Cash Register"
        assert till.location == "Store Front"
        assert till.is_active == True
    
    def test_till_unique_code_per_company(self, db, test_company):
        till1 = Till(company_id=test_company.id, till_code="TERM001", till_name="Terminal 1")
        db.add(till1)
        db.commit()
        
        till2 = Till(company_id=test_company.id, till_code="TERM001", till_name="Terminal 2")
        db.add(till2)
        with pytest.raises(IntegrityError):
            db.commit()
