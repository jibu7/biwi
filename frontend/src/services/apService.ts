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
  private getCompanyId(): number {
    const { selectedCompanyId } = useAuthStore.getState();
    if (!selectedCompanyId) {
      throw new Error('No company selected');
    }
    return selectedCompanyId;
  }

  async getSuppliers(includeInactive = false, skip = 0, limit = 100): Promise<Supplier[]> {
    const response = await axiosInstance.get('/ap/suppliers', {
      params: { include_inactive: includeInactive, skip, limit },
      headers: {
        'X-Tenant-ID': this.getCompanyId().toString()
      }
    });
    return response.data;
  }

  async getSupplier(id: number): Promise<Supplier> {
    const response = await axiosInstance.get(`/ap/suppliers/${id}`, {
      headers: {
        'X-Tenant-ID': this.getCompanyId().toString()
      }
    });
    return response.data;
  }

  async createSupplier(data: SupplierCreate): Promise<Supplier> {
    const response = await axiosInstance.post('/ap/suppliers', data, {
      headers: {
        'X-Tenant-ID': this.getCompanyId().toString()
      }
    });
    return response.data;
  }

  async updateSupplier(id: number, data: SupplierUpdate): Promise<Supplier> {
    const response = await axiosInstance.put(`/ap/suppliers/${id}`, data, {
      headers: {
        'X-Tenant-ID': this.getCompanyId().toString()
      }
    });
    return response.data;
  }

  async deleteSupplier(id: number): Promise<Supplier> {
    const response = await axiosInstance.delete(`/ap/suppliers/${id}`, {
      headers: {
        'X-Tenant-ID': this.getCompanyId().toString()
      }
    });
    return response.data;
  }

  async getAPTransactionTypes(): Promise<APTransactionType[]> {
    const response = await axiosInstance.get('/ap/transaction-types', {
      headers: {
        'X-Tenant-ID': this.getCompanyId().toString()
      }
    });
    return response.data;
  }

  async createAPTransactionType(data: APTransactionTypeCreate): Promise<APTransactionType> {
    const response = await axiosInstance.post('/ap/transaction-types', data, {
      headers: {
        'X-Tenant-ID': this.getCompanyId().toString()
      }
    });
    return response.data;
  }

  async getAPTransactions(params?: {
    supplier_id?: number;
    from_date?: string;
    to_date?: string;
    skip?: number;
    limit?: number;
  }): Promise<APTransaction[]> {
    const response = await axiosInstance.get('/ap/transactions', {
      params,
      headers: {
        'X-Tenant-ID': this.getCompanyId().toString()
      }
    });
    return response.data;
  }

  async createAPTransaction(data: APTransactionCreate): Promise<APTransaction> {
    const response = await axiosInstance.post('/ap/transactions', data, {
      headers: {
        'X-Tenant-ID': this.getCompanyId().toString()
      }
    });
    return response.data;
  }

  async getSupplierAgeing(asOfDate: string): Promise<SupplierAgeing[]> {
    const response = await axiosInstance.get('/ap/reports/ageing', {
      params: { as_of_date: asOfDate },
      headers: {
        'X-Tenant-ID': this.getCompanyId().toString()
      }
    });
    return response.data;
  }

  async getSupplierStatement(
    supplierId: number,
    fromDate: string,
    toDate: string
  ): Promise<SupplierStatement[]> {
    const response = await axiosInstance.get(`/ap/reports/supplier-statement/${supplierId}`, {
      params: { from_date: fromDate, to_date: toDate },
      headers: {
        'X-Tenant-ID': this.getCompanyId().toString()
      }
    });
    return response.data;
  }

  async createAllocation(data: APAllocationCreate): Promise<APAllocation> {
    const response = await axiosInstance.post('/ap/allocations', data, {
      headers: {
        'X-Tenant-ID': this.getCompanyId().toString()
      }
    });
    return response.data;
  }

  async getDefaults(): Promise<APDefaults> {
    const response = await axiosInstance.get('/ap/defaults', {
      headers: {
        'X-Tenant-ID': this.getCompanyId().toString()
      }
    });
    return response.data;
  }

  async updateDefaults(data: APDefaultsUpdate): Promise<APDefaults> {
    const response = await axiosInstance.put('/ap/defaults', data, {
      headers: {
        'X-Tenant-ID': this.getCompanyId().toString()
      }
    });
    return response.data;
  }
}

export const apService = new APService();
