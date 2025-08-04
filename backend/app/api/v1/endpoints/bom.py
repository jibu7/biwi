from typing import List, Optional
from datetime import datetime
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from app import crud, models, schemas
from app.database.database import get_db
from app.core.permissions import PermissionChecker
from app.core.permissions import (
    BOM_SETUP_MANAGE, 
    BOM_MANUFACTURING_CREATE, 
    BOM_MANUFACTURING_PROCESS, 
    BOM_REPORTS_VIEW, 
    BOM_MRP_RUN
)
from app.services.bom_service import BOMService
from app.api.deps import get_current_active_user
from app.core.tenant_context import get_current_tenant_id

router = APIRouter()

# BOM Headers
@router.post("/", response_model=schemas.BOMHeaderRead)
def create_bom_header(
    *,
    db: Session = Depends(get_db),
    bom_in: schemas.BOMHeaderCreate,
    current_user: models.User = Depends(PermissionChecker([BOM_SETUP_MANAGE]))
):
    """Create new BOM header with components"""
    service = BOMService(db)
    return service.create_bom(bom_in, current_user.id)

@router.get("/", response_model=List[schemas.BOMHeaderRead])
def list_bom_headers(
    *,
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[str] = Query(None),
    current_user: models.User = Depends(PermissionChecker([BOM_SETUP_MANAGE, BOM_REPORTS_VIEW]))
):
    """List all BOM headers for the company"""
    company_id = get_current_tenant_id()
    boms = crud.bom.get_bom_headers_by_company(
        db=db, company_id=company_id, skip=skip, limit=limit
    )
    
    # Filter by status if provided
    if status:
        boms = [bom for bom in boms if bom.status == status]
    
    # Convert to response model with costs
    service = BOMService(db)
    result = []
    for bom in boms:
        try:
            enriched_bom = service.get_bom_with_costs(bom.id, company_id)
            result.append(enriched_bom)
        except Exception:
            # Fallback to basic BOM data if cost calculation fails
            result.append(schemas.BOMHeaderRead(
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
                components=[]
            ))
    
    return result

@router.get("/{bom_id}", response_model=schemas.BOMHeaderRead)
def get_bom_header(
    *,
    db: Session = Depends(get_db),
    bom_id: int,
    current_user: models.User = Depends(PermissionChecker([BOM_SETUP_MANAGE, BOM_REPORTS_VIEW]))
):
    """Get specific BOM header with components and costs"""
    service = BOMService(db)
    company_id = get_current_tenant_id()
    return service.get_bom_with_costs(bom_id, company_id)

@router.put("/{bom_id}", response_model=schemas.BOMHeaderRead)
def update_bom_header(
    *,
    db: Session = Depends(get_db),
    bom_id: int,
    bom_in: schemas.BOMHeaderUpdate,
    current_user: models.User = Depends(PermissionChecker([BOM_SETUP_MANAGE]))
):
    """Update BOM header"""
    company_id = get_current_tenant_id()
    bom = crud.bom.get_bom_header(db=db, bom_id=bom_id, company_id=company_id)
    if not bom:
        raise HTTPException(status_code=404, detail="BOM header not found")
    
    updated_bom = crud.bom.update_bom_header(db=db, bom_obj=bom, bom_in=bom_in)
    
    # Return enriched data
    service = BOMService(db)
    return service.get_bom_with_costs(updated_bom.id, company_id)

@router.delete("/{bom_id}")
def delete_bom_header(
    *,
    db: Session = Depends(get_db),
    bom_id: int,
    current_user: models.User = Depends(PermissionChecker([BOM_SETUP_MANAGE]))
):
    """Delete BOM header and all components"""
    company_id = get_current_tenant_id()
    try:
        if not crud.bom.delete_bom_header(db=db, bom_id=bom_id, company_id=company_id):
            raise HTTPException(status_code=404, detail="BOM header not found")
        return {"message": "BOM header deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/by-item/{item_id}", response_model=schemas.BOMHeaderRead)
def get_bom_by_item(
    *,
    db: Session = Depends(get_db),
    item_id: int,
    version: Optional[str] = Query(None),
    current_user: models.User = Depends(PermissionChecker([BOM_SETUP_MANAGE, BOM_REPORTS_VIEW]))
):
    """Get active BOM for a specific item"""
    company_id = get_current_tenant_id()
    bom = crud.bom.get_bom_header_by_item(
        db=db, item_id=item_id, company_id=company_id, version=version
    )
    if not bom:
        raise HTTPException(status_code=404, detail="No active BOM found for this item")
    
    service = BOMService(db)
    return service.get_bom_with_costs(bom.id, company_id)

