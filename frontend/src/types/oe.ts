// Sales Order Types
export interface SalesOrder {
  id: number;
  company_id: number;
  document_number: string;
  order_date: string;
  customer_id: number;
  reference?: string;
  sales_representative_id?: number;
  status: 'DRAFT' | 'CONFIRMED' | 'INVOICED' | 'CANCELLED' | 'Draft';
  currency_code?: string;
  exchange_rate?: number;
  subtotal?: number;
  tax_amount?: number;
  total_amount: number;
  notes?: string;
  ar_invoice_id?: number;
  
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
  order_date: string;
  reference?: string;
  sales_representative_id?: number;
  notes?: string;
  shipping_address?: any;
  billing_address?: any;
  lines: SalesOrderLineCreate[];
}

export interface SalesOrderLineCreate {
  item_id: number;
  description: string;
  quantity_ordered: number;
  unit_price: number;
  discount_percentage?: number;
  tax_type_id?: number;
}

// Purchase Order Types
export interface PurchaseOrder {
  id: number;
  company_id: number;
  document_number: string;
  order_number?: string; // Keep for backward compatibility
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
  order_date: string;
  expected_delivery_date?: string;
  reference?: string;
  status?: string;
  total_amount: number;
  notes?: string;
  delivery_address_warehouse_id: number;
  lines: PurchaseOrderLineCreate[];
}

export interface PurchaseOrderLineCreate {
  item_id: number;
  description: string;
  quantity_ordered: number;
  unit_price: number;
  discount_percentage?: number;
  tax_type_id?: number;
  tax_amount?: number;
  line_total: number;
  notes?: string;
}

// Goods Received Voucher Types
export interface GoodsReceivedVoucher {
  id: number;
  company_id: number;
  document_number: string; // Backend uses document_number
  grv_number?: string; // Keep for backward compatibility
  grv_date: string;
  purchase_order_id?: number;
  supplier_id: number;
  supplier_delivery_note?: string;
  reference?: string; // Backend may use reference
  received_by?: string;
  status: 'DRAFT' | 'Open' | 'CONFIRMED' | 'INVOICED';
  total_value?: number;
  notes?: string;
  is_active?: boolean;
  ap_invoice_id?: number;
  created_at?: string;
  updated_at?: string;
  
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
  unit_cost: number;
  unit_price?: number; // Keep for backward compatibility
  line_total: number;
  notes?: string;
}

export interface GoodsReceivedVoucherCreate {
  supplier_id: number;
  purchase_order_id?: number;
  grv_date?: string;
  supplier_delivery_note?: string;
  reference?: string;
  received_by?: string;
  notes?: string;
  lines: GoodsReceivedVoucherLineCreate[];
}

export interface GoodsReceivedVoucherLineCreate {
  item_id: number;
  description?: string;
  quantity_received: number;
  unit_price?: number;
  unit_cost?: number;
  line_total?: number;
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
  // Order status defaults
  default_so_status: 'Draft' | 'Open' | 'PartiallyInvoiced' | 'Invoiced' | 'Closed' | 'Cancelled';
  default_po_status: 'Draft' | 'Open' | 'PartiallyReceived' | 'Received' | 'Closed' | 'Cancelled';
  default_grv_status: 'Open' | 'PartiallyInvoiced' | 'Invoiced' | 'Closed';
  // Next document numbers
  next_so_number: number;
  next_po_number: number;
  next_grv_number: number;
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
  default_so_status?: 'Draft' | 'Open' | 'PartiallyInvoiced' | 'Invoiced' | 'Closed' | 'Cancelled';
  default_po_status?: 'Draft' | 'Open' | 'PartiallyReceived' | 'Received' | 'Closed' | 'Cancelled';
  default_grv_status?: 'Open' | 'PartiallyInvoiced' | 'Invoiced' | 'Closed';
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
