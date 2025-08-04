from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal

# BOM Header Schemas
class BOMHeaderBase(BaseModel):
    item_id: int
    version: str = "1.0"
    description: Optional[str] = None
    effective_date: date
    expiry_date: Optional[date] = None
    status: str = "Active"
    unit_quantity: Decimal = Decimal("1.0")
    labor_hours: Decimal = Decimal("0.0")
    overhead_percentage: Decimal = Decimal("0.0")

class BOMComponentCreate(BaseModel):
    component_item_id: int
    quantity_required: Decimal
    unit_of_measure_id: int
    scrap_percentage: Decimal = Decimal("0.0")
    is_phantom: bool = False
    notes: Optional[str] = None

class BOMHeaderCreate(BOMHeaderBase):
    components: List[BOMComponentCreate]
    
    @validator('components')
    def validate_components(cls, v):
        if not v:
            raise ValueError("BOM must have at least one component")
        return v

class BOMHeaderUpdate(BaseModel):
    version: Optional[str] = None
    description: Optional[str] = None
    effective_date: Optional[date] = None
    expiry_date: Optional[date] = None
    status: Optional[str] = None
    unit_quantity: Optional[Decimal] = None
    labor_hours: Optional[Decimal] = None
    overhead_percentage: Optional[Decimal] = None

class BOMComponentRead(BaseModel):
    id: int
    component_item_id: int
    component_item_code: Optional[str] = None
    component_item_description: Optional[str] = None
    quantity_required: Decimal
    unit_of_measure_id: int
    unit_of_measure_name: Optional[str] = None
    scrap_percentage: Decimal
    is_phantom: bool
    notes: Optional[str] = None
    unit_cost: Optional[Decimal] = None  # From inventory item
    extended_cost: Optional[Decimal] = None  # Calculated
    
    class Config:
        from_attributes = True

class BOMHeaderRead(BOMHeaderBase):
    id: int
    company_id: int
    item_code: Optional[str] = None
    item_description: Optional[str] = None
    components: List[BOMComponentRead] = []
    total_material_cost: Optional[Decimal] = None
    total_labor_cost: Optional[Decimal] = None
    total_overhead_cost: Optional[Decimal] = None
    total_cost: Optional[Decimal] = None
    
    class Config:
        from_attributes = True

# Manufacturing Order Schemas
class ManufacturingOrderBase(BaseModel):
    bom_header_id: int
    item_id: int
    warehouse_id: int
    quantity_to_produce: Decimal
    scheduled_start_date: datetime
    scheduled_end_date: datetime
    priority: int = 5
    notes: Optional[str] = None
    linked_sales_order_id: Optional[int] = None

class ManufacturingOrderCreate(ManufacturingOrderBase):
    pass

class ManufacturingOrderUpdate(BaseModel):
    quantity_to_produce: Optional[Decimal] = None
    scheduled_start_date: Optional[datetime] = None
    scheduled_end_date: Optional[datetime] = None
    status: Optional[str] = None
    priority: Optional[int] = None
    notes: Optional[str] = None

class ManufacturingOrderRead(ManufacturingOrderBase):
    id: int
    company_id: int
    order_number: str
    quantity_produced: Decimal
    actual_start_date: Optional[datetime] = None
    actual_end_date: Optional[datetime] = None
    status: str
    created_at: datetime
    created_by_user_id: int
    
    class Config:
        from_attributes = True

# Material Requisition Schemas
class MaterialRequisitionRead(BaseModel):
    id: int
    manufacturing_order_id: int
    component_item_id: int
    component_item_code: Optional[str] = None
    component_item_description: Optional[str] = None
    required_quantity: Decimal
    issued_quantity: Decimal
    warehouse_id: int
    status: str
    issue_date: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Production Entry Schemas
class ProductionEntryCreate(BaseModel):
    manufacturing_order_id: int
    entry_date: datetime
    quantity_produced: Decimal
    quantity_scrapped: Decimal = Decimal("0.0")
    labor_hours_actual: Decimal = Decimal("0.0")
    notes: Optional[str] = None

class ProductionEntryRead(ProductionEntryCreate):
    id: int
    linked_gl_journal_entry_id: Optional[int] = None
    created_by_user_id: int
    
    class Config:
        from_attributes = True

# MRP Schemas
class MRPRequest(BaseModel):
    item_ids: Optional[List[int]] = None  # If None, run for all items
    warehouse_id: int
    planning_horizon_days: int = 30
    include_sales_orders: bool = True
    include_min_stock_levels: bool = True

class MRPResult(BaseModel):
    item_id: int
    item_code: str
    item_description: str
    current_stock: Decimal
    required_quantity: Decimal
    suggested_production_quantity: Decimal
    suggested_purchase_quantity: Decimal
    suggested_date: date
    source_documents: List[str] = []

# BOM Defaults Schemas
class BOMDefaultsBase(BaseModel):
    default_overhead_percentage: Decimal = Decimal("15.0")
    default_labor_rate_per_hour: Decimal = Decimal("25.0")
    wip_gl_account_id: Optional[int] = None
    labor_gl_account_id: Optional[int] = None
    overhead_gl_account_id: Optional[int] = None
    variance_gl_account_id: Optional[int] = None
    auto_issue_components: bool = True
    allow_negative_inventory: bool = False

class BOMDefaultsCreate(BOMDefaultsBase):
    pass

class BOMDefaultsUpdate(BaseModel):
    default_overhead_percentage: Optional[Decimal] = None
    default_labor_rate_per_hour: Optional[Decimal] = None
    wip_gl_account_id: Optional[int] = None
    labor_gl_account_id: Optional[int] = None
    overhead_gl_account_id: Optional[int] = None
    variance_gl_account_id: Optional[int] = None
    auto_issue_components: Optional[bool] = None
    allow_negative_inventory: Optional[bool] = None

class BOMDefaultsRead(BOMDefaultsBase):
    id: int
    company_id: int
    
    class Config:
        from_attributes = True