@router.post("/{bom_id}/copy", response_model=schemas.BOMHeaderRead)
def copy_bom_header(
    *,
    db: Session = Depends(get_db),
    bom_id: int,
    new_version: str,
    current_user: models.User = Depends(PermissionChecker([BOM_SETUP_MANAGE]))
):
    """Copy an existing BOM to create a new version"""
    service = BOMService(db)
    return service.copy_bom(bom_id, new_version, current_user.id)

@router.get("/{bom_id}/explosion")
def get_bom_explosion(
    *,
    db: Session = Depends(get_db),
    bom_id: int,
    quantity: float = Query(1.0, gt=0),
    current_user: models.User = Depends(PermissionChecker([BOM_REPORTS_VIEW]))
):
    """Get multi-level BOM explosion"""
    service = BOMService(db)
    return service.get_bom_explosion(bom_id, Decimal(str(quantity)))

# Manufacturing Orders
@router.post("/manufacturing-orders", response_model=schemas.ManufacturingOrderRead)
def create_manufacturing_order(
    *,
    db: Session = Depends(get_db),
    mo_in: schemas.ManufacturingOrderCreate,
    current_user: models.User = Depends(PermissionChecker([BOM_MANUFACTURING_CREATE]))
):
    """Create new manufacturing order"""
    service = BOMService(db)
    return service.create_manufacturing_order(mo_in, current_user.id)

@router.get("/manufacturing-orders", response_model=List[schemas.ManufacturingOrderRead])
def list_manufacturing_orders(
    *,
    db: Session = Depends(get_db),
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: models.User = Depends(PermissionChecker([BOM_MANUFACTURING_PROCESS, BOM_REPORTS_VIEW]))
):
    """List manufacturing orders with optional status filter"""
    company_id = get_current_tenant_id()
    mos = crud.bom.get_manufacturing_orders_by_company(
        db=db, company_id=company_id, skip=skip, limit=limit, status=status
    )
    
    return [
        schemas.ManufacturingOrderRead(
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
        for mo in mos
    ]

@router.get("/manufacturing-orders/{mo_id}", response_model=schemas.ManufacturingOrderRead)
def get_manufacturing_order(
    *,
    db: Session = Depends(get_db),
    mo_id: int,
    current_user: models.User = Depends(PermissionChecker([BOM_MANUFACTURING_PROCESS, BOM_REPORTS_VIEW]))
):
    """Get specific manufacturing order"""
    service = BOMService(db)
    company_id = get_current_tenant_id()
    return service.get_manufacturing_order(mo_id, company_id)

@router.put("/manufacturing-orders/{mo_id}", response_model=schemas.ManufacturingOrderRead)
def update_manufacturing_order(
    *,
    db: Session = Depends(get_db),
    mo_id: int,
    mo_in: schemas.ManufacturingOrderUpdate,
    current_user: models.User = Depends(PermissionChecker([BOM_MANUFACTURING_PROCESS]))
):
    """Update manufacturing order"""
    company_id = get_current_tenant_id()
    mo = crud.bom.get_manufacturing_order(db=db, mo_id=mo_id, company_id=company_id)
    if not mo:
        raise HTTPException(status_code=404, detail="Manufacturing order not found")
    
    updated_mo = crud.bom.update_manufacturing_order(db=db, mo_obj=mo, mo_in=mo_in)
    service = BOMService(db)
    return service.get_manufacturing_order(updated_mo.id, company_id)

@router.post("/manufacturing-orders/{mo_id}/release")
def release_manufacturing_order(
    *,
    db: Session = Depends(get_db),
    mo_id: int,
    current_user: models.User = Depends(PermissionChecker([BOM_MANUFACTURING_PROCESS]))
):
    """Release manufacturing order for processing"""
    service = BOMService(db)
    mo = service.release_manufacturing_order(mo_id, current_user.id)
    return {"message": "Manufacturing order released", "order_number": mo.order_number}

@router.post("/manufacturing-orders/{mo_id}/complete")
def complete_manufacturing_order(
    *,
    db: Session = Depends(get_db),
    mo_id: int,
    current_user: models.User = Depends(PermissionChecker([BOM_MANUFACTURING_PROCESS]))
):
    """Complete manufacturing order"""
    company_id = get_current_tenant_id()
    try:
        mo = crud.bom.complete_manufacturing_order(
            db=db, mo_id=mo_id, company_id=company_id, user_id=current_user.id
        )
        return {"message": "Manufacturing order completed successfully", "order_number": mo.order_number}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/manufacturing-orders/{mo_id}/material-requisitions", response_model=List[schemas.MaterialRequisitionRead])
def get_material_requisitions(
    *,
    db: Session = Depends(get_db),
    mo_id: int,
    current_user: models.User = Depends(PermissionChecker([BOM_MANUFACTURING_PROCESS, BOM_REPORTS_VIEW]))
):
    """Get material requisitions for a manufacturing order"""
    company_id = get_current_tenant_id()
    mo = crud.bom.get_manufacturing_order(db=db, mo_id=mo_id, company_id=company_id)
    if not mo:
        raise HTTPException(status_code=404, detail="Manufacturing order not found")
    
    return [
        schemas.MaterialRequisitionRead(
            id=req.id,
            manufacturing_order_id=req.manufacturing_order_id,
            component_item_id=req.component_item_id,
            component_item_code=req.component_item.item_code if req.component_item else None,
            component_item_description=req.component_item.description if req.component_item else None,
            required_quantity=req.required_quantity,
            issued_quantity=req.issued_quantity,
            warehouse_id=req.warehouse_id,
            status=req.status,
            issue_date=req.issue_date
        )
        for req in mo.material_requisitions
    ]

# Production Entries
@router.post("/production-entries", response_model=schemas.ProductionEntryRead)
def create_production_entry(
    *,
    db: Session = Depends(get_db),
    entry_in: schemas.ProductionEntryCreate,
    current_user: models.User = Depends(PermissionChecker([BOM_MANUFACTURING_PROCESS]))
):
    """Create a production entry"""
    service = BOMService(db)
    return service.record_production(entry_in, current_user.id)

# Material Requirements Planning (MRP)
@router.post("/mrp", response_model=List[schemas.MRPResult])
def calculate_material_requirements(
    *,
    db: Session = Depends(get_db),
    mrp_request: schemas.MRPRequest,
    current_user: models.User = Depends(PermissionChecker([BOM_MRP_RUN]))
):
    """Run Material Requirements Planning analysis"""
    service = BOMService(db)
    return service.run_mrp(mrp_request)

# BOM Defaults
@router.get("/defaults", response_model=schemas.BOMDefaultsRead)
def get_bom_defaults(
    *,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([BOM_SETUP_MANAGE]))
):
    """Get BOM defaults for the company"""
    company_id = get_current_tenant_id()
    defaults = crud.bom.get_or_create_bom_defaults(db=db, company_id=company_id)
    return schemas.BOMDefaultsRead(
        id=defaults.id,
        company_id=defaults.company_id,
        default_overhead_percentage=defaults.default_overhead_percentage,
        default_labor_rate_per_hour=defaults.default_labor_rate_per_hour,
        wip_gl_account_id=defaults.wip_gl_account_id,
        labor_gl_account_id=defaults.labor_gl_account_id,
        overhead_gl_account_id=defaults.overhead_gl_account_id,
        variance_gl_account_id=defaults.variance_gl_account_id,
        auto_issue_components=defaults.auto_issue_components,
        allow_negative_inventory=defaults.allow_negative_inventory
    )

