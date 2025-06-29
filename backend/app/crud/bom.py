from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime
from decimal import Decimal
from app import models, schemas
from app.crud import inventory as crud_inventory
from app.crud import gl as crud_gl

def create_bom_header(db: Session, bom_in: schemas.BOMHeaderCreate, company_id: int) -> models.BOMHeader:
    # Create BOM header
    db_bom = models.BOMHeader(
        company_id=company_id,
        parent_item_id=bom_in.parent_item_id,
        bom_code=bom_in.bom_code,
        description=bom_in.description,
        revision=bom_in.revision,
        effective_date=bom_in.effective_date,
        expiry_date=bom_in.expiry_date,
        quantity_per_batch=bom_in.quantity_per_batch,
        unit_of_measure_id=bom_in.unit_of_measure_id,
        is_active=bom_in.is_active,
        notes=bom_in.notes
    )
    db.add(db_bom)
    db.flush()
    
    # Create components
    for component in bom_in.components:
        db_component = models.BOMComponent(
            bom_header_id=db_bom.id,
            component_item_id=component.component_item_id,
            quantity_required=component.quantity_required,
            unit_of_measure_id=component.unit_of_measure_id,
            scrap_percentage=component.scrap_percentage,
            sequence_number=component.sequence_number,
            is_phantom=component.is_phantom,
            notes=component.notes
        )
        db.add(db_component)
    
    db.commit()
    db.refresh(db_bom)
    return db_bom

def get_bom_headers_by_company(db: Session, company_id: int, skip: int = 0, limit: int = 100) -> List[models.BOMHeader]:
    return db.query(models.BOMHeader).options(
        joinedload(models.BOMHeader.parent_item),
        joinedload(models.BOMHeader.unit_of_measure),
        joinedload(models.BOMHeader.components).joinedload(models.BOMComponent.component_item),
        joinedload(models.BOMHeader.components).joinedload(models.BOMComponent.unit_of_measure)
    ).filter(
        models.BOMHeader.company_id == company_id
    ).offset(skip).limit(limit).all()

def get_bom_header(db: Session, bom_id: int, company_id: int) -> Optional[models.BOMHeader]:
    return db.query(models.BOMHeader).options(
        joinedload(models.BOMHeader.parent_item),
        joinedload(models.BOMHeader.unit_of_measure),
        joinedload(models.BOMHeader.components).joinedload(models.BOMComponent.component_item),
        joinedload(models.BOMHeader.components).joinedload(models.BOMComponent.unit_of_measure)
    ).filter(
        models.BOMHeader.id == bom_id,
        models.BOMHeader.company_id == company_id
    ).first()

def get_bom_header_by_item(db: Session, item_id: int, company_id: int) -> Optional[models.BOMHeader]:
    """Get active BOM for a specific item"""
    return db.query(models.BOMHeader).filter(
        models.BOMHeader.parent_item_id == item_id,
        models.BOMHeader.company_id == company_id,
        models.BOMHeader.is_active == True
    ).first()

def update_bom_header(db: Session, bom_obj: models.BOMHeader, bom_in: schemas.BOMHeaderUpdate) -> models.BOMHeader:
    update_data = bom_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(bom_obj, field, value)
    
    db.add(bom_obj)
    db.commit()
    db.refresh(bom_obj)
    return bom_obj

def delete_bom_header(db: Session, bom_id: int, company_id: int) -> bool:
    bom = get_bom_header(db, bom_id, company_id)
    if bom:
        db.delete(bom)
        db.commit()
        return True
    return False

