from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_, or_
from typing import List, Optional, Dict
from datetime import datetime, date, timedelta
from decimal import Decimal
from app import models, schemas
from app.crud import inventory as crud_inventory
from app.crud import gl as crud_gl

# BOM Header CRUD Operations
def create_bom_header(db: Session, bom_in: schemas.BOMHeaderCreate, company_id: int, user_id: int) -> models.BOMHeader:
    """Create a new BOM header with components"""
    # Create BOM header
    db_bom = models.BOMHeader(
        company_id=company_id,
        item_id=bom_in.item_id,
        version=bom_in.version,
        description=bom_in.description,
        effective_date=bom_in.effective_date,
        expiry_date=bom_in.expiry_date,
        status=bom_in.status,
        unit_quantity=bom_in.unit_quantity,
        labor_hours=bom_in.labor_hours,
        overhead_percentage=bom_in.overhead_percentage
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
            is_phantom=component.is_phantom,
            notes=component.notes
        )
        db.add(db_component)
    
    db.commit()
    db.refresh(db_bom)
    return db_bom

def get_bom_headers_by_company(db: Session, company_id: int, skip: int = 0, limit: int = 100) -> List[models.BOMHeader]:
    """Get all BOM headers for a company with related data"""
    return db.query(models.BOMHeader).options(
        joinedload(models.BOMHeader.item),
        joinedload(models.BOMHeader.components).joinedload(models.BOMComponent.component_item),
        joinedload(models.BOMHeader.components).joinedload(models.BOMComponent.unit_of_measure)
    ).filter(
        models.BOMHeader.company_id == company_id
    ).offset(skip).limit(limit).all()

def get_bom_header(db: Session, bom_id: int, company_id: int) -> Optional[models.BOMHeader]:
    """Get a specific BOM header with all related data"""
    return db.query(models.BOMHeader).options(
        joinedload(models.BOMHeader.item),
        joinedload(models.BOMHeader.components).joinedload(models.BOMComponent.component_item),
        joinedload(models.BOMHeader.components).joinedload(models.BOMComponent.unit_of_measure)
    ).filter(
        models.BOMHeader.id == bom_id,
        models.BOMHeader.company_id == company_id
    ).first()

def get_bom_header_by_item(db: Session, item_id: int, company_id: int, version: Optional[str] = None) -> Optional[models.BOMHeader]:
    """Get active BOM for a specific item"""
    query = db.query(models.BOMHeader).filter(
        models.BOMHeader.item_id == item_id,
        models.BOMHeader.company_id == company_id,
        models.BOMHeader.status == "Active"
    )
    
    if version:
        query = query.filter(models.BOMHeader.version == version)
    else:
        # Get the latest version if no version specified
        query = query.order_by(models.BOMHeader.version.desc())
    
    return query.first()

def update_bom_header(db: Session, bom_obj: models.BOMHeader, bom_in: schemas.BOMHeaderUpdate) -> models.BOMHeader:
    """Update an existing BOM header"""
    update_data = bom_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(bom_obj, field, value)
    
    db.add(bom_obj)
    db.commit()
    db.refresh(bom_obj)
    return bom_obj

def delete_bom_header(db: Session, bom_id: int, company_id: int) -> bool:
    """Delete a BOM header and all its components"""
    bom = get_bom_header(db, bom_id, company_id)
    if bom:
        # Check if BOM is being used in any manufacturing orders
        mo_count = db.query(models.ManufacturingOrder).filter(
            models.ManufacturingOrder.bom_header_id == bom_id,
            models.ManufacturingOrder.status.in_(["Planned", "Released", "In Progress"])
        ).count()
        
        if mo_count > 0:
            raise ValueError("Cannot delete BOM: it is being used in active manufacturing orders")
        
        db.delete(bom)
        db.commit()
        return True
    return False

