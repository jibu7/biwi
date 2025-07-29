export interface GLAccount {
  id: number;
  company_id: number;
  account_code: string;
  account_name: string;
  account_type: 'Asset' | 'Liability' | 'Equity' | 'Income' | 'Expense';
  parent_account_id?: number;
  current_balance: number;
  balance: number; // for reporting/display purposes
  description?: string; // account description
  is_active: boolean;
  is_control_account: boolean;
}

export interface GLAccountCreate {
  account_code: string;
  account_name: string;
  account_type: 'Asset' | 'Liability' | 'Equity' | 'Income' | 'Expense';
  parent_account_id?: number;
  is_active?: boolean;
  is_control_account?: boolean;
}

export interface GLAccountUpdate {
  account_code?: string;
  account_name?: string;
  account_type?: 'Asset' | 'Liability' | 'Equity' | 'Income' | 'Expense';
  parent_account_id?: number;
  is_active?: boolean;
  is_control_account?: boolean;
}

export interface GLJournalEntryLine {
  id?: number;
  gl_account_id: number;
  description?: string;
  debit_amount: number;
  credit_amount: number;
}

export interface GLJournalEntry {
  id: number;
  company_id: number;
  entry_date: string;
  reference?: string;
  description?: string;
  posted_by_user_id: number;
  status: string;
  created_at: string;
  updated_at: string;
  lines: GLJournalEntryLine[];
}

export interface GLJournalEntryCreate {
  entry_date: string;
  reference?: string;
  description?: string;
  lines: GLJournalEntryLine[];
}

export interface GLTransactionType {
  id: number;
  company_id: number;
  name: string;
  description?: string;
  default_debit_account_id?: number;
  default_credit_account_id?: number;
  default_tax_control_account_id?: number;  // NEW
  is_active: boolean;
}

export interface GLTransactionTypeCreate {
  name: string;
  description?: string;
  default_debit_account_id?: number;
  default_credit_account_id?: number;
  default_tax_control_account_id?: number;
  is_active?: boolean;
}

export interface GLTransactionTypeUpdate {
  name?: string;
  description?: string;
  default_debit_account_id?: number;
  default_credit_account_id?: number;
  default_tax_control_account_id?: number;
  is_active?: boolean;
}

export interface GLDefaults {
  id: number;
  company_id: number;
  retained_earnings_account_id?: number;
  default_cash_account_id?: number;
  default_ar_control_account_id?: number;
  default_ap_control_account_id?: number;
}

export interface GLDefaultsUpdate {
  retained_earnings_account_id?: number;
  default_cash_account_id?: number;
  default_ar_control_account_id?: number;
  default_ap_control_account_id?: number;
}

export interface TrialBalanceItem {
  account_code: string;
  account_name: string;
  account_type: string;
  debit_balance: number;
  credit_balance: number;
}

export interface AccountTransaction {
  date: string;
  reference: string;
  description: string;
  debit_amount: number;
  credit_amount: number;
  balance: number;
}
