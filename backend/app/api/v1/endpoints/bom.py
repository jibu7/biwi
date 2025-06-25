from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import crud, models, schemas
from app.database.database import get_db
from app.core.permissions import PermissionChecker, BOM_SETUP_MANAGE, BOM_MANUFACTURING_PROCESS, BOM_REPORTS_VIEW

router = APIRouter()

# BOM Headers
@router.post("/bom-headers", response_model=schemas.BOMHeaderRead)
def create_bom_header(
    *,
    db: Session = Depends(get_db),
    bom_in: schemas.BOMHeaderCreate,
    current_user: models.User = Depends(PermissionChecker([BOM_SETUP_MANAGE]))
):
    """Create new BOM header with components"""
    return crud.bom.create_bom_header(db=db, bom_in=bom_in, company_id=current_user.company_id)

@router.get("/bom-headers", response_model=List[schemas.BOMHeaderRead])
def list_bom_headers(
    *,
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(PermissionChecker([BOM_SETUP_MANAGE, BOM_REPORTS_VIEW]))
):
    """List all BOM headers for the company"""
    return crud.bom.get_bom_headers_by_company(
        db=db, company_id=current_user.company_id, skip=skip, limit=limit
    )

@router.get("/bom-headers/{bom_id}", response_model=schemas.BOMHeaderRead)
def get_bom_header(
    *,
    db: Session = Depends(get_db),
    bom_id: int,
    current_user: models.User = Depends(PermissionChecker([BOM_SETUP_MANAGE, BOM_REPORTS_VIEW]))
):
    """Get specific BOM header with components"""
    bom = crud.bom.get_bom_header(db=db, bom_id=bom_id, company_id=current_user.company_id)
    if not bom:
        raise HTTPException(status_code=404, detail="BOM header not found")
    return bom

@router.put("/bom-headers/{bom_id}", response_model=schemas.BOMHeaderRead)
def update_bom_header(
    *,
    db: Session = Depends(get_db),
    bom_id: int,
    bom_in: schemas.BOMHeaderUpdate,
    current_user: models.User = Depends(PermissionChecker([BOM_SETUP_MANAGE]))
):
    """Update BOM header"""
    bom = crud.bom.get_bom_header(db=db, bom_id=bom_id, company_id=current_user.company_id)
    if not bom:
        raise HTTPException(status_code=404, detail="BOM header not found")
    
    return crud.bom.update_bom_header(db=db, bom_obj=bom, bom_in=bom_in)

@router.delete("/bom-headers/{bom_id}")
def delete_bom_header(
    *,
    db: Session = Depends(get_db),
    bom_id: int,
    current_user: models.User = Depends(PermissionChecker([BOM_SETUP_MANAGE]))
):
    """Delete BOM header and all components"""
    if not crud.bom.delete_bom_header(db=db, bom_id=bom_id, company_id=current_user.company_id):
        raise HTTPException(status_code=404, detail="BOM header not found")
    
    return {"message": "BOM header deleted successfully"}

@router.get("/bom-headers/by-item/{item_id}", response_model=schemas.BOMHeaderRead)
def get_bom_by_item(
    *,
    db: Session = Depends(get_db),
    item_id: int,
    current_user: models.User = Depends(PermissionChecker([BOM_SETUP_MANAGE, BOM_REPORTS_VIEW]))
):
    """Get active BOM for a specific item"""
    bom = crud.bom.get_bom_header_by_item(db=db, item_id=item_id, company_id=current_user.company_id)
    if not bom:
        raise HTTPException(status_code=404, detail="No active BOM found for this item")
    return bom