# Manufacturing Order CRUD Operations
def create_manufacturing_order(db: Session, mo_in: schemas.ManufacturingOrderCreate, company_id: int, user_id: int) -> models.ManufacturingOrder:
    """Create a new manufacturing order"""
    # Generate order number
    order_count = db.query(models.ManufacturingOrder).filter(
        models.ManufacturingOrder.company_id == company_id
    ).count()
    order_number = f"MO{order_count + 1:06d}"
    
    # Create manufacturing order
    db_mo = models.ManufacturingOrder(
        company_id=company_id,
        order_number=order_number,
        bom_header_id=mo_in.bom_header_id,
        item_id=mo_in.item_id,
        warehouse_id=mo_in.warehouse_id,
        quantity_to_produce=mo_in.quantity_to_produce,
        scheduled_start_date=mo_in.scheduled_start_date,
        scheduled_end_date=mo_in.scheduled_end_date,
        priority=mo_in.priority,
        notes=mo_in.notes,
        linked_sales_order_id=mo_in.linked_sales_order_id,
        created_by_user_id=user_id,
        status="Planned"
    )
    db.add(db_mo)
    db.flush()
    
    # Create material requisitions based on BOM
    bom = get_bom_header(db, mo_in.bom_header_id, company_id)
    if bom:
        for component in bom.components:
            required_qty = component.quantity_required * mo_in.quantity_to_produce
            # Apply scrap percentage
            required_qty = required_qty * (1 + component.scrap_percentage / 100)
            
            db_requisition = models.MaterialRequisition(
                manufacturing_order_id=db_mo.id,
                component_item_id=component.component_item_id,
                required_quantity=required_qty,
                warehouse_id=mo_in.warehouse_id,
                status="Pending"
            )
            db.add(db_requisition)
    
    db.commit()
    db.refresh(db_mo)
    return db_mo

def get_manufacturing_orders_by_company(db: Session, company_id: int, skip: int = 0, limit: int = 100, status: Optional[str] = None) -> List[models.ManufacturingOrder]:
    """Get manufacturing orders for a company"""
    query = db.query(models.ManufacturingOrder).options(
        joinedload(models.ManufacturingOrder.bom_header),
        joinedload(models.ManufacturingOrder.item),
        joinedload(models.ManufacturingOrder.warehouse)
    ).filter(
        models.ManufacturingOrder.company_id == company_id
    )
    
    if status:
        query = query.filter(models.ManufacturingOrder.status == status)
    
    return query.offset(skip).limit(limit).all()

def get_manufacturing_order(db: Session, mo_id: int, company_id: int) -> Optional[models.ManufacturingOrder]:
    """Get a specific manufacturing order with all related data"""
    return db.query(models.ManufacturingOrder).options(
        joinedload(models.ManufacturingOrder.bom_header),
        joinedload(models.ManufacturingOrder.item),
        joinedload(models.ManufacturingOrder.warehouse),
        joinedload(models.ManufacturingOrder.material_requisitions),
        joinedload(models.ManufacturingOrder.production_entries)
    ).filter(
        models.ManufacturingOrder.id == mo_id,
        models.ManufacturingOrder.company_id == company_id
    ).first()

def update_manufacturing_order(db: Session, mo_obj: models.ManufacturingOrder, mo_in: schemas.ManufacturingOrderUpdate) -> models.ManufacturingOrder:
    """Update an existing manufacturing order"""
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
    mo.actual_start_date = datetime.utcnow()
    
    db.commit()
    db.refresh(mo)
    return mo

def complete_manufacturing_order(db: Session, mo_id: int, company_id: int, user_id: int) -> models.ManufacturingOrder:
    """Complete a manufacturing order"""
    mo = get_manufacturing_order(db, mo_id, company_id)
    if not mo or mo.status not in ["Released", "In Progress"]:
        raise ValueError("Manufacturing order not found or not ready for completion")
    
    mo.status = "Completed"
    mo.actual_end_date = datetime.utcnow()
    mo.quantity_produced = mo.quantity_to_produce  # Assuming full production
    
    db.commit()
    db.refresh(mo)
    return mo

