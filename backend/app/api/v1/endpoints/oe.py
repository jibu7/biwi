from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from app import models, schemas, crud
from app.database.database import get_db
from app.core.permissions import (
    PermissionChecker, 
    OE_SALES_ORDERS_MANAGE,
    OE_PURCHASE_ORDERS_MANAGE,
    OE_GRV_PROCESS,
    OE_SETUP_MANAGE,
    OE_REPORTS_VIEW
)
from app.core.security import get_current_active_user

router = APIRouter()

# Sales Orders
@router.post("/sales-orders", response_model=schemas.SalesOrder)
async def create_sales_order(
    so_in: schemas.SalesOrderCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        PermissionChecker([OE_SALES_ORDERS_MANAGE])
    )
):
    return crud.oe.create_sales_order(
        db, so_in, current_user.company_id, current_user.id
    )

@router.get("/sales-orders", response_model=List[schemas.SalesOrder])
async def list_sales_orders(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        PermissionChecker([OE_SALES_ORDERS_MANAGE])
    )
):
    sales_orders = crud.oe.get_sales_orders(
        db, current_user.company_id, skip, limit
    )
    
    # Add customer names and other computed fields
    result = []
    for so in sales_orders:
        so_dict = so.__dict__.copy()
        so_dict['customer_name'] = so.customer.name if so.customer else None
        so_dict['sales_representative_name'] = so.sales_representative.name if so.sales_representative else None
        so_dict['currency_code'] = "USD"  # Default for now
        so_dict['exchange_rate'] = 1.0
        so_dict['subtotal'] = so.total_amount
        so_dict['tax_amount'] = 0  # Calculate if needed
        result.append(so_dict)
    
    return result

@router.get("/sales-orders/{so_id}", response_model=schemas.SalesOrder)
async def get_sales_order(
    so_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        PermissionChecker([OE_SALES_ORDERS_MANAGE])
    )
):
    from sqlalchemy.orm import joinedload
    
    so = db.query(models.SalesOrder).options(
        joinedload(models.SalesOrder.customer),
        joinedload(models.SalesOrder.sales_representative),
        joinedload(models.SalesOrder.lines).joinedload(models.SalesOrderLine.item)
    ).filter(
        models.SalesOrder.id == so_id,
        models.SalesOrder.company_id == current_user.company_id
    ).first()
    
    if not so:
        raise HTTPException(status_code=404, detail="Sales Order not found")
    
    # Calculate subtotal and tax
    from decimal import Decimal
    subtotal = sum(line.line_total for line in so.lines) if so.lines else Decimal('0')
    tax_amount = Decimal('0')  # Tax calculation should be based on configured tax types, not hardcoded
    
    # Build response with computed fields
    from types import SimpleNamespace
    
    # Create a copy of the sales order with additional fields
    result = SimpleNamespace()
    result.id = so.id
    result.company_id = so.company_id
    result.customer_id = so.customer_id
    result.order_date = so.order_date
    result.reference = so.reference
    result.document_number = so.document_number
    result.status = so.status
    result.total_amount = so.total_amount
    result.notes = so.notes
    result.shipping_address = so.shipping_address
    result.billing_address = so.billing_address
    result.sales_representative_id = so.sales_representative_id
    result.ar_invoice_id = so.ar_invoice_id
    
    # Add computed fields
    result.customer_name = so.customer.name if so.customer else None
    result.sales_representative_name = so.sales_representative.name if so.sales_representative else None
    result.currency_code = "USD"  # Default for now
    result.exchange_rate = Decimal('1.0')
    result.subtotal = subtotal
    result.tax_amount = tax_amount
    result.created_at = getattr(so, 'created_at', None)
    result.updated_at = getattr(so, 'updated_at', None)
    
    # Add lines with item details
    result.lines = []
    for line in so.lines:
        line_obj = SimpleNamespace()
        line_obj.id = line.id
        line_obj.sales_order_id = line.sales_order_id
        line_obj.item_id = line.item_id
        line_obj.description = line.description
        line_obj.quantity_ordered = line.quantity_ordered
        line_obj.quantity_invoiced = line.quantity_invoiced
        line_obj.unit_price = line.unit_price
        line_obj.discount_percentage = line.discount_percentage
        line_obj.tax_type_id = line.tax_type_id
        line_obj.tax_amount = line.tax_amount
        line_obj.line_total = line.line_total
        line_obj.item_code = line.item.item_code if line.item else None
        line_obj.item_description = line.item.description if line.item else None
        result.lines.append(line_obj)
    
    return result

@router.put("/sales-orders/{so_id}", response_model=schemas.SalesOrder)
async def update_sales_order(
    so_id: int,
    so_update: schemas.SalesOrderUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        PermissionChecker([OE_SALES_ORDERS_MANAGE])
    )
):
    so = db.query(models.SalesOrder).filter(
        models.SalesOrder.id == so_id,
        models.SalesOrder.company_id == current_user.company_id
    ).first()
    if not so:
        raise HTTPException(status_code=404, detail="Sales Order not found")
    
    for field, value in so_update.model_dump(exclude_unset=True).items():
        setattr(so, field, value)
    
    db.commit()
    db.refresh(so)
    return so

@router.post("/sales-orders/{so_id}/convert-to-invoice", response_model=schemas.ARTransaction)
async def convert_so_to_invoice(
    so_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        PermissionChecker([OE_SALES_ORDERS_MANAGE])
    )
):
    try:
        ar_invoice = crud.oe.convert_so_to_ar_invoice(
            db, so_id, current_user.company_id, current_user.id
        )
        return ar_invoice
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/sales-orders/{so_id}/debug-conversion")
async def debug_so_conversion(
    so_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        PermissionChecker([OE_SALES_ORDERS_MANAGE])
    )
):
    """Debug endpoint to check if a sales order can be converted to invoice"""
    try:
        # Get SO with lines
        so = db.query(models.SalesOrder).options(
            joinedload(models.SalesOrder.lines).joinedload(models.SalesOrderLine.item),
            joinedload(models.SalesOrder.customer)
        ).filter(
            models.SalesOrder.id == so_id,
            models.SalesOrder.company_id == current_user.company_id
        ).first()
        
        if not so:
            return {"status": "error", "message": "Sales Order not found"}
        
        issues = []
        
        # Check SO status
        if so.status == "Invoiced":
            issues.append("Sales Order already invoiced")
        
        # Check AR transaction type
        ar_trans_type = db.query(models.ARTransactionType).filter(
            models.ARTransactionType.company_id == current_user.company_id,
            models.ARTransactionType.base_type == "Invoice",
            models.ARTransactionType.is_active == True
        ).first()
        
        if not ar_trans_type:
            issues.append("No active Invoice transaction type found")
        
        # Check AR defaults
        ar_defaults = db.query(models.ARDefaults).filter(
            models.ARDefaults.company_id == current_user.company_id
        ).first()
        
        if not ar_defaults:
            issues.append("AR defaults not configured")
        else:
            if not ar_defaults.default_ar_control_gl_account_id:
                issues.append("AR Control GL account not configured")
            if not ar_defaults.default_sales_gl_account_id:
                issues.append("Sales GL account not configured")
        
        # Check inventory defaults
        inv_defaults = db.query(models.InventoryDefaults).filter(
            models.InventoryDefaults.company_id == current_user.company_id
        ).first()
        
        if not inv_defaults:
            issues.append("Inventory defaults not configured")
        else:
            if not inv_defaults.default_cogs_gl_account_id:
                issues.append("COGS GL account not configured")
            if not inv_defaults.default_inventory_gl_account_id:
                issues.append("Inventory GL account not configured")
        
        # Check inventory availability for each line
        line_issues = []
        for line in so.lines:
            item = line.item
            if item and item.item_type == "Stock":
                # Check inventory location
                item_location = db.query(models.InventoryItemLocation).filter(
                    models.InventoryItemLocation.item_id == item.id,
                    models.InventoryItemLocation.company_id == current_user.company_id
                ).first()
                
                if not item_location:
                    line_issues.append(f"Item {item.item_code}: No inventory location found")
                else:
                    available = item_location.quantity_on_hand - item_location.quantity_committed
                    if available < line.quantity_ordered:
                        line_issues.append(f"Item {item.item_code}: Insufficient inventory (available: {available}, needed: {line.quantity_ordered})")
                
                if not item.average_cost:
                    line_issues.append(f"Item {item.item_code}: No average cost set")
        
        return {
            "status": "success" if not issues and not line_issues else "warning",
            "so_id": so_id,
            "so_number": so.document_number,
            "so_status": so.status,
            "customer": so.customer.name if so.customer else None,
            "total_amount": float(so.total_amount),
            "general_issues": issues,
            "line_issues": line_issues,
            "ar_transaction_type": ar_trans_type.name if ar_trans_type else None,
            "ar_defaults_configured": ar_defaults is not None,
            "inventory_defaults_configured": inv_defaults is not None
        }
        
    except Exception as e:
        return {"status": "error", "message": str(e)}

