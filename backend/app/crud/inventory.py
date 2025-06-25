from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal
from fastapi import HTTPException
from app import models, schemas
from app.crud import gl as crud_gl

# Unit of Measure CRUD
def create_unit_of_measure(db: Session, uom: schemas.UnitOfMeasureCreate, company_id: int) -> models.UnitOfMeasure:
    db_uom = models.UnitOfMeasure(**uom.model_dump(), company_id=company_id)
    db.add(db_uom)
    db.commit()
    db.refresh(db_uom)
    return db_uom

def get_unit_of_measure(db: Session, uom_id: int, company_id: int) -> Optional[models.UnitOfMeasure]:
    return db.query(models.UnitOfMeasure).filter(
        models.UnitOfMeasure.id == uom_id,
        models.UnitOfMeasure.company_id == company_id
    ).first()

def get_units_of_measure(db: Session, company_id: int, skip: int = 0, limit: int = 100) -> List[models.UnitOfMeasure]:
    return db.query(models.UnitOfMeasure).filter(
        models.UnitOfMeasure.company_id == company_id
    ).offset(skip).limit(limit).all()

def update_unit_of_measure(db: Session, uom_db_obj: models.UnitOfMeasure, uom_in: schemas.UnitOfMeasureUpdate) -> models.UnitOfMeasure:
    update_data = uom_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(uom_db_obj, field, value)
    db.add(uom_db_obj)
    db.commit()
    db.refresh(uom_db_obj)
    return uom_db_obj

def delete_unit_of_measure(db: Session, uom_id: int, company_id: int) -> Optional[models.UnitOfMeasure]:
    uom = get_unit_of_measure(db, uom_id, company_id)
    if uom:
        db.delete(uom)
        db.commit()
    return uom

# Warehouse CRUD
def create_warehouse(db: Session, warehouse: schemas.WarehouseCreate, company_id: int) -> models.Warehouse:
    # If setting as default, ensure no other warehouse is default
    if warehouse.is_default:
        db.query(models.Warehouse).filter(
            models.Warehouse.company_id == company_id,
            models.Warehouse.is_default == True
        ).update({"is_default": False})
    
    db_warehouse = models.Warehouse(**warehouse.model_dump(), company_id=company_id)
    db.add(db_warehouse)
    db.commit()
    db.refresh(db_warehouse)
    return db_warehouse

def get_warehouse(db: Session, warehouse_id: int, company_id: int) -> Optional[models.Warehouse]:
    return db.query(models.Warehouse).filter(
        models.Warehouse.id == warehouse_id,
        models.Warehouse.company_id == company_id
    ).first()

def get_warehouses(db: Session, company_id: int, skip: int = 0, limit: int = 100) -> List[models.Warehouse]:
    return db.query(models.Warehouse).filter(
        models.Warehouse.company_id == company_id
    ).offset(skip).limit(limit).all()

def update_warehouse(db: Session, warehouse_db_obj: models.Warehouse, warehouse_in: schemas.WarehouseUpdate) -> models.Warehouse:
    update_data = warehouse_in.model_dump(exclude_unset=True)
    
    # If setting as default, ensure no other warehouse is default
    if update_data.get("is_default", False):
        db.query(models.Warehouse).filter(
            models.Warehouse.company_id == warehouse_db_obj.company_id,
            models.Warehouse.id != warehouse_db_obj.id,
            models.Warehouse.is_default == True
        ).update({"is_default": False})
    
    for field, value in update_data.items():
        setattr(warehouse_db_obj, field, value)
    
    db.add(warehouse_db_obj)
    db.commit()
    db.refresh(warehouse_db_obj)
    return warehouse_db_obj

def delete_warehouse(db: Session, warehouse_id: int, company_id: int) -> Optional[models.Warehouse]:
    warehouse = get_warehouse(db, warehouse_id, company_id)
    if warehouse:
        # Check if warehouse has inventory
        has_inventory = db.query(models.InventoryItemLocation).filter(
            models.InventoryItemLocation.warehouse_id == warehouse_id,
            models.InventoryItemLocation.quantity_on_hand > 0
        ).first()
        
        if has_inventory:
            raise HTTPException(status_code=400, detail="Cannot delete warehouse with inventory")
        
        db.delete(warehouse)
        db.commit()
    return warehouse

