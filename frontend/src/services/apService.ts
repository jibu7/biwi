import axiosInstance from '@/lib/axiosInstance';
import {
  Supplier,
  SupplierCreate,
  SupplierUpdate,
  APTransactionType,
  APTransactionTypeCreate,
  APTransactionTypeUpdate,
  APTransaction,
  APTransactionCreate,
  APAllocation,
  APAllocationCreate,
  APDefaults,
  APDefaultsUpdate,
  SupplierAgeing,
  SupplierStatement,
} from '@/types/ap';

export const apService = {
  // Suppliers
  async getSuppliers(includeInactive = false): Promise<Supplier[]> {
    const response = await axiosInstance.get<Supplier[]>('/ap/suppliers', {
      params: { include_inactive: includeInactive }
    });
    return response.data;
  },

  async getSupplier(id: number): Promise<Supplier> {
    const response = await axiosInstance.get<Supplier>(`/ap/suppliers/${id}`);
    return response.data;
  },

  async createSupplier(data: SupplierCreate): Promise<Supplier> {
    const response = await axiosInstance.post<Supplier>('/ap/suppliers', data);
    return response.data;
  },

  async updateSupplier(id: number, data: SupplierUpdate): Promise<Supplier> {
    const response = await axiosInstance.put<Supplier>(`/ap/suppliers/${id}`, data);
    return response.data;
  },

  async deleteSupplier(id: number): Promise<Supplier> {
    const response = await axiosInstance.delete<Supplier>(`/ap/suppliers/${id}`);
    return response.data;
  },

  // AP Transaction Types
  async getAPTransactionTypes(): Promise<APTransactionType[]> {
    const response = await axiosInstance.get<APTransactionType[]>('/ap/transaction-types');
    return response.data;
  },

  async getAPTransactionType(id: number): Promise<APTransactionType> {
    const response = await axiosInstance.get<APTransactionType>(`/ap/transaction-types/${id}`);
    return response.data;
  },

  async createAPTransactionType(data: APTransactionTypeCreate): Promise<APTransactionType> {
    const response = await axiosInstance.post<APTransactionType>('/ap/transaction-types', data);
    return response.data;
  },

  async updateAPTransactionType(id: number, data: APTransactionTypeUpdate): Promise<APTransactionType> {
    const response = await axiosInstance.put<APTransactionType>(`/ap/transaction-types/${id}`, data);
    return response.data;
  },

  async deleteAPTransactionType(id: number): Promise<APTransactionType> {
    const response = await axiosInstance.delete<APTransactionType>(`/ap/transaction-types/${id}`);
    return response.data;
  },

  // AP Defaults
  async getAPDefaults(): Promise<APDefaults> {
    const response = await axiosInstance.get<APDefaults>('/ap/defaults');
    return response.data;
  },

  async updateAPDefaults(data: APDefaultsUpdate): Promise<APDefaults> {
    const response = await axiosInstance.put<APDefaults>('/ap/defaults', data);
    return response.data;
  },

  // AP Transactions
  async createAPTransaction(data: APTransactionCreate): Promise<APTransaction> {
    const response = await axiosInstance.post<APTransaction>('/ap/transactions', data);
    return response.data;
  },

  async getAPTransactions(params?: {
    skip?: number;
    limit?: number;
    supplier_id?: number;
    transaction_type_id?: number;
    start_date?: string;
    end_date?: string;
  }): Promise<APTransaction[]> {
    const response = await axiosInstance.get<APTransaction[]>('/ap/transactions', { params });
    return response.data;
  },

  async getAPTransaction(id: number): Promise<APTransaction> {
    const response = await axiosInstance.get<APTransaction>(`/ap/transactions/${id}`);
    return response.data;
  },

  // AP Allocations
  async createAPAllocation(data: APAllocationCreate): Promise<APAllocation> {
    const response = await axiosInstance.post<APAllocation>('/ap/allocations', data);
    return response.data;
  },
  async getAPAllocations(params?: {
   skip?: number;
   limit?: number;
   supplier_id?: number;
 }): Promise<APAllocation[]> {
   const response = await axiosInstance.get<APAllocation[]>('/ap/allocations', { params });
   return response.data;
 },

 // Reports
 async getSupplierAgeing(asOfDate: string): Promise<SupplierAgeing[]> {
   const response = await axiosInstance.get<SupplierAgeing[]>('/ap/reports/ageing', {
     params: { as_of_date: asOfDate }
   });
   return response.data;
 },

 async getSupplierListing(): Promise<Supplier[]> {
   const response = await axiosInstance.get<Supplier[]>('/ap/reports/supplier-listing');
   return response.data;
 },

 async getSupplierStatement(
   supplierId: number,
   startDate: string,
   endDate: string
 ): Promise<SupplierStatement> {
   const response = await axiosInstance.get<SupplierStatement>('/ap/reports/statement', {
     params: {
       supplier_id: supplierId,
       start_date: startDate,
       end_date: endDate,
     }
   });
   return response.data;
 },
};
