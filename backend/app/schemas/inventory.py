from pydantic import BaseModel
from typing import Optional, List
from datetime import date
from decimal import Decimal

# Unit of Measure Schemas
class UnitOfMeasureBase(BaseModel):
    name: str
    abbreviation: str
    is_base_unit: bool = False
    conversion_factor_to_base: Decimal = Decimal("1.00")
    is_active: bool = True

class UnitOfMeasureCreate(UnitOfMeasureBase):
    pass

class UnitOfMeasureUpdate(BaseModel):
    name: Optional[str] = None
    abbreviation: Optional[str] = None
    is_base_unit: Optional[bool] = None
    conversion_factor_to_base: Optional[Decimal] = None
    is_active: Optional[bool] = None

class UnitOfMeasure(UnitOfMeasureBase):
    id: int
    company_id: int
    
    class Config:
        from_attributes = True

# Warehouse Schemas
class WarehouseBase(BaseModel):
    name: str
    warehouse_code: str
    location: Optional[str] = None
    is_default: bool = False
    is_active: bool = True

class WarehouseCreate(WarehouseBase):
    pass

class WarehouseUpdate(BaseModel):
    name: Optional[str] = None
    warehouse_code: Optional[str] = None
    location: Optional[str] = None
    is_default: Optional[bool] = None
    is_active: Optional[bool] = None

class Warehouse(WarehouseBase):
    id: int
    company_id: int
    
    class Config:
        from_attributes = True

# Inventory Item Schemas
class InventoryItemBase(BaseModel):
    item_code: str
    description: str
    item_type: str  # "Stock", "Service", "NonStock"
    unit_of_measure_id: int
    costing_method: str = "WeightedAverage"
    standard_cost: Decimal = Decimal("0.00")
    selling_price: Decimal = Decimal("0.00")
    is_active: bool = True
    notes: Optional[str] = None
    reorder_level: Optional[Decimal] = None
    reorder_quantity: Optional[Decimal] = None
    default_inventory_gl_account_id: Optional[int] = None
    default_cogs_gl_account_id: Optional[int] = None
    default_sales_gl_account_id: Optional[int] = None

class InventoryItemCreate(InventoryItemBase):
    pass

class InventoryItemUpdate(BaseModel):
    item_code: Optional[str] = None
    description: Optional[str] = None
    item_type: Optional[str] = None
    unit_of_measure_id: Optional[int] = None
    costing_method: Optional[str] = None
    standard_cost: Optional[Decimal] = None
    selling_price: Optional[Decimal] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None
    reorder_level: Optional[Decimal] = None
    reorder_quantity: Optional[Decimal] = None
    default_inventory_gl_account_id: Optional[int] = None
    default_cogs_gl_account_id: Optional[int] = None
    default_sales_gl_account_id: Optional[int] = None

class InventoryItem(InventoryItemBase):
    id: int
    company_id: int
    average_cost: Decimal
    unit_of_measure: Optional[UnitOfMeasure] = None
    
    class Config:
        from_attributes = True

# Item Barcode Schemas
class ItemBarcodeBase(BaseModel):
    item_id: int
    barcode: str
    unit_of_measure_id: Optional[int] = None
    quantity_in_uom: Decimal = Decimal("1.00")

class ItemBarcodeCreate(ItemBarcodeBase):
    pass

class ItemBarcodeUpdate(BaseModel):
    barcode: Optional[str] = None
    unit_of_measure_id: Optional[int] = None
    quantity_in_uom: Optional[Decimal] = None

class ItemBarcode(ItemBarcodeBase):
    id: int
    company_id: int
    unit_of_measure: Optional[UnitOfMeasure] = None
    
    class Config:
        from_attributes = True

# Inventory Item Location Schemas
class InventoryItemLocationBase(BaseModel):
    item_id: int
    warehouse_id: int
    quantity_on_hand: Decimal = Decimal("0.00")
    quantity_committed: Decimal = Decimal("0.00")
    quantity_on_order: Decimal = Decimal("0.00")

class InventoryItemLocation(InventoryItemLocationBase):
    id: int
    company_id: int
    
    class Config:
        from_attributes = True

# Inventory Transaction Type Schemas
class InventoryTransactionTypeBase(BaseModel):
    name: str
    description: Optional[str] = None
    base_type: str
    affects_quantity_direction: str  # "Increase", "Decrease", "None"
    default_offsetting_gl_account_id: Optional[int] = None

