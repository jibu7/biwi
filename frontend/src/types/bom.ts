// Import types from other modules
import { InventoryItem, UnitOfMeasure, Warehouse } from './inventory';

// BOM Header Types
export interface BOMHeader {
  id: number;
  company_id: number;
  parent_item_id: number;
  parent_item?: InventoryItem;
  bom_code: string;
  description?: string;
  revision: string;
  effective_date: string;
  expiry_date?: string;
  quantity_per_batch: number;
  unit_of_measure_id: number;
  unit_of_measure?: UnitOfMeasure;
  is_active: boolean;
  notes?: string;
  components: BOMComponent[];
}

export interface BOMHeaderCreate {
  parent_item_id: number;
  bom_code: string;
  description?: string;
  revision: string;
  effective_date: string;
  expiry_date?: string;
  quantity_per_batch: number;
  unit_of_measure_id: number;
  is_active: boolean;
  notes?: string;
  components: BOMComponentCreate[];
}

export interface BOMHeaderUpdate {
  description?: string;
  expiry_date?: string;
  quantity_per_batch?: number;
  is_active?: boolean;
  notes?: string;
}

// BOM Component Types
export interface BOMComponent {
  id: number;
  bom_header_id: number;
  component_item_id: number;
  component_item?: InventoryItem;
  quantity_required: number;
  unit_of_measure_id: number;
  unit_of_measure?: UnitOfMeasure;
  scrap_percentage: number;
  sequence_number: number;
  is_phantom: boolean;
  notes?: string;
}

export interface BOMComponentCreate {
  component_item_id: number;
  quantity_required: number;
  unit_of_measure_id: number;
  scrap_percentage: number;
  sequence_number: number;
  is_phantom: boolean;
  notes?: string;
}

// Manufacturing Order Types
export interface ManufacturingOrder {
  id: number;
  company_id: number;
  order_number: string;
  bom_header_id: number;
  bom_header?: BOMHeader;
  warehouse_id: number;
  warehouse?: Warehouse;
  quantity_to_manufacture: number;
  quantity_completed: number;
  order_date: string;
  due_date?: string;
  start_date?: string;
  completion_date?: string;
  status: string;
  notes?: string;
}

export interface ManufacturingOrderCreate {
  bom_header_id: number;
  warehouse_id: number;
  quantity_to_manufacture: number;
  due_date?: string;
  notes?: string;
}

// BOM Defaults Types
export interface BOMDefaults {
  id: number;
  company_id: number;
  default_wip_gl_account_id?: number;
  default_material_usage_gl_account_id?: number;
  default_manufacturing_overhead_gl_account_id?: number;
  default_scrap_gl_account_id?: number;
  next_mo_number: number;
}

export interface BOMDefaultsUpdate {
  default_wip_gl_account_id?: number;
  default_material_usage_gl_account_id?: number;
  default_manufacturing_overhead_gl_account_id?: number;
  default_scrap_gl_account_id?: number;
}

// Material Requirements Planning Types
export interface MRPRequest {
  bom_header_id: number;
  quantity_to_produce: number;
  warehouse_id: number;
  include_phantom_items: boolean;
}

export interface MRPResult {
  item_id: number;
  item_code: string;
  description: string;
  quantity_required: number;
  quantity_available: number;
  quantity_short: number;
  unit_of_measure: string;
  level: number;
}
