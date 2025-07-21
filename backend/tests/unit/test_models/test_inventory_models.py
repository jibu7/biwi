import pytest
from decimal import Decimal
from datetime import date
from sqlalchemy.exc import IntegrityError
from app.models.inventory import InventoryItem, InventoryLocation, InventoryTransaction, UnitOfMeasure

class TestInventoryItemModel:
    def test_create_inventory_item(self, db, test_company):
        # Create unit of measure first
        uom = UnitOfMeasure(
            company_id=test_company.id,
            name="Each",
            abbreviation="EA",
            conversion_factor=Decimal("1.0")
        )
        db.add(uom)
        db.commit()
        
        item = InventoryItem(
            company_id=test_company.id,
            item_code="ITEM001",
            name="Test Item",
            description="Test inventory item",
            unit_of_measure_id=uom.id,
            unit_cost=Decimal("10.00"),
            selling_price=Decimal("15.00"),
            reorder_level=Decimal("100"),
            reorder_quantity=Decimal("500"),
            is_active=True
        )
        db.add(item)
        db.commit()
        
        assert item.id is not None
        assert item.item_code == "ITEM001"
        assert item.name == "Test Item"
        assert item.unit_cost == Decimal("10.00")
        assert item.selling_price == Decimal("15.00")
        assert item.unit_of_measure_id == uom.id
    
    def test_item_unique_code_per_company(self, db, test_company):
        item1 = InventoryItem(company_id=test_company.id, item_code="ITEM001", name="Item 1")
        db.add(item1)
        db.commit()
        
        item2 = InventoryItem(company_id=test_company.id, item_code="ITEM001", name="Item 2")
        db.add(item2)
        with pytest.raises(IntegrityError):
            db.commit()

class TestInventoryLocationModel:
    def test_create_inventory_location(self, db, test_company):
        location = InventoryLocation(
            company_id=test_company.id,
            location_code="LOC001",
            name="Main Warehouse",
            description="Primary storage location",
            is_active=True
        )
        db.add(location)
        db.commit()
        
        assert location.id is not None
        assert location.location_code == "LOC001"
        assert location.name == "Main Warehouse"
        assert location.is_active == True
    
    def test_location_unique_code_per_company(self, db, test_company):
        location1 = InventoryLocation(company_id=test_company.id, location_code="LOC001", name="Location 1")
        db.add(location1)
        db.commit()
        
        location2 = InventoryLocation(company_id=test_company.id, location_code="LOC001", name="Location 2")
        db.add(location2)
        with pytest.raises(IntegrityError):
            db.commit()

class TestInventoryTransactionModel:
    def test_create_inventory_transaction(self, db, test_company):
        # Create prerequisites
        uom = UnitOfMeasure(company_id=test_company.id, name="Each", abbreviation="EA")
        db.add(uom)
        db.commit()
        
        item = InventoryItem(
            company_id=test_company.id,
            item_code="ITEM001",
            name="Test Item",
            unit_of_measure_id=uom.id
        )
        db.add(item)
        db.commit()
        
        location = InventoryLocation(
            company_id=test_company.id,
            location_code="LOC001",
            name="Main Warehouse"
        )
        db.add(location)
        db.commit()
        
        transaction = InventoryTransaction(
            company_id=test_company.id,
            item_id=item.id,
            location_id=location.id,
            transaction_type="Receipt",
            transaction_date=date.today(),
            quantity=Decimal("100"),
            unit_cost=Decimal("10.00"),
            total_cost=Decimal("1000.00"),
            reference="PO-001",
            description="Initial stock receipt"
        )
        db.add(transaction)
        db.commit()
        
        assert transaction.id is not None
        assert transaction.transaction_type == "Receipt"
        assert transaction.quantity == Decimal("100")
        assert transaction.unit_cost == Decimal("10.00")
        assert transaction.total_cost == Decimal("1000.00")
        assert transaction.item_id == item.id
        assert transaction.location_id == location.id

class TestUnitOfMeasureModel:
    def test_create_unit_of_measure(self, db, test_company):
        uom = UnitOfMeasure(
            company_id=test_company.id,
            name="Kilogram",
            abbreviation="KG",
            conversion_factor=Decimal("1000.0"),
            base_unit="Gram",
            is_active=True
        )
        db.add(uom)
        db.commit()
        
        assert uom.id is not None
        assert uom.name == "Kilogram"
        assert uom.abbreviation == "KG"
        assert uom.conversion_factor == Decimal("1000.0")
        assert uom.base_unit == "Gram"
    
    def test_uom_unique_name_per_company(self, db, test_company):
        uom1 = UnitOfMeasure(company_id=test_company.id, name="Each", abbreviation="EA")
        db.add(uom1)
        db.commit()
        
        uom2 = UnitOfMeasure(company_id=test_company.id, name="Each", abbreviation="PC")
        db.add(uom2)
        with pytest.raises(IntegrityError):
            db.commit()