class InventoryTransactionTypeCreate(InventoryTransactionTypeBase):
    pass

class InventoryTransactionTypeUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    base_type: Optional[str] = None
    affects_quantity_direction: Optional[str] = None
    default_offsetting_gl_account_id: Optional[int] = None

class InventoryTransactionType(InventoryTransactionTypeBase):
    id: int
    company_id: int
    
    class Config:
        from_attributes = True

# Inventory Transaction Schemas
class InventoryTransactionBase(BaseModel):
    item_id: int
    warehouse_id: int
    inventory_transaction_type_id: int
    transaction_date: date
    quantity: Decimal
    unit_cost: Decimal
    reference_document_type: Optional[str] = None
    reference_document_id: Optional[int] = None
    notes: Optional[str] = None

class InventoryTransactionCreate(InventoryTransactionBase):
    pass

class InventoryTransaction(InventoryTransactionBase):
    id: int
    company_id: int
    total_value: Decimal
    linked_gl_journal_entry_id: Optional[int] = None
    
    # Related objects
    item: Optional["InventoryItem"] = None
    warehouse: Optional["Warehouse"] = None
    transaction_type: Optional["InventoryTransactionType"] = None
    
    class Config:
        from_attributes = True

# Update models to resolve forward references
InventoryTransaction.model_rebuild()

# Inventory Adjustment Schema
class InventoryAdjustmentCreate(BaseModel):
    item_id: int
    warehouse_id: int
    quantity: Decimal  # Can be positive or negative
    unit_cost: Optional[Decimal] = None  # If None, use current average cost
    inventory_transaction_type_id: int
    reason: str
    transaction_date: Optional[date] = None

# Warehouse Transfer Schema
class WarehouseTransferCreate(BaseModel):
    item_id: int
    from_warehouse_id: int
    to_warehouse_id: int
    quantity: Decimal
    unit_cost: Optional[Decimal] = None
    transfer_date: Optional[date] = None
    notes: Optional[str] = None

# Inventory Defaults Schemas
class InventoryDefaultsBase(BaseModel):
    default_warehouse_id: Optional[int] = None
    default_inventory_gl_account_id: Optional[int] = None
    default_cogs_gl_account_id: Optional[int] = None
    default_sales_revenue_gl_account_id: Optional[int] = None
    default_inventory_adjustment_gl_account_id: Optional[int] = None
    default_grv_clearing_gl_account_id: Optional[int] = None

class InventoryDefaultsCreate(InventoryDefaultsBase):
    pass

class InventoryDefaultsUpdate(InventoryDefaultsBase):
    pass

class InventoryDefaults(InventoryDefaultsBase):
    id: int
    company_id: int
    
    class Config:
        from_attributes = True

# Inventory Count Session Schemas
class InventoryCountSessionBase(BaseModel):
    warehouse_id: int
    count_date: date
    notes: Optional[str] = None

class InventoryCountSessionCreate(InventoryCountSessionBase):
    pass

class InventoryCountSessionUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None

class InventoryCountSession(InventoryCountSessionBase):
    id: int
    company_id: int
    status: str
    warehouse: Optional["Warehouse"] = None
    
    class Config:
        from_attributes = True

# Inventory Count Line Schemas
class InventoryCountLineBase(BaseModel):
    item_id: int
    system_quantity: Decimal
    counted_quantity: Optional[Decimal] = None

class InventoryCountLineUpdate(BaseModel):
    id: int
    counted_quantity: Decimal

class InventoryCountLine(InventoryCountLineBase):
    id: int
    inventory_count_session_id: int
    variance_quantity: Optional[Decimal] = None
    item: Optional["InventoryItem"] = None
    
    class Config:
        from_attributes = True

# Report Schemas
class InventoryValuationItem(BaseModel):
    item_code: str
    description: str
    warehouse_name: str
    quantity_on_hand: Decimal
    average_cost: Decimal
    total_value: Decimal

class InventoryMovementItem(BaseModel):
    transaction_date: date
    transaction_type: str
    reference: Optional[str]
    quantity: Decimal
    unit_cost: Decimal
    total_value: Decimal
    notes: Optional[str]

class StockQuantityItem(BaseModel):
    item_code: str
    description: str
    costing_method: str
    standard_cost: Decimal
    average_cost: Decimal
    selling_price: Decimal
    warehouse_name: str
    quantity_on_hand: Decimal
    quantity_committed: Decimal
    quantity_on_order: Decimal
    available_quantity: Decimal  # on_hand - committed
