export interface Customer {
  id: number;
  company_id: number;
  customer_code: string;
  name: string;
  address?: any;
  contact_info?: any;
  payment_terms?: string;
  credit_limit?: number;
  current_balance: number;
  sales_representative_id?: number;
  default_ar_gl_account_id?: number;
  is_active: boolean;
  sales_representative_name?: string;
  default_ar_gl_account_name?: string;
}

export interface CustomerCreate {
  customer_code: string;
  name: string;
  address?: any;
  contact_info?: any;
  payment_terms?: string;
  credit_limit?: number;
  sales_representative_id?: number;
  default_ar_gl_account_id?: number;
  is_active?: boolean;
}

export interface CustomerUpdate {
  customer_code?: string;
  name?: string;
  address?: any;
  contact_info?: any;
  payment_terms?: string;
  credit_limit?: number;
  sales_representative_id?: number;
  default_ar_gl_account_id?: number;
  is_active?: boolean;
}

export interface SalesRepresentative {
  id: number;
  company_id: number;
  name: string;
  email?: string;
  phone?: string;
  employee_id?: string;
  commission_rate?: number;
  contact_info?: any;
  is_active: boolean;
}

export interface SalesRepresentativeCreate {
  name: string;
  email?: string;
  phone?: string;
  employee_id?: string;
  commission_rate?: number;
  contact_info?: any;
  is_active?: boolean;
}

export interface SalesRepresentativeUpdate {
  name?: string;
  email?: string;
  phone?: string;
  employee_id?: string;
  commission_rate?: number;
  contact_info?: any;
  is_active?: boolean;
}

export interface ARTransactionType {
  id: number;
  company_id: number;
  name: string;
  description?: string;
  base_type: 'Invoice' | 'Receipt' | 'Credit Note' | 'Journal';
  default_gl_account_id?: number;
  default_ar_control_gl_account_id?: number;
  affects_balance_direction: 'Debit' | 'Credit';
  is_active: boolean;
  default_gl_account_name?: string;
  default_ar_control_gl_account_name?: string;
}

export interface ARTransactionTypeCreate {
  name: string;
  description?: string;
  base_type: 'Invoice' | 'Receipt' | 'Credit Note' | 'Journal';
  default_gl_account_id?: number;
  default_ar_control_gl_account_id?: number;
  affects_balance_direction: 'Debit' | 'Credit';
  is_active?: boolean;
}

export interface ARTransactionTypeUpdate {
  name?: string;
  description?: string;
  base_type?: 'Invoice' | 'Receipt' | 'Credit Note' | 'Journal';
  default_gl_account_id?: number;
  default_ar_control_gl_account_id?: number;
  affects_balance_direction?: 'Debit' | 'Credit';
  is_active?: boolean;
}

export interface ARTransaction {
  id: number;
  company_id: number;
  customer_id: number;
  ar_transaction_type_id: number;
  linked_gl_journal_entry_id?: number;
  sales_order_id?: number;
  transaction_date: string;
  due_date?: string;
  reference?: string;
  document_number: string;
  total_amount: number;
  open_amount: number;
  is_posted_to_gl: boolean;
  status: 'Draft' | 'Posted' | 'Paid' | 'PartiallyPaid';
  customer_name?: string;
  ar_transaction_type_name?: string;
}

export interface ARTransactionCreate {
  customer_id: number;
  ar_transaction_type_id: number;
  transaction_date: string;
  due_date?: string;
  reference?: string;
  document_number: string;
  total_amount: number;
}

export interface ARTransactionUpdate {
  customer_id?: number;
  ar_transaction_type_id?: number;
  transaction_date?: string;
  due_date?: string;
  reference?: string;
  document_number?: string;
  total_amount?: number;
}

export interface ARAllocationLine {
  id: number;
  ar_allocation_id: number;
  debit_transaction_id: number;
  credit_transaction_id: number;
  allocated_amount: number;
  debit_transaction_document_number?: string;
  credit_transaction_document_number?: string;
}

export interface ARAllocationLineCreate {
  debit_transaction_id: number;
  credit_transaction_id: number;
  allocated_amount: number;
}

export interface ARAllocation {
  id: number;
  company_id: number;
  allocation_date: string;
  customer_id: number;
  lines: ARAllocationLine[];
  customer_name?: string;
}

export interface ARAllocationCreate {
  allocation_date: string;
  customer_id: number;
  lines: ARAllocationLineCreate[];
}

export interface ARDefaults {
  id: number;
  company_id: number;
  default_ar_control_gl_account_id?: number;
  default_sales_gl_account_id?: number;
  default_receipt_gl_account_id?: number;
  default_sales_discount_gl_account_id?: number;
  default_payment_terms?: string;
  default_credit_limit?: number;
  default_ar_control_gl_account_name?: string;
  default_sales_gl_account_name?: string;
  default_receipt_gl_account_name?: string;
  default_sales_discount_gl_account_name?: string;
}

export interface ARDefaultsCreate {
  default_ar_control_gl_account_id?: number;
  default_sales_gl_account_id?: number;
  default_receipt_gl_account_id?: number;
  default_sales_discount_gl_account_id?: number;
  default_payment_terms?: string;
  default_credit_limit?: number;
}

export interface ARDefaultsUpdate {
  default_ar_control_gl_account_id?: number;
  default_sales_gl_account_id?: number;
  default_receipt_gl_account_id?: number;
  default_sales_discount_gl_account_id?: number;
  default_payment_terms?: string;
  default_credit_limit?: number;
}

export interface CustomerAgingReportItem {
  customer_id: number;
  customer_name: string;
  current_balance: number;
  current: number;
  days_1_30: number;
  days_31_60: number;
  days_61_90: number;
  over_90: number;
}

export interface CustomerStatementItem {
  id: number;
  transaction_date: string;
  due_date?: string;
  document_number: string;
  reference?: string;
  ar_transaction_type_name: string;
  total_amount: number;
  open_amount: number;
  status: string;
}