# Note: Production Entry functions are commented out as the ProductionEntry model is not implemented yet
# def create_production_entry(db: Session, entry_in: schemas.ProductionEntryCreate, company_id: int, user_id: int) -> models.ProductionEntry:
#     """Create a production entry"""
#     # Verify manufacturing order exists and is active
#     mo = get_manufacturing_order(db, entry_in.manufacturing_order_id, company_id)
#     if not mo or mo.status not in ["Released", "In Progress"]:
#         raise ValueError("Manufacturing order not found or not active")
#     
#     # Create production entry
#     db_entry = models.ProductionEntry(
#         manufacturing_order_id=entry_in.manufacturing_order_id,
#         entry_date=entry_in.entry_date,
#         quantity_produced=entry_in.quantity_produced,
#         quantity_scrapped=entry_in.quantity_scrapped,
#         labor_hours_actual=entry_in.labor_hours_actual,
#         notes=entry_in.notes,
#         created_by_user_id=user_id
#     )
#     db.add(db_entry)
#     
#     # Update manufacturing order quantities
#     mo.quantity_produced += entry_in.quantity_produced
#     if mo.status == "Released" and mo.quantity_produced > 0:
#         mo.status = "In Progress"
#     
#     # Check if order is complete
#     if mo.quantity_produced >= mo.quantity_to_produce:
#         mo.status = "Completed"
#         mo.actual_end_date = datetime.utcnow()
#     
#     db.commit()
#     db.refresh(db_entry)
#     return db_entry

# Material Requirements Planning (MRP)
def calculate_mrp(db: Session, mrp_request: schemas.MRPRequest, company_id: int) -> List[schemas.MRPResult]:
    """Calculate Material Requirements Planning"""
    results = []
    
    # Determine items to analyze
    item_ids = mrp_request.item_ids
    if not item_ids:
        # Get all items with active BOMs
        bom_items = db.query(models.BOMHeader.item_id).filter(
            models.BOMHeader.company_id == company_id,
            models.BOMHeader.status == "Active"
        ).distinct().all()
        item_ids = [item[0] for item in bom_items]
    
    planning_date = date.today() + timedelta(days=mrp_request.planning_horizon_days)
    
    for item_id in item_ids:
        # Get current stock
        stock_query = db.query(func.sum(models.InventoryItemLocation.quantity_on_hand)).filter(
            models.InventoryItemLocation.item_id == item_id,
            models.InventoryItemLocation.warehouse_id == mrp_request.warehouse_id
        )
        current_stock = stock_query.scalar() or Decimal("0.0")
        
        # Calculate required quantity from various sources
        required_qty = Decimal("0.0")
        source_docs = []
        
        # From open manufacturing orders
        if mrp_request.include_sales_orders:
            mo_demand = db.query(func.sum(models.MaterialRequisition.required_quantity)).join(
                models.ManufacturingOrder
            ).filter(
                models.MaterialRequisition.component_item_id == item_id,
                models.ManufacturingOrder.company_id == company_id,
                models.ManufacturingOrder.warehouse_id == mrp_request.warehouse_id,
                models.ManufacturingOrder.status.in_(["Planned", "Released", "In Progress"]),
                models.MaterialRequisition.status.in_(["Pending", "Partial"])
            ).scalar()
            
            if mo_demand:
                required_qty += mo_demand
                source_docs.append(f"Manufacturing Orders: {mo_demand}")
        
        # From minimum stock levels
        if mrp_request.include_min_stock_levels:
            item = db.query(models.InventoryItem).filter(
                models.InventoryItem.id == item_id
            ).first()
            
            if item and hasattr(item, 'minimum_stock_level') and item.minimum_stock_level:
                min_stock_shortage = max(Decimal("0.0"), item.minimum_stock_level - current_stock)
                if min_stock_shortage > 0:
                    required_qty += min_stock_shortage
                    source_docs.append(f"Min Stock Level: {min_stock_shortage}")
        
        # Determine if item can be manufactured or purchased
        bom = get_bom_header_by_item(db, item_id, company_id)
        suggested_production = Decimal("0.0")
        suggested_purchase = Decimal("0.0")
        
        shortage = max(Decimal("0.0"), required_qty - current_stock)
        if shortage > 0:
            if bom:
                suggested_production = shortage
            else:
                suggested_purchase = shortage
        
        # Get item details
        item = db.query(models.InventoryItem).filter(
            models.InventoryItem.id == item_id
        ).first()
        
        if item:
            result = schemas.MRPResult(
                item_id=item.id,
                item_code=item.item_code,
                item_description=item.description,
                current_stock=current_stock,
                required_quantity=required_qty,
                suggested_production_quantity=suggested_production,
                suggested_purchase_quantity=suggested_purchase,
                suggested_date=planning_date,
                source_documents=source_docs
            )
            results.append(result)
    
    return results