@router.post("/bom-headers/{bom_id}/copy", response_model=schemas.BOMHeaderRead)
def copy_bom_header(
    *,
    db: Session = Depends(get_db),
    bom_id: int,
    new_bom_code: str,
    new_revision: str,
    current_user: models.User = Depends(PermissionChecker([BOM_SETUP_MANAGE]))
):
    """Copy an existing BOM to create a new version"""
    try:
        return crud.bom.copy_bom(
            db=db, 
            source_bom_id=bom_id, 
            new_bom_code=new_bom_code, 
            new_revision=new_revision, 
            company_id=current_user.company_id
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# Manufacturing Orders
@router.post("/manufacturing-orders", response_model=schemas.ManufacturingOrderRead)
def create_manufacturing_order(
    *,
    db: Session = Depends(get_db),
    mo_in: schemas.ManufacturingOrderCreate,
    current_user: models.User = Depends(PermissionChecker([BOM_MANUFACTURING_PROCESS]))
):
    """Create new manufacturing order"""
    return crud.bom.create_manufacturing_order(
        db=db, mo_in=mo_in, company_id=current_user.company_id
    )

@router.get("/manufacturing-orders", response_model=List[schemas.ManufacturingOrderRead])
def list_manufacturing_orders(
    *,
    db: Session = Depends(get_db),
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(PermissionChecker([BOM_MANUFACTURING_PROCESS, BOM_REPORTS_VIEW]))
):
    """List manufacturing orders with optional status filter"""
    query = db.query(models.ManufacturingOrder).filter(
        models.ManufacturingOrder.company_id == current_user.company_id
    )
    
    if status:
        query = query.filter(models.ManufacturingOrder.status == status)
    
    return query.offset(skip).limit(limit).all()

@router.get("/manufacturing-orders/{mo_id}", response_model=schemas.ManufacturingOrderRead)
def get_manufacturing_order(
    *,
    db: Session = Depends(get_db),
    mo_id: int,
    current_user: models.User = Depends(PermissionChecker([BOM_MANUFACTURING_PROCESS, BOM_REPORTS_VIEW]))
):
    """Get specific manufacturing order"""
    mo = crud.bom.get_manufacturing_order(db=db, mo_id=mo_id, company_id=current_user.company_id)
    if not mo:
        raise HTTPException(status_code=404, detail="Manufacturing order not found")
    return mo

@router.put("/manufacturing-orders/{mo_id}", response_model=schemas.ManufacturingOrderRead)
def update_manufacturing_order(
    *,
    db: Session = Depends(get_db),
    mo_id: int,
    mo_in: schemas.ManufacturingOrderUpdate,
    current_user: models.User = Depends(PermissionChecker([BOM_MANUFACTURING_PROCESS]))
):
    """Update manufacturing order"""
    mo = crud.bom.get_manufacturing_order(db=db, mo_id=mo_id, company_id=current_user.company_id)
    if not mo:
        raise HTTPException(status_code=404, detail="Manufacturing order not found")
    
    return crud.bom.update_manufacturing_order(db=db, mo_obj=mo, mo_in=mo_in)

@router.post("/manufacturing-orders/{mo_id}/release")
def release_manufacturing_order(
    *,
    db: Session = Depends(get_db),
    mo_id: int,
    current_user: models.User = Depends(PermissionChecker([BOM_MANUFACTURING_PROCESS]))
):
    """Release manufacturing order for processing"""
    try:
        mo = crud.bom.release_manufacturing_order(
            db=db, mo_id=mo_id, company_id=current_user.company_id
        )
        return {"message": "Manufacturing order released", "order_number": mo.order_number}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/manufacturing-orders/{mo_id}/process")
def process_manufacturing_order(
    *,
    db: Session = Depends(get_db),
    mo_id: int,
    current_user: models.User = Depends(PermissionChecker([BOM_MANUFACTURING_PROCESS]))
):
    """Process manufacturing order - consume components and produce finished goods"""
    try:
        mo = crud.bom.process_manufacturing_order(
            db=db, mo_id=mo_id, company_id=current_user.company_id, user_id=current_user.id
        )
        return {"message": "Manufacturing order processed successfully", "order_number": mo.order_number}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/manufacturing-orders/{mo_id}/cancel")
def cancel_manufacturing_order(
    *,
    db: Session = Depends(get_db),
    mo_id: int,
    current_user: models.User = Depends(PermissionChecker([BOM_MANUFACTURING_PROCESS]))
):
    """Cancel manufacturing order"""
    try:
        mo = crud.bom.cancel_manufacturing_order(
            db=db, mo_id=mo_id, company_id=current_user.company_id
        )
        return {"message": "Manufacturing order cancelled", "order_number": mo.order_number}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# BOM Defaults
@router.get("/defaults", response_model=schemas.BOMDefaultsRead)
def get_bom_defaults(
    *,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([BOM_SETUP_MANAGE]))
):
    """Get BOM defaults for the company"""
    defaults = crud.bom.get_or_create_bom_defaults(db=db, company_id=current_user.company_id)
    return defaults

