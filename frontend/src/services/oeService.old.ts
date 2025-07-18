import axiosInstance from '@/lib/axiosInstance';
import { 
  SalesOrder, SalesOrderCreate, 
  PurchaseOrder, PurchaseOrderCreate,
  GoodsReceivedVoucher, GoodsReceivedVoucherCreate,
  OrderDefaults, OrderDefaultsUpdate,
  ARTransaction, APTransaction
} from '@/types/oe';
import { APTransactionCreate } from '@/types/ap';

class OrderEntryService {
  async createSalesOrder(soData: SalesOrderCreate) {
    const response = await axiosInstance.post('/oe/sales-orders', soData);
    return response.data;
  }

  async convertSOToInvoice(soId: number) {
    const response = await axiosInstance.post(`/oe/sales-orders/${soId}/convert-to-invoice`, {});
    return response.data;
  }

  async createPurchaseOrder(poData: PurchaseOrderCreate) {
    const response = await axiosInstance.post('/oe/purchase-orders', poData);
    return response.data;
  }

  async createGRV(grvData: GoodsReceivedVoucherCreate) {
    const response = await axiosInstance.post('/oe/grvs', grvData);
    return response.data;
  }

  async convertGRVToAPInvoice(grvId: number, invoiceDetails: any) {
    const response = await axiosInstance.post(`/oe/grvs/${grvId}/convert-to-ap-invoice`, invoiceDetails);
    return response.data;
  }
}

export const oeService = new OrderEntryService();

// Sales Orders API functions
export const salesOrderService = {
  getAll: async (params?: { skip?: number; limit?: number }): Promise<SalesOrder[]> => {
    const { selectedCompanyId } = useAuthStore.getState();
    const response = await axiosInstance.get('/oe/sales-orders', { 
      params,
      headers: { 'X-Tenant-ID': selectedCompanyId?.toString() || '' }
    });
    return response.data;
  },

  getById: async (id: number): Promise<SalesOrder> => {
    const { selectedCompanyId } = useAuthStore.getState();
    const response = await axiosInstance.get(`/oe/sales-orders/${id}`, {
      headers: { 'X-Tenant-ID': selectedCompanyId?.toString() || '' }
    });
    return response.data;
  },

  create: async (data: SalesOrderCreate): Promise<SalesOrder> => {
    const { selectedCompanyId } = useAuthStore.getState();
    const response = await axiosInstance.post('/oe/sales-orders', data, {
      headers: { 'X-Tenant-ID': selectedCompanyId?.toString() || '' }
    });
    return response.data;
  },

  update: async (id: number, data: Partial<SalesOrder>): Promise<SalesOrder> => {
    const { selectedCompanyId } = useAuthStore.getState();
    const response = await axiosInstance.put(`/oe/sales-orders/${id}`, data, {
      headers: { 'X-Tenant-ID': selectedCompanyId?.toString() || '' }
    });
    return response.data;
  },

  convertToInvoice: async (id: number): Promise<ARTransaction> => {
    const { selectedCompanyId } = useAuthStore.getState();
    const response = await axiosInstance.post(`/oe/sales-orders/${id}/convert-to-invoice`, {}, {
      headers: { 'X-Tenant-ID': selectedCompanyId?.toString() || '' }
    });
    return response.data;
  },
};

// Purchase Orders API functions
export const purchaseOrderService = {
  getAll: async (params?: { skip?: number; limit?: number }): Promise<PurchaseOrder[]> => {
    const { selectedCompanyId } = useAuthStore.getState();
    const response = await axiosInstance.get('/oe/purchase-orders', { 
      params,
      headers: { 'X-Tenant-ID': selectedCompanyId?.toString() || '' }
    });
    return response.data;
  },

  getById: async (id: number): Promise<PurchaseOrder> => {
    const { selectedCompanyId } = useAuthStore.getState();
    const response = await axiosInstance.get(`/oe/purchase-orders/${id}`, {
      headers: { 'X-Tenant-ID': selectedCompanyId?.toString() || '' }
    });
    return response.data;
  },

  create: async (data: PurchaseOrderCreate): Promise<PurchaseOrder> => {
    const { selectedCompanyId } = useAuthStore.getState();
    const response = await axiosInstance.post('/oe/purchase-orders', data, {
      headers: { 'X-Tenant-ID': selectedCompanyId?.toString() || '' }
    });
    // ensure order_number is returned
    return response.data;
  },

  update: async (id: number, data: Partial<PurchaseOrder>): Promise<PurchaseOrder> => {
    const { selectedCompanyId } = useAuthStore.getState();
    const response = await axiosInstance.put(`/oe/purchase-orders/${id}`, data, {
      headers: { 'X-Tenant-ID': selectedCompanyId?.toString() || '' }
    });
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    const { selectedCompanyId } = useAuthStore.getState();
    await axiosInstance.delete(`/oe/purchase-orders/${id}`, {
      headers: { 'X-Tenant-ID': selectedCompanyId?.toString() || '' }
    });
  },
};

