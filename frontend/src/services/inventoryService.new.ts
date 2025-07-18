import { axiosInstance } from '@/lib/axiosInstance';
import { useAuthStore } from '@/store/authStore';
import {
  UnitOfMeasure,
  UnitOfMeasureCreate,
  UnitOfMeasureUpdate,
  Warehouse,
  WarehouseCreate,
  WarehouseUpdate,
  InventoryItem,
  InventoryItemCreate,
  InventoryItemUpdate,
  ItemBarcode,
  ItemBarcodeCreate,
  InventoryTransactionType,
  InventoryTransactionTypeCreate,
  InventoryTransactionTypeUpdate,
  InventoryTransaction,
  InventoryAdjustmentCreate,
  WarehouseTransferCreate,
  InventoryDefaults,
  InventoryDefaultsUpdate,
  InventoryCountSession,
  InventoryCountSessionCreate,
  InventoryCountLine,
  InventoryCountLineUpdate,
  InventoryValuationItem,
  StockQuantityItem,
} from '@/types/inventory';

class InventoryService {
  private getHeaders() {
    const { selectedCompanyId } = useAuthStore.getState();
    return {
      'X-Tenant-ID': selectedCompanyId?.toString() || ''
    };
  }

  async getInventoryItems(skip = 0, limit = 100) {
    const response = await axiosInstance.get('/inventory/items', {
      params: { skip, limit },
      headers: this.getHeaders()
    });
    return response.data;
  }

  async createInventoryItem(itemData: InventoryItemCreate) {
    const response = await axiosInstance.post('/inventory/items', itemData, {
      headers: this.getHeaders()
    });
    return response.data;
  }

  async processAdjustment(adjustmentData: InventoryAdjustmentCreate) {
    const response = await axiosInstance.post('/inventory/adjustments', adjustmentData, {
      headers: this.getHeaders()
    });
    return response.data;
  }

  async getInventoryValuation(warehouseId?: number, asOfDate?: string) {
    const response = await axiosInstance.get('/inventory/reports/valuation', {
      params: { warehouse_id: warehouseId, as_of_date: asOfDate },
      headers: this.getHeaders()
    });
    return response.data;
  }

  // Tenant-aware item lookup for other modules
  async searchItems(query: string, limit = 10) {
    const response = await axiosInstance.get('/inventory/items/search', {
      params: { q: query, limit },
      headers: this.getHeaders()
    });
    return response.data;
  }

  // Unit of Measure functions with tenant headers
  async createUnitOfMeasure(data: UnitOfMeasureCreate): Promise<UnitOfMeasure> {
    const response = await axiosInstance.post('/inventory/units-of-measure', data, {
      headers: this.getHeaders()
    });
    return response.data;
  }

  async getUnitsOfMeasure(skip = 0, limit = 100): Promise<UnitOfMeasure[]> {
    const response = await axiosInstance.get('/inventory/units-of-measure', {
      params: { skip, limit },
      headers: this.getHeaders()
    });
    return response.data;
  }

  async getUnitOfMeasure(id: number): Promise<UnitOfMeasure> {
    const response = await axiosInstance.get(`/inventory/units-of-measure/${id}`, {
      headers: this.getHeaders()
    });
    return response.data;
  }

  async updateUnitOfMeasure(id: number, data: UnitOfMeasureUpdate): Promise<UnitOfMeasure> {
    const response = await axiosInstance.put(`/inventory/units-of-measure/${id}`, data, {
      headers: this.getHeaders()
    });
    return response.data;
  }

  async deleteUnitOfMeasure(id: number): Promise<void> {
    await axiosInstance.delete(`/inventory/units-of-measure/${id}`, {
      headers: this.getHeaders()
    });
  }

  // Warehouse functions with tenant headers
  async createWarehouse(data: WarehouseCreate): Promise<Warehouse> {
    const response = await axiosInstance.post('/inventory/warehouses', data, {
      headers: this.getHeaders()
    });
    return response.data;
  }

  async getWarehouses(skip = 0, limit = 100): Promise<Warehouse[]> {
    const response = await axiosInstance.get('/inventory/warehouses', {
      params: { skip, limit },
      headers: this.getHeaders()
    });
    return response.data;
  }

  async getWarehouse(id: number): Promise<Warehouse> {
    const response = await axiosInstance.get(`/inventory/warehouses/${id}`, {
      headers: this.getHeaders()
    });
    return response.data;
  }

  async updateWarehouse(id: number, data: WarehouseUpdate): Promise<Warehouse> {
    const response = await axiosInstance.put(`/inventory/warehouses/${id}`, data, {
      headers: this.getHeaders()
    });
    return response.data;
  }

  async deleteWarehouse(id: number): Promise<void> {
    await axiosInstance.delete(`/inventory/warehouses/${id}`, {
      headers: this.getHeaders()
    });
  }

  // Item functions with tenant headers
  async getInventoryItem(id: number): Promise<InventoryItem> {
    const response = await axiosInstance.get(`/inventory/items/${id}`, {
      headers: this.getHeaders()
    });
    return response.data;
  }

  async updateInventoryItem(id: number, data: InventoryItemUpdate): Promise<InventoryItem> {
    const response = await axiosInstance.put(`/inventory/items/${id}`, data, {
      headers: this.getHeaders()
    });
    return response.data;
  }

  async deleteInventoryItem(id: number): Promise<void> {
    await axiosInstance.delete(`/inventory/items/${id}`, {
      headers: this.getHeaders()
    });
  }