@router.put("/defaults", response_model=schemas.BOMDefaultsRead)
def update_bom_defaults(
    *,
    db: Session = Depends(get_db),
    defaults_in: schemas.BOMDefaultsUpdate,
    current_user: models.User = Depends(PermissionChecker([BOM_SETUP_MANAGE]))
):
    """Update BOM defaults"""
    defaults = crud.bom.get_or_create_bom_defaults(db=db, company_id=current_user.company_id)
    return crud.bom.update_bom_defaults(db=db, defaults_obj=defaults, defaults_in=defaults_in)

# Reports and Analytics
@router.post("/reports/mrp", response_model=List[schemas.MRPResult])
def calculate_material_requirements(
    *,
    db: Session = Depends(get_db),
    mrp_request: schemas.MRPRequest,
    current_user: models.User = Depends(PermissionChecker([BOM_REPORTS_VIEW]))
):
    """Calculate material requirements for a BOM"""
    return crud.bom.calculate_mrp(db=db, mrp_request=mrp_request, company_id=current_user.company_id)

@router.get("/reports/cost-analysis/{bom_id}")
def get_bom_cost_analysis(
    *,
    db: Session = Depends(get_db),
    bom_id: int,
    quantity: float = 1.0,
    current_user: models.User = Depends(PermissionChecker([BOM_REPORTS_VIEW]))
):
    """Get cost analysis for a BOM"""
    from decimal import Decimal
    return crud.bom.get_bom_cost_analysis(
        db=db, bom_id=bom_id, company_id=current_user.company_id, quantity=Decimal(str(quantity))
    )

@router.get("/reports/where-used/{item_id}", response_model=List[schemas.BOMHeaderRead])
def get_bom_where_used(
    *,
    db: Session = Depends(get_db),
    item_id: int,
    current_user: models.User = Depends(PermissionChecker([BOM_REPORTS_VIEW]))
):
    """Find all BOMs where this item is used as a component"""
    return crud.bom.get_bom_where_used(db=db, item_id=item_id, company_id=current_user.company_id)

@router.get("/reports/manufacturing-orders/summary")
def get_manufacturing_orders_summary(
    *,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([BOM_REPORTS_VIEW]))
):
    """Get summary of manufacturing orders by status"""
    from sqlalchemy import func
    
    summary = db.query(
        models.ManufacturingOrder.status,
        func.count(models.ManufacturingOrder.id).label('count'),
        func.sum(models.ManufacturingOrder.quantity_to_manufacture).label('total_quantity')
    ).filter(
        models.ManufacturingOrder.company_id == current_user.company_id
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
    
    total_boms = db.query(func.count(models.BOMHeader.id)).filter(
        models.BOMHeader.company_id == current_user.company_id
    ).scalar()
    
    active_boms = db.query(func.count(models.BOMHeader.id)).filter(
        models.BOMHeader.company_id == current_user.company_id,
        models.BOMHeader.is_active == True
    ).scalar()
    
    return {
        "total_boms": total_boms,
        "active_boms": active_boms,
        "inactive_boms": total_boms - active_boms
    }
