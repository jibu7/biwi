export interface Supplier {
  id: number;
  company_id: number;
  supplier_code: string;
  name: string;
  address?: any;
  contact_info?: any;
  payment_terms?: string;
  current_balance: number;
  default_ap_gl_account_id?: number;
  is_active: boolean;
}

export interface SupplierCreate {
  supplier_code: string;
  name: string;
  address?: any;
  contact_info?: any;
  payment_terms?: string;
  default_ap_gl_account_id?: number;
  is_active?: boolean;
}

export interface SupplierUpdate {
  supplier_code?: string;
  name?: string;
  address?: any;
  contact_info?: any;
  payment_terms?: string;
  default_ap_gl_account_id?: number;
  is_active?: boolean;
}

export interface APTransactionType {
  id: number;
  company_id: number;
  name: string;
  description?: string;
  base_type: 'Supplier Invoice' | 'Payment' | 'Debit Note' | 'Journal';
  default_gl_account_id?: number;
  default_ap_control_gl_account_id?: number;
  affects_balance_direction: 'Credit' | 'Debit';
  is_active: boolean;
}

export interface APTransactionTypeCreate {
  name: string;
  description?: string;
  base_type: 'Supplier Invoice' | 'Payment' | 'Debit Note' | 'Journal';
  default_gl_account_id?: number;
  default_ap_control_gl_account_id?: number;
  affects_balance_direction: 'Credit' | 'Debit';
  is_active?: boolean;
}

export interface APTransactionTypeUpdate {
  name?: string;
  description?: string;
  base_type?: 'Supplier Invoice' | 'Payment' | 'Debit Note' | 'Journal';
  default_gl_account_id?: number;
  default_ap_control_gl_account_id?: number;
  affects_balance_direction?: 'Credit' | 'Debit';
  is_active?: boolean;
}

export interface APTransaction {
  id: number;
  company_id: number;
  supplier_id: number;
  ap_transaction_type_id: number;
  transaction_date: string;
  due_date?: string;
  reference?: string;
  document_number: string;
  total_amount: number;
  open_amount: number;
  is_posted_to_gl: boolean;
  status: string;
  linked_gl_journal_entry_id?: number;
}

export interface APTransactionCreate {
  supplier_id: number;
  ap_transaction_type_id: number;
  transaction_date: string;
  due_date?: string;
  reference?: string;
  total_amount: number;
}

export interface APAllocationLine {
  id?: number;
  credit_transaction_id: number;
  debit_transaction_id: number;
  allocated_amount: number;
}

export interface APAllocation {
  id: number;
  company_id: number;
  allocation_date: string;
  supplier_id: number;
  lines: APAllocationLine[];
}

export interface APAllocationCreate {
  allocation_date: string;
  supplier_id: number;
  lines: APAllocationLine[];
}

export interface APDefaults {
  id: number;
  company_id: number;
  default_ap_control_gl_account_id?: number;
  default_expense_gl_account_id?: number;
  default_payment_gl_account_id?: number;
  default_purchase_discount_gl_account_id?: number;
}

export interface APDefaultsUpdate {
  default_ap_control_gl_account_id?: number;
  default_expense_gl_account_id?: number;
  default_payment_gl_account_id?: number;
  default_purchase_discount_gl_account_id?: number;
}

export interface SupplierAgeing {
  supplier_id: number;
  supplier_code: string;
  supplier_name: string;
  current: number;
  days_30: number;
  days_60: number;
  days_90: number;
  days_120_plus: number;
  total_due: number;
}

export interface SupplierStatement {
  supplier: Supplier;
  opening_balance: number;
  transactions: APTransaction[];
  closing_balance: number;
  period_start: string;
  period_end: string;
}
