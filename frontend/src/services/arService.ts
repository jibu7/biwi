import axiosInstance from '@/lib/axiosInstance';
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

// Customer API functions
export const customerService = {
  getAll: async (): Promise<Customer[]> => {
    try {
      const response = await axiosInstance.get('/ar/customers');
      console.log('Customer API Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }
  },

  getById: async (id: number): Promise<Customer> => {
    try {
      const response = await axiosInstance.get(`/ar/customers/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching customer:', error);
      throw error;
    }
  },

  create: async (data: CustomerCreate): Promise<Customer> => {
    try {
      console.log('Creating customer with data:', data);
      const response = await axiosInstance.post('/ar/customers', data);
      console.log('Customer created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  },

  update: async (id: number, data: CustomerUpdate): Promise<Customer> => {
    try {
      const response = await axiosInstance.put(`/ar/customers/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  },

  delete: async (id: number): Promise<void> => {
    try {
      await axiosInstance.delete(`/ar/customers/${id}`);
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  },

  // Customer Analytics
  getCustomerAnalytics: async (customerId: number): Promise<CustomerWithAnalytics> => {
    const response = await axiosInstance.get(`/ar/customers/${customerId}/analytics`);
    return response.data;
  },

  getCustomerWriteOffSummary: async (customerId: number): Promise<CustomerWriteOffSummary> => {
    const response = await axiosInstance.get(`/ar/customers/${customerId}/writeoff-summary`);
    return response.data;
  },

  getCustomerCreditAnalysis: async (customerId: number): Promise<CustomerCreditAnalysis> => {
    const response = await axiosInstance.get(`/ar/customers/${customerId}/credit-analysis`);
    return response.data;
  },
};

// Sales Representative API functions
export const salesRepService = {
  getAll: async (): Promise<SalesRepresentative[]> => {
    const response = await axiosInstance.get('/ar/sales-representatives');
    return response.data;
  },

  getById: async (id: number): Promise<SalesRepresentative> => {
    const response = await axiosInstance.get(`/ar/sales-representatives/${id}`);
    return response.data;
  },

  create: async (data: SalesRepresentativeCreate): Promise<SalesRepresentative> => {
    const response = await axiosInstance.post('/ar/sales-representatives', data);
    return response.data;
  },

  update: async (id: number, data: SalesRepresentativeUpdate): Promise<SalesRepresentative> => {
    const response = await axiosInstance.put(`/ar/sales-representatives/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/ar/sales-representatives/${id}`);
  },
};

// AR Transaction Type API functions
export const arTransactionTypeService = {
  getAll: async (): Promise<ARTransactionType[]> => {
    const response = await axiosInstance.get('/ar/transaction-types');
    return response.data;
  },

  getById: async (id: number): Promise<ARTransactionType> => {
    const response = await axiosInstance.get(`/ar/transaction-types/${id}`);
    return response.data;
  },

  create: async (data: ARTransactionTypeCreate): Promise<ARTransactionType> => {
    const response = await axiosInstance.post('/ar/transaction-types', data);
    return response.data;
  },

  update: async (id: number, data: ARTransactionTypeUpdate): Promise<ARTransactionType> => {
    const response = await axiosInstance.put(`/ar/transaction-types/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/ar/transaction-types/${id}`);
  },
};

// AR Transaction API functions
export const arTransactionService = {
  getAll: async (params?: {
    customer_id?: number;
    from_date?: string;
    to_date?: string;
    skip?: number;
    limit?: number;
  }): Promise<ARTransaction[]> => {
    const response = await axiosInstance.get('/ar/transactions', { params });
    return response.data;
  },

  getByType: async (baseType: string, params?: {
    customer_id?: number;
    from_date?: string;
    to_date?: string;
    skip?: number;
    limit?: number;
  }): Promise<ARTransaction[]> => {
    const response = await axiosInstance.get('/ar/transactions', { 
      params: { ...params, base_type: baseType } 
    });
    return response.data;
  },

  getById: async (id: number): Promise<ARTransaction> => {
    const response = await axiosInstance.get(`/ar/transactions/${id}`);
    return response.data;
  },

  create: async (data: ARTransactionCreate): Promise<ARTransaction> => {
    const response = await axiosInstance.post('/ar/transactions', data);
    return response.data;
  },

  update: async (id: number, data: ARTransactionUpdate): Promise<ARTransaction> => {
    const response = await axiosInstance.put(`/ar/transactions/${id}`, data);
    return response.data;
  },

  post: async (id: number): Promise<ARTransaction> => {
    const response = await axiosInstance.post(`/ar/transactions/${id}/post`);
    return response.data;
  },
};

// AR Allocation API functions
export const arAllocationService = {
  getAll: async (params?: {
    customer_id?: number;
    skip?: number;
    limit?: number;
  }): Promise<ARAllocation[]> => {
    const response = await axiosInstance.get('/ar/allocations', { params });
    return response.data;
  },

  create: async (data: ARAllocationCreate): Promise<ARAllocation> => {
    const response = await axiosInstance.post('/ar/allocations', data);
    return response.data;
  },
};

// AR Defaults API functions
export const arDefaultsService = {
  get: async (): Promise<ARDefaults> => {
    const response = await axiosInstance.get('/ar/defaults');
    return response.data;
  },

  update: async (data: ARDefaultsUpdate): Promise<ARDefaults> => {
    const response = await axiosInstance.put('/ar/defaults', data);
    return response.data;
  },
};

// AR Reports API functions
export const arReportsService = {
  getCustomerAging: async (asOfDate: string): Promise<CustomerAgingReportItem[]> => {
    const response = await axiosInstance.get('/ar/reports/customer-aging', {
      params: { as_of_date: asOfDate },
    });
    return response.data;
  },

  getCustomerStatement: async (
    customerId: number,
    fromDate: string,
    toDate: string
  ): Promise<CustomerStatementItem[]> => {
    const response = await axiosInstance.get(`/ar/reports/customer-statement/${customerId}`, {
      params: { from_date: fromDate, to_date: toDate },
    });
    return response.data;
  },

  // Financial Reporting
  getBadDebtExpenseReport: async (startDate: string, endDate: string): Promise<BadDebtExpenseReport> => {
    const response = await axiosInstance.get('/ar/reports/bad-debt-expense', {
      params: { start_date: startDate, end_date: endDate }
    });
    return response.data;
  },

  getARAgingWithWriteoffs: async (asOfDate: string): Promise<ARAgingWithWriteoffs[]> => {
    const response = await axiosInstance.get('/ar/reports/aging-with-writeoffs', {
      params: { as_of_date: asOfDate }
    });
    return response.data;
  },

  getWriteOffRecoveries: async (startDate: string, endDate: string): Promise<WriteOffRecovery[]> => {
    const response = await axiosInstance.get('/ar/reports/writeoff-recoveries', {
      params: { start_date: startDate, end_date: endDate }
    });
    return response.data;
  },
};

// Write-off service functions
export const writeOffService = {
  getAll: async (): Promise<ARWriteOff[]> => {
    try {
      const response = await axiosInstance.get('/ar/writeoffs');
      return response.data;
    } catch (error) {
      console.error('Error fetching write-offs:', error);
      throw error;
    }
  },

  getById: async (id: number): Promise<ARWriteOff> => {
    try {
      const response = await axiosInstance.get(`/ar/writeoffs/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching write-off:', error);
      throw error;
    }
  },

  create: async (data: ARWriteOffCreate): Promise<ARWriteOff> => {
    try {
      console.log('Creating write-off with data:', data);
      const response = await axiosInstance.post('/ar/writeoffs', data);
      console.log('Write-off created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating write-off:', error);
      throw error;
    }
  },

  update: async (id: number, data: ARWriteOffUpdate): Promise<ARWriteOff> => {
    try {
      const response = await axiosInstance.put(`/ar/writeoffs/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating write-off:', error);
      throw error;
    }
  },

  approve: async (id: number, approval: ARWriteOffApproval): Promise<ARWriteOff> => {
    try {
      const response = await axiosInstance.post(`/ar/writeoffs/${id}/approve`, approval);
      return response.data;
    } catch (error) {
      console.error('Error approving write-off:', error);
      throw error;
    }
  },

  reject: async (id: number, approval: ARWriteOffApproval): Promise<ARWriteOff> => {
    try {
      const response = await axiosInstance.post(`/ar/writeoffs/${id}/reject`, approval);
      return response.data;
    } catch (error) {
      console.error('Error rejecting write-off:', error);
      throw error;
    }
  },

  delete: async (id: number): Promise<void> => {
    try {
      await axiosInstance.delete(`/ar/writeoffs/${id}`);
    } catch (error) {
      console.error('Error deleting write-off:', error);
      throw error;
    }
  },
};
