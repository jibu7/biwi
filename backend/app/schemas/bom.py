from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from decimal import Decimal

# BOM Header Schemas
class BOMHeaderBase(BaseModel):
    parent_item_id: int
    bom_code: str
    description: Optional[str] = None
    revision: str = "1.0"
    effective_date: datetime
    expiry_date: Optional[datetime] = None
    quantity_per_batch: Decimal = Decimal("1.00")
    unit_of_measure_id: int
    is_active: bool = True
    notes: Optional[str] = None

class BOMHeaderCreate(BOMHeaderBase):
    components: List["BOMComponentCreate"]

class BOMHeaderUpdate(BaseModel):
    description: Optional[str] = None
    expiry_date: Optional[datetime] = None
    quantity_per_batch: Optional[Decimal] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None

class BOMHeaderRead(BOMHeaderBase):
    id: int
    company_id: int
    components: List["BOMComponentRead"] = []
    
    class Config:
        from_attributes = True

# BOM Component Schemas
class BOMComponentBase(BaseModel):
    component_item_id: int
    quantity_required: Decimal
    unit_of_measure_id: int
    scrap_percentage: Decimal = Decimal("0.00")
    sequence_number: int = 10
    is_phantom: bool = False
    notes: Optional[str] = None

class BOMComponentCreate(BOMComponentBase):
    pass

class BOMComponentUpdate(BaseModel):
    quantity_required: Optional[Decimal] = None
    scrap_percentage: Optional[Decimal] = None
    sequence_number: Optional[int] = None
    notes: Optional[str] = None

class BOMComponentRead(BOMComponentBase):
    id: int
    bom_header_id: int
    
    class Config:
        from_attributes = True

# Manufacturing Order Schemas
class ManufacturingOrderBase(BaseModel):
    bom_header_id: int
    warehouse_id: int
    quantity_to_manufacture: Decimal
    due_date: Optional[datetime] = None
    notes: Optional[str] = None

class ManufacturingOrderCreate(ManufacturingOrderBase):
    pass

class ManufacturingOrderUpdate(BaseModel):
    due_date: Optional[datetime] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class ManufacturingOrderRead(ManufacturingOrderBase):
    id: int
    company_id: int
    order_number: str
    quantity_completed: Decimal
    order_date: datetime
    start_date: Optional[datetime]
    completion_date: Optional[datetime]
    status: str
    
    class Config:
        from_attributes = True

# BOM Defaults Schemas
class BOMDefaultsBase(BaseModel):
    default_wip_gl_account_id: Optional[int] = None
    default_material_usage_gl_account_id: Optional[int] = None
    default_manufacturing_overhead_gl_account_id: Optional[int] = None
    default_scrap_gl_account_id: Optional[int] = None

class BOMDefaultsCreate(BOMDefaultsBase):
    pass

class BOMDefaultsUpdate(BOMDefaultsBase):
    pass

class BOMDefaultsRead(BOMDefaultsBase):
    id: int
    company_id: int
    next_mo_number: int
    
    class Config:
        from_attributes = True

# Material Requirements Planning
class MRPRequest(BaseModel):
    bom_header_id: int
    quantity_to_produce: Decimal
    warehouse_id: int
    include_phantom_items: bool = False

class MRPResult(BaseModel):
    item_id: int
    item_code: str
    description: str
    quantity_required: Decimal
    quantity_available: Decimal
    quantity_short: Decimal
    unit_of_measure: str
    level: int  # BOM level (0 = parent, 1 = direct component, etc.)

# Manufacturing Order Component Schemas
class ManufacturingOrderComponentBase(BaseModel):
    component_item_id: int
    quantity_required: Decimal
    unit_cost: Decimal

class ManufacturingOrderComponentCreate(ManufacturingOrderComponentBase):
    pass

class ManufacturingOrderComponentRead(ManufacturingOrderComponentBase):
    id: int
    manufacturing_order_id: int
    quantity_issued: Decimal
    
    class Config:
        from_attributes = True
