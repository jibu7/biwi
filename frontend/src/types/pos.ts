export interface Till {
  id: number;
  company_id: number;
  till_code: string;
  name: string;
  warehouse_id: number;
  gl_cash_account_id: number;
  is_active: boolean;
  warehouse_name?: string;
  gl_cash_account_name?: string;
}

export interface TillCreate {
  till_code: string;
  name: string;
  warehouse_id: number;
  gl_cash_account_id: number;
  is_active?: boolean;
}

export interface TillUpdate {
  till_code?: string;
  name?: string;
  warehouse_id?: number;
  gl_cash_account_id?: number;
  is_active?: boolean;
}

export interface POSTransactionType {
  id: number;
  company_id: number;
  type_code: string;
  name: string;
  is_sale: boolean;
  is_return: boolean;
  gl_revenue_account_id?: number;
  gl_cost_account_id?: number;
  is_active: boolean;
  gl_revenue_account_name?: string;
  gl_cost_account_name?: string;
}

export interface POSTransactionTypeCreate {
  type_code: string;
  name: string;
  is_sale: boolean;
  is_return: boolean;
  gl_revenue_account_id?: number;
  gl_cost_account_id?: number;
  is_active?: boolean;
}

export interface POSTransactionTypeUpdate {
  type_code?: string;
  name?: string;
  is_sale?: boolean;
  is_return?: boolean;
  gl_revenue_account_id?: number;
  gl_cost_account_id?: number;
  is_active?: boolean;
}

export interface POSDefaults {
  id: number;
  company_id: number;
  default_warehouse_id?: number;
  default_customer_id?: number;
  default_sale_transaction_type_id?: number;
  default_return_transaction_type_id?: number;
  receipt_header?: string;
  receipt_footer?: string;
  auto_print_receipt: boolean;
  default_warehouse_name?: string;
  default_customer_name?: string;
  default_sale_transaction_type_name?: string;
  default_return_transaction_type_name?: string;
}

export interface POSDefaultsUpdate {
  default_warehouse_id?: number;
  default_customer_id?: number;
  default_sale_transaction_type_id?: number;
  default_return_transaction_type_id?: number;
  receipt_header?: string;
  receipt_footer?: string;
  auto_print_receipt?: boolean;
}

export interface POSSession {
  id: number;
  company_id: number;
  till_id: number;
  cashier_id: number;
  opening_cash_amount: number;
  closing_cash_amount?: number;
  expected_cash_amount?: number;
  cash_variance?: number;
  status: 'open' | 'closed';
  opened_at: string;
  closed_at?: string;
  notes?: string;
  till_name?: string;
  cashier_name?: string;
}

export interface POSSessionCreate {
  till_id: number;
  opening_cash_amount: number;
  notes?: string;
}

export interface POSSessionClose {
  closing_cash_amount: number;
  notes?: string;
}

export interface POSTransactionLine {
  id?: number;
  line_number: number;
  inventory_item_id: number;
  quantity: number;
  unit_price: number;
  discount_amount?: number;
  tax_amount?: number;
  line_total: number;
  inventory_item_name?: string;
  inventory_item_code?: string;
}

export interface POSTransaction {
  id: number;
  company_id: number;
  session_id: number;
  transaction_type_id: number;
  customer_id?: number;
  subtotal_amount: number;
  discount_amount?: number;
  tax_amount?: number;
  total_amount: number;
  payment_method: 'cash' | 'card' | 'check' | 'other';
  payment_reference?: string;
  status: 'completed' | 'voided' | 'refunded';
  transaction_date: string;
  notes?: string;
  lines: POSTransactionLine[];
  transaction_type_name?: string;
  customer_name?: string;
  cashier_name?: string;
}

export interface POSTransactionCreate {
  transaction_type_id: number;
  customer_id?: number;
  payment_method: 'cash' | 'card' | 'check' | 'other';
  payment_reference?: string;
  notes?: string;
  lines: Omit<POSTransactionLine, 'id'>[];
}

export interface POSCashMovement {
  id: number;
  company_id: number;
  session_id: number;
  movement_type: 'cash_in' | 'cash_out';
  amount: number;
  reason: string;
  reference?: string;
  created_at: string;
  created_by: number;
  created_by_name?: string;
}

export interface POSCashMovementCreate {
  movement_type: 'cash_in' | 'cash_out';
  amount: number;
  reason: string;
  reference?: string;
}

export interface CashierSalesReport {
  cashier_id: number;
  cashier_name: string;
  total_sales: number;
  total_returns: number;
  net_sales: number;
  transaction_count: number;
  average_transaction: number;
}

export interface InventorySalesReport {
  inventory_item_id: number;
  inventory_item_code: string;
  inventory_item_name: string;
  quantity_sold: number;
  total_sales: number;
  average_price: number;
}

export interface CartItem {
  item_id: number;
  description: string;
  quantity: number;
  unit_price: number;
  discount_percentage: number;
  discount_amount: number;
  tax_amount: number;
  line_total: number;
}

export interface InventoryItem {
  id: number;
  item_code: string;
  description: string;
  selling_price: number;
  cost_price: number;
  is_active: boolean;
}

// Additional types for compatibility with specification
export interface TillSession {
  id: number;
  tillId: number;
  userId: number;
  openingDate: string;
  closingDate?: string;
  openingBalance: number;
  expectedClosingBalance?: number;
  actualClosingBalance?: number;
  variance?: number;
  status: 'Open' | 'Closed' | 'Reconciled';
  reconciliationNotes?: string;
}

export interface POSPayment {
  id: number;
  paymentMethod: string;
  amount: number;
  referenceNumber?: string;
  paymentDetails?: any;
}

export interface ReceiptData {
  transaction: POSTransaction;
  companyInfo: any;
  tillInfo: any;
  cashierName: string;
  receiptHeader?: string;
  receiptFooter?: string;
}
