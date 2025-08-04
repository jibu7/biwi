"""
BOM API Endpoint Aliases
This file provides aliases for the requested endpoint structure while maintaining the existing comprehensive implementation.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app import models, schemas, crud
from app.database.database import get_db
from app.core.permissions import PermissionChecker
from app.core.permissions import (
    BOM_SETUP_MANAGE, 
    BOM_MANUFACTURING_CREATE, 
    BOM_MANUFACTURING_PROCESS, 
    BOM_REPORTS_VIEW, 
    BOM_MRP_RUN
)
from app.core.tenant_context import get_current_tenant_id

# Import the main BOM router to delegate to existing implementations
from .bom import router as main_bom_router

# Create alias router for backward compatibility
alias_router = APIRouter()

# BOM Headers aliases
@alias_router.post("/bom-headers", response_model=schemas.BOMHeaderRead)
def create_bom_header_alias(
    bom_in: schemas.BOMHeaderCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([BOM_SETUP_MANAGE]))
):
    """Create a new Bill of Materials (ALIAS ENDPOINT)"""
    from .bom import create_bom_header
    return create_bom_header(db=db, bom_in=bom_in, current_user=current_user)

@alias_router.get("/bom-headers", response_model=List[schemas.BOMHeaderRead])
def list_bom_headers_alias(
    skip: int = 0,
    limit: int = 100,
    item_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([BOM_SETUP_MANAGE, BOM_REPORTS_VIEW]))
):
    """List Bills of Materials (ALIAS ENDPOINT)"""
    from .bom import list_bom_headers
    return list_bom_headers(db=db, skip=skip, limit=limit, status=status, current_user=current_user)

@alias_router.get("/bom-headers/{bom_id}", response_model=schemas.BOMHeaderRead)
def get_bom_header_alias(
    bom_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([BOM_SETUP_MANAGE, BOM_REPORTS_VIEW]))
):
    """Get a specific BOM with components (ALIAS ENDPOINT)"""
    from .bom import get_bom_header
    return get_bom_header(db=db, bom_id=bom_id, current_user=current_user)

@alias_router.post("/bom-headers/{bom_id}/calculate-cost")
def calculate_bom_cost_alias(
    bom_id: int,
    quantity: float = Query(1.0, gt=0),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([BOM_SETUP_MANAGE]))
):
    """Calculate and return BOM cost rollup (ALIAS ENDPOINT)"""
    from .bom import get_bom_cost_analysis
    return get_bom_cost_analysis(db=db, bom_id=bom_id, quantity=quantity, current_user=current_user)

@alias_router.post("/bom-headers/{bom_id}/explode")
def explode_bom_alias(
    bom_id: int,
    quantity: float = Query(1.0, gt=0),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([BOM_SETUP_MANAGE, BOM_MRP_RUN]))
):
    """Explode multi-level BOM to show all components (ALIAS ENDPOINT)"""
    from .bom import get_bom_explosion
    return get_bom_explosion(db=db, bom_id=bom_id, quantity=quantity, current_user=current_user)

# Manufacturing Order aliases
@alias_router.post("/manufacturing-orders", response_model=schemas.ManufacturingOrderRead)
def create_manufacturing_order_alias(
    order_in: schemas.ManufacturingOrderCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([BOM_MANUFACTURING_CREATE]))
):
    """Create a new manufacturing order (ALIAS ENDPOINT)"""
    from .bom import create_manufacturing_order
    return create_manufacturing_order(db=db, mo_in=order_in, current_user=current_user)

@alias_router.get("/manufacturing-orders", response_model=List[schemas.ManufacturingOrderRead])
def list_manufacturing_orders_alias(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    warehouse_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([BOM_MANUFACTURING_CREATE, BOM_REPORTS_VIEW]))
):
    """List manufacturing orders (ALIAS ENDPOINT)"""
    from .bom import list_manufacturing_orders
    return list_manufacturing_orders(db=db, status=status, skip=skip, limit=limit, current_user=current_user)

@alias_router.get("/manufacturing-orders/{order_id}", response_model=schemas.ManufacturingOrderRead)
def get_manufacturing_order_alias(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([BOM_MANUFACTURING_CREATE, BOM_REPORTS_VIEW]))
):
    """Get a specific manufacturing order (ALIAS ENDPOINT)"""
    from .bom import get_manufacturing_order
    return get_manufacturing_order(db=db, mo_id=order_id, current_user=current_user)

@alias_router.put("/manufacturing-orders/{order_id}/release")
def release_manufacturing_order_alias(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([BOM_MANUFACTURING_PROCESS]))
):
    """Release a manufacturing order for production (ALIAS ENDPOINT)"""
    from .bom import release_manufacturing_order
    return release_manufacturing_order(db=db, mo_id=order_id, current_user=current_user)

@alias_router.post("/manufacturing-orders/{order_id}/issue-materials")
def issue_materials_alias(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([BOM_MANUFACTURING_PROCESS]))
):
    """Issue materials from inventory for production (ALIAS ENDPOINT)"""
    from .bom import issue_materials_for_order
    return issue_materials_for_order(db=db, order_id=order_id, current_user=current_user)

@alias_router.get("/manufacturing-orders/{order_id}/requisitions", response_model=List[schemas.MaterialRequisitionRead])
def get_material_requisitions_alias(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([BOM_MANUFACTURING_PROCESS, BOM_REPORTS_VIEW]))
):
    """Get material requisitions for a manufacturing order (ALIAS ENDPOINT)"""
    from .bom import get_material_requisitions
    return get_material_requisitions(db=db, mo_id=order_id, current_user=current_user)

# Production Entry aliases
@alias_router.post("/production-entries", response_model=schemas.ProductionEntryRead)
def record_production_alias(
    entry_in: schemas.ProductionEntryCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([BOM_MANUFACTURING_PROCESS]))
):
    """Record production completion (ALIAS ENDPOINT)"""
    from .bom import create_production_entry
    return create_production_entry(db=db, production_entry=entry_in, current_user=current_user)

# MRP aliases
@alias_router.post("/mrp/run", response_model=List[schemas.MRPResult])
def run_mrp_alias(
    mrp_request: schemas.MRPRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([BOM_MRP_RUN]))
):
    """Run Material Requirements Planning (ALIAS ENDPOINT)"""
    from .bom import calculate_material_requirements
    return calculate_material_requirements(db=db, mrp_request=mrp_request, current_user=current_user)

# BOM Defaults aliases
@alias_router.get("/defaults", response_model=schemas.BOMDefaultsRead)
def get_bom_defaults_alias(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([BOM_SETUP_MANAGE]))
):
    """Get BOM defaults for the company (ALIAS ENDPOINT)"""
    from .bom import get_bom_defaults
    return get_bom_defaults(db=db, current_user=current_user)

@alias_router.put("/defaults", response_model=schemas.BOMDefaultsRead)
def update_bom_defaults_alias(
    defaults_in: schemas.BOMDefaultsUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([BOM_SETUP_MANAGE]))
):
    """Update BOM defaults for the company (ALIAS ENDPOINT)"""
    from .bom import update_bom_defaults
    return update_bom_defaults(db=db, defaults_in=defaults_in, current_user=current_user)

# Reports aliases
@alias_router.get("/reports/bom-where-used/{item_id}")
def bom_where_used_report_alias(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([BOM_REPORTS_VIEW]))
):
    """Show where an item is used as a component (ALIAS ENDPOINT)"""
    from .bom import get_where_used_report
    return get_where_used_report(db=db, item_id=item_id, current_user=current_user)

# Create the router object that can be imported
router = alias_router