def create_manufacturing_order(db: Session, mo_in: schemas.ManufacturingOrderCreate, company_id: int) -> models.ManufacturingOrder:
    # Get BOM defaults for next order number
    defaults = get_or_create_bom_defaults(db, company_id)
    order_number = f"MO{defaults.next_mo_number:06d}"
    
    # Create manufacturing order
    db_mo = models.ManufacturingOrder(
        company_id=company_id,
        order_number=order_number,
        bom_header_id=mo_in.bom_header_id,
        warehouse_id=mo_in.warehouse_id,
        quantity_to_manufacture=mo_in.quantity_to_manufacture,
        due_date=mo_in.due_date,
        status="Planned",
        notes=mo_in.notes
    )
    db.add(db_mo)
    db.flush()
    
    # Update next order number
    defaults.next_mo_number += 1
    
    # Get BOM and calculate component requirements
    bom = get_bom_header(db, mo_in.bom_header_id, company_id)
    if bom:
        for component in bom.components:
            quantity_needed = (component.quantity_required * mo_in.quantity_to_manufacture * 
                             (1 + component.scrap_percentage / 100))
            
            # Get current average cost for component
            item = db.query(models.InventoryItem).filter(
                models.InventoryItem.id == component.component_item_id
            ).first()
            
            db_component = models.ManufacturingOrderComponent(
                manufacturing_order_id=db_mo.id,
                component_item_id=component.component_item_id,
                quantity_required=quantity_needed,
                unit_cost=item.average_cost if item else Decimal("0.00")
            )
            db.add(db_component)
    
    db.commit()
    db.refresh(db_mo)
    return db_mo

def get_manufacturing_orders_by_company(db: Session, company_id: int, skip: int = 0, limit: int = 100) -> List[models.ManufacturingOrder]:
    return db.query(models.ManufacturingOrder).filter(
        models.ManufacturingOrder.company_id == company_id
    ).offset(skip).limit(limit).all()

def get_manufacturing_order(db: Session, mo_id: int, company_id: int) -> Optional[models.ManufacturingOrder]:
    return db.query(models.ManufacturingOrder).filter(
        models.ManufacturingOrder.id == mo_id,
        models.ManufacturingOrder.company_id == company_id
    ).first()

def update_manufacturing_order(db: Session, mo_obj: models.ManufacturingOrder, mo_in: schemas.ManufacturingOrderUpdate) -> models.ManufacturingOrder:
    update_data = mo_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(mo_obj, field, value)
    
    db.add(mo_obj)
    db.commit()
    db.refresh(mo_obj)
    return mo_obj

def release_manufacturing_order(db: Session, mo_id: int, company_id: int) -> models.ManufacturingOrder:
    """Release a manufacturing order for production"""
    mo = get_manufacturing_order(db, mo_id, company_id)
    if not mo or mo.status != "Planned":
        raise ValueError("Manufacturing order not found or not in Planned status")
    
    mo.status = "Released"
    mo.start_date = datetime.utcnow()
    
    db.commit()
    db.refresh(mo)
    return mo

def process_manufacturing_order(db: Session, mo_id: int, company_id: int, user_id: int) -> models.ManufacturingOrder:
    """
    Process a manufacturing order:
    1. Issue components from inventory
    2. Create finished goods in inventory
    3. Post GL entries for WIP and inventory movements
    """
    mo = db.query(models.ManufacturingOrder).filter(
        models.ManufacturingOrder.id == mo_id,
        models.ManufacturingOrder.company_id == company_id
    ).first()
    
    if not mo or mo.status != "Released":
        raise ValueError("Manufacturing order not found or not in Released status")
    
    # Get BOM defaults
    defaults = get_bom_defaults(db, company_id)
    if not defaults or not defaults.default_wip_gl_account_id:
        raise ValueError("BOM defaults not configured")
    
    total_cost = Decimal("0.00")
    
    # Issue components
    for component in mo.component_allocations:
        if component.quantity_issued < component.quantity_required:
            # Create inventory transaction for component consumption
            inv_transaction = crud_inventory.process_inventory_adjustment(
                db=db,
                adjustment_in=schemas.InventoryAdjustmentCreate(
                    item_id=component.component_item_id,
                    warehouse_id=mo.warehouse_id,
                    quantity=-component.quantity_required,  # Negative for consumption
                    unit_cost=component.unit_cost,
                    inventory_transaction_type_id=get_consumption_transaction_type_id(db, company_id),
                    reference_document_type="ManufacturingOrder",
                    reference_document_id=mo.id
                ),
                company_id=company_id,
                user_id=user_id
            )
            
            component.quantity_issued = component.quantity_required
            total_cost += component.quantity_required * component.unit_cost
    
    # Create finished goods
    bom = mo.bom_header
    unit_cost = total_cost / mo.quantity_to_manufacture if mo.quantity_to_manufacture > 0 else Decimal("0.00")
    
    # Create inventory transaction for finished goods production
    inv_transaction = crud_inventory.process_inventory_adjustment(
        db=db,
        adjustment_in=schemas.InventoryAdjustmentCreate(
            item_id=bom.parent_item_id,
            warehouse_id=mo.warehouse_id,
            quantity=mo.quantity_to_manufacture,
            unit_cost=unit_cost,
            inventory_transaction_type_id=get_production_transaction_type_id(db, company_id),
            reference_document_type="ManufacturingOrder",
            reference_document_id=mo.id
        ),
        company_id=company_id,
        user_id=user_id
    )
    
    # Update manufacturing order
    mo.status = "Completed"
    mo.quantity_completed = mo.quantity_to_manufacture
    mo.completion_date = datetime.utcnow()
    
    db.commit()
    db.refresh(mo)
    return mo

