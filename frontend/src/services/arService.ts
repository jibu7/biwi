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

  // AR Transaction Type methods
  async getARTransactionTypes(skip = 0, limit = 100): Promise<ARTransactionType[]> {
    const response = await axiosInstance.get('/ar/transaction-types', {
      params: { skip, limit },
      headers: {
        'X-Tenant-ID': this.getCompanyId().toString()
      }
    });
    return response.data;
  }

  async createARTransactionType(data: ARTransactionTypeCreate): Promise<ARTransactionType> {
    const response = await axiosInstance.post('/ar/transaction-types', data, {
      headers: {
        'X-Tenant-ID': this.getCompanyId().toString()
      }
    });
    return response.data;
  }

  async getARTransactionType(id: number): Promise<ARTransactionType> {
    const response = await axiosInstance.get(`/ar/transaction-types/${id}`, {
      headers: {
        'X-Tenant-ID': this.getCompanyId().toString()
      }
    });
    return response.data;
  }

  async updateARTransactionType(id: number, data: ARTransactionTypeUpdate): Promise<ARTransactionType> {
    const response = await axiosInstance.put(`/ar/transaction-types/${id}`, data, {
      headers: {
        'X-Tenant-ID': this.getCompanyId().toString()
      }
    });
    return response.data;
  }

  async deleteARTransactionType(id: number): Promise<void> {
    await axiosInstance.delete(`/ar/transaction-types/${id}`, {
      headers: {
        'X-Tenant-ID': this.getCompanyId().toString()
      }
    });
  }

  // AR Defaults methods
  async getARDefaults(): Promise<ARDefaults> {
    const response = await axiosInstance.get('/ar/defaults', {
      headers: {
        'X-Tenant-ID': this.getCompanyId().toString()
      }
    });
    return response.data;
  }

  async updateARDefaults(data: ARDefaultsUpdate): Promise<ARDefaults> {
    const response = await axiosInstance.put('/ar/defaults', data, {
      headers: {
        'X-Tenant-ID': this.getCompanyId().toString()
      }
    });
    return response.data;
  }

  // Sales Representative methods
  async getSalesRepresentatives(skip = 0, limit = 100): Promise<SalesRepresentative[]> {
    const response = await axiosInstance.get('/ar/sales-representatives', {
      params: { skip, limit },
      headers: {
        'X-Tenant-ID': this.getCompanyId().toString()
      }
    });
    return response.data;
  }

  async createSalesRepresentative(data: SalesRepresentativeCreate): Promise<SalesRepresentative> {
    const response = await axiosInstance.post('/ar/sales-representatives', data, {
      headers: {
        'X-Tenant-ID': this.getCompanyId().toString()
      }
    });
    return response.data;
  }

  async getSalesRepresentative(id: number): Promise<SalesRepresentative> {
    const response = await axiosInstance.get(`/ar/sales-representatives/${id}`, {
      headers: {
        'X-Tenant-ID': this.getCompanyId().toString()
      }
    });
    return response.data;
  }

  async updateSalesRepresentative(id: number, data: SalesRepresentativeUpdate): Promise<SalesRepresentative> {
    const response = await axiosInstance.put(`/ar/sales-representatives/${id}`, data, {
      headers: {
        'X-Tenant-ID': this.getCompanyId().toString()
      }
    });
    return response.data;
  }

  async deleteSalesRepresentative(id: number): Promise<void> {
    await axiosInstance.delete(`/ar/sales-representatives/${id}`, {
      headers: {
        'X-Tenant-ID': this.getCompanyId().toString()
      }
    });
  }

  // AR Allocation methods
  async getARAllocations(skip = 0, limit = 100): Promise<ARAllocation[]> {
    const response = await axiosInstance.get('/ar/allocations', {
      params: { skip, limit },
      headers: {
        'X-Tenant-ID': this.getCompanyId().toString()
      }
    });
    return response.data;
  }

  async createARAllocation(data: ARAllocationCreate): Promise<ARAllocation> {
    const response = await axiosInstance.post('/ar/allocations', data, {
      headers: {
        'X-Tenant-ID': this.getCompanyId().toString()
      }
    });
    return response.data;
  }

  async getARAllocation(id: number): Promise<ARAllocation> {
    const response = await axiosInstance.get(`/ar/allocations/${id}`, {
      headers: {
        'X-Tenant-ID': this.getCompanyId().toString()
      }
    });
    return response.data;
  }

  async deleteARAllocation(id: number): Promise<void> {
    await axiosInstance.delete(`/ar/allocations/${id}`, {
      headers: {
        'X-Tenant-ID': this.getCompanyId().toString()
      }
    });
  }

  // AR Write-off methods
  async getARWriteOffs(skip = 0, limit = 100): Promise<ARWriteOff[]> {
    const response = await axiosInstance.get('/ar/writeoffs', {
      params: { skip, limit },
      headers: {
        'X-Tenant-ID': this.getCompanyId().toString()
      }
    });
    return response.data;
  }

  async createARWriteOff(data: ARWriteOffCreate): Promise<ARWriteOff> {
    const response = await axiosInstance.post('/ar/writeoffs', data, {
      headers: {
        'X-Tenant-ID': this.getCompanyId().toString()
      }
    });
    return response.data;
  }

  async getARWriteOff(id: number): Promise<ARWriteOff> {
    const response = await axiosInstance.get(`/ar/writeoffs/${id}`, {
      headers: {
        'X-Tenant-ID': this.getCompanyId().toString()
      }
    });
    return response.data;
  }

  async updateARWriteOff(id: number, data: ARWriteOffUpdate): Promise<ARWriteOff> {
    const response = await axiosInstance.put(`/ar/writeoffs/${id}`, data, {
      headers: {
        'X-Tenant-ID': this.getCompanyId().toString()
      }
    });
    return response.data;
  }

  async approveARWriteOff(id: number, approval: ARWriteOffApproval): Promise<ARWriteOff> {
    const response = await axiosInstance.post(`/ar/writeoffs/${id}/approve`, approval, {
      headers: {
        'X-Tenant-ID': this.getCompanyId().toString()
      }
    });
    return response.data;
  }

  async rejectARWriteOff(id: number, approval: ARWriteOffApproval): Promise<ARWriteOff> {
    const response = await axiosInstance.post(`/ar/writeoffs/${id}/reject`, approval, {
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

export const arTransactionTypeService = {
  getAll: (skip?: number, limit?: number) => arService.getARTransactionTypes(skip, limit),
  getById: (id: number) => arService.getARTransactionType(id),
  create: (data: ARTransactionTypeCreate) => arService.createARTransactionType(data),
  update: (id: number, data: ARTransactionTypeUpdate) => arService.updateARTransactionType(id, data),
  delete: (id: number) => arService.deleteARTransactionType(id),
};

export const arDefaultsService = {
  get: () => arService.getARDefaults(),
  update: (data: ARDefaultsUpdate) => arService.updateARDefaults(data),
};

export const salesRepService = {
  getAll: (skip?: number, limit?: number) => arService.getSalesRepresentatives(skip, limit),
  getById: (id: number) => arService.getSalesRepresentative(id),
  create: (data: SalesRepresentativeCreate) => arService.createSalesRepresentative(data),
  update: (id: number, data: SalesRepresentativeUpdate) => arService.updateSalesRepresentative(id, data),
  delete: (id: number) => arService.deleteSalesRepresentative(id),
};

export const arAllocationService = {
  getAll: (skip?: number, limit?: number) => arService.getARAllocations(skip, limit),
  getById: (id: number) => arService.getARAllocation(id),
  create: (data: ARAllocationCreate) => arService.createARAllocation(data),
  delete: (id: number) => arService.deleteARAllocation(id),
};

export const writeOffService = {
  getAll: (skip?: number, limit?: number) => arService.getARWriteOffs(skip, limit),
  getById: (id: number) => arService.getARWriteOff(id),
  create: (data: ARWriteOffCreate) => arService.createARWriteOff(data),
  update: (id: number, data: ARWriteOffUpdate) => arService.updateARWriteOff(id, data),
  approve: (id: number, approval: ARWriteOffApproval) => arService.approveARWriteOff(id, approval),
  reject: (id: number, approval: ARWriteOffApproval) => arService.rejectARWriteOff(id, approval),
};

// Export createARInvoice function for backward compatibility
export const createARInvoice = (data: ARInvoiceCreateSchema) => arService.createARTransaction(data);

// Export arReportsService for backward compatibility
export const arReportsService = {
  getCustomerAging: (asOfDate: string) => arService.getCustomerAgeing(asOfDate),
  getCustomerStatement: (customerId: number, startDate: string, endDate: string) => 
    arService.getARTransactions({ customer_id: customerId, from_date: startDate, to_date: endDate })
};
