import pytest
from decimal import Decimal
from datetime import date
from sqlalchemy.exc import IntegrityError
from app.models.inventory import InventoryItem, Warehouse, InventoryTransaction, UnitOfMeasure

class TestInventoryItemModel:
    def test_create_inventory_item(self, db, test_company):
        # Create unit of measure first
        uom = UnitOfMeasure(
            company_id=test_company.id,
            name="Each",
            abbreviation="EA",
            conversion_factor_to_base=Decimal("1.0")
        )
        db.add(uom)
        db.commit()
        
        item = InventoryItem(
            company_id=test_company.id,
            item_code="ITEM001",
            description="Test inventory item",
            item_type="Stock",
            unit_of_measure_id=uom.id,
            selling_price=Decimal("15.00"),
            is_active=True
        )
        db.add(item)
        db.commit()
        
        assert item.id is not None
        assert item.item_code == "ITEM001"
        assert item.selling_price == Decimal("15.00")
        assert item.unit_of_measure_id == uom.id
    
    def test_item_unique_code_per_company(self, db, test_company):
        item1 = InventoryItem(company_id=test_company.id, item_code="ITEM001", description="Item 1", item_type="Stock")
        db.add(item1)
        db.commit()
        
        item2 = InventoryItem(company_id=test_company.id, item_code="ITEM001", description="Item 2", item_type="Stock")
        db.add(item2)
        with pytest.raises(IntegrityError):
            db.commit()

class TestWarehouseModel:
    def test_create_warehouse(self, db, test_company):
        warehouse = Warehouse(
            company_id=test_company.id,
            warehouse_code="LOC001",
            name="Main Warehouse",
            location="Primary storage location",
            is_active=True
        )
        db.add(warehouse)
        db.commit()
        
        assert warehouse.id is not None
        assert warehouse.warehouse_code == "LOC001"
        assert warehouse.name == "Main Warehouse"
        assert warehouse.is_active == True
    
    def test_warehouse_unique_code_per_company(self, db, test_company):
        warehouse1 = Warehouse(company_id=test_company.id, warehouse_code="LOC001", name="Location 1")
        db.add(warehouse1)
        db.commit()
        
        warehouse2 = Warehouse(company_id=test_company.id, warehouse_code="LOC001", name="Location 2")
        db.add(warehouse2)
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
            description="Test Item",
            item_type="Stock",
            unit_of_measure_id=uom.id
        )
        db.add(item)
        db.commit()
        
        warehouse = Warehouse(
            company_id=test_company.id,
            warehouse_code="LOC001",
            name="Main Warehouse"
        )
        db.add(warehouse)
        db.commit()
        
        transaction = InventoryTransaction(
            company_id=test_company.id,
            item_id=item.id,
            warehouse_id=warehouse.id,
            transaction_date=date.today(),
            quantity=Decimal("100"),
            unit_cost=Decimal("10.00"),
            total_value=Decimal("1000.00"),
            notes="Initial stock receipt"
        )
        db.add(transaction)
        db.commit()
        
        assert transaction.id is not None
        assert transaction.quantity == Decimal("100")
        assert transaction.unit_cost == Decimal("10.00")
        assert transaction.total_value == Decimal("1000.00")
        assert transaction.item_id == item.id
        assert transaction.warehouse_id == warehouse.id

class TestUnitOfMeasureModel:
    def test_create_unit_of_measure(self, db, test_company):
        uom = UnitOfMeasure(
            company_id=test_company.id,
            name="Kilogram",
            abbreviation="KG",
            conversion_factor_to_base=Decimal("1000.0"),
            is_active=True
        )
        db.add(uom)
        db.commit()
        
        assert uom.id is not None
        assert uom.name == "Kilogram"
        assert uom.abbreviation == "KG"
        assert uom.conversion_factor_to_base == Decimal("1000.0")
    
    def test_uom_unique_name_per_company(self, db, test_company):
        uom1 = UnitOfMeasure(company_id=test_company.id, name="Each", abbreviation="EA")
        db.add(uom1)
        db.commit()
        
        uom2 = UnitOfMeasure(company_id=test_company.id, name="Each", abbreviation="PC")
        db.add(uom2)
        with pytest.raises(IntegrityError):
            db.commit()
