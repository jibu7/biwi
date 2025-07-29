import axiosInstance from '@/lib/axiosInstance';

export interface BalanceSheetData {
  assets: FinancialStatementLine[];
  liabilities: FinancialStatementLine[];
  equity: FinancialStatementLine[];
  total_assets: number;
  total_liabilities: number;
  total_equity: number;
  as_of_date: string;
  company_name: string;
}

export interface IncomeStatementData {
  revenue: FinancialStatementLine[];
  expenses: FinancialStatementLine[];
  total_revenue: number;
  total_expenses: number;
  net_income: number;
  start_date: string;
  end_date: string;
  company_name: string;
}

export interface FinancialStatementLine {
  account_code: string;
  account_name: string;
  amount: number;
  level: number;
  is_total: boolean;
  is_subtotal: boolean;
}

export interface ARAgingDetail {
  customer_id: number;
  customer_name: string;
  customer_code: string;
  total_outstanding: number;
  current: number;
  days_30: number;
  days_60: number;
  days_90: number;
  days_120_plus: number;
  credit_limit: number;
  last_payment_date: string | null;
}

export interface APAgingDetail {
  supplier_id: number;
  supplier_name: string;
  supplier_code: string;
  total_outstanding: number;
  current: number;
  days_30: number;
  days_60: number;
  days_90: number;
  days_120_plus: number;
  last_payment_date: string | null;
}

export interface CashbookData {
  opening_balance: number;
  closing_balance: number;
  total_debits: number;
  total_credits: number;
  transactions: CashbookTransaction[];
}

export interface CashbookTransaction {
  date: string;
  reference: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface CashFlowData {
  operating_activities: FinancialStatementLine[];
  investing_activities: FinancialStatementLine[];
  financing_activities: FinancialStatementLine[];
  net_cash_from_operating: number;
  net_cash_from_investing: number;
  net_cash_from_financing: number;
  net_change_in_cash: number;
  beginning_cash: number;
  ending_cash: number;
  start_date: string;
  end_date: string;
  company_name: string;
}

export interface ReportTemplate {
  id: number;
  name: string;
  report_type: string;
  template_data: any;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
}

export interface AccountTransaction {
  transaction_date: string;
  reference_number: string;
  description: string;
  debit_amount?: number;
  credit_amount?: number;
  running_balance?: number;
  journal_entry_id?: number;
}

export interface CustomerTransaction {
  transaction_date: string;
  reference_number: string;
  description: string;
  amount: number;
  transaction_type: string;
  invoice_id?: number;
  payment_id?: number;
}

const reportingService = {
  // Financial Statements
  getBalanceSheet: async (asOfDate: string, comparativeDate?: string): Promise<BalanceSheetData> => {
    const params = new URLSearchParams({ as_of_date: asOfDate });
    if (comparativeDate) {
      params.append('comparative_date', comparativeDate);
    }
    const response = await axiosInstance.get(`/reporting/balance-sheet?${params}`);
    return response.data;
  },

  getIncomeStatement: async (
    startDate: string, 
    endDate: string, 
    comparativeStartDate?: string, 
    comparativeEndDate?: string
  ): Promise<IncomeStatementData> => {
    const params = new URLSearchParams({ 
      start_date: startDate, 
      end_date: endDate 
    });
    if (comparativeStartDate && comparativeEndDate) {
      params.append('comparative_start_date', comparativeStartDate);
      params.append('comparative_end_date', comparativeEndDate);
    }
    const response = await axiosInstance.get(`/reporting/income-statement?${params}`);
    return response.data;
  },

  getCashFlowStatement: async (startDate: string, endDate: string): Promise<CashFlowData> => {
    const params = new URLSearchParams({ 
      start_date: startDate, 
      end_date: endDate 
    });
    const response = await axiosInstance.get(`/reporting/cash-flow?${params}`);
    return response.data;
  },

  // AR Reports
  getDetailedARAging: async (asOfDate: string): Promise<ARAgingDetail[]> => {
    const response = await axiosInstance.get(`/reporting/ar-aging-detail?as_of_date=${asOfDate}`);
    return response.data;
  },

  // AP Reports
  getDetailedAPAging: async (asOfDate: string): Promise<APAgingDetail[]> => {
    const response = await axiosInstance.get(`/reporting/ap-aging-detail?as_of_date=${asOfDate}`);
    return response.data;
  },

  // GL Reports
  getCashbookReport: async (
    glAccountId: number, 
    startDate: string, 
    endDate: string
  ): Promise<CashbookData> => {
    const params = new URLSearchParams({
      gl_account_id: glAccountId.toString(),
      start_date: startDate,
      end_date: endDate
    });
    const response = await axiosInstance.get(`/reporting/cashbook?${params}`);
    return response.data;
  },

  getAccountTransactions: async (
    accountCode: string,
    startDate: string,
    endDate: string
  ): Promise<AccountTransaction[]> => {
    const params = new URLSearchParams({
      account_code: accountCode,
      start_date: startDate,
      end_date: endDate
    });
    const response = await axiosInstance.get(`/reporting/account-transactions?${params}`);
    return response.data;
  },

  getCustomerTransactions: async (
    customerId: number,
    asOfDate: string
  ): Promise<CustomerTransaction[]> => {
    const params = new URLSearchParams({
      customer_id: customerId.toString(),
      as_of_date: asOfDate
    });
    const response = await axiosInstance.get(`/reporting/customer-transactions?${params}`);
    return response.data;
  },

  // Report Templates
  getReportTemplates: async (reportType?: string): Promise<ReportTemplate[]> => {
    const params = reportType ? `?report_type=${reportType}` : '';
    const response = await axiosInstance.get(`/reporting/templates${params}`);
    return response.data;
  },

  createReportTemplate: async (template: Partial<ReportTemplate>): Promise<ReportTemplate> => {
    const response = await axiosInstance.post('/reporting/templates', template);
    return response.data;
  },

  updateReportTemplate: async (id: number, template: Partial<ReportTemplate>): Promise<ReportTemplate> => {
    const response = await axiosInstance.put(`/reporting/templates/${id}`, template);
    return response.data;
  },

  deleteReportTemplate: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/reporting/templates/${id}`);
  },

  // Bank Reconciliation
  createBankReconciliation: async (reconciliation: any): Promise<any> => {
    const response = await axiosInstance.post('/reporting/bank-reconciliation', reconciliation);
    return response.data;
  },

  getBankReconciliations: async (): Promise<any[]> => {
    const response = await axiosInstance.get('/reporting/bank-reconciliation');
    return response.data;
  }
};

export default reportingService;