  // Barcode functions with tenant headers
  async getItemBarcodes(itemId: number): Promise<ItemBarcode[]> {
    const response = await axiosInstance.get(`/inventory/items/${itemId}/barcodes`, {
      headers: this.getHeaders()
    });
    return response.data;
  }

  async createItemBarcode(itemId: number, data: ItemBarcodeCreate): Promise<ItemBarcode> {
    const response = await axiosInstance.post(`/inventory/items/${itemId}/barcodes`, data, {
      headers: this.getHeaders()
    });
    return response.data;
  }

  async deleteItemBarcode(itemId: number, barcodeId: number): Promise<void> {
    await axiosInstance.delete(`/inventory/items/${itemId}/barcodes/${barcodeId}`, {
      headers: this.getHeaders()
    });
  }

  // Transaction type functions with tenant headers
  async getInventoryTransactionTypes(): Promise<InventoryTransactionType[]> {
    const response = await axiosInstance.get('/inventory/transaction-types', {
      headers: this.getHeaders()
    });
    return response.data;
  }

  async createInventoryTransactionType(data: InventoryTransactionTypeCreate): Promise<InventoryTransactionType> {
    const response = await axiosInstance.post('/inventory/transaction-types', data, {
      headers: this.getHeaders()
    });
    return response.data;
  }

  async updateInventoryTransactionType(id: number, data: InventoryTransactionTypeUpdate): Promise<InventoryTransactionType> {
    const response = await axiosInstance.put(`/inventory/transaction-types/${id}`, data, {
      headers: this.getHeaders()
    });
    return response.data;
  }

  async deleteInventoryTransactionType(id: number): Promise<void> {
    await axiosInstance.delete(`/inventory/transaction-types/${id}`, {
      headers: this.getHeaders()
    });
  }

  // Transaction functions with tenant headers
  async getInventoryTransactions(skip = 0, limit = 100, itemId?: number): Promise<InventoryTransaction[]> {
    const response = await axiosInstance.get('/inventory/transactions', {
      params: { skip, limit, item_id: itemId },
      headers: this.getHeaders()
    });
    return response.data;
  }

  async processInventoryAdjustment(data: InventoryAdjustmentCreate): Promise<InventoryTransaction> {
    const response = await axiosInstance.post('/inventory/adjustments', data, {
      headers: this.getHeaders()
    });
    return response.data;
  }

  async processWarehouseTransfer(data: WarehouseTransferCreate): Promise<InventoryTransaction[]> {
    const response = await axiosInstance.post('/inventory/transfers', data, {
      headers: this.getHeaders()
    });
    return response.data;
  }

  // Defaults functions with tenant headers
  async getInventoryDefaults(): Promise<InventoryDefaults> {
    const response = await axiosInstance.get('/inventory/defaults', {
      headers: this.getHeaders()
    });
    return response.data;
  }

  async updateInventoryDefaults(data: InventoryDefaultsUpdate): Promise<InventoryDefaults> {
    const response = await axiosInstance.put('/inventory/defaults', data, {
      headers: this.getHeaders()
    });
    return response.data;
  }

  // Count functions with tenant headers
  async startInventoryCount(data: InventoryCountSessionCreate): Promise<InventoryCountSession> {
    const response = await axiosInstance.post('/inventory/count-sessions', data, {
      headers: this.getHeaders()
    });
    return response.data;
  }

  async getInventoryCountSession(id: number): Promise<InventoryCountSession> {
    const response = await axiosInstance.get(`/inventory/count-sessions/${id}`, {
      headers: this.getHeaders()
    });
    return response.data;
  }

  async getInventoryCountSessions(skip = 0, limit = 100): Promise<InventoryCountSession[]> {
    const response = await axiosInstance.get('/inventory/count-sessions', {
      params: { skip, limit },
      headers: this.getHeaders()
    });
    return response.data;
  }

  async getInventoryCountLines(sessionId: number): Promise<InventoryCountLine[]> {
    const response = await axiosInstance.get(`/inventory/count-sessions/${sessionId}/lines`, {
      headers: this.getHeaders()
    });
    return response.data;
  }

  async recordCountedQuantities(sessionId: number, updates: InventoryCountLineUpdate[]): Promise<void> {
    await axiosInstance.put(`/inventory/count-sessions/${sessionId}/lines`, updates, {
      headers: this.getHeaders()
    });
  }

  async processCountVariances(sessionId: number): Promise<InventoryTransaction[]> {
    const response = await axiosInstance.post(`/inventory/count-sessions/${sessionId}/process`, {}, {
      headers: this.getHeaders()
    });
    return response.data;
  }

  // Report functions with tenant headers
  async getInventoryMovement(
    itemId: number,
    startDate: string,
    endDate: string,
    warehouseId?: number
  ): Promise<InventoryTransaction[]> {
    const response = await axiosInstance.get('/inventory/reports/movement', {
      params: { item_id: itemId, start_date: startDate, end_date: endDate, warehouse_id: warehouseId },
      headers: this.getHeaders()
    });
    return response.data;
  }

  async getStockQuantities(warehouseId?: number): Promise<any[]> {
    const response = await axiosInstance.get('/inventory/reports/stock-quantity', {
      params: warehouseId ? { warehouse_id: warehouseId } : {},
      headers: this.getHeaders()
    });
    return response.data;
  }

  async getItemListing(activeOnly = true): Promise<any[]> {
    const response = await axiosInstance.get('/inventory/reports/item-listing', {
      params: { active_only: activeOnly },
      headers: this.getHeaders()
    });
    return response.data;
  }

  // Aliases for compatibility
  getItems = this.getInventoryItems;
}

export const inventoryService = new InventoryService();