# BOM Costing Functions
def calculate_bom_cost(db: Session, bom_id: int, company_id: int, quantity: Decimal = Decimal("1.0")) -> Dict:
    """Calculate comprehensive cost analysis for a BOM"""
    bom = get_bom_header(db, bom_id, company_id)
    if not bom:
        raise ValueError("BOM not found")
    
    # Get BOM defaults for labor and overhead rates
    defaults = get_bom_defaults(db, company_id)
    labor_rate = defaults.default_labor_rate_per_hour if defaults else Decimal("25.0")
    overhead_rate = defaults.default_overhead_percentage if defaults else Decimal("15.0")
    
    # Calculate material costs
    material_cost = Decimal("0.0")
    component_details = []
    
    for component in bom.components:
        item = db.query(models.InventoryItem).filter(
            models.InventoryItem.id == component.component_item_id
        ).first()
        
        if item:
            effective_qty = component.quantity_required * quantity * (1 + component.scrap_percentage / 100)
            component_cost = effective_qty * (item.average_cost or Decimal("0.0"))
            material_cost += component_cost
            
            component_details.append({
                "component_item_id": component.component_item_id,
                "item_code": item.item_code,
                "description": item.description,
                "quantity_required": component.quantity_required,
                "effective_quantity": effective_qty,
                "unit_cost": item.average_cost or Decimal("0.0"),
                "extended_cost": component_cost
            })
    
    # Calculate labor cost
    labor_hours = bom.labor_hours * quantity
    labor_cost = labor_hours * labor_rate
    
    # Calculate overhead cost
    overhead_percentage = bom.overhead_percentage or overhead_rate
    overhead_cost = material_cost * (overhead_percentage / 100)
    
    total_cost = material_cost + labor_cost + overhead_cost
    
    return {
        "bom_id": bom.id,
        "item_code": bom.item.item_code if bom.item else "",
        "item_description": bom.item.description if bom.item else "",
        "quantity_analyzed": quantity,
        "material_cost": material_cost,
        "labor_cost": labor_cost,
        "overhead_cost": overhead_cost,
        "total_cost": total_cost,
        "unit_cost": total_cost / quantity if quantity > 0 else Decimal("0.0"),
        "component_details": component_details
    }

# BOM Defaults CRUD Operations
def get_or_create_bom_defaults(db: Session, company_id: int) -> models.BOMDefaults:
    """Get or create BOM defaults for a company"""
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
    """Get BOM defaults for a company"""
    return db.query(models.BOMDefaults).filter(
        models.BOMDefaults.company_id == company_id
    ).first()

def update_bom_defaults(db: Session, defaults_obj: models.BOMDefaults, defaults_in: schemas.BOMDefaultsUpdate) -> models.BOMDefaults:
    """Update BOM defaults"""
    update_data = defaults_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(defaults_obj, field, value)
    
    db.add(defaults_obj)
    db.commit()
    db.refresh(defaults_obj)
    return defaults_obj

