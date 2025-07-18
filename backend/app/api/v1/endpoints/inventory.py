from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from app import models, schemas, crud
from app.database.database import get_db
from app.core.security import get_current_active_user, TenantPermissionChecker
from app.middleware.tenant import get_current_tenant_id
from app.core import permissions

router = APIRouter()

# Unit of Measure endpoints
@router.post("/units-of-measure", response_model=schemas.UnitOfMeasure)
async def create_unit_of_measure(
    request: Request,
    uom: schemas.UnitOfMeasureCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(TenantPermissionChecker([permissions.INV_SETUP_MANAGE]))
):
    company_id = get_current_tenant_id(request)
    return crud.create_unit_of_measure(db, uom, company_id)

@router.get("/units-of-measure", response_model=List[schemas.UnitOfMeasure])
async def list_units_of_measure(
    request: Request,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(TenantPermissionChecker([permissions.INV_SETUP_MANAGE, permissions.INV_REPORTS_VIEW]))
):
    company_id = get_current_tenant_id(request)
    return crud.get_units_of_measure(db, company_id, skip, limit)

@router.get("/units-of-measure/{uom_id}", response_model=schemas.UnitOfMeasure)
async def get_unit_of_measure(
    uom_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([INV_SETUP_MANAGE, INV_REPORTS_VIEW]))
):
    uom = crud.get_unit_of_measure(db, uom_id, current_user.company_id)
    if not uom:
        raise HTTPException(status_code=404, detail="Unit of measure not found")
    return uom

@router.put("/units-of-measure/{uom_id}", response_model=schemas.UnitOfMeasure)
async def update_unit_of_measure(
    uom_id: int,
    uom_in: schemas.UnitOfMeasureUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([INV_SETUP_MANAGE]))
):
    uom = crud.get_unit_of_measure(db, uom_id, current_user.company_id)
    if not uom:
        raise HTTPException(status_code=404, detail="Unit of measure not found")
    return crud.update_unit_of_measure(db, uom, uom_in)

@router.delete("/units-of-measure/{uom_id}")
async def delete_unit_of_measure(
    uom_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([INV_SETUP_MANAGE]))
):
    uom = crud.delete_unit_of_measure(db, uom_id, current_user.company_id)
    if not uom:
        raise HTTPException(status_code=404, detail="Unit of measure not found")
    return {"detail": "Unit of measure deleted"}

# Warehouse endpoints
@router.post("/warehouses", response_model=schemas.Warehouse)
async def create_warehouse(
    request: Request,
    warehouse: schemas.WarehouseCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(TenantPermissionChecker([permissions.INV_SETUP_MANAGE]))
):
    company_id = get_current_tenant_id(request)
    return crud.create_warehouse(db, warehouse, company_id)

@router.get("/warehouses", response_model=List[schemas.Warehouse])
async def list_warehouses(
    request: Request,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(TenantPermissionChecker([permissions.INV_SETUP_MANAGE, permissions.INV_REPORTS_VIEW]))
):
    company_id = get_current_tenant_id(request)
    return crud.get_warehouses(db, company_id, skip, limit)

@router.get("/warehouses/{warehouse_id}", response_model=schemas.Warehouse)
async def get_warehouse(
    warehouse_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([INV_SETUP_MANAGE, INV_REPORTS_VIEW]))
):
    warehouse = crud.get_warehouse(db, warehouse_id, current_user.company_id)
    if not warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    return warehouse

@router.put("/warehouses/{warehouse_id}", response_model=schemas.Warehouse)
async def update_warehouse(
    warehouse_id: int,
    warehouse_in: schemas.WarehouseUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([INV_SETUP_MANAGE]))
):
    warehouse = crud.get_warehouse(db, warehouse_id, current_user.company_id)
    if not warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    return crud.update_warehouse(db, warehouse, warehouse_in)

@router.delete("/warehouses/{warehouse_id}")
async def delete_warehouse(
    warehouse_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([INV_SETUP_MANAGE]))
):
    warehouse = crud.delete_warehouse(db, warehouse_id, current_user.company_id)
    if not warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    return {"detail": "Warehouse deleted"}

# Inventory Item endpoints
@router.post("/items", response_model=schemas.InventoryItem)
async def create_inventory_item(
    request: Request,
    item: schemas.InventoryItemCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(TenantPermissionChecker([permissions.INV_SETUP_MANAGE]))
):
    company_id = get_current_tenant_id(request)
    return crud.inventory.create_inventory_item(db, item, company_id)

