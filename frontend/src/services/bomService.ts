import axiosInstance from '@/lib/axiosInstance';
import { 
  BOMHeader, BOMHeaderCreate, BOMHeaderUpdate,
  ManufacturingOrder, ManufacturingOrderCreate,
  BOMDefaults, BOMDefaultsUpdate,
  MRPRequest, MRPResult
} from '@/types/bom';

// Type aliases for consistency with the interface expectations
export type BOMHeaderRead = BOMHeader;
export type ManufacturingOrderRead = ManufacturingOrder;
export type ProductionEntryCreate = any; // Define this type as needed

export const bomService = {
  // BOM Headers
  async createBOM(data: BOMHeaderCreate): Promise<BOMHeader> {
    const response = await axiosInstance.post('/bom/bom-headers', data);
    return response.data;
  },

  async getBOMs(params?: {
    skip?: number;
    limit?: number;
    item_id?: number;
    status?: string;
  }): Promise<BOMHeader[]> {
    const response = await axiosInstance.get('/bom/bom-headers', { params });
    return response.data;
  },

  async getBOM(id: number): Promise<BOMHeader> {
    const response = await axiosInstance.get(`/bom/bom-headers/${id}`);
    return response.data;
  },

  async updateBOM(id: number, data: BOMHeaderUpdate): Promise<BOMHeader> {
    const response = await axiosInstance.put(`/bom/bom-headers/${id}`, data);
    return response.data;
  },

  async deleteBOM(id: number): Promise<void> {
    await axiosInstance.delete(`/bom/bom-headers/${id}`);
  },

  async calculateBOMCost(id: number): Promise<any> {
    const response = await axiosInstance.post(`/bom/bom-headers/${id}/calculate-cost`);
    return response.data;
  },

  async explodeBOM(id: number, quantity: number = 1): Promise<any[]> {
    const response = await axiosInstance.post(`/bom/bom-headers/${id}/explode`, null, {
      params: { quantity }
    });
    return response.data;
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

  async getManufacturingOrders(params?: {
    skip?: number;
    limit?: number;
    status?: string;
    warehouse_id?: number;
  }): Promise<ManufacturingOrder[]> {
    const response = await axiosInstance.get('/bom/manufacturing-orders', { params });
    return response.data;
  },

  async getManufacturingOrder(id: number): Promise<ManufacturingOrder> {
    const response = await axiosInstance.get(`/bom/manufacturing-orders/${id}`);
    return response.data;
  },

  async releaseManufacturingOrder(id: number): Promise<void> {
    await axiosInstance.put(`/bom/manufacturing-orders/${id}/release`);
  },

  async issueMaterials(orderId: number): Promise<any> {
    const response = await axiosInstance.post(`/bom/manufacturing-orders/${orderId}/issue-materials`);
    return response.data;
  },

  async getMaterialRequisitions(orderId: number): Promise<any[]> {
    const response = await axiosInstance.get(`/bom/manufacturing-orders/${orderId}/requisitions`);
    return response.data;
  },

  async processManufacturingOrder(id: number): Promise<void> {
    await axiosInstance.post(`/bom/manufacturing-orders/${id}/process`);
  },

  async cancelManufacturingOrder(id: number): Promise<void> {
    await axiosInstance.post(`/bom/manufacturing-orders/${id}/cancel`);
  },

  // Production Entry
  async recordProduction(data: any): Promise<any> {
    const response = await axiosInstance.post('/bom/production-entries', data);
    return response.data;
  },

  // MRP
  async runMRP(data: MRPRequest): Promise<MRPResult[]> {
    const response = await axiosInstance.post('/bom/mrp/run', data);
    return response.data;
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

  // Reports
  async getWhereUsedReport(itemId: number): Promise<any[]> {
    const response = await axiosInstance.get(`/bom/reports/bom-where-used/${itemId}`);
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