# Utility Functions
def get_bom_where_used(db: Session, item_id: int, company_id: int) -> List[models.BOMHeader]:
    """Find all BOMs where this item is used as a component"""
    return db.query(models.BOMHeader).join(models.BOMComponent).filter(
        models.BOMComponent.component_item_id == item_id,
        models.BOMHeader.company_id == company_id,
        models.BOMHeader.status == "Active"
    ).all()

def explode_bom(db: Session, bom_id: int, company_id: int, quantity: Decimal = Decimal("1.0"), level: int = 0) -> List[Dict]:
    """Recursively explode a BOM to show all levels of components"""
    bom = get_bom_header(db, bom_id, company_id)
    if not bom:
        return []
    
    explosion = []
    
    for component in bom.components:
        item = component.component_item
        if not item:
            continue
        
        effective_qty = component.quantity_required * quantity * (1 + component.scrap_percentage / 100)
        
        explosion.append({
            "level": level,
            "item_id": item.id,
            "item_code": item.item_code,
            "description": item.description,
            "quantity_required": effective_qty,
            "unit_of_measure": component.unit_of_measure.name if component.unit_of_measure else "",
            "is_phantom": component.is_phantom
        })
        
        # If component has its own BOM, explode it
        if not component.is_phantom:
            sub_bom = get_bom_header_by_item(db, component.component_item_id, company_id)
            if sub_bom:
                sub_explosion = explode_bom(db, sub_bom.id, company_id, effective_qty, level + 1)
                explosion.extend(sub_explosion)
    
    return explosion

def copy_bom(db: Session, source_bom_id: int, new_version: str, company_id: int, user_id: int) -> models.BOMHeader:
    """Create a copy of an existing BOM with a new version"""
    source_bom = get_bom_header(db, source_bom_id, company_id)
    if not source_bom:
        raise ValueError("Source BOM not found")
    
    # Create new BOM header
    new_bom = models.BOMHeader(
        company_id=company_id,
        item_id=source_bom.item_id,
        version=new_version,
        description=source_bom.description,
        effective_date=date.today(),
        status="Draft",
        unit_quantity=source_bom.unit_quantity,
        labor_hours=source_bom.labor_hours,
        overhead_percentage=source_bom.overhead_percentage
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
            is_phantom=component.is_phantom,
            notes=component.notes
        )
        db.add(new_component)
    
    db.commit()
    db.refresh(new_bom)
    return new_bom

def issue_materials(
    db: Session,
    manufacturing_order_id: int,
    company_id: int,
    user_id: int
) -> List[models.InventoryTransaction]:
    """Issue materials from inventory for production"""
    from fastapi import HTTPException, status
    
    # Get manufacturing order and requisitions
    order = db.query(models.ManufacturingOrder).filter(
        models.ManufacturingOrder.id == manufacturing_order_id,
        models.ManufacturingOrder.company_id == company_id
    ).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Manufacturing order not found")
    
    if order.status not in ["Released", "In Progress"]:
        raise HTTPException(status_code=400, detail="Order must be released to issue materials")
    
    requisitions = db.query(models.MaterialRequisition).filter(
        models.MaterialRequisition.manufacturing_order_id == manufacturing_order_id,
        models.MaterialRequisition.status.in_(["Pending", "Partial"])
    ).all()
    
    inventory_transactions = []
    
    # Get BOM defaults for GL accounts
    defaults = db.query(models.BOMDefaults).filter(
        models.BOMDefaults.company_id == company_id
    ).first()
    
    for req in requisitions:
        # Calculate quantity to issue
        qty_to_issue = req.required_quantity - req.issued_quantity
        
        if qty_to_issue > 0:
            # Create inventory transaction (consumption)
            item = db.query(models.InventoryItem).filter(
                models.InventoryItem.id == req.component_item_id
            ).first()
            
            # Check available inventory
            item_location = db.query(models.InventoryItemLocation).filter(
                models.InventoryItemLocation.item_id == req.component_item_id,
                models.InventoryItemLocation.warehouse_id == req.warehouse_id
            ).first()
            
            if not item_location or item_location.quantity_on_hand < qty_to_issue:
                if not (defaults and defaults.allow_negative_inventory):
                    raise HTTPException(
                        status_code=400, 
                        detail=f"Insufficient inventory for item {item.item_code}"
                    )
            
            # Process inventory adjustment for consumption
            inv_transaction = crud_inventory.process_inventory_adjustment(
                db=db,
                adjustment_in=schemas.InventoryAdjustmentCreate(
                    item_id=req.component_item_id,
                    warehouse_id=req.warehouse_id,
                    quantity=-qty_to_issue,  # Negative for consumption
                    unit_cost=item.average_cost,
                    inventory_transaction_type_id=get_consumption_transaction_type_id(db, company_id),
                    reference_document_type="ManufacturingOrder",
                    reference_document_id=manufacturing_order_id
                ),
                company_id=company_id,
                user_id=user_id
            )
            
            inventory_transactions.append(inv_transaction)
            
            # Update requisition
            req.issued_quantity = req.required_quantity
            req.status = "Issued"
            req.issue_date = datetime.utcnow()
    
    # Update order status if all materials issued
    if order.status == "Released":
        order.status = "In Progress"
        order.actual_start_date = datetime.utcnow()
    
    db.commit()
    return inventory_transactions

