import axiosInstance from '@/lib/axiosInstance';

export interface TaxSummaryData {
  salesTaxes: Record<string, {
    rate: number;
    taxAmount: number;
  }>;
  purchaseTaxes: Record<string, {
    rate: number;
    taxAmount: number;
  }>;
  totals: {
    totalSalesTax: number;
    totalPurchaseTax: number;
    netTaxPayable: number;
  };
}

export interface TaxDetailedReport {
  sales_transactions: Array<{
    transaction_id: number;
    transaction_date: string;
    customer_name: string;
    reference: string;
    net_amount: number;
    tax_amount: number;
    tax_type: string;
    tax_rate: number;
  }>;
  purchase_transactions: Array<{
    transaction_id: number;
    transaction_date: string;
    supplier_name: string;
    reference: string;
    net_amount: number;
    tax_amount: number;
    tax_type: string;
    tax_rate: number;
  }>;
  summary: TaxSummaryData;
}

export interface TaxReturnData {
  period_start: string;
  period_end: string;
  sales_tax_collected: number;
  purchase_tax_paid: number;
  net_tax_payable: number;
  tax_breakdowns: Array<{
    tax_type: string;
    sales_tax: number;
    purchase_tax: number;
    net_amount: number;
  }>;
}

export interface MultiCurrencyTaxReport {
  base_currency: string;
  currencies: Record<string, {
    sales_tax: number;
    purchase_tax: number;
    net_tax_payable: number;
    exchange_rates: Record<string, number>;
  }>;
  base_currency_summary: TaxSummaryData;
}

export const taxReportService = {
  getTaxSummary: async (startDate: Date, endDate: Date): Promise<TaxSummaryData> => {
    const response = await axiosInstance.get('/tax-reports/summary', {
      params: {
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
      },
    });
    return response.data;
  },

  getDetailedTaxReport: async (startDate: Date, endDate: Date): Promise<TaxDetailedReport> => {
    const response = await axiosInstance.get('/tax-reports/detailed', {
      params: {
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
      },
    });
    return response.data;
  },

  getTaxReturnData: async (startDate: Date, endDate: Date): Promise<TaxReturnData> => {
    const response = await axiosInstance.get('/tax-reports/tax-return', {
      params: {
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
      },
    });
    return response.data;
  },

  getMultiCurrencyTaxReport: async (startDate: Date, endDate: Date): Promise<MultiCurrencyTaxReport> => {
    const response = await axiosInstance.get('/tax-reports/multi-currency', {
      params: {
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
      },
    });
    return response.data;
  },
};