# Inventory Item CRUD
def create_inventory_item(db: Session, item: schemas.InventoryItemCreate, company_id: int) -> models.InventoryItem:
    db_item = models.InventoryItem(**item.model_dump(), company_id=company_id)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    
    # Create inventory locations for all warehouses
    warehouses = get_warehouses(db, company_id)
    for warehouse in warehouses:
        location = models.InventoryItemLocation(
            company_id=company_id,
            item_id=db_item.id,
            warehouse_id=warehouse.id,
            quantity_on_hand=Decimal("0.00"),
            quantity_committed=Decimal("0.00"),
            quantity_on_order=Decimal("0.00")
        )
        db.add(location)
    
    db.commit()
    return db_item

def get_inventory_item(db: Session, item_id: int, company_id: int) -> Optional[models.InventoryItem]:
    return db.query(models.InventoryItem).filter(
        models.InventoryItem.id == item_id,
        models.InventoryItem.company_id == company_id
    ).first()

def get_inventory_items(db: Session, company_id: int, skip: int = 0, limit: int = 100) -> List[models.InventoryItem]:
    return db.query(models.InventoryItem).filter(
        models.InventoryItem.company_id == company_id
    ).offset(skip).limit(limit).all()

def update_inventory_item(db: Session, item_db_obj: models.InventoryItem, item_in: schemas.InventoryItemUpdate) -> models.InventoryItem:
    update_data = item_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item_db_obj, field, value)
    db.add(item_db_obj)
    db.commit()
    db.refresh(item_db_obj)
    return item_db_obj

def delete_inventory_item(db: Session, item_id: int, company_id: int) -> Optional[models.InventoryItem]:
    item = get_inventory_item(db, item_id, company_id)
    if item:
        # Check if item has stock
        has_stock = db.query(models.InventoryItemLocation).filter(
            models.InventoryItemLocation.item_id == item_id,
            models.InventoryItemLocation.quantity_on_hand > 0
        ).first()
        
        if has_stock:
            raise HTTPException(status_code=400, detail="Cannot delete item with stock on hand")
        
        # Soft delete instead
        item.is_active = False
        db.add(item)
        db.commit()
    return item

# Item Barcode CRUD
def create_item_barcode(db: Session, barcode: schemas.ItemBarcodeCreate, company_id: int) -> models.ItemBarcode:
    db_barcode = models.ItemBarcode(**barcode.model_dump(), company_id=company_id)
    db.add(db_barcode)
    db.commit()
    db.refresh(db_barcode)
    return db_barcode

def get_item_barcodes(db: Session, item_id: int, company_id: int) -> List[models.ItemBarcode]:
    return db.query(models.ItemBarcode).filter(
        models.ItemBarcode.item_id == item_id,
        models.ItemBarcode.company_id == company_id
    ).all()

def delete_item_barcode(db: Session, barcode_id: int, company_id: int) -> Optional[models.ItemBarcode]:
    barcode = db.query(models.ItemBarcode).filter(
        models.ItemBarcode.id == barcode_id,
        models.ItemBarcode.company_id == company_id
    ).first()
    if barcode:
        db.delete(barcode)
        db.commit()
    return barcode

# Inventory Transaction Type CRUD
def create_inventory_transaction_type(db: Session, trans_type: schemas.InventoryTransactionTypeCreate, company_id: int) -> models.InventoryTransactionType:
    db_type = models.InventoryTransactionType(**trans_type.model_dump(), company_id=company_id)
    db.add(db_type)
    db.commit()
    db.refresh(db_type)
    return db_type

def get_inventory_transaction_type(db: Session, type_id: int, company_id: int) -> Optional[models.InventoryTransactionType]:
    return db.query(models.InventoryTransactionType).filter(
        models.InventoryTransactionType.id == type_id,
        models.InventoryTransactionType.company_id == company_id
    ).first()

