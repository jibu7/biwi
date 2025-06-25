import axiosInstance from '@/lib/axiosInstance';
import { 
  BOMHeader, BOMHeaderCreate, BOMHeaderUpdate,
  ManufacturingOrder, ManufacturingOrderCreate,
  BOMDefaults, BOMDefaultsUpdate,
  MRPRequest, MRPResult
} from '@/types/bom';

export const bomService = {
  // BOM Headers
  async createBOMHeader(data: BOMHeaderCreate): Promise<BOMHeader> {
    const response = await axiosInstance.post('/bom/bom-headers', data);
    return response.data;
  },

  async getBOMHeaders(skip = 0, limit = 100): Promise<BOMHeader[]> {
    const response = await axiosInstance.get('/bom/bom-headers', {
      params: { skip, limit }
    });
    return response.data;
  },

  async getBOMHeader(id: number): Promise<BOMHeader> {
    const response = await axiosInstance.get(`/bom/bom-headers/${id}`);
    return response.data;
  },

  async updateBOMHeader(id: number, data: BOMHeaderUpdate): Promise<BOMHeader> {
    const response = await axiosInstance.put(`/bom/bom-headers/${id}`, data);
    return response.data;
  },

  async deleteBOMHeader(id: number): Promise<void> {
    await axiosInstance.delete(`/bom/bom-headers/${id}`);
  },

  async getBOMByItem(itemId: number): Promise<BOMHeader> {
    const response = await axiosInstance.get(`/bom/bom-headers/by-item/${itemId}`);
    return response.data;
  },

  async copyBOM(bomId: number, newBomCode: string, newRevision: string): Promise<BOMHeader> {
    const response = await axiosInstance.post(`/bom/bom-headers/${bomId}/copy`, {
      new_bom_code: newBomCode,
      new_revision: newRevision
    });
    return response.data;
  },

  // Manufacturing Orders
  async createManufacturingOrder(data: ManufacturingOrderCreate): Promise<ManufacturingOrder> {
    const response = await axiosInstance.post('/bom/manufacturing-orders', data);
    return response.data;
  },

  async getManufacturingOrders(status?: string, skip = 0, limit = 100): Promise<ManufacturingOrder[]> {
    const response = await axiosInstance.get('/bom/manufacturing-orders', {
      params: { status, skip, limit }
    });
    return response.data;
  },

  async getManufacturingOrder(id: number): Promise<ManufacturingOrder> {
    const response = await axiosInstance.get(`/bom/manufacturing-orders/${id}`);
    return response.data;
  },

  async releaseManufacturingOrder(id: number): Promise<void> {
    await axiosInstance.post(`/bom/manufacturing-orders/${id}/release`);
  },

  async processManufacturingOrder(id: number): Promise<void> {
    await axiosInstance.post(`/bom/manufacturing-orders/${id}/process`);
  },

  async cancelManufacturingOrder(id: number): Promise<void> {
    await axiosInstance.post(`/bom/manufacturing-orders/${id}/cancel`);
  },

  // BOM Defaults
  async getBOMDefaults(): Promise<BOMDefaults> {
    const response = await axiosInstance.get('/bom/defaults');
    return response.data;
  },

  async updateBOMDefaults(data: BOMDefaultsUpdate): Promise<BOMDefaults> {
    const response = await axiosInstance.put('/bom/defaults', data);
    return response.data;
  },

  // Reports and Analytics
  async calculateMRP(data: MRPRequest): Promise<MRPResult[]> {
    const response = await axiosInstance.post('/bom/reports/mrp', data);
    return response.data;
  },

  async getBOMCostAnalysis(bomId: number, quantity = 1): Promise<any> {
    const response = await axiosInstance.get(`/bom/reports/cost-analysis/${bomId}`, {
      params: { quantity }
    });
    return response.data;
  },

  async getBOMWhereUsed(itemId: number): Promise<BOMHeader[]> {
    const response = await axiosInstance.get(`/bom/reports/where-used/${itemId}`);
    return response.data;
  },

  async getManufacturingOrdersSummary(): Promise<any> {
    const response = await axiosInstance.get('/bom/reports/manufacturing-orders/summary');
    return response.data;
  },

  async getBOMSummary(): Promise<any> {
    const response = await axiosInstance.get('/bom/reports/bom-summary');
    return response.data;
  }
};
