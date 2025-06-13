// Unit of Measure Types
export interface UnitOfMeasure {
  id: number;
  company_id: number;
  name: string;
  abbreviation: string;
  conversion_factor_to_base: number;
  is_active: boolean;
}

export interface UnitOfMeasureCreate {
  name: string;
  abbreviation: string;
  conversion_factor_to_base?: number;
  is_active?: boolean;
}

export interface UnitOfMeasureUpdate {
  name?: string;
  abbreviation?: string;
  conversion_factor_to_base?: number;
  is_active?: boolean;
}

// Warehouse Types
export interface Warehouse {
  id: number;
  company_id: number;
  name: string;
  location?: string;
  is_default: boolean;
  is_active: boolean;
}

export interface WarehouseCreate {
  name: string;
  location?: string;
  is_default?: boolean;
  is_active?: boolean;
}

export interface WarehouseUpdate {
  name?: string;
  location?: string;
  is_default?: boolean;
  is_active?: boolean;
}

// Inventory Item Types
export interface InventoryItem {
  id: number;
  company_id: number;
  item_code: string;
  description: string;
  item_type: 'Stock' | 'Service' | 'NonStock';
  unit_of_measure_id: number;
  unit_of_measure?: UnitOfMeasure;
  costing_method: string;
  standard_cost: number;
  average_cost: number;
  selling_price: number;
  is_active: boolean;
  notes?: string;
  reorder_level?: number;
  reorder_quantity?: number;
  default_inventory_gl_account_id?: number;
  default_cogs_gl_account_id?: number;
  default_sales_gl_account_id?: number;
}

export interface InventoryItemCreate {
  item_code: string;
  description: string;
  item_type: 'Stock' | 'Service' | 'NonStock';
  unit_of_measure_id: number;
  costing_method?: string;
  standard_cost?: number;
  selling_price?: number;
  is_active?: boolean;
  notes?: string;
  reorder_level?: number;
  reorder_quantity?: number;
  default_inventory_gl_account_id?: number;
  default_cogs_gl_account_id?: number;
  default_sales_gl_account_id?: number;
}

export interface InventoryItemUpdate {
  item_code?: string;
  description?: string;
  item_type?: 'Stock' | 'Service' | 'NonStock';
  unit_of_measure_id?: number;
  costing_method?: string;
  standard_cost?: number;
  selling_price?: number;
  is_active?: boolean;
  notes?: string;
  reorder_level?: number;
  reorder_quantity?: number;
  default_inventory_gl_account_id?: number;
  default_cogs_gl_account_id?: number;
  default_sales_gl_account_id?: number;
}

// Item Barcode Types
export interface ItemBarcode {
  id: number;
  company_id: number;
  item_id: number;
  barcode: string;
  unit_of_measure_id?: number;
  unit_of_measure?: UnitOfMeasure;
  quantity_in_uom: number;
}

export interface ItemBarcodeCreate {
  item_id: number;
  barcode: string;
  unit_of_measure_id?: number;
  quantity_in_uom?: number;
}

// Inventory Transaction Type Types
export interface InventoryTransactionType {
  id: number;
  company_id: number;
  name: string;
  description?: string;
  base_type: string;
  affects_quantity_direction: 'Increase' | 'Decrease' | 'None';
  default_offsetting_gl_account_id?: number;
}

export interface InventoryTransactionTypeCreate {
  name: string;
  description?: string;
  base_type: string;
  affects_quantity_direction: 'Increase' | 'Decrease' | 'None';
  default_offsetting_gl_account_id?: number;
}

export interface InventoryTransactionTypeUpdate {
  name?: string;
  description?: string;
  base_type?: string;
  affects_quantity_direction?: 'Increase' | 'Decrease' | 'None';
  default_offsetting_gl_account_id?: number;
}

// Inventory Transaction Types
export interface InventoryTransaction {
  id: number;
  company_id: number;
  item_id: number;
  warehouse_id: number;
  inventory_transaction_type_id: number;
  transaction_date: string;
  quantity: number;
  unit_cost: number;
  total_value: number;
  reference_document_type?: string;
  reference_document_id?: number;
  notes?: string;
  linked_gl_journal_entry_id?: number;
}

export interface InventoryAdjustmentCreate {
  item_id: number;
  warehouse_id: number;
  quantity: number;
  unit_cost?: number;
  inventory_transaction_type_id: number;
  reason: string;
  transaction_date?: string;
}

export interface WarehouseTransferCreate {
  item_id: number;
  from_warehouse_id: number;
  to_warehouse_id: number;
  quantity: number;
  unit_cost?: number;
  transfer_date?: string;
  notes?: string;
}

// Inventory Defaults Types
export interface InventoryDefaults {
  id: number;
  company_id: number;
  default_warehouse_id?: number;
  default_inventory_gl_account_id?: number;
  default_cogs_gl_account_id?: number;
  default_sales_revenue_gl_account_id?: number;
  default_inventory_adjustment_gl_account_id?: number;
}

export interface InventoryDefaultsUpdate {
  default_warehouse_id?: number;
  default_inventory_gl_account_id?: number;
  default_cogs_gl_account_id?: number;
  default_sales_revenue_gl_account_id?: number;
  default_inventory_adjustment_gl_account_id?: number;
}

// Inventory Count Types
export interface InventoryCountSession {
  id: number;
  company_id: number;
  warehouse_id: number;
  count_date: string;
  status: 'Open' | 'Counting' | 'Review' | 'Completed';
  notes?: string;
}

export interface InventoryCountSessionCreate {
  warehouse_id: number;
  count_date: string;
  notes?: string;
}

export interface InventoryCountLine {
  id: number;
  inventory_count_session_id: number;
  item_id: number;
  system_quantity: number;
  counted_quantity?: number;
  variance_quantity?: number;
}

export interface InventoryCountLineUpdate {
  id: number;
  counted_quantity: number;
}

// Report Types
export interface InventoryValuationItem {
  item_code: string;
  description: string;
  warehouse_name: string;
  quantity_on_hand: number;
  average_cost: number;
  total_value: number;
}

export interface StockQuantityItem {
  item_code: string;
  description: string;
  warehouse_name: string;
  quantity_on_hand: number;
  quantity_committed: number;
  quantity_on_order: number;
  available_quantity: number;
}
