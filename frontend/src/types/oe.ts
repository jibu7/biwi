// Sales Order Types
export interface SalesOrder {
  id: number;
  company_id: number;
  order_number: string;
  order_date: string;
  customer_id: number;
  customer_po_reference?: string;
  sales_representative_id?: number;
  status: 'DRAFT' | 'CONFIRMED' | 'INVOICED' | 'CANCELLED';
  currency_code: string;
  exchange_rate: number;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  
  // Related data
  customer_name?: string;
  sales_representative_name?: string;
  lines?: SalesOrderLine[];
}

export interface SalesOrderLine {
  id: number;
  sales_order_id: number;
  line_number: number;
  item_id: number;
  item_code?: string;
  item_description?: string;
  quantity: number;
  unit_price: number;
  discount_percentage: number;
  line_total: number;
  notes?: string;
}

export interface SalesOrderCreate {
  customer_id: number;
  customer_po_reference?: string;
  sales_representative_id?: number;
  order_date?: string;
  currency_code?: string;
  exchange_rate?: number;
  notes?: string;
  lines: SalesOrderLineCreate[];
}

export interface SalesOrderLineCreate {
  item_id: number;
  quantity: number;
  unit_price: number;
  discount_percentage?: number;
  notes?: string;
}

// Purchase Order Types
export interface PurchaseOrder {
  id: number;
  company_id: number;
  order_number: string;
  order_date: string;
  supplier_id: number;
  supplier_reference?: string;
  status: 'DRAFT' | 'CONFIRMED' | 'RECEIVED' | 'INVOICED' | 'CANCELLED';
  currency_code: string;
  exchange_rate: number;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  
  // Related data
  supplier_name?: string;
  lines?: PurchaseOrderLine[];
}

export interface PurchaseOrderLine {
  id: number;
  purchase_order_id: number;
  line_number: number;
  item_id: number;
  item_code?: string;
  item_description?: string;
  quantity: number;
  unit_price: number;
  discount_percentage: number;
  line_total: number;
  quantity_received: number;
  notes?: string;
}

export interface PurchaseOrderCreate {
  supplier_id: number;
  supplier_reference?: string;
  order_date?: string;
  currency_code?: string;
  exchange_rate?: number;
  notes?: string;
  lines: PurchaseOrderLineCreate[];
}

export interface PurchaseOrderLineCreate {
  item_id: number;
  quantity: number;
  unit_price: number;
  discount_percentage?: number;
  notes?: string;
}

// Goods Received Voucher Types
export interface GoodsReceivedVoucher {
  id: number;
  company_id: number;
  grv_number: string;
  grv_date: string;
  purchase_order_id?: number;
  supplier_id: number;
  supplier_delivery_note?: string;
  received_by?: string;
  status: 'DRAFT' | 'CONFIRMED' | 'INVOICED';
  total_value?: number;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  
  // Related data
  purchase_order_number?: string;
  supplier_name?: string;
  lines?: GoodsReceivedVoucherLine[];
}

export interface GoodsReceivedVoucherLine {
  id: number;
  grv_id: number;
  line_number: number;
  purchase_order_line_id?: number;
  item_id: number;
  item_code?: string;
  item_description?: string;
  quantity_ordered?: number;
  quantity_received: number;
  unit_price: number;
  line_total?: number;
  notes?: string;
}

export interface GoodsReceivedVoucherCreate {
  supplier_id: number;
  purchase_order_id?: number;
  grv_date?: string;
  supplier_delivery_note?: string;
  received_by?: string;
  notes?: string;
  lines: GoodsReceivedVoucherLineCreate[];
}

export interface GoodsReceivedVoucherLineCreate {
  item_id: number;
  quantity_received: number;
  unit_price: number;
  purchase_order_line_id?: number;
  notes?: string;
}

// Order Defaults Types
export interface OrderDefaults {
  id: number;
  company_id: number;
  default_currency_code: string;
  default_payment_terms?: string;
  default_sales_representative_id?: number;
  default_warehouse_id?: number;
  auto_generate_order_numbers: boolean;
  sales_order_number_prefix?: string;
  purchase_order_number_prefix?: string;
  grv_number_prefix?: string;
  require_approval_for_orders: boolean;
  order_approval_limit?: number;
  created_at: string;
  updated_at: string;
  
  // Related data
  default_sales_representative_name?: string;
  default_warehouse_name?: string;
}

export interface OrderDefaultsUpdate {
  default_currency_code?: string;
  default_payment_terms?: string;
  default_sales_representative_id?: number;
  default_warehouse_id?: number;
  auto_generate_order_numbers?: boolean;
  sales_order_number_prefix?: string;
  purchase_order_number_prefix?: string;
  grv_number_prefix?: string;
  require_approval_for_orders?: boolean;
  order_approval_limit?: number;
}

// Re-export AR and AP Transaction types for conversions
export interface ARTransaction {
  id: number;
  company_id: number;
  transaction_type: string;
  transaction_number: string;
  transaction_date: string;
  customer_id: number;
  amount: number;
  status: string;
  reference?: string;
  // ... other AR transaction fields
}

export interface APTransaction {
  id: number;
  company_id: number;
  transaction_type: string;
  transaction_number: string;
  transaction_date: string;
  supplier_id: number;
  amount: number;
  status: string;
  reference?: string;
  // ... other AP transaction fields
}