def complete_production(
    db: Session,
    production_entry_in: schemas.ProductionEntryCreate,
    company_id: int,
    user_id: int
) -> models.ProductionEntry:
    """Record production completion and update inventory"""
    from fastapi import HTTPException, status
    
    # Get manufacturing order
    order = db.query(models.ManufacturingOrder).filter(
        models.ManufacturingOrder.id == production_entry_in.manufacturing_order_id,
        models.ManufacturingOrder.company_id == company_id
    ).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Manufacturing order not found")
    
    if order.status not in ["In Progress", "Completed"]:
        raise HTTPException(status_code=400, detail="Order must be in progress to record production")
    
    # Create production entry
    db_entry = models.ProductionEntry(
        created_by_user_id=user_id,
        **production_entry_in.model_dump()
    )
    db.add(db_entry)
    db.flush()
    
    # Update finished goods inventory
    if production_entry_in.quantity_produced > 0:
        # Calculate cost of production
        bom_cost = calculate_bom_cost(db, order.bom_header_id, company_id)
        unit_cost = bom_cost["unit_cost"]
        
        # Create inventory transaction for finished goods
        inv_transaction = crud_inventory.process_inventory_adjustment(
            db=db,
            adjustment_in=schemas.InventoryAdjustmentCreate(
                item_id=order.item_id,
                warehouse_id=order.warehouse_id,
                quantity=production_entry_in.quantity_produced,
                unit_cost=unit_cost,
                inventory_transaction_type_id=get_production_transaction_type_id(db, company_id),
                reference_document_type="ProductionEntry",
                reference_document_id=db_entry.id
            ),
            company_id=company_id,
            user_id=user_id
        )
    
    # Handle scrap if any
    if production_entry_in.quantity_scrapped > 0:
        # Create scrap transaction
        pass  # Implement scrap handling
    
    # Update manufacturing order
    order.quantity_produced += production_entry_in.quantity_produced
    
    if order.quantity_produced >= order.quantity_to_produce:
        order.status = "Completed"
        order.actual_end_date = datetime.utcnow()
    
    # GL Posting for production
    defaults = db.query(models.BOMDefaults).filter(
        models.BOMDefaults.company_id == company_id
    ).first()
    
    if defaults and defaults.wip_gl_account_id:
        # Create GL journal entry for production completion
        # Debit: Finished Goods Inventory
        # Credit: Work in Progress
        total_cost = unit_cost * production_entry_in.quantity_produced
        
        gl_entry = crud_gl.create_journal_entry(
            db=db,
            entry_in=schemas.GLJournalEntryCreate(
                entry_date=production_entry_in.entry_date.date(),
                reference=f"PROD-{order.order_number}",
                description=f"Production completion for {order.order_number}",
                lines=[
                    schemas.GLJournalEntryLineCreate(
                        gl_account_id=get_inventory_gl_account_id(db, order.item_id),
                        description="Finished goods",
                        debit_amount=total_cost,
                        credit_amount=Decimal("0.0")
                    ),
                    schemas.GLJournalEntryLineCreate(
                        gl_account_id=defaults.wip_gl_account_id,
                        description="Work in progress",
                        debit_amount=Decimal("0.0"),
                        credit_amount=total_cost
                    )
                ]
            ),
            company_id=company_id,
            user_id=user_id
        )
        
        db_entry.linked_gl_journal_entry_id = gl_entry.id
    
    db.commit()
    db.refresh(db_entry)
    return db_entry

