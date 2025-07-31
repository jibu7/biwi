import pytest
from decimal import Decimal
from datetime import datetime
from sqlalchemy.exc import IntegrityError
from app.models.bom import BOMHeader, BOMComponent

class TestBOMHeaderModel:
    def test_create_bom_header(self, db, test_company):
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
        
        bom_header = BOMHeader(
            company_id=test_company.id,
            parent_item_id=finished_item.id,
            bom_code="BOM-001",
            description="Test BOM for finished product",
            revision="1.0",
            is_active=True,
            effective_date=datetime.utcnow(),
        )
        db.add(bom_header)
        db.commit()
        
        assert bom_header.id is not None
        assert bom_header.bom_code == "BOM-001"
        assert bom_header.revision == "1.0"
        assert bom_header.is_active == True
        assert bom_header.parent_item_id == finished_item.id
    
    def test_bom_unique_code_per_company(self, db, test_company):
        from app.models.inventory import InventoryItem, UnitOfMeasure
        
        uom = UnitOfMeasure(company_id=test_company.id, name="Each", abbreviation="EA")
        db.add(uom)
        db.commit()
        
        item1 = InventoryItem(company_id=test_company.id, item_code="ITEM1", name="Item 1", unit_of_measure_id=uom.id)
        item2 = InventoryItem(company_id=test_company.id, item_code="ITEM2", name="Item 2", unit_of_measure_id=uom.id)
        db.add_all([item1, item2])
        db.commit()
        
        bom1 = BOMHeader(company_id=test_company.id, parent_item_id=item1.id, bom_code="BOM-001")
        db.add(bom1)
        db.commit()
        
        bom2 = BOMHeader(company_id=test_company.id, parent_item_id=item2.id, bom_code="BOM-001")
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
            unit_of_measure_id=uom.id
        )
        db.add_all([finished_item, component_item])
        db.commit()
        
        bom_header = BOMHeader(
            company_id=test_company.id,
            parent_item_id=finished_item.id,
            bom_code="BOM-001",
            revision="1.0"
        )
        db.add(bom_header)
        db.commit()
        
        bom_component = BOMComponent(
            bom_header_id=bom_header.id,
            component_item_id=component_item.id,
            quantity_required=Decimal("5.0"),
            scrap_percentage=Decimal("0.05"),
            notes="Main component"
        )
        db.add(bom_component)
        db.commit()
        
        assert bom_component.id is not None
        assert bom_component.quantity_required == Decimal("5.0")
        assert bom_component.scrap_percentage == Decimal("0.05")
        assert bom_component.bom_header_id == bom_header.id
        assert bom_component.component_item_id == component_item.id
