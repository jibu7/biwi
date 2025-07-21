import pytest
from decimal import Decimal
from datetime import date
from sqlalchemy.exc import IntegrityError
from app.models.bom import BillOfMaterials, BOMComponent, BOMVersion

class TestBillOfMaterialsModel:
    def test_create_bom(self, db, test_company):
        # Create inventory item first
        from app.models.inventory import InventoryItem, UnitOfMeasure
        
        uom = UnitOfMeasure(company_id=test_company.id, name="Each", abbreviation="EA")
        db.add(uom)
        db.commit()
        
        finished_item = InventoryItem(
            company_id=test_company.id,
            item_code="FINISHED001",
            name="Finished Product",
            unit_of_measure_id=uom.id
        )
        db.add(finished_item)
        db.commit()
        
        bom = BillOfMaterials(
            company_id=test_company.id,
            item_id=finished_item.id,
            bom_number="BOM-001",
            description="Test BOM for finished product",
            version="1.0",
            is_active=True,
            effective_date=date.today(),
            total_cost=Decimal("100.00")
        )
        db.add(bom)
        db.commit()
        
        assert bom.id is not None
        assert bom.bom_number == "BOM-001"
        assert bom.version == "1.0"
        assert bom.is_active == True
        assert bom.total_cost == Decimal("100.00")
        assert bom.item_id == finished_item.id
    
    def test_bom_unique_number_per_company(self, db, test_company):
        from app.models.inventory import InventoryItem, UnitOfMeasure
        
        uom = UnitOfMeasure(company_id=test_company.id, name="Each", abbreviation="EA")
        db.add(uom)
        db.commit()
        
        item1 = InventoryItem(company_id=test_company.id, item_code="ITEM1", name="Item 1", unit_of_measure_id=uom.id)
        item2 = InventoryItem(company_id=test_company.id, item_code="ITEM2", name="Item 2", unit_of_measure_id=uom.id)
        db.add_all([item1, item2])
        db.commit()
        
        bom1 = BillOfMaterials(company_id=test_company.id, item_id=item1.id, bom_number="BOM-001")
        db.add(bom1)
        db.commit()
        
        bom2 = BillOfMaterials(company_id=test_company.id, item_id=item2.id, bom_number="BOM-001")
        db.add(bom2)
        with pytest.raises(IntegrityError):
            db.commit()

class TestBOMComponentModel:
    def test_create_bom_component(self, db, test_company):
        # Create prerequisites
        from app.models.inventory import InventoryItem, UnitOfMeasure
        
        uom = UnitOfMeasure(company_id=test_company.id, name="Each", abbreviation="EA")
        db.add(uom)
        db.commit()
        
        finished_item = InventoryItem(
            company_id=test_company.id,
            item_code="FINISHED001",
            name="Finished Product",
            unit_of_measure_id=uom.id
        )
        component_item = InventoryItem(
            company_id=test_company.id,
            item_code="COMP001",
            name="Component Item",
            unit_of_measure_id=uom.id,
            unit_cost=Decimal("10.00")
        )
        db.add_all([finished_item, component_item])
        db.commit()
        
        bom = BillOfMaterials(
            company_id=test_company.id,
            item_id=finished_item.id,
            bom_number="BOM-001",
            version="1.0"
        )
        db.add(bom)
        db.commit()
        
        bom_component = BOMComponent(
            company_id=test_company.id,
            bom_id=bom.id,
            component_item_id=component_item.id,
            sequence_number=10,
            quantity_required=Decimal("5.0"),
            unit_cost=Decimal("10.00"),
            total_cost=Decimal("50.00"),
            scrap_factor=Decimal("0.05"),
            notes="Main component"
        )
        db.add(bom_component)
        db.commit()
        
        assert bom_component.id is not None
        assert bom_component.sequence_number == 10
        assert bom_component.quantity_required == Decimal("5.0")
        assert bom_component.unit_cost == Decimal("10.00")
        assert bom_component.total_cost == Decimal("50.00")
        assert bom_component.scrap_factor == Decimal("0.05")
        assert bom_component.bom_id == bom.id
        assert bom_component.component_item_id == component_item.id

class TestBOMVersionModel:
    def test_create_bom_version(self, db, test_company):
        # Create prerequisites
        from app.models.inventory import InventoryItem, UnitOfMeasure
        
        uom = UnitOfMeasure(company_id=test_company.id, name="Each", abbreviation="EA")
        db.add(uom)
        db.commit()
        
        finished_item = InventoryItem(
            company_id=test_company.id,
            item_code="FINISHED001",
            name="Finished Product",
            unit_of_measure_id=uom.id
        )
        db.add(finished_item)
        db.commit()
        
        bom = BillOfMaterials(
            company_id=test_company.id,
            item_id=finished_item.id,
            bom_number="BOM-001",
            version="1.0"
        )
        db.add(bom)
        db.commit()
        
        bom_version = BOMVersion(
            company_id=test_company.id,
            bom_id=bom.id,
            version_number="2.0",
            description="Updated BOM version",
            effective_date=date.today(),
            created_date=date.today(),
            is_current=True,
            change_reason="Cost optimization"
        )
        db.add(bom_version)
        db.commit()
        
        assert bom_version.id is not None
        assert bom_version.version_number == "2.0"
        assert bom_version.is_current == True
        assert bom_version.change_reason == "Cost optimization"
        assert bom_version.bom_id == bom.id