@router.put("/defaults", response_model=schemas.BOMDefaultsRead)
def update_bom_defaults(
    *,
    db: Session = Depends(get_db),
    defaults_in: schemas.BOMDefaultsUpdate,
    current_user: models.User = Depends(PermissionChecker([BOM_SETUP_MANAGE]))
):
    """Update BOM defaults"""
    service = BOMService(db)
    return service.update_bom_defaults(defaults_in)

# Reports and Analytics
@router.get("/reports/cost-analysis/{bom_id}")
def get_bom_cost_analysis(
    *,
    db: Session = Depends(get_db),
    bom_id: int,
    quantity: float = Query(1.0, gt=0),
    current_user: models.User = Depends(PermissionChecker([BOM_REPORTS_VIEW]))
):
    """Get cost analysis for a BOM"""
    company_id = get_current_tenant_id()
    return crud.bom.calculate_bom_cost(
        db=db, bom_id=bom_id, company_id=company_id, quantity=Decimal(str(quantity))
    )

@router.get("/reports/where-used/{item_id}")
def get_where_used_report(
    *,
    db: Session = Depends(get_db),
    item_id: int,
    current_user: models.User = Depends(PermissionChecker([BOM_REPORTS_VIEW]))
):
    """Find all BOMs where this item is used as a component"""
    service = BOMService(db)
    return service.get_where_used_report(item_id)

@router.get("/reports/manufacturing-orders/summary")
def get_manufacturing_orders_summary(
    *,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([BOM_REPORTS_VIEW]))
):
    """Get summary of manufacturing orders by status"""
    from sqlalchemy import func
    
    company_id = get_current_tenant_id()
    summary = db.query(
        models.ManufacturingOrder.status,
        func.count(models.ManufacturingOrder.id).label('count'),
        func.sum(models.ManufacturingOrder.quantity_to_produce).label('total_quantity')
    ).filter(
        models.ManufacturingOrder.company_id == company_id
    ).group_by(models.ManufacturingOrder.status).all()
    
    return [
        {
            "status": row.status,
            "count": row.count,
            "total_quantity": float(row.total_quantity) if row.total_quantity else 0.0
        }
        for row in summary
    ]

