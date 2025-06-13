import axiosInstance from '@/lib/axiosInstance';
import { 
  SalesOrder, SalesOrderCreate, 
  PurchaseOrder, PurchaseOrderCreate,
  GoodsReceivedVoucher, GoodsReceivedVoucherCreate,
  OrderDefaults, OrderDefaultsUpdate,
  ARTransaction, APTransaction
} from '@/types/oe';

// Sales Orders API functions
export const salesOrderService = {
  getAll: async (params?: { skip?: number; limit?: number }): Promise<SalesOrder[]> => {
    const response = await axiosInstance.get('/oe/sales-orders', { params });
    return response.data;
  },

  getById: async (id: number): Promise<SalesOrder> => {
    const response = await axiosInstance.get(`/oe/sales-orders/${id}`);
    return response.data;
  },

  create: async (data: SalesOrderCreate): Promise<SalesOrder> => {
    const response = await axiosInstance.post('/oe/sales-orders', data);
    return response.data;
  },

  update: async (id: number, data: Partial<SalesOrder>): Promise<SalesOrder> => {
    const response = await axiosInstance.put(`/oe/sales-orders/${id}`, data);
    return response.data;
  },

  convertToInvoice: async (id: number): Promise<ARTransaction> => {
    const response = await axiosInstance.post(`/oe/sales-orders/${id}/convert-to-invoice`);
    return response.data;
  },
};

// Purchase Orders API functions
export const purchaseOrderService = {
  getAll: async (params?: { skip?: number; limit?: number }): Promise<PurchaseOrder[]> => {
    const response = await axiosInstance.get('/oe/purchase-orders', { params });
    return response.data;
  },

  getById: async (id: number): Promise<PurchaseOrder> => {
    const response = await axiosInstance.get(`/oe/purchase-orders/${id}`);
    return response.data;
  },

  create: async (data: PurchaseOrderCreate): Promise<PurchaseOrder> => {
    const response = await axiosInstance.post('/oe/purchase-orders', data);
    return response.data;
  },

  update: async (id: number, data: Partial<PurchaseOrder>): Promise<PurchaseOrder> => {
    const response = await axiosInstance.put(`/oe/purchase-orders/${id}`, data);
    return response.data;
  },
};

// GRVs API functions
export const grvService = {
  getAll: async (params?: { skip?: number; limit?: number }): Promise<GoodsReceivedVoucher[]> => {
    const response = await axiosInstance.get('/oe/grvs', { params });
    return response.data;
  },

  getById: async (id: number): Promise<GoodsReceivedVoucher> => {
    const response = await axiosInstance.get(`/oe/grvs/${id}`);
    return response.data;
  },

  create: async (data: GoodsReceivedVoucherCreate): Promise<GoodsReceivedVoucher> => {
    const response = await axiosInstance.post('/oe/grvs', data);
    return response.data;
  },

  convertToAPInvoice: async (id: number, invoiceDetails: any): Promise<APTransaction> => {
    const response = await axiosInstance.post(`/oe/grvs/${id}/convert-to-ap-invoice`, invoiceDetails);
    return response.data;
  },
};

// Order Defaults API functions
export const oeDefaultsService = {
  get: async (): Promise<OrderDefaults> => {
    const response = await axiosInstance.get('/oe/defaults');
    return response.data;
  },

  update: async (data: OrderDefaultsUpdate): Promise<OrderDefaults> => {
    const response = await axiosInstance.put('/oe/defaults', data);
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
    const response = await axiosInstance.get('/oe/reports/sales-orders-listing', { params });
    return response.data;
  },

  getPurchaseOrdersReport: async (params: { 
    start_date?: string; 
    end_date?: string; 
    supplier_id?: number; 
    status?: string;
  }): Promise<PurchaseOrder[]> => {
    const response = await axiosInstance.get('/oe/reports/purchase-orders-listing', { params });
    return response.data;
  },

  getGRVsReport: async (params: { 
    start_date?: string; 
    end_date?: string; 
    supplier_id?: number; 
    status?: string;
  }): Promise<GoodsReceivedVoucher[]> => {
    const response = await axiosInstance.get('/oe/reports/grv-listing', { params });
    return response.data;
  },
};