def cancel_manufacturing_order(db: Session, mo_id: int, company_id: int) -> models.ManufacturingOrder:
    """Cancel a manufacturing order"""
    mo = get_manufacturing_order(db, mo_id, company_id)
    if not mo or mo.status in ["Completed", "Cancelled"]:
        raise ValueError("Manufacturing order not found or cannot be cancelled")
    
    mo.status = "Cancelled"
    
    db.commit()
    db.refresh(mo)
    return mo

def calculate_mrp(db: Session, mrp_request: schemas.MRPRequest, company_id: int) -> List[schemas.MRPResult]:
    """
    Calculate Material Requirements Planning for a BOM
    """
    results = []
    processed_items = set()  # To avoid duplicate items at same level
    
    def explode_bom(bom_header_id: int, quantity_to_produce: Decimal, level: int = 0):
        bom = get_bom_header(db, bom_header_id, company_id)
        if not bom:
            return
        
        for component in bom.components:
            # Calculate total requirement including scrap
            total_required = (component.quantity_required * quantity_to_produce * 
                            (1 + component.scrap_percentage / 100))
            
            # Create unique key for item at this level
            item_key = (component.component_item_id, level)
            
            if item_key in processed_items:
                # Find existing result and add to quantity
                for result in results:
                    if result.item_id == component.component_item_id and result.level == level:
                        result.quantity_required += total_required
                        result.quantity_short = max(Decimal("0.00"), result.quantity_required - result.quantity_available)
                        break
                continue
            
            processed_items.add(item_key)
            
            # Get current inventory
            item_location = db.query(models.InventoryItemLocation).filter(
                models.InventoryItemLocation.item_id == component.component_item_id,
                models.InventoryItemLocation.warehouse_id == mrp_request.warehouse_id
            ).first()
            
            available_qty = item_location.quantity_on_hand if item_location else Decimal("0.00")
            
            # Get item details
            item = db.query(models.InventoryItem).filter(
                models.InventoryItem.id == component.component_item_id
            ).first()
            
            if item:
                result = schemas.MRPResult(
                    item_id=item.id,
                    item_code=item.item_code,
                    description=item.description,
                    quantity_required=total_required,
                    quantity_available=available_qty,
                    quantity_short=max(Decimal("0.00"), total_required - available_qty),
                    unit_of_measure=item.unit_of_measure.name if item.unit_of_measure else "",
                    level=level
                )
                results.append(result)
            
            # If component is a phantom or has its own BOM, explode it
            if component.is_phantom or mrp_request.include_phantom_items:
                sub_bom = db.query(models.BOMHeader).filter(
                    models.BOMHeader.parent_item_id == component.component_item_id,
                    models.BOMHeader.company_id == company_id,
                    models.BOMHeader.is_active == True
                ).first()
                
                if sub_bom:
                    explode_bom(sub_bom.id, total_required, level + 1)
    
    explode_bom(mrp_request.bom_header_id, mrp_request.quantity_to_produce)
    
    # Sort results by level and item code
    results.sort(key=lambda x: (x.level, x.item_code))
    return results