# Purchase Orders
@router.post("/purchase-orders", response_model=schemas.PurchaseOrder)
async def create_purchase_order(
    po_in: schemas.PurchaseOrderCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        PermissionChecker([OE_PURCHASE_ORDERS_MANAGE])
    )
):
    return crud.oe.create_purchase_order(
        db, po_in, current_user.company_id, current_user.id
    )

@router.get("/purchase-orders", response_model=List[schemas.PurchaseOrder])
async def list_purchase_orders(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        PermissionChecker([OE_PURCHASE_ORDERS_MANAGE])
    )
):
    return crud.oe.get_purchase_orders(
        db, current_user.company_id, skip, limit
    )

@router.get("/purchase-orders/{po_id}", response_model=schemas.PurchaseOrder)
async def get_purchase_order(
    po_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        PermissionChecker([OE_PURCHASE_ORDERS_MANAGE])
    )
):
    po = db.query(models.PurchaseOrder).filter(
        models.PurchaseOrder.id == po_id,
        models.PurchaseOrder.company_id == current_user.company_id
    ).first()
    if not po:
        raise HTTPException(status_code=404, detail="Purchase Order not found")
    return po

@router.put("/purchase-orders/{po_id}", response_model=schemas.PurchaseOrder)
async def update_purchase_order(
    po_id: int,
    po_update: schemas.PurchaseOrderUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        PermissionChecker([OE_PURCHASE_ORDERS_MANAGE])
    )
):
    po = db.query(models.PurchaseOrder).filter(
        models.PurchaseOrder.id == po_id,
        models.PurchaseOrder.company_id == current_user.company_id
    ).first()
    if not po:
        raise HTTPException(status_code=404, detail="Purchase Order not found")
    
    for field, value in po_update.model_dump(exclude_unset=True).items():
        setattr(po, field, value)
    
    db.commit()
    db.refresh(po)
    return po

# Goods Received Vouchers
@router.post("/grvs", response_model=schemas.GoodsReceivedVoucher)
async def create_grv(
    grv_in: schemas.GoodsReceivedVoucherCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        PermissionChecker([OE_GRV_PROCESS])
    )
):
    return crud.oe.create_grv(
        db, grv_in, current_user.company_id, current_user.id
    )

@router.get("/grvs", response_model=List[schemas.GoodsReceivedVoucher])
async def list_grvs(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        PermissionChecker([OE_GRV_PROCESS])
    )
):
    return crud.oe.get_grvs(
        db, current_user.company_id, skip, limit
    )

@router.get("/grvs/{grv_id}", response_model=schemas.GoodsReceivedVoucher)
async def get_grv(
    grv_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        PermissionChecker([OE_GRV_PROCESS])
    )
):
    grv = db.query(models.GoodsReceivedVoucher).filter(
        models.GoodsReceivedVoucher.id == grv_id,
        models.GoodsReceivedVoucher.company_id == current_user.company_id
    ).first()
    if not grv:
        raise HTTPException(status_code=404, detail="GRV not found")
    return grv

@router.post("/grvs/{grv_id}/convert-to-ap-invoice", response_model=schemas.APTransaction)
async def convert_grv_to_ap_invoice(
    grv_id: int,
    ap_invoice_details: schemas.APTransactionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        PermissionChecker([OE_GRV_PROCESS])
    )
):
    try:
        ap_invoice = crud.oe.convert_grv_to_ap_invoice(
            db, grv_id, current_user.company_id, current_user.id, ap_invoice_details
        )
        return ap_invoice
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# Order Defaults
@router.get("/defaults", response_model=schemas.OrderDefaults)
async def get_order_defaults(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        PermissionChecker([OE_SETUP_MANAGE])
    )
):
    return crud.oe.get_or_create_order_defaults(db, current_user.company_id)

@router.put("/defaults", response_model=schemas.OrderDefaults)
async def update_order_defaults(
    defaults_update: schemas.OrderDefaultsUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        PermissionChecker([OE_SETUP_MANAGE])
    )
):
    defaults = crud.oe.get_or_create_order_defaults(db, current_user.company_id)
    
    for field, value in defaults_update.model_dump(exclude_unset=True).items():
        setattr(defaults, field, value)
    
    db.commit()
    db.refresh(defaults)
    return defaults

# Reports
@router.get("/reports/sales-orders-listing", response_model=List[schemas.SalesOrder])
async def sales_orders_report(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    customer_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        PermissionChecker([OE_REPORTS_VIEW])
    )
):
    query = db.query(models.SalesOrder).filter(
        models.SalesOrder.company_id == current_user.company_id
    )
    
    if start_date:
        query = query.filter(models.SalesOrder.order_date >= start_date)
    if end_date:
        query = query.filter(models.SalesOrder.order_date <= end_date)
    if customer_id:
        query = query.filter(models.SalesOrder.customer_id == customer_id)
    if status:
        query = query.filter(models.SalesOrder.status == status)
    
    return query.all()

@router.get("/reports/purchase-orders-listing", response_model=List[schemas.PurchaseOrder])
async def purchase_orders_report(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    supplier_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        PermissionChecker([OE_REPORTS_VIEW])
    )
):
    query = db.query(models.PurchaseOrder).filter(
        models.PurchaseOrder.company_id == current_user.company_id
    )
    
    if start_date:
        query = query.filter(models.PurchaseOrder.order_date >= start_date)
    if end_date:
        query = query.filter(models.PurchaseOrder.order_date <= end_date)
    if supplier_id:
        query = query.filter(models.PurchaseOrder.supplier_id == supplier_id)
    if status:
        query = query.filter(models.PurchaseOrder.status == status)
    
    return query.all()

@router.get("/reports/grv-listing", response_model=List[schemas.GoodsReceivedVoucher])
async def grv_report(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    supplier_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        PermissionChecker([OE_REPORTS_VIEW])
    )
):
    query = db.query(models.GoodsReceivedVoucher).filter(
        models.GoodsReceivedVoucher.company_id == current_user.company_id
    )
    
    if start_date:
        query = query.filter(models.GoodsReceivedVoucher.grv_date >= start_date)
    if end_date:
        query = query.filter(models.GoodsReceivedVoucher.grv_date <= end_date)
    if supplier_id:
        query = query.filter(models.GoodsReceivedVoucher.supplier_id == supplier_id)
    if status:
        query = query.filter(models.GoodsReceivedVoucher.status == status)
    
    return query.all()
