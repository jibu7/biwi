import { axiosInstance } from '@/lib/axiosInstance';
import {
  Supplier,
  SupplierCreate,
  SupplierUpdate,
  APTransactionType,
  APTransactionTypeCreate,
  APTransaction,
  APTransactionCreate,
  APAllocation,
  APAllocationCreate,
  APDefaults,
  APDefaultsUpdate,
  SupplierAgeing,
  SupplierStatement,
} from '@/types/ap';

class APService {

  getSuppliers = async (includeInactive = false, skip = 0, limit = 100): Promise<Supplier[]> => {
    const response = await axiosInstance.get('/ap/suppliers', {
      params: { include_inactive: includeInactive, skip, limit }
    });
    return response.data;
  };

  getSupplier = async (id: number): Promise<Supplier> => {
    const response = await axiosInstance.get(`/ap/suppliers/${id}`);
    return response.data;
  };

  createSupplier = async (data: SupplierCreate): Promise<Supplier> => {
    const response = await axiosInstance.post('/ap/suppliers', data);
    return response.data;
  };

  updateSupplier = async (id: number, data: SupplierUpdate): Promise<Supplier> => {
    const response = await axiosInstance.put(`/ap/suppliers/${id}`, data);
    return response.data;
  };

  deleteSupplier = async (id: number): Promise<Supplier> => {
    const response = await axiosInstance.delete(`/ap/suppliers/${id}`);
    return response.data;
  };

  getAPTransactionTypes = async (): Promise<APTransactionType[]> => {
    const response = await axiosInstance.get('/ap/transaction-types');
    return response.data;
  };

  createAPTransactionType = async (data: APTransactionTypeCreate): Promise<APTransactionType> => {
    const response = await axiosInstance.post('/ap/transaction-types', data);
    return response.data;
  };

  getAPTransactions = async (params?: {
    supplier_id?: number;
    from_date?: string;
    to_date?: string;
    skip?: number;
    limit?: number;
  }): Promise<APTransaction[]> => {
    const response = await axiosInstance.get('/ap/transactions', {
      params
    });
    return response.data;
  };

  getAPTransaction = async (id: number): Promise<APTransaction> => {
    const response = await axiosInstance.get(`/ap/transactions/${id}`);
    return response.data;
  };

  createAPTransaction = async (data: APTransactionCreate): Promise<APTransaction> => {
    const response = await axiosInstance.post('/ap/transactions', data);
    return response.data;
  };

  getSupplierAgeing = async (asOfDate: string): Promise<SupplierAgeing[]> => {
    const response = await axiosInstance.get('/ap/reports/ageing', {
      params: { as_of_date: asOfDate }
    });
    return response.data;
  };

  getSupplierStatement = async (
    supplierId: number,
    fromDate: string,
    toDate: string
  ): Promise<SupplierStatement[]> => {
    const response = await axiosInstance.get(`/ap/reports/supplier-statement/${supplierId}`, {
      params: { from_date: fromDate, to_date: toDate }
    });
    return response.data;
  };

  createAllocation = async (data: APAllocationCreate): Promise<APAllocation> => {
    const response = await axiosInstance.post('/ap/allocations', data);
    return response.data;
  };

  getDefaults = async (): Promise<APDefaults> => {
    const response = await axiosInstance.get('/ap/defaults');
    return response.data;
  };

  updateDefaults = async (data: APDefaultsUpdate): Promise<APDefaults> => {
    const response = await axiosInstance.put('/ap/defaults', data);
    return response.data;
  };
}

export const apService = new APService();
