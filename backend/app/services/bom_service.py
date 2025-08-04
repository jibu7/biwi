from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, date
from decimal import Decimal
from fastapi import HTTPException, status

from app import models, schemas
from app.crud import bom as crud_bom
from app.crud import inventory as crud_inventory
from app.crud import gl as crud_gl
from app.core.tenant_context import get_current_tenant_id


class BOMService:
    """Business logic layer for BOM operations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_bom(self, bom_data: schemas.BOMHeaderCreate, user_id: int) -> schemas.BOMHeaderRead:
        """Create a new BOM with business validation"""
        company_id = get_current_tenant_id()
        
        # Validate that the item exists and is appropriate for manufacturing
        item = self.db.query(models.InventoryItem).filter(
            models.InventoryItem.id == bom_data.item_id,
            models.InventoryItem.company_id == company_id
        ).first()
        
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Item not found"
            )
        
        # Check for duplicate BOM (same item + version)
        existing_bom = crud_bom.get_bom_header_by_item(
            self.db, bom_data.item_id, company_id, bom_data.version
        )
        if existing_bom:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"BOM already exists for item {item.item_code} version {bom_data.version}"
            )
        
        # Validate all component items exist
        for component in bom_data.components:
            component_item = self.db.query(models.InventoryItem).filter(
                models.InventoryItem.id == component.component_item_id,
                models.InventoryItem.company_id == company_id
            ).first()
            
            if not component_item:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Component item with ID {component.component_item_id} not found"
                )
            
            # Prevent circular references
            if component.component_item_id == bom_data.item_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Item cannot be a component of itself"
                )
        
        # Create BOM
        bom = crud_bom.create_bom_header(self.db, bom_data, company_id, user_id)
        
        # Return enriched BOM data
        return self.get_bom_with_costs(bom.id, company_id)
    
    def get_bom_with_costs(self, bom_id: int, company_id: int) -> schemas.BOMHeaderRead:
        """Get BOM with calculated costs"""
        bom = crud_bom.get_bom_header(self.db, bom_id, company_id)
        if not bom:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="BOM not found"
            )
        
        # Calculate costs
        cost_analysis = crud_bom.calculate_bom_cost(self.db, bom_id, company_id)
        
        # Build response
        components_data = []
        for component in bom.components:
            component_data = schemas.BOMComponentRead(
                id=component.id,
                component_item_id=component.component_item_id,
                component_item_code=component.component_item.item_code if component.component_item else None,
                component_item_description=component.component_item.description if component.component_item else None,
                quantity_required=component.quantity_required,
                unit_of_measure_id=component.unit_of_measure_id,
                unit_of_measure_name=component.unit_of_measure.name if component.unit_of_measure else None,
                scrap_percentage=component.scrap_percentage,
                is_phantom=component.is_phantom,
                notes=component.notes,
                unit_cost=component.component_item.average_cost if component.component_item else None,
                extended_cost=None  # Will be calculated below
            )
            
            # Calculate extended cost
            if component_data.unit_cost:
                effective_qty = component.quantity_required * (1 + component.scrap_percentage / 100)
                component_data.extended_cost = effective_qty * component_data.unit_cost
            
            components_data.append(component_data)
        
        return schemas.BOMHeaderRead(
            id=bom.id,
            company_id=bom.company_id,
            item_id=bom.item_id,
            item_code=bom.item.item_code if bom.item else None,
            item_description=bom.item.description if bom.item else None,
            version=bom.version,
            description=bom.description,
            effective_date=bom.effective_date,
            expiry_date=bom.expiry_date,
            status=bom.status,
            unit_quantity=bom.unit_quantity,
            labor_hours=bom.labor_hours,
            overhead_percentage=bom.overhead_percentage,
            components=components_data,
            total_material_cost=cost_analysis.get("material_cost"),
            total_labor_cost=cost_analysis.get("labor_cost"),
            total_overhead_cost=cost_analysis.get("overhead_cost"),
            total_cost=cost_analysis.get("total_cost")
        )
    
    def create_manufacturing_order(self, mo_data: schemas.ManufacturingOrderCreate, user_id: int) -> schemas.ManufacturingOrderRead:
        """Create a manufacturing order with validation"""
        company_id = get_current_tenant_id()
        
        # Validate BOM exists and is active
        bom = crud_bom.get_bom_header(self.db, mo_data.bom_header_id, company_id)
        if not bom or bom.status != "Active":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="BOM not found or not active"
            )
        
        # Validate item matches BOM
        if mo_data.item_id != bom.item_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Item ID does not match BOM item"
            )
        
        # Validate warehouse exists
        warehouse = self.db.query(models.Warehouse).filter(
            models.Warehouse.id == mo_data.warehouse_id,
            models.Warehouse.company_id == company_id
        ).first()
        
        if not warehouse:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Warehouse not found"
            )
        
        # Check component availability
        availability_issues = self.check_component_availability(
            mo_data.bom_header_id, mo_data.quantity_to_produce, mo_data.warehouse_id, company_id
        )
        
        if availability_issues:
            # Create MO anyway but add warning in notes
            warning = "Component availability issues: " + "; ".join(availability_issues)
            if mo_data.notes:
                mo_data.notes += f"\n{warning}"
            else:
                mo_data.notes = warning
        
        # Create manufacturing order
        mo = crud_bom.create_manufacturing_order(self.db, mo_data, company_id, user_id)
        
        return schemas.ManufacturingOrderRead(
            id=mo.id,
            company_id=mo.company_id,
            order_number=mo.order_number,
            bom_header_id=mo.bom_header_id,
            item_id=mo.item_id,
            warehouse_id=mo.warehouse_id,
            quantity_to_produce=mo.quantity_to_produce,
            quantity_produced=mo.quantity_produced,
            scheduled_start_date=mo.scheduled_start_date,
            scheduled_end_date=mo.scheduled_end_date,
            actual_start_date=mo.actual_start_date,
            actual_end_date=mo.actual_end_date,
            status=mo.status,
            priority=mo.priority,
            notes=mo.notes,
            linked_sales_order_id=mo.linked_sales_order_id,
            created_at=mo.created_at,
            created_by_user_id=mo.created_by_user_id
        )
    
    def check_component_availability(self, bom_id: int, quantity: Decimal, warehouse_id: int, company_id: int) -> List[str]:
        """Check if all components are available for production"""
        issues = []
        
        bom = crud_bom.get_bom_header(self.db, bom_id, company_id)
        if not bom:
            return ["BOM not found"]
        
        for component in bom.components:
            required_qty = component.quantity_required * quantity * (1 + component.scrap_percentage / 100)
            
            # Get available quantity
            location = self.db.query(models.InventoryItemLocation).filter(
                models.InventoryItemLocation.item_id == component.component_item_id,
                models.InventoryItemLocation.warehouse_id == warehouse_id
            ).first()
            
            available_qty = location.quantity_on_hand if location else Decimal("0.0")
            
            if available_qty < required_qty:
                shortage = required_qty - available_qty
                item_code = component.component_item.item_code if component.component_item else f"ID{component.component_item_id}"
                issues.append(f"{item_code}: short {shortage} units (need {required_qty}, have {available_qty})")
        
        return issues
    
    def release_manufacturing_order(self, mo_id: int, user_id: int) -> schemas.ManufacturingOrderRead:
        """Release a manufacturing order with additional validations"""
        company_id = get_current_tenant_id()
        
        # Get BOM defaults to check auto-issue setting
        defaults = crud_bom.get_bom_defaults(self.db, company_id)
        
        # Release the order
        mo = crud_bom.release_manufacturing_order(self.db, mo_id, company_id)
        
        # If auto-issue is enabled, automatically issue components
        if defaults and defaults.auto_issue_components:
            try:
                self.issue_components_for_mo(mo_id, company_id, user_id)
            except Exception as e:
                # Log the error but don't fail the release
                print(f"Warning: Could not auto-issue components: {e}")
        
        return self.get_manufacturing_order(mo_id, company_id)
    
    def issue_components_for_mo(self, mo_id: int, company_id: int, user_id: int):
        """Issue components for a manufacturing order"""
        mo = crud_bom.get_manufacturing_order(self.db, mo_id, company_id)
        if not mo:
            raise HTTPException(status_code=404, detail="Manufacturing order not found")
        
        defaults = crud_bom.get_bom_defaults(self.db, company_id)
        allow_negative = defaults.allow_negative_inventory if defaults else False
        
        for requisition in mo.material_requisitions:
            if requisition.status == "Pending" and requisition.issued_quantity < requisition.required_quantity:
                remaining_qty = requisition.required_quantity - requisition.issued_quantity
                
                # Check availability unless negative inventory is allowed
                if not allow_negative:
                    location = self.db.query(models.InventoryItemLocation).filter(
                        models.InventoryItemLocation.item_id == requisition.component_item_id,
                        models.InventoryItemLocation.warehouse_id == requisition.warehouse_id
                    ).first()
                    
                    available_qty = location.quantity_on_hand if location else Decimal("0.0")
                    if available_qty < remaining_qty:
                        continue  # Skip this component if not enough inventory
                
                # Issue the component
                try:
                    # This would integrate with inventory adjustment system
                    requisition.issued_quantity = requisition.required_quantity
                    requisition.status = "Issued"
                    requisition.issue_date = datetime.utcnow()
                    
                    self.db.commit()
                except Exception as e:
                    self.db.rollback()
                    raise e
    
    def record_production(self, production_data: schemas.ProductionEntryCreate, user_id: int) -> schemas.ProductionEntryRead:
        """Record production with GL integration"""
        company_id = get_current_tenant_id()
        
        # Create production entry
        entry = crud_bom.create_production_entry(self.db, production_data, company_id, user_id)
        
        # Create GL entries for production
        self.create_production_gl_entries(entry, company_id, user_id)
        
        return schemas.ProductionEntryRead(
            id=entry.id,
            manufacturing_order_id=entry.manufacturing_order_id,
            entry_date=entry.entry_date,
            quantity_produced=entry.quantity_produced,
            quantity_scrapped=entry.quantity_scrapped,
            labor_hours_actual=entry.labor_hours_actual,
            notes=entry.notes,
            linked_gl_journal_entry_id=entry.linked_gl_journal_entry_id,
            created_by_user_id=entry.created_by_user_id
        )
    
    def create_production_gl_entries(self, production_entry: models.ProductionEntry, company_id: int, user_id: int):
        """Create GL entries for production activity"""
        defaults = crud_bom.get_bom_defaults(self.db, company_id)
        if not defaults:
            return  # No GL integration if defaults not configured
        
        mo = production_entry.manufacturing_order
        if not mo:
            return
        
        # Calculate costs
        bom_cost = crud_bom.calculate_bom_cost(
            self.db, mo.bom_header_id, company_id, production_entry.quantity_produced
        )
        
        material_cost = bom_cost.get("material_cost", Decimal("0.0"))
        labor_cost = bom_cost.get("labor_cost", Decimal("0.0"))
        overhead_cost = bom_cost.get("overhead_cost", Decimal("0.0"))
        
        # Create journal entries
        journal_entries = []
        
        # Debit: WIP (Work in Progress)
        if defaults.wip_gl_account_id and material_cost > 0:
            journal_entries.append({
                "account_id": defaults.wip_gl_account_id,
                "debit": material_cost,
                "credit": Decimal("0.0"),
                "description": f"Material cost for MO {mo.order_number}"
            })
        
        # Credit: Material Usage
        # This would typically be handled by inventory adjustments
        
        # Debit: Labor
        if defaults.labor_gl_account_id and labor_cost > 0:
            journal_entries.append({
                "account_id": defaults.labor_gl_account_id,
                "debit": labor_cost,
                "credit": Decimal("0.0"),
                "description": f"Labor cost for MO {mo.order_number}"
            })
        
        # Debit: Overhead
        if defaults.overhead_gl_account_id and overhead_cost > 0:
            journal_entries.append({
                "account_id": defaults.overhead_gl_account_id,
                "debit": overhead_cost,
                "credit": Decimal("0.0"),
                "description": f"Overhead cost for MO {mo.order_number}"
            })
        
        # Create the journal entry if we have entries
        if journal_entries:
            try:
                # This would integrate with GL journal creation
                # For now, we'll just link the production entry
                production_entry.linked_gl_journal_entry_id = None  # Would be actual GL entry ID
                self.db.commit()
            except Exception as e:
                print(f"Warning: Could not create GL entries: {e}")
    
    def calculate_mrp(self, mrp_request: schemas.MRPRequest) -> List[schemas.MRPResult]:
        """Calculate Material Requirements Planning"""
        company_id = get_current_tenant_id()
        
        # Validate warehouse
        warehouse = self.db.query(models.Warehouse).filter(
            models.Warehouse.id == mrp_request.warehouse_id,
            models.Warehouse.company_id == company_id
        ).first()
        
        if not warehouse:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Warehouse not found"
            )
        
        return crud_bom.calculate_mrp(self.db, mrp_request, company_id)
    
    def get_manufacturing_order(self, mo_id: int, company_id: int) -> schemas.ManufacturingOrderRead:
        """Get manufacturing order with full details"""
        mo = crud_bom.get_manufacturing_order(self.db, mo_id, company_id)
        if not mo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Manufacturing order not found"
            )
        
        return schemas.ManufacturingOrderRead(
            id=mo.id,
            company_id=mo.company_id,
            order_number=mo.order_number,
            bom_header_id=mo.bom_header_id,
            item_id=mo.item_id,
            warehouse_id=mo.warehouse_id,
            quantity_to_produce=mo.quantity_to_produce,
            quantity_produced=mo.quantity_produced,
            scheduled_start_date=mo.scheduled_start_date,
            scheduled_end_date=mo.scheduled_end_date,
            actual_start_date=mo.actual_start_date,
            actual_end_date=mo.actual_end_date,
            status=mo.status,
            priority=mo.priority,
            notes=mo.notes,
            linked_sales_order_id=mo.linked_sales_order_id,
            created_at=mo.created_at,
            created_by_user_id=mo.created_by_user_id
        )
    
    def get_bom_explosion(self, bom_id: int, quantity: Decimal = Decimal("1.0")) -> List[Dict[str, Any]]:
        """Get multi-level BOM explosion"""
        company_id = get_current_tenant_id()
        return crud_bom.explode_bom(self.db, bom_id, company_id, quantity)
    
    def copy_bom(self, source_bom_id: int, new_version: str, user_id: int) -> schemas.BOMHeaderRead:
        """Copy an existing BOM to a new version"""
        company_id = get_current_tenant_id()
        
        # Validate source BOM exists
        source_bom = crud_bom.get_bom_header(self.db, source_bom_id, company_id)
        if not source_bom:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Source BOM not found"
            )
        
        # Check if new version already exists
        existing = crud_bom.get_bom_header_by_item(
            self.db, source_bom.item_id, company_id, new_version
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"BOM version {new_version} already exists for this item"
            )
        
        # Copy BOM
        new_bom = crud_bom.copy_bom(self.db, source_bom_id, new_version, company_id, user_id)
        
        return self.get_bom_with_costs(new_bom.id, company_id)
    
    def get_where_used_report(self, item_id: int) -> List[Dict[str, Any]]:
        """Get where-used report for an item"""
        company_id = get_current_tenant_id()
        
        boms = crud_bom.get_bom_where_used(self.db, item_id, company_id)
        
        result = []
        for bom in boms:
            # Find the component record for this item
            component = next(
                (c for c in bom.components if c.component_item_id == item_id), 
                None
            )
            
            if component:
                result.append({
                    "bom_id": bom.id,
                    "parent_item_code": bom.item.item_code if bom.item else "",
                    "parent_item_description": bom.item.description if bom.item else "",
                    "bom_version": bom.version,
                    "quantity_required": component.quantity_required,
                    "scrap_percentage": component.scrap_percentage,
                    "effective_date": bom.effective_date,
                    "status": bom.status
                })
        
        return result
    
    def update_bom_defaults(self, defaults_data: schemas.BOMDefaultsUpdate) -> schemas.BOMDefaultsRead:
        """Update BOM defaults for the company"""
        company_id = get_current_tenant_id()
        
        defaults = crud_bom.get_or_create_bom_defaults(self.db, company_id)
        updated_defaults = crud_bom.update_bom_defaults(self.db, defaults, defaults_data)
        
        return schemas.BOMDefaultsRead(
            id=updated_defaults.id,
            company_id=updated_defaults.company_id,
            default_overhead_percentage=updated_defaults.default_overhead_percentage,
            default_labor_rate_per_hour=updated_defaults.default_labor_rate_per_hour,
            wip_gl_account_id=updated_defaults.wip_gl_account_id,
            labor_gl_account_id=updated_defaults.labor_gl_account_id,
            overhead_gl_account_id=updated_defaults.overhead_gl_account_id,
            variance_gl_account_id=updated_defaults.variance_gl_account_id,
            auto_issue_components=updated_defaults.auto_issue_components,
            allow_negative_inventory=updated_defaults.allow_negative_inventory
        )
    
    def run_mrp(self, mrp_request: schemas.MRPRequest) -> List[schemas.MRPResult]:
        """Run Material Requirements Planning"""
        company_id = get_current_tenant_id()
        return crud_bom.run_mrp(self.db, mrp_request, company_id)
    
    def issue_materials_for_order(self, manufacturing_order_id: int, user_id: int):
        """Issue materials for a manufacturing order"""
        company_id = get_current_tenant_id()
        return crud_bom.issue_materials(
            self.db, manufacturing_order_id, company_id, user_id
        )
    
    def complete_production(self, production_entry: schemas.ProductionEntryCreate, user_id: int):
        """Record production completion"""
        company_id = get_current_tenant_id()
        return crud_bom.complete_production(
            self.db, production_entry, company_id, user_id
        )
    
    def explode_bom_multilevel(self, bom_id: int, quantity: float = 1.0):
        """Get complete multi-level BOM explosion"""
        company_id = get_current_tenant_id()
        return crud_bom.explode_bom(
            self.db, bom_id, company_id, Decimal(str(quantity))
        )