@router.get("/reports/bom-summary")
def get_bom_summary(
    *,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([BOM_REPORTS_VIEW]))
):
    """Get summary of BOMs"""
    from sqlalchemy import func
    
    company_id = get_current_tenant_id()
    
    total_boms = db.query(func.count(models.BOMHeader.id)).filter(
        models.BOMHeader.company_id == company_id
    ).scalar()
    
    active_boms = db.query(func.count(models.BOMHeader.id)).filter(
        models.BOMHeader.company_id == company_id,
        models.BOMHeader.status == "Active"
    ).scalar()
    
    return {
        "total_boms": total_boms or 0,
        "active_boms": active_boms or 0,
        "inactive_boms": (total_boms or 0) - (active_boms or 0)
    }

# Material Issuance and Production Operations
@router.post("/manufacturing-orders/{order_id}/issue-materials")
def issue_materials_for_order(
    *,
    db: Session = Depends(get_db),
    order_id: int,
    current_user: models.User = Depends(PermissionChecker([BOM_MANUFACTURING_PROCESS]))
):
    """Issue materials for a manufacturing order"""
    service = BOMService(db)
    return service.issue_materials_for_order(order_id, current_user.id)

@router.post("/production-entries", response_model=schemas.ProductionEntryRead)
def create_production_entry(
    *,
    db: Session = Depends(get_db),
    production_entry: schemas.ProductionEntryCreate,
    current_user: models.User = Depends(PermissionChecker([BOM_MANUFACTURING_PROCESS]))
):
    """Record production completion"""
    service = BOMService(db)
    return service.complete_production(production_entry, current_user.id)

@router.get("/bom-headers/{bom_id}/explode")
def explode_bom_multilevel(
    *,
    db: Session = Depends(get_db),
    bom_id: int,
    quantity: Optional[float] = Query(1.0, ge=0.001),
    current_user: models.User = Depends(PermissionChecker([BOM_SETUP_MANAGE, BOM_REPORTS_VIEW]))
):
    """Get complete multi-level BOM explosion"""
    service = BOMService(db)
    return service.explode_bom_multilevel(bom_id, quantity)

@router.get("/manufacturing-orders/{order_id}/material-requisitions", response_model=List[schemas.MaterialRequisitionRead])
def get_order_material_requisitions(
    *,
    db: Session = Depends(get_db),
    order_id: int,
    current_user: models.User = Depends(PermissionChecker([BOM_MANUFACTURING_PROCESS, BOM_REPORTS_VIEW]))
):
    """Get material requisitions for a manufacturing order"""
    company_id = get_current_tenant_id()
    requisitions = db.query(models.MaterialRequisition).options(
        joinedload(models.MaterialRequisition.component_item),
        joinedload(models.MaterialRequisition.warehouse)
    ).filter(
        models.MaterialRequisition.manufacturing_order_id == order_id
    ).join(models.ManufacturingOrder).filter(
        models.ManufacturingOrder.company_id == company_id
    ).all()
    
    return [
        schemas.MaterialRequisitionRead(
            id=req.id,
            manufacturing_order_id=req.manufacturing_order_id,
            component_item_id=req.component_item_id,
            component_item_code=req.component_item.item_code if req.component_item else None,
            component_item_description=req.component_item.description if req.component_item else None,
            required_quantity=req.required_quantity,
            issued_quantity=req.issued_quantity,
            warehouse_id=req.warehouse_id,
            status=req.status,
            issue_date=req.issue_date
        )
        for req in requisitions
    ]

@router.get("/manufacturing-orders/{order_id}/production-entries", response_model=List[schemas.ProductionEntryRead])
def get_order_production_entries(
    *,
    db: Session = Depends(get_db),
    order_id: int,
    current_user: models.User = Depends(PermissionChecker([BOM_MANUFACTURING_PROCESS, BOM_REPORTS_VIEW]))
):
    """Get production entries for a manufacturing order"""
    company_id = get_current_tenant_id()
    entries = db.query(models.ProductionEntry).filter(
        models.ProductionEntry.manufacturing_order_id == order_id
    ).join(models.ManufacturingOrder).filter(
        models.ManufacturingOrder.company_id == company_id
    ).all()
    
    return [
        schemas.ProductionEntryRead(
            id=entry.id,
            manufacturing_order_id=entry.manufacturing_order_id,
            entry_date=entry.entry_date,
            quantity_produced=entry.quantity_produced,
            quantity_scrapped=entry.quantity_scrapped,
            labor_hours_actual=entry.labor_hours_actual,
            linked_gl_journal_entry_id=entry.linked_gl_journal_entry_id,
            notes=entry.notes,
            created_by_user_id=entry.created_by_user_id
        )
        for entry in entries
    ]