def get_bom_cost_analysis(db: Session, bom_id: int, company_id: int, quantity: Decimal = Decimal("1.00")) -> dict:
    """Calculate cost breakdown for a BOM"""
    bom = get_bom_header(db, bom_id, company_id)
    if not bom:
        return {}
    
    component_costs = []
    total_material_cost = Decimal("0.00")
    
    for component in bom.components:
        item = db.query(models.InventoryItem).filter(
            models.InventoryItem.id == component.component_item_id
        ).first()
        
        if item:
            component_qty = component.quantity_required * quantity * (1 + component.scrap_percentage / 100)
            component_cost = component_qty * item.average_cost
            total_material_cost += component_cost
            
            component_costs.append({
                "item_code": item.item_code,
                "description": item.description,
                "quantity_required": component.quantity_required,
                "scrap_percentage": component.scrap_percentage,
                "effective_quantity": component_qty,
                "unit_cost": item.average_cost,
                "total_cost": component_cost
            })
    
    return {
        "bom_code": bom.bom_code,
        "parent_item": bom.parent_item.item_code if bom.parent_item else "",
        "quantity_analyzed": quantity,
        "total_material_cost": total_material_cost,
        "unit_material_cost": total_material_cost / quantity if quantity > 0 else Decimal("0.00"),
        "component_costs": component_costs
    }

def get_or_create_bom_defaults(db: Session, company_id: int) -> models.BOMDefaults:
    defaults = db.query(models.BOMDefaults).filter(
        models.BOMDefaults.company_id == company_id
    ).first()
    
    if not defaults:
        defaults = models.BOMDefaults(company_id=company_id)
        db.add(defaults)
        db.commit()
        db.refresh(defaults)
    
    return defaults

def get_bom_defaults(db: Session, company_id: int) -> Optional[models.BOMDefaults]:
    return db.query(models.BOMDefaults).filter(
        models.BOMDefaults.company_id == company_id
    ).first()

def update_bom_defaults(db: Session, defaults_obj: models.BOMDefaults, defaults_in: schemas.BOMDefaultsUpdate) -> models.BOMDefaults:
    update_data = defaults_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(defaults_obj, field, value)
    
    db.add(defaults_obj)
    db.commit()
    db.refresh(defaults_obj)
    return defaults_obj

# Helper functions to get transaction type IDs
def get_consumption_transaction_type_id(db: Session, company_id: int) -> int:
    # This should return the ID for "ManufacturingConsumption" type
    trans_type = db.query(models.InventoryTransactionType).filter(
        models.InventoryTransactionType.company_id == company_id,
        models.InventoryTransactionType.base_type == "ManufacturingConsumption"
    ).first()
    return trans_type.id if trans_type else None

def get_production_transaction_type_id(db: Session, company_id: int) -> int:
    # This should return the ID for "ManufacturingProduction" type
    trans_type = db.query(models.InventoryTransactionType).filter(
        models.InventoryTransactionType.company_id == company_id,
        models.InventoryTransactionType.base_type == "ManufacturingProduction"
    ).first()
    return trans_type.id if trans_type else None

def get_bom_where_used(db: Session, item_id: int, company_id: int) -> List[models.BOMHeader]:
    """Find all BOMs where this item is used as a component"""
    return db.query(models.BOMHeader).join(models.BOMComponent).filter(
        models.BOMComponent.component_item_id == item_id,
        models.BOMHeader.company_id == company_id,
        models.BOMHeader.is_active == True
    ).all()

def copy_bom(db: Session, source_bom_id: int, new_bom_code: str, new_revision: str, company_id: int) -> models.BOMHeader:
    """Create a copy of an existing BOM with new code and revision"""
    source_bom = get_bom_header(db, source_bom_id, company_id)
    if not source_bom:
        raise ValueError("Source BOM not found")
    
    # Create new BOM header
    new_bom = models.BOMHeader(
        company_id=company_id,
        parent_item_id=source_bom.parent_item_id,
        bom_code=new_bom_code,
        description=source_bom.description,
        revision=new_revision,
        effective_date=datetime.utcnow(),
        quantity_per_batch=source_bom.quantity_per_batch,
        unit_of_measure_id=source_bom.unit_of_measure_id,
        is_active=True,
        notes=source_bom.notes
    )
    db.add(new_bom)
    db.flush()
    
    # Copy components
    for component in source_bom.components:
        new_component = models.BOMComponent(
            bom_header_id=new_bom.id,
            component_item_id=component.component_item_id,
            quantity_required=component.quantity_required,
            unit_of_measure_id=component.unit_of_measure_id,
            scrap_percentage=component.scrap_percentage,
            sequence_number=component.sequence_number,
            is_phantom=component.is_phantom,
            notes=component.notes
        )
        db.add(new_component)
    
    db.commit()
    db.refresh(new_bom)
    return new_bom
