import { axiosInstance } from '@/lib/axiosInstance';
import { useAuthStore } from '@/store/authStore';
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

class APService {
  private getCompanyId = (): number => {
    const { selectedCompanyId } = useAuthStore.getState();
    if (!selectedCompanyId) {
      throw new Error('No company selected');
    }
    return selectedCompanyId;
  };

  getSuppliers = async (includeInactive = false, skip = 0, limit = 100): Promise<Supplier[]> => {
    const response = await axiosInstance.get('/ap/suppliers', {
      params: { include_inactive: includeInactive, skip, limit },
      headers: {
        'X-Tenant-ID': this.getCompanyId().toString()
      }
    });
    return response.data;
  };

  getSupplier = async (id: number): Promise<Supplier> => {
    const response = await axiosInstance.get(`/ap/suppliers/${id}`, {
      headers: {
        'X-Tenant-ID': this.getCompanyId().toString()
      }
    });
    return response.data;
  };

  createSupplier = async (data: SupplierCreate): Promise<Supplier> => {
    const response = await axiosInstance.post('/ap/suppliers', data, {
      headers: {
        'X-Tenant-ID': this.getCompanyId().toString()
      }
    });
    return response.data;
  };

  updateSupplier = async (id: number, data: SupplierUpdate): Promise<Supplier> => {
    const response = await axiosInstance.put(`/ap/suppliers/${id}`, data, {
      headers: {
        'X-Tenant-ID': this.getCompanyId().toString()
      }
    });
    return response.data;
  };

  deleteSupplier = async (id: number): Promise<Supplier> => {
    const response = await axiosInstance.delete(`/ap/suppliers/${id}`, {
      headers: {
        'X-Tenant-ID': this.getCompanyId().toString()
      }
    });
    return response.data;
  };

  getAPTransactionTypes = async (): Promise<APTransactionType[]> => {
    const response = await axiosInstance.get('/ap/transaction-types', {
      headers: {
        'X-Tenant-ID': this.getCompanyId().toString()
      }
    });
    return response.data;
  };

  createAPTransactionType = async (data: APTransactionTypeCreate): Promise<APTransactionType> => {
    const response = await axiosInstance.post('/ap/transaction-types', data, {
      headers: {
        'X-Tenant-ID': this.getCompanyId().toString()
      }
    });
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
      params,
      headers: {
        'X-Tenant-ID': this.getCompanyId().toString()
      }
    });
    return response.data;
  };

  getAPTransaction = async (id: number): Promise<APTransaction> => {
    const response = await axiosInstance.get(`/ap/transactions/${id}`, {
      headers: {
        'X-Tenant-ID': this.getCompanyId().toString()
      }
    });
    return response.data;
  };

  createAPTransaction = async (data: APTransactionCreate): Promise<APTransaction> => {
    const response = await axiosInstance.post('/ap/transactions', data, {
      headers: {
        'X-Tenant-ID': this.getCompanyId().toString()
      }
    });
    return response.data;
  };

  getSupplierAgeing = async (asOfDate: string): Promise<SupplierAgeing[]> => {
    const response = await axiosInstance.get('/ap/reports/ageing', {
      params: { as_of_date: asOfDate },
      headers: {
        'X-Tenant-ID': this.getCompanyId().toString()
      }
    });
    return response.data;
  };

  getSupplierStatement = async (
    supplierId: number,
    fromDate: string,
    toDate: string
  ): Promise<SupplierStatement[]> => {
    const response = await axiosInstance.get(`/ap/reports/supplier-statement/${supplierId}`, {
      params: { from_date: fromDate, to_date: toDate },
      headers: {
        'X-Tenant-ID': this.getCompanyId().toString()
      }
    });
    return response.data;
  };

  createAllocation = async (data: APAllocationCreate): Promise<APAllocation> => {
    const response = await axiosInstance.post('/ap/allocations', data, {
      headers: {
        'X-Tenant-ID': this.getCompanyId().toString()
      }
    });
    return response.data;
  };

  getDefaults = async (): Promise<APDefaults> => {
    const response = await axiosInstance.get('/ap/defaults', {
      headers: {
        'X-Tenant-ID': this.getCompanyId().toString()
      }
    });
    return response.data;
  };

  updateDefaults = async (data: APDefaultsUpdate): Promise<APDefaults> => {
    const response = await axiosInstance.put('/ap/defaults', data, {
      headers: {
        'X-Tenant-ID': this.getCompanyId().toString()
      }
    });
    return response.data;
  };
}

export const apService = new APService();