@router.get("/items", response_model=List[schemas.InventoryItem])
async def list_inventory_items(
    request: Request,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    company_id = get_current_tenant_id(request)
    items = crud.inventory.get_inventory_items_by_company(db, company_id, skip, limit)
    return items

@router.get("/items/{item_id}", response_model=schemas.InventoryItem)
async def get_inventory_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([INV_SETUP_MANAGE, INV_REPORTS_VIEW]))
):
    item = crud.get_inventory_item(db, item_id, current_user.company_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item

@router.put("/items/{item_id}", response_model=schemas.InventoryItem)
async def update_inventory_item(
    item_id: int,
    item_in: schemas.InventoryItemUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([INV_SETUP_MANAGE]))
):
    item = crud.get_inventory_item(db, item_id, current_user.company_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return crud.update_inventory_item(db, item, item_in)

@router.delete("/items/{item_id}")
async def delete_inventory_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([INV_SETUP_MANAGE]))
):
    item = crud.delete_inventory_item(db, item_id, current_user.company_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"detail": "Item deactivated"}

# Item Barcode endpoints
@router.post("/items/{item_id}/barcodes", response_model=schemas.ItemBarcode)
async def create_item_barcode(
    item_id: int,
    barcode: schemas.ItemBarcodeCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([INV_SETUP_MANAGE]))
):
    # Verify item exists
    item = crud.get_inventory_item(db, item_id, current_user.company_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Ensure barcode is for the correct item
    if barcode.item_id != item_id:
        raise HTTPException(status_code=400, detail="Item ID mismatch")
    
    return crud.create_item_barcode(db, barcode, current_user.company_id)

@router.get("/items/{item_id}/barcodes", response_model=List[schemas.ItemBarcode])
async def list_item_barcodes(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([INV_SETUP_MANAGE, INV_REPORTS_VIEW]))
):
    # Verify item exists
    item = crud.get_inventory_item(db, item_id, current_user.company_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    return crud.get_item_barcodes(db, item_id, current_user.company_id)

@router.delete("/barcodes/{barcode_id}")
async def delete_item_barcode(
    barcode_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([INV_SETUP_MANAGE]))
):
    barcode = crud.delete_item_barcode(db, barcode_id, current_user.company_id)
    if not barcode:
        raise HTTPException(status_code=404, detail="Barcode not found")
    return {"detail": "Barcode deleted"}

# Inventory Transaction Type endpoints
@router.post("/transaction-types", response_model=schemas.InventoryTransactionType)
async def create_inventory_transaction_type(
    trans_type: schemas.InventoryTransactionTypeCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([INV_SETUP_MANAGE]))
):
    return crud.create_inventory_transaction_type(db, trans_type, current_user.company_id)

@router.get("/transaction-types", response_model=List[schemas.InventoryTransactionType])
async def list_inventory_transaction_types(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([INV_SETUP_MANAGE, INV_REPORTS_VIEW]))
):
    return crud.get_inventory_transaction_types(db, current_user.company_id, skip, limit)

@router.get("/transaction-types/{type_id}", response_model=schemas.InventoryTransactionType)
async def get_inventory_transaction_type(
    type_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([INV_SETUP_MANAGE, INV_REPORTS_VIEW]))
):
    trans_type = crud.get_inventory_transaction_type(db, type_id, current_user.company_id)
    if not trans_type:
        raise HTTPException(status_code=404, detail="Transaction type not found")
    return trans_type

@router.put("/transaction-types/{type_id}", response_model=schemas.InventoryTransactionType)
async def update_inventory_transaction_type(
    type_id: int,
    type_in: schemas.InventoryTransactionTypeUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([INV_SETUP_MANAGE]))
):
    trans_type = crud.get_inventory_transaction_type(db, type_id, current_user.company_id)
    if not trans_type:
        raise HTTPException(status_code=404, detail="Transaction type not found")
    return crud.update_inventory_transaction_type(db, trans_type, type_in)