def get_inventory_transaction_types(db: Session, company_id: int, skip: int = 0, limit: int = 100) -> List[models.InventoryTransactionType]:
    return db.query(models.InventoryTransactionType).filter(
        models.InventoryTransactionType.company_id == company_id
    ).offset(skip).limit(limit).all()

def update_inventory_transaction_type(db: Session, type_db_obj: models.InventoryTransactionType, type_in: schemas.InventoryTransactionTypeUpdate) -> models.InventoryTransactionType:
    update_data = type_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(type_db_obj, field, value)
    db.add(type_db_obj)
    db.commit()
    db.refresh(type_db_obj)
    return type_db_obj

def delete_inventory_transaction_type(db: Session, type_id: int, company_id: int) -> Optional[models.InventoryTransactionType]:
    trans_type = get_inventory_transaction_type(db, type_id, company_id)
    if trans_type:
        db.delete(trans_type)
        db.commit()
    return trans_type

# Inventory Defaults CRUD
def get_inventory_defaults(db: Session, company_id: int) -> Optional[models.InventoryDefaults]:
    return db.query(models.InventoryDefaults).filter(
        models.InventoryDefaults.company_id == company_id
    ).first()

def create_or_update_inventory_defaults(db: Session, defaults_in: schemas.InventoryDefaultsCreate, company_id: int) -> models.InventoryDefaults:
    db_defaults = get_inventory_defaults(db, company_id)
    
    if db_defaults:
        # Update existing
        update_data = defaults_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_defaults, field, value)
    else:
        # Create new
        db_defaults = models.InventoryDefaults(**defaults_in.model_dump(), company_id=company_id)
        db.add(db_defaults)
    
    db.commit()
    db.refresh(db_defaults)
    return db_defaults