def run_mrp(
    db: Session,
    mrp_request: schemas.MRPRequest,
    company_id: int
) -> List[schemas.MRPResult]:
    """Run Material Requirements Planning"""
    
    results = []
    planning_end_date = date.today() + timedelta(days=mrp_request.planning_horizon_days)
    
    # Get items to analyze
    if mrp_request.item_ids:
        items = db.query(models.InventoryItem).filter(
            models.InventoryItem.id.in_(mrp_request.item_ids),
            models.InventoryItem.company_id == company_id
        ).all()
    else:
        # Get all manufactured items
        items = db.query(models.InventoryItem).filter(
            models.InventoryItem.company_id == company_id,
            models.InventoryItem.item_type == "Stock"
        ).all()
    
    for item in items:
        # Get current stock
        item_location = db.query(models.InventoryItemLocation).filter(
            models.InventoryItemLocation.item_id == item.id,
            models.InventoryItemLocation.warehouse_id == mrp_request.warehouse_id
        ).first()
        
        current_stock = item_location.quantity_on_hand if item_location else Decimal("0.0")
        
        # Calculate demand
        total_demand = Decimal("0.0")
        source_documents = []
        
        # Demand from sales orders
        if mrp_request.include_sales_orders:
            open_so_lines = db.query(models.SalesOrderLine).join(
                models.SalesOrder
            ).filter(
                models.SalesOrderLine.item_id == item.id,
                models.SalesOrder.company_id == company_id,
                models.SalesOrder.status.in_(["Open", "PartiallyInvoiced"])
            ).all()
            
            for so_line in open_so_lines:
                remaining_qty = so_line.quantity_ordered - so_line.quantity_invoiced
                total_demand += remaining_qty
                source_documents.append(f"SO-{so_line.sales_order.document_number}")
        
        # Demand from open manufacturing orders (for components)
        open_mo_reqs = db.query(models.MaterialRequisition).join(
            models.ManufacturingOrder
        ).filter(
            models.MaterialRequisition.component_item_id == item.id,
            models.ManufacturingOrder.company_id == company_id,
            models.ManufacturingOrder.status.in_(["Planned", "Released", "In Progress"]),
            models.MaterialRequisition.status.in_(["Pending", "Partial"])
        ).all()
        
        for req in open_mo_reqs:
            remaining_qty = req.required_quantity - req.issued_quantity
            total_demand += remaining_qty
            source_documents.append(f"MO-{req.manufacturing_order.order_number}")
        
        # Check reorder level
        if mrp_request.include_min_stock_levels and item.reorder_level:
            if current_stock < item.reorder_level:
                min_stock_demand = item.reorder_level - current_stock
                total_demand = max(total_demand, min_stock_demand)
                if min_stock_demand > 0:
                    source_documents.append("Min Stock Level")
        
        # Calculate net requirement
        net_requirement = total_demand - current_stock
        
        if net_requirement > 0:
            # Check if item has BOM (manufactured) or needs to be purchased
            bom = db.query(models.BOMHeader).filter(
                models.BOMHeader.item_id == item.id,
                models.BOMHeader.company_id == company_id,
                models.BOMHeader.status == "Active"
            ).first()
            
            if bom:
                # Suggest production
                suggested_production = net_requirement
                if item.reorder_quantity and item.reorder_quantity > net_requirement:
                    suggested_production = item.reorder_quantity
                
                results.append(schemas.MRPResult(
                    item_id=item.id,
                    item_code=item.item_code,
                    item_description=item.description,
                    current_stock=current_stock,
                    required_quantity=total_demand,
                    suggested_production_quantity=suggested_production,
                    suggested_purchase_quantity=Decimal("0.0"),
                    suggested_date=date.today() + timedelta(days=7),  # Lead time calculation needed
                    source_documents=source_documents
                ))
            else:
                # Suggest purchase
                suggested_purchase = net_requirement
                if item.reorder_quantity and item.reorder_quantity > net_requirement:
                    suggested_purchase = item.reorder_quantity
                
                results.append(schemas.MRPResult(
                    item_id=item.id,
                    item_code=item.item_code,
                    item_description=item.description,
                    current_stock=current_stock,
                    required_quantity=total_demand,
                    suggested_production_quantity=Decimal("0.0"),
                    suggested_purchase_quantity=suggested_purchase,
                    suggested_date=date.today() + timedelta(days=3),  # Lead time calculation needed
                    source_documents=source_documents
                ))
    
    return results

