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
    return crud.oe.get_sales_orders(
        db, current_user.company_id, skip, limit
    )

@router.get("/sales-orders/{so_id}", response_model=schemas.SalesOrder)
async def get_sales_order(
    so_id: int,
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
    return so

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