// GRVs API functions
export const grvService = {
  getAll: async (params?: { skip?: number; limit?: number }): Promise<GoodsReceivedVoucher[]> => {
    const { selectedCompanyId } = useAuthStore.getState();
    const response = await axiosInstance.get('/oe/grvs', { 
      params,
      headers: { 'X-Tenant-ID': selectedCompanyId?.toString() || '' }
    });
    return response.data;
  },

  getById: async (id: number): Promise<GoodsReceivedVoucher> => {
    const { selectedCompanyId } = useAuthStore.getState();
    const response = await axiosInstance.get(`/oe/grvs/${id}`, {
      headers: { 'X-Tenant-ID': selectedCompanyId?.toString() || '' }
    });
    return response.data;
  },

  create: async (data: GoodsReceivedVoucherCreate): Promise<GoodsReceivedVoucher> => {
    const { selectedCompanyId } = useAuthStore.getState();
    // Format the data to match backend expectations
    const formattedData = {
      supplier_id: data.supplier_id,
      purchase_order_id: data.purchase_order_id,
      grv_date: data.grv_date,
      reference: data.reference || data.supplier_delivery_note,
      notes: data.notes,
      lines: data.lines.map((line) => ({
        item_id: line.item_id,
        description: line.description || 'No description',
        quantity_received: line.quantity_received,
        unit_cost: line.unit_price || line.unit_cost || 0,
        line_total: line.line_total || (line.quantity_received * (line.unit_price || line.unit_cost || 0)),
        purchase_order_line_id: line.purchase_order_line_id
      }))
    };
    
    console.log('Sending GRV data:', formattedData);
    const response = await axiosInstance.post('/oe/grvs', formattedData, {
      headers: { 'X-Tenant-ID': selectedCompanyId?.toString() || '' }
    });
    return response.data;
  },

  convertToAPInvoice: async (id: number, invoiceDetails: APTransactionCreate): Promise<APTransaction> => {
    const { selectedCompanyId } = useAuthStore.getState();
    const response = await axiosInstance.post(`/oe/grvs/${id}/convert-to-ap-invoice`, invoiceDetails, {
      headers: { 'X-Tenant-ID': selectedCompanyId?.toString() || '' }
    });
    return response.data;
  },
};

// Order Defaults API functions
export const oeDefaultsService = {
  get: async (): Promise<OrderDefaults> => {
    const { selectedCompanyId } = useAuthStore.getState();
    const response = await axiosInstance.get('/oe/defaults', {
      headers: { 'X-Tenant-ID': selectedCompanyId?.toString() || '' }
    });
    return response.data;
  },

  update: async (data: OrderDefaultsUpdate): Promise<OrderDefaults> => {
    const { selectedCompanyId } = useAuthStore.getState();
    const response = await axiosInstance.put('/oe/defaults', data, {
      headers: { 'X-Tenant-ID': selectedCompanyId?.toString() || '' }
    });
    return response.data;
  },
};

// OE Reports API functions
export const oeReportsService = {
  getSalesOrdersReport: async (params: { 
    start_date?: string; 
    end_date?: string; 
    customer_id?: number; 
    status?: string;
  }): Promise<SalesOrder[]> => {
    const { selectedCompanyId } = useAuthStore.getState();
    const response = await axiosInstance.get('/oe/reports/sales-orders-listing', { 
      params,
      headers: { 'X-Tenant-ID': selectedCompanyId?.toString() || '' }
    });
    return response.data;
  },

  getPurchaseOrdersReport: async (params: { 
    start_date?: string; 
    end_date?: string; 
    supplier_id?: number; 
    status?: string;
  }): Promise<PurchaseOrder[]> => {
    const { selectedCompanyId } = useAuthStore.getState();
    const response = await axiosInstance.get('/oe/reports/purchase-orders-listing', { 
      params,
      headers: { 'X-Tenant-ID': selectedCompanyId?.toString() || '' }
    });
    return response.data;
  },

  getGRVsReport: async (params: { 
    start_date?: string; 
    end_date?: string; 
    supplier_id?: number; 
    status?: string;
  }): Promise<GoodsReceivedVoucher[]> => {
    const { selectedCompanyId } = useAuthStore.getState();
    const response = await axiosInstance.get('/oe/reports/grv-listing', { 
      params,
      headers: { 'X-Tenant-ID': selectedCompanyId?.toString() || '' }
    });
    return response.data;
  },
};