# Helper functions
def generate_manufacturing_order_number(db: Session, company_id: int) -> str:
    """Generate unique manufacturing order number"""
    from datetime import datetime
    year = datetime.now().year
    month = datetime.now().month
    
    # Get last order number for this month
    last_order = db.query(models.ManufacturingOrder).filter(
        models.ManufacturingOrder.company_id == company_id,
        models.ManufacturingOrder.order_number.like(f"MO-{year}{month:02d}%")
    ).order_by(models.ManufacturingOrder.order_number.desc()).first()
    
    if last_order:
        last_seq = int(last_order.order_number.split("-")[-1])
        new_seq = last_seq + 1
    else:
        new_seq = 1
    
    return f"MO-{year}{month:02d}-{new_seq:04d}"

def get_consumption_transaction_type_id(db: Session, company_id: int) -> int:
    """Get or create consumption transaction type"""
    trans_type = db.query(models.InventoryTransactionType).filter(
        models.InventoryTransactionType.company_id == company_id,
        models.InventoryTransactionType.base_type == "ManufacturingConsumption"
    ).first()
    
    if not trans_type:
        # Create default
        trans_type = models.InventoryTransactionType(
            company_id=company_id,
            name="Manufacturing Consumption",
            base_type="ManufacturingConsumption",
            affects_quantity_direction="Decrease"
        )
        db.add(trans_type)
        db.commit()
        db.refresh(trans_type)
    
    return trans_type.id

def get_production_transaction_type_id(db: Session, company_id: int) -> int:
    """Get or create production transaction type"""
    trans_type = db.query(models.InventoryTransactionType).filter(
        models.InventoryTransactionType.company_id == company_id,
        models.InventoryTransactionType.base_type == "ManufacturingProduction"
    ).first()
    
    if not trans_type:
        # Create default
        trans_type = models.InventoryTransactionType(
            company_id=company_id,
            name="Manufacturing Production",
            base_type="ManufacturingProduction",
            affects_quantity_direction="Increase"
        )
        db.add(trans_type)
        db.commit()
        db.refresh(trans_type)
    
    return trans_type.id

def get_inventory_gl_account_id(db: Session, item_id: int) -> int:
    """Get inventory GL account for an item"""
    from fastapi import HTTPException
    
    item = db.query(models.InventoryItem).filter(
        models.InventoryItem.id == item_id
    ).first()
    
    if item and item.default_inventory_gl_account_id:
        return item.default_inventory_gl_account_id
    
    # Fall back to company defaults
    inv_defaults = db.query(models.InventoryDefaults).filter(
        models.InventoryDefaults.company_id == item.company_id
    ).first()
    
    if inv_defaults and inv_defaults.default_inventory_gl_account_id:
        return inv_defaults.default_inventory_gl_account_id
    
    raise HTTPException(status_code=400, detail="No inventory GL account configured")