@router.delete("/transaction-types/{type_id}")
async def delete_inventory_transaction_type(
    type_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([INV_SETUP_MANAGE]))
):
    trans_type = crud.delete_inventory_transaction_type(db, type_id, current_user.company_id)
    if not trans_type:
        raise HTTPException(status_code=404, detail="Transaction type not found")
    return {"detail": "Transaction type deleted"}

# Inventory Defaults endpoints
@router.get("/defaults", response_model=schemas.InventoryDefaults)
async def get_inventory_defaults(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([INV_SETUP_MANAGE, INV_REPORTS_VIEW]))
):
    defaults = crud.get_inventory_defaults(db, current_user.company_id)
    if not defaults:
        raise HTTPException(status_code=404, detail="Inventory defaults not configured")
    return defaults

@router.put("/defaults", response_model=schemas.InventoryDefaults)
async def update_inventory_defaults(
    defaults_in: schemas.InventoryDefaultsUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([INV_SETUP_MANAGE]))
):
    return crud.create_or_update_inventory_defaults(db, defaults_in, current_user.company_id)

# Inventory Adjustment endpoints
@router.post("/adjustments", response_model=schemas.InventoryTransaction)
async def process_inventory_adjustment(
    request: Request,
    adjustment: schemas.InventoryAdjustmentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(TenantPermissionChecker([permissions.INV_TRANSACTIONS_ADJUST]))
):
    company_id = get_current_tenant_id(request)
    return crud.inventory.process_inventory_adjustment(db, adjustment, company_id, current_user.id)

# Warehouse Transfer endpoints
@router.post("/warehouse-transfers", response_model=List[schemas.InventoryTransaction])
async def process_warehouse_transfer(
    transfer: schemas.WarehouseTransferCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([INV_TRANSACTIONS_ADJUST]))
):
    return crud.process_warehouse_transfer(db, transfer, current_user.company_id, current_user.id)

# Inventory Count endpoints
@router.get("/counts/sessions", response_model=List[schemas.InventoryCountSession])
async def list_inventory_count_sessions(
    warehouse_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([INV_TRANSACTIONS_ADJUST, INV_REPORTS_VIEW]))
):
    return crud.get_inventory_count_sessions(db, current_user.company_id, warehouse_id, skip, limit)

@router.post("/counts/sessions", response_model=schemas.InventoryCountSession)
async def start_inventory_count(
    count_in: schemas.InventoryCountSessionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([INV_TRANSACTIONS_ADJUST]))
):
    return crud.start_inventory_count(db, count_in, current_user.company_id, count_in.warehouse_id)

@router.get("/counts/sessions/{session_id}", response_model=schemas.InventoryCountSession)
async def get_inventory_count_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([INV_TRANSACTIONS_ADJUST, INV_REPORTS_VIEW]))
):
    from sqlalchemy.orm import joinedload
    
    session = db.query(models.InventoryCountSession).options(
        joinedload(models.InventoryCountSession.warehouse)
    ).filter(
        models.InventoryCountSession.id == session_id,
        models.InventoryCountSession.company_id == current_user.company_id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Count session not found")
    return session

@router.get("/counts/sessions/{session_id}/lines", response_model=List[schemas.InventoryCountLine])
async def get_inventory_count_lines(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([INV_TRANSACTIONS_ADJUST, INV_REPORTS_VIEW]))
):
    from sqlalchemy.orm import joinedload
    
    # Verify session exists
    session = db.query(models.InventoryCountSession).filter(
        models.InventoryCountSession.id == session_id,
        models.InventoryCountSession.company_id == current_user.company_id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Count session not found")
    
    return db.query(models.InventoryCountLine).options(
        joinedload(models.InventoryCountLine.item)
    ).filter(
        models.InventoryCountLine.inventory_count_session_id == session_id
    ).all()

@router.put("/counts/sessions/{session_id}/lines")
async def record_counted_quantities(
    session_id: int,
    counts: List[schemas.InventoryCountLineUpdate],
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([INV_TRANSACTIONS_ADJUST]))
):
    crud.record_counted_quantities(db, session_id, counts, current_user.company_id)
    return {"detail": "Counted quantities recorded"}

@router.post("/counts/sessions/{session_id}/process-variances")
async def process_count_variances(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([INV_TRANSACTIONS_ADJUST]))
):
    crud.process_inventory_count_variances(db, session_id, current_user.company_id, current_user.id)
    return {"detail": "Count variances processed"}

@router.get("/counts/sessions", response_model=List[schemas.InventoryCountSession])
async def list_inventory_count_sessions(
    warehouse_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([INV_TRANSACTIONS_ADJUST, INV_REPORTS_VIEW]))
):
    return crud.get_inventory_count_sessions(db, current_user.company_id, warehouse_id, skip, limit)

# Inventory Transaction endpoints
@router.get("/transactions", response_model=List[schemas.InventoryTransaction])
async def list_inventory_transactions(
    item_id: Optional[int] = None,
    warehouse_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([INV_REPORTS_VIEW]))
):
    from sqlalchemy.orm import joinedload
    
    query = db.query(models.InventoryTransaction).options(
        joinedload(models.InventoryTransaction.item),
        joinedload(models.InventoryTransaction.warehouse),
        joinedload(models.InventoryTransaction.transaction_type)
    ).filter(
        models.InventoryTransaction.company_id == current_user.company_id
    )
    
    if item_id:
        query = query.filter(models.InventoryTransaction.item_id == item_id)
    if warehouse_id:
        query = query.filter(models.InventoryTransaction.warehouse_id == warehouse_id)
    if start_date:
        query = query.filter(models.InventoryTransaction.transaction_date >= start_date)
    if end_date:
        query = query.filter(models.InventoryTransaction.transaction_date <= end_date)
    
    return query.offset(skip).limit(limit).all()

@router.get("/transactions/{transaction_id}", response_model=schemas.InventoryTransaction)
async def get_inventory_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([INV_REPORTS_VIEW]))
):
    from sqlalchemy.orm import joinedload
    
    transaction = db.query(models.InventoryTransaction).options(
        joinedload(models.InventoryTransaction.item),
        joinedload(models.InventoryTransaction.warehouse),
        joinedload(models.InventoryTransaction.transaction_type)
    ).filter(
        models.InventoryTransaction.id == transaction_id,
        models.InventoryTransaction.company_id == current_user.company_id
    ).first()
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Inventory transaction not found")
    return transaction

# Inventory Reports endpoints
@router.get("/reports/valuation")
async def get_inventory_valuation(
    request: Request,
    warehouse_id: Optional[int] = None,
    as_of_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(TenantPermissionChecker([permissions.INV_REPORTS_VIEW]))
):
    company_id = get_current_tenant_id(request)
    return crud.inventory.get_inventory_valuation(db, company_id, warehouse_id, as_of_date)

@router.get("/reports/movement", response_model=List[schemas.InventoryTransaction])
async def get_inventory_movement_report(
    item_id: int,
    warehouse_id: Optional[int] = None,
    start_date: date = Query(...),
    end_date: date = Query(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([INV_REPORTS_VIEW]))
):
    return crud.get_inventory_movement(db, current_user.company_id, item_id, warehouse_id, start_date, end_date)

@router.get("/reports/stock-quantity", response_model=List[schemas.StockQuantityItem])
async def get_stock_quantity_report(
    warehouse_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([INV_REPORTS_VIEW]))
):
    return crud.get_stock_quantities(db, current_user.company_id, warehouse_id)

@router.get("/reports/item-listing")
async def get_item_listing_report(
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([INV_REPORTS_VIEW]))
):
    query = db.query(models.InventoryItem).filter(
        models.InventoryItem.company_id == current_user.company_id
    )
    
    if active_only:
        query = query.filter(models.InventoryItem.is_active == True)
    
    items = query.all()
    
    return [
        {
            "item_code": item.item_code,
            "description": item.description,
            "item_type": item.item_type,
            "unit_of_measure": item.unit_of_measure.name if item.unit_of_measure else None,
            "average_cost": item.average_cost,
            "selling_price": item.selling_price,
            "is_active": item.is_active
        }
        for item in items
    ]

# Placeholder endpoints for future complex reports
@router.get("/reports/slow-movers")
async def get_slow_movers_report(
    days: int = 90,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([INV_REPORTS_VIEW]))
):
    # Placeholder - complex analysis required
    return {"message": "Slow movers report - to be implemented"}

@router.get("/reports/sales-analysis")
async def get_sales_analysis_report(
    start_date: date = Query(...),
    end_date: date = Query(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([INV_REPORTS_VIEW]))
):
    # Placeholder - requires sales data from OE module
    return {"message": "Sales analysis report - to be implemented after OE module"}