# Core Inventory Processing Functions
def process_inventory_adjustment(
    db: Session,
    adjustment_in: schemas.InventoryAdjustmentCreate,
    company_id: int,
    user_id: int
) -> models.InventoryTransaction:
    """Process an inventory adjustment with GL posting"""
    
    # Get item and location
    item = get_inventory_item(db, adjustment_in.item_id, company_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    location = db.query(models.InventoryItemLocation).filter(
        models.InventoryItemLocation.item_id == adjustment_in.item_id,
        models.InventoryItemLocation.warehouse_id == adjustment_in.warehouse_id,
        models.InventoryItemLocation.company_id == company_id
    ).first()
    
    if not location:
        raise HTTPException(status_code=404, detail="Item not found in warehouse")
    
    # Get transaction type
    trans_type = get_inventory_transaction_type(db, adjustment_in.inventory_transaction_type_id, company_id)
    if not trans_type:
        raise HTTPException(status_code=404, detail="Transaction type not found")
    
    # Determine unit cost
    unit_cost = adjustment_in.unit_cost if adjustment_in.unit_cost else item.average_cost
    
    # Calculate total value
    total_value = adjustment_in.quantity * unit_cost
    
    # Update inventory location
    old_quantity = location.quantity_on_hand
    old_total_value = old_quantity * item.average_cost
    
    if trans_type.affects_quantity_direction == "Increase":
        location.quantity_on_hand += adjustment_in.quantity
        # Update weighted average cost
        new_total_value = old_total_value + total_value
        new_total_quantity = old_quantity + adjustment_in.quantity
        if new_total_quantity > 0:
            item.average_cost = new_total_value / new_total_quantity
    elif trans_type.affects_quantity_direction == "Decrease":
        if location.quantity_on_hand < adjustment_in.quantity:
            raise HTTPException(status_code=400, detail="Insufficient stock")
        location.quantity_on_hand -= adjustment_in.quantity
        # Cost doesn't change on decrease
    
    # Create inventory transaction
    inv_transaction = models.InventoryTransaction(
        company_id=company_id,
        item_id=adjustment_in.item_id,
        warehouse_id=adjustment_in.warehouse_id,
        inventory_transaction_type_id=adjustment_in.inventory_transaction_type_id,
        transaction_date=adjustment_in.transaction_date or date.today(),
        quantity=adjustment_in.quantity if trans_type.affects_quantity_direction == "Increase" else -adjustment_in.quantity,
        unit_cost=unit_cost,
        total_value=total_value,
        reference_document_type="Adjustment",
        notes=adjustment_in.reason
    )
    
    # GL Posting
    gl_entries = []
    
    # Get GL accounts
    inv_defaults = get_inventory_defaults(db, company_id)
    inv_gl_account_id = item.default_inventory_gl_account_id or inv_defaults.default_inventory_gl_account_id
    adj_gl_account_id = trans_type.default_offsetting_gl_account_id or inv_defaults.default_inventory_adjustment_gl_account_id
    
    if not inv_gl_account_id or not adj_gl_account_id:
        raise HTTPException(status_code=400, detail="GL accounts not configured")
    
    if trans_type.affects_quantity_direction == "Increase":
        # Debit Inventory, Credit Adjustment Account
        gl_entries.append(schemas.GLJournalEntryLineCreate(
            gl_account_id=inv_gl_account_id,
            description=f"Inventory adjustment - {item.item_code}",
            debit_amount=total_value,
            credit_amount=Decimal("0.00")
        ))
        gl_entries.append(schemas.GLJournalEntryLineCreate(
            gl_account_id=adj_gl_account_id,
            description=f"Inventory adjustment - {item.item_code}",
            debit_amount=Decimal("0.00"),
            credit_amount=total_value
        ))
    else:
        # Debit Adjustment Account, Credit Inventory
        gl_entries.append(schemas.GLJournalEntryLineCreate(
            gl_account_id=adj_gl_account_id,
            description=f"Inventory adjustment - {item.item_code}",
            debit_amount=total_value,
            credit_amount=Decimal("0.00")
        ))
        gl_entries.append(schemas.GLJournalEntryLineCreate(
            gl_account_id=inv_gl_account_id,
            description=f"Inventory adjustment - {item.item_code}",
            debit_amount=Decimal("0.00"),
            credit_amount=total_value
        ))
    
    # Create GL journal entry
    gl_entry = crud_gl.create_gl_journal_entry(
        db,
        schemas.GLJournalEntryCreate(
            entry_date=adjustment_in.transaction_date or date.today(),
            reference=f"INV-ADJ-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            description=f"Inventory adjustment - {adjustment_in.reason}",
            lines=gl_entries
        ),
        company_id,
        user_id
    )
    
    inv_transaction.linked_gl_journal_entry_id = gl_entry.id
    
    # Save everything
    db.add(item)
    db.add(location)
    db.add(inv_transaction)
    db.commit()
    db.refresh(inv_transaction)
    
    return inv_transaction

def process_warehouse_transfer(
    db: Session,
    transfer_in: schemas.WarehouseTransferCreate,
    company_id: int,
    user_id: int
) -> List[models.InventoryTransaction]:
    """Process a warehouse transfer"""
    
    # Validate item
    item = get_inventory_item(db, transfer_in.item_id, company_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Validate warehouses
    from_warehouse = get_warehouse(db, transfer_in.from_warehouse_id, company_id)
    to_warehouse = get_warehouse(db, transfer_in.to_warehouse_id, company_id)
    
    if not from_warehouse or not to_warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    
    if transfer_in.from_warehouse_id == transfer_in.to_warehouse_id:
        raise HTTPException(status_code=400, detail="Cannot transfer to same warehouse")
    
    # Get locations
    from_location = db.query(models.InventoryItemLocation).filter(
        models.InventoryItemLocation.item_id == transfer_in.item_id,
        models.InventoryItemLocation.warehouse_id == transfer_in.from_warehouse_id,
        models.InventoryItemLocation.company_id == company_id
    ).first()
    
    to_location = db.query(models.InventoryItemLocation).filter(
        models.InventoryItemLocation.item_id == transfer_in.item_id,
        models.InventoryItemLocation.warehouse_id == transfer_in.to_warehouse_id,
        models.InventoryItemLocation.company_id == company_id
    ).first()
    
    if not from_location or not to_location:
        raise HTTPException(status_code=404, detail="Item location not found")
    
    # Check stock
    if from_location.quantity_on_hand < transfer_in.quantity:
        raise HTTPException(status_code=400, detail="Insufficient stock in source warehouse")
    
    # Get transaction types
    transfer_out_type = db.query(models.InventoryTransactionType).filter(
        models.InventoryTransactionType.base_type == "WarehouseTransferOut",
        models.InventoryTransactionType.company_id == company_id
    ).first()
    
    transfer_in_type = db.query(models.InventoryTransactionType).filter(
        models.InventoryTransactionType.base_type == "WarehouseTransferIn",
        models.InventoryTransactionType.company_id == company_id
    ).first()
    
    if not transfer_out_type or not transfer_in_type:
        raise HTTPException(status_code=400, detail="Transfer transaction types not configured")
    
    # Determine unit cost
    unit_cost = transfer_in.unit_cost if transfer_in.unit_cost else item.average_cost
    total_value = transfer_in.quantity * unit_cost
    
    # Update locations
    from_location.quantity_on_hand -= transfer_in.quantity
    to_location.quantity_on_hand += transfer_in.quantity
    
    # Create transactions
    transfer_date = transfer_in.transfer_date or date.today()
    
    out_transaction = models.InventoryTransaction(
        company_id=company_id,
        item_id=transfer_in.item_id,
        warehouse_id=transfer_in.from_warehouse_id,
        inventory_transaction_type_id=transfer_out_type.id,
        transaction_date=transfer_date,
        quantity=-transfer_in.quantity,
        unit_cost=unit_cost,
        total_value=total_value,
        reference_document_type="WarehouseTransfer",
        notes=transfer_in.notes or f"Transfer to {to_warehouse.name}"
    )
    
    in_transaction = models.InventoryTransaction(
        company_id=company_id,
        item_id=transfer_in.item_id,
        warehouse_id=transfer_in.to_warehouse_id,
        inventory_transaction_type_id=transfer_in_type.id,
        transaction_date=transfer_date,
        quantity=transfer_in.quantity,
        unit_cost=unit_cost,
        total_value=total_value,
        reference_document_type="WarehouseTransfer",
        notes=transfer_in.notes or f"Transfer from {from_warehouse.name}"
    )
    
    # GL Posting (simplified - direct transfer)
    inv_defaults = get_inventory_defaults(db, company_id)
    inv_gl_account_id = item.default_inventory_gl_account_id or inv_defaults.default_inventory_gl_account_id
    
    if inv_gl_account_id:
        gl_entries = [
            schemas.GLJournalEntryLineCreate(
                gl_account_id=inv_gl_account_id,
                description=f"Transfer {item.item_code} to {to_warehouse.name}",
                debit_amount=total_value,
                credit_amount=Decimal("0.00")
            ),
            schemas.GLJournalEntryLineCreate(
                gl_account_id=inv_gl_account_id,
                description=f"Transfer {item.item_code} from {from_warehouse.name}",
                debit_amount=Decimal("0.00"),
                credit_amount=total_value
            )
        ]
        
        gl_entry = crud_gl.create_gl_journal_entry(
            db,
            schemas.GLJournalEntryCreate(
                entry_date=transfer_date,
                reference=f"WHT-{datetime.now().strftime('%Y%m%d%H%M%S')}",
                description=f"Warehouse transfer - {item.item_code}",
                lines=gl_entries
            ),
            company_id,
            user_id
        )
        
        out_transaction.linked_gl_journal_entry_id = gl_entry.id
        in_transaction.linked_gl_journal_entry_id = gl_entry.id
    
    # Save everything
    db.add(from_location)
    db.add(to_location)
    db.add(out_transaction)
    db.add(in_transaction)
    db.commit()
    
    return [out_transaction, in_transaction]

# Inventory Count Functions
def start_inventory_count(
    db: Session,
    count_in: schemas.InventoryCountSessionCreate,
    company_id: int,
    warehouse_id: int
) -> models.InventoryCountSession:
    """Start a new inventory count session"""
    
    # Create count session
    count_session = models.InventoryCountSession(
        company_id=company_id,
        warehouse_id=warehouse_id,
        count_date=count_in.count_date,
        status="Open",
        notes=count_in.notes
    )
    db.add(count_session)
    db.commit()
    db.refresh(count_session)
    
    # Create count lines for all items in warehouse
    item_locations = db.query(models.InventoryItemLocation).filter(
        models.InventoryItemLocation.warehouse_id == warehouse_id,
        models.InventoryItemLocation.company_id == company_id
    ).all()
    
    for location in item_locations:
        count_line = models.InventoryCountLine(
            inventory_count_session_id=count_session.id,
            item_id=location.item_id,
            system_quantity=location.quantity_on_hand,
            counted_quantity=None,
            variance_quantity=None
        )
        db.add(count_line)
    
    db.commit()
    return count_session

def record_counted_quantities(
    db: Session,
    session_id: int,
    counts: List[schemas.InventoryCountLineUpdate],
    company_id: int
):
    """Record counted quantities for inventory count lines"""
    
    # Verify session
    count_session = db.query(models.InventoryCountSession).filter(
        models.InventoryCountSession.id == session_id,
        models.InventoryCountSession.company_id == company_id
    ).first()
    
    if not count_session:
        raise HTTPException(status_code=404, detail="Count session not found")
    
    if count_session.status not in ["Open", "Counting"]:
        raise HTTPException(status_code=400, detail="Count session is not open for counting")
    
    # Update status to Counting
    count_session.status = "Counting"
    
    # Update count lines
    for count_update in counts:
        count_line = db.query(models.InventoryCountLine).filter(
            models.InventoryCountLine.id == count_update.id,
            models.InventoryCountLine.inventory_count_session_id == session_id
        ).first()
        
        if count_line:
            count_line.counted_quantity = count_update.counted_quantity
            count_line.variance_quantity = count_update.counted_quantity - count_line.system_quantity
            db.add(count_line)
    
    db.commit()

def process_inventory_count_variances(
    db: Session,
    session_id: int,
    company_id: int,
    user_id: int
):
    """Process inventory count variances and create adjustments"""
    
    # Verify session
    count_session = db.query(models.InventoryCountSession).filter(
        models.InventoryCountSession.id == session_id,
        models.InventoryCountSession.company_id == company_id
    ).first()
    
    if not count_session:
        raise HTTPException(status_code=404, detail="Count session not found")
    
    if count_session.status == "Completed":
        raise HTTPException(status_code=400, detail="Count session already completed")
    
    # Get count adjustment transaction types
    increase_type = db.query(models.InventoryTransactionType).filter(
        models.InventoryTransactionType.base_type == "AdjustmentIncrease",
        models.InventoryTransactionType.company_id == company_id
    ).first()
    
    decrease_type = db.query(models.InventoryTransactionType).filter(
        models.InventoryTransactionType.base_type == "AdjustmentDecrease",
        models.InventoryTransactionType.company_id == company_id
    ).first()
    
    if not increase_type or not decrease_type:
        raise HTTPException(status_code=400, detail="Adjustment transaction types not configured")
    
    # Process each line with variance
    count_lines = db.query(models.InventoryCountLine).filter(
        models.InventoryCountLine.inventory_count_session_id == session_id,
        models.InventoryCountLine.variance_quantity != 0,
        models.InventoryCountLine.variance_quantity.isnot(None)
    ).all()
    
    for line in count_lines:
        if line.variance_quantity > 0:
            # Positive variance - increase inventory
            adjustment = schemas.InventoryAdjustmentCreate(
                item_id=line.item_id,
                warehouse_id=count_session.warehouse_id,
                quantity=abs(line.variance_quantity),
                inventory_transaction_type_id=increase_type.id,
                reason=f"Inventory count adjustment - Session {session_id}",
                transaction_date=count_session.count_date
            )
        else:
            # Negative variance - decrease inventory
            adjustment = schemas.InventoryAdjustmentCreate(
                item_id=line.item_id,
                warehouse_id=count_session.warehouse_id,
                quantity=abs(line.variance_quantity),
                inventory_transaction_type_id=decrease_type.id,
                reason=f"Inventory count adjustment - Session {session_id}",
                transaction_date=count_session.count_date
            )
        
        process_inventory_adjustment(db, adjustment, company_id, user_id)
    
    # Update session status
    count_session.status = "Completed"
    db.commit()

# Reporting Functions
def get_inventory_valuation(
    db: Session,
    company_id: int,
    warehouse_id: Optional[int],
    as_of_date: date
) -> List[dict]:
    """Get inventory valuation report"""
    
    query = db.query(
        models.InventoryItem.item_code,
        models.InventoryItem.description,
        models.Warehouse.name.label("warehouse_name"),
        models.InventoryItemLocation.quantity_on_hand,
        models.InventoryItem.average_cost,
        (models.InventoryItemLocation.quantity_on_hand * models.InventoryItem.average_cost).label("total_value")
    ).join(
        models.InventoryItemLocation,
        models.InventoryItem.id == models.InventoryItemLocation.item_id
    ).join(
        models.Warehouse,
        models.InventoryItemLocation.warehouse_id == models.Warehouse.id
    ).filter(
        models.InventoryItem.company_id == company_id,
        models.InventoryItemLocation.quantity_on_hand > 0
    )
    
    if warehouse_id:
        query = query.filter(models.InventoryItemLocation.warehouse_id == warehouse_id)
    
    results = query.all()
    
    return [
        {
            "item_code": r.item_code,
            "description": r.description,
            "warehouse_name": r.warehouse_name,
            "quantity_on_hand": r.quantity_on_hand,
            "average_cost": r.average_cost,
            "total_value": r.total_value
        }
        for r in results
    ]

def get_inventory_movement(
    db: Session,
    company_id: int,
    item_id: int,
    warehouse_id: Optional[int],
    start_date: date,
    end_date: date
) -> List[models.InventoryTransaction]:
    """Get inventory movement report"""
    
    query = db.query(models.InventoryTransaction).filter(
        models.InventoryTransaction.company_id == company_id,
        models.InventoryTransaction.item_id == item_id,
        models.InventoryTransaction.transaction_date >= start_date,
        models.InventoryTransaction.transaction_date <= end_date
    )
    
    if warehouse_id:
        query = query.filter(models.InventoryTransaction.warehouse_id == warehouse_id)
    
    return query.order_by(models.InventoryTransaction.transaction_date).all()

def get_stock_quantities(
    db: Session,
    company_id: int,
    warehouse_id: Optional[int]
) -> List[dict]:
    """Get current stock quantities with cost information"""
    
    query = db.query(
        models.InventoryItem.item_code,
        models.InventoryItem.description,
        models.InventoryItem.costing_method,
        models.InventoryItem.standard_cost,
        models.InventoryItem.average_cost,
        models.InventoryItem.selling_price,
        models.Warehouse.name.label("warehouse_name"),
        models.InventoryItemLocation.quantity_on_hand,
        models.InventoryItemLocation.quantity_committed,
        models.InventoryItemLocation.quantity_on_order,
        (models.InventoryItemLocation.quantity_on_hand - models.InventoryItemLocation.quantity_committed).label("available_quantity")
    ).join(
        models.InventoryItemLocation,
        models.InventoryItem.id == models.InventoryItemLocation.item_id
    ).join(
        models.Warehouse,
        models.InventoryItemLocation.warehouse_id == models.Warehouse.id
    ).filter(
        models.InventoryItem.company_id == company_id,
        models.InventoryItem.is_active == True
    )
    
    if warehouse_id:
        query = query.filter(models.InventoryItemLocation.warehouse_id == warehouse_id)
    
    results = query.all()
    
    return [
        {
            "item_code": r.item_code,
            "description": r.description,
            "costing_method": r.costing_method,
            "standard_cost": float(r.standard_cost) if r.standard_cost else 0.0,
            "average_cost": float(r.average_cost) if r.average_cost else 0.0,
            "selling_price": float(r.selling_price) if r.selling_price else 0.0,
            "warehouse_name": r.warehouse_name,
            "quantity_on_hand": r.quantity_on_hand,
            "quantity_committed": r.quantity_committed,
            "quantity_on_order": r.quantity_on_order,
            "available_quantity": r.available_quantity
        }
        for r in results
    ]
