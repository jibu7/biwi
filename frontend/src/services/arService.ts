import { axiosInstance } from '@/lib/axiosInstance';
import { useAuthStore } from '@/store/authStore';
import {
  Customer,
  CustomerCreate,
  CustomerUpdate,
  CustomerWithAnalytics,
  CustomerWriteOffSummary,
  CustomerCreditAnalysis,
  SalesRepresentative,
  SalesRepresentativeCreate,
  SalesRepresentativeUpdate,
  ARTransactionType,
  ARTransactionTypeCreate,
  ARTransactionTypeUpdate,
  ARTransaction,
  ARTransactionCreate,
  ARTransactionUpdate,
  ARAllocation,
  ARAllocationCreate,
  ARDefaults,
  ARDefaultsUpdate,
  ARWriteOff,
  ARWriteOffCreate,
  ARWriteOffUpdate,
  ARWriteOffApproval,
  CustomerAgingReportItem,
  CustomerStatementItem,
  BadDebtExpenseReport,
  ARAgingWithWriteoffs,
  WriteOffRecovery,
} from '@/types/ar';

// Add interfaces for tax and currency
interface ARTransactionWithTax {
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
  currencyId?: string;
  exchangeRate?: number;
  foreignCurrencyAmount?: number;
  baseCurrencyAmount?: number;
  taxLines?: ARTaxLine[];
}

interface ARTaxLine {
  taxTypeId: string;
  taxableAmount: number;
  taxAmount: number;
}

// Extend ARTransactionCreate to include tax and currency fields
interface ARInvoiceCreateSchema extends ARTransactionCreate {
  currencyId?: string;
  exchangeRate?: number;
  foreignCurrencyAmount?: number;
  baseCurrencyAmount?: number;
  taxLines?: ARTaxLine[];
}

class ARService {
  private getCompanyId(): number {
    const { selectedCompanyId } = useAuthStore.getState();
    if (!selectedCompanyId) {
      throw new Error('No company selected');
    }
    return selectedCompanyId;
  }

  async getCustomers(skip = 0, limit = 100) {
    const response = await axiosInstance.get('/ar/customers', {
      params: { skip, limit },
      headers: {
        'X-Tenant-ID': this.getCompanyId().toString()
      }
    });
    return response.data;
  }

  async createCustomer(customerData: CustomerCreate) {
    const response = await axiosInstance.post('/ar/customers', customerData, {
      headers: {
        'X-Tenant-ID': this.getCompanyId().toString()
      }
    });
    return response.data;
  }

  async createARTransaction(transactionData: ARTransactionCreate) {
    const response = await axiosInstance.post('/ar/transactions', transactionData, {
      headers: {
        'X-Tenant-ID': this.getCompanyId().toString()
      }
    });
    return response.data;
  }

  async getCustomerAgeing(asOfDate: string) {
    const response = await axiosInstance.get('/ar/reports/ageing', {
      params: { as_of_date: asOfDate },
      headers: {
        'X-Tenant-ID': this.getCompanyId().toString()
      }
    });
    return response.data;
  }

  // Additional methods with tenant awareness
  async getCustomer(id: number): Promise<Customer> {
    const response = await axiosInstance.get(`/ar/customers/${id}`, {
      headers: {
        'X-Tenant-ID': this.getCompanyId().toString()
      }
    });
    return response.data;
  }

  async updateCustomer(id: number, data: CustomerUpdate): Promise<Customer> {
    const response = await axiosInstance.put(`/ar/customers/${id}`, data, {
      headers: {
        'X-Tenant-ID': this.getCompanyId().toString()
      }
    });
    return response.data;
  }

  async deleteCustomer(id: number): Promise<void> {
    await axiosInstance.delete(`/ar/customers/${id}`, {
      headers: {
        'X-Tenant-ID': this.getCompanyId().toString()
      }
    });
  }

  async getARTransactions(params?: {
    customer_id?: number;
    from_date?: string;
    to_date?: string;
    skip?: number;
    limit?: number;
  }): Promise<ARTransaction[]> {
    const response = await axiosInstance.get('/ar/transactions', { 
      params,
      headers: {
        'X-Tenant-ID': this.getCompanyId().toString()
      }
    });
    return response.data;
  }

  async getARTransaction(id: number): Promise<ARTransaction> {
    const response = await axiosInstance.get(`/ar/transactions/${id}`, {
      headers: {
        'X-Tenant-ID': this.getCompanyId().toString()
      }
    });
    return response.data;
  }

  async updateARTransaction(id: number, data: ARTransactionUpdate): Promise<ARTransaction> {
    const response = await axiosInstance.put(`/ar/transactions/${id}`, data, {
      headers: {
        'X-Tenant-ID': this.getCompanyId().toString()
      }
    });
    return response.data;
  }

  async postARTransaction(id: number): Promise<ARTransaction> {
    const response = await axiosInstance.post(`/ar/transactions/${id}/post`, {}, {
      headers: {
        'X-Tenant-ID': this.getCompanyId().toString()
      }
    });
    return response.data;
  }
}

export const arService = new ARService();

// Legacy exports for backward compatibility
export const customerService = {
  getAll: () => arService.getCustomers(),
  getById: (id: number) => arService.getCustomer(id),
  create: (data: CustomerCreate) => arService.createCustomer(data),
  update: (id: number, data: CustomerUpdate) => arService.updateCustomer(id, data),
  delete: (id: number) => arService.deleteCustomer(id),
};

export const arTransactionService = {
  getAll: (params?: any) => arService.getARTransactions(params),
  getById: (id: number) => arService.getARTransaction(id),
  create: (data: ARTransactionCreate) => arService.createARTransaction(data),
  update: (id: number, data: ARTransactionUpdate) => arService.updateARTransaction(id, data),
  post: (id: number) => arService.postARTransaction(id),
};
