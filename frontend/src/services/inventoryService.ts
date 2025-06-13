import axiosInstance from '@/lib/axiosInstance';
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

const API_PREFIX = '/inventory';

// Unit of Measure
export const createUnitOfMeasure = async (data: UnitOfMeasureCreate): Promise<UnitOfMeasure> => {
  const response = await axiosInstance.post(`${API_PREFIX}/units-of-measure`, data);
  return response.data;
};

export const getUnitsOfMeasure = async (skip = 0, limit = 100): Promise<UnitOfMeasure[]> => {
  const response = await axiosInstance.get(`${API_PREFIX}/units-of-measure`, {
    params: { skip, limit },
  });
  return response.data;
};

export const getUnitOfMeasure = async (id: number): Promise<UnitOfMeasure> => {
  const response = await axiosInstance.get(`${API_PREFIX}/units-of-measure/${id}`);
  return response.data;
};

export const updateUnitOfMeasure = async (id: number, data: UnitOfMeasureUpdate): Promise<UnitOfMeasure> => {
  const response = await axiosInstance.put(`${API_PREFIX}/units-of-measure/${id}`, data);
  return response.data;
};

export const deleteUnitOfMeasure = async (id: number): Promise<void> => {
  await axiosInstance.delete(`${API_PREFIX}/units-of-measure/${id}`);
};

// Warehouse
export const createWarehouse = async (data: WarehouseCreate): Promise<Warehouse> => {
  const response = await axiosInstance.post(`${API_PREFIX}/warehouses`, data);
  return response.data;
};

export const getWarehouses = async (skip = 0, limit = 100): Promise<Warehouse[]> => {
  const response = await axiosInstance.get(`${API_PREFIX}/warehouses`, {
    params: { skip, limit },
  });
  return response.data;
};

export const getWarehouse = async (id: number): Promise<Warehouse> => {
  const response = await axiosInstance.get(`${API_PREFIX}/warehouses/${id}`);
  return response.data;
};

export const updateWarehouse = async (id: number, data: WarehouseUpdate): Promise<Warehouse> => {
  const response = await axiosInstance.put(`${API_PREFIX}/warehouses/${id}`, data);
  return response.data;
};

export const deleteWarehouse = async (id: number): Promise<void> => {
  await axiosInstance.delete(`${API_PREFIX}/warehouses/${id}`);
};

// Inventory Item
export const createInventoryItem = async (data: InventoryItemCreate): Promise<InventoryItem> => {
  const response = await axiosInstance.post(`${API_PREFIX}/items`, data);
  return response.data;
};

export const getInventoryItems = async (skip = 0, limit = 100): Promise<InventoryItem[]> => {
  const response = await axiosInstance.get(`${API_PREFIX}/items`, {
    params: { skip, limit },
  });
  return response.data;
};

export const getInventoryItem = async (id: number): Promise<InventoryItem> => {
  const response = await axiosInstance.get(`${API_PREFIX}/items/${id}`);
  return response.data;
};

export const updateInventoryItem = async (id: number, data: InventoryItemUpdate): Promise<InventoryItem> => {
  const response = await axiosInstance.put(`${API_PREFIX}/items/${id}`, data);
  return response.data;
};

export const deleteInventoryItem = async (id: number): Promise<void> => {
  await axiosInstance.delete(`${API_PREFIX}/items/${id}`);
};

// Item Barcode
export const createItemBarcode = async (itemId: number, data: ItemBarcodeCreate): Promise<ItemBarcode> => {
  const response = await axiosInstance.post(`${API_PREFIX}/items/${itemId}/barcodes`, data);
  return response.data;
};

export const getItemBarcodes = async (itemId: number): Promise<ItemBarcode[]> => {
  const response = await axiosInstance.get(`${API_PREFIX}/items/${itemId}/barcodes`);
  return response.data;
};

export const deleteItemBarcode = async (barcodeId: number): Promise<void> => {
  await axiosInstance.delete(`${API_PREFIX}/barcodes/${barcodeId}`);
};

// Inventory Transaction Type
export const createInventoryTransactionType = async (data: InventoryTransactionTypeCreate): Promise<InventoryTransactionType> => {
  const response = await axiosInstance.post(`${API_PREFIX}/transaction-types`, data);
  return response.data;
};

export const getInventoryTransactionTypes = async (skip = 0, limit = 100): Promise<InventoryTransactionType[]> => {
  const response = await axiosInstance.get(`${API_PREFIX}/transaction-types`, {
    params: { skip, limit },
  });
  return response.data;
};

export const getInventoryTransactionType = async (id: number): Promise<InventoryTransactionType> => {
  const response = await axiosInstance.get(`${API_PREFIX}/transaction-types/${id}`);
  return response.data;
};

export const updateInventoryTransactionType = async (id: number, data: InventoryTransactionTypeUpdate): Promise<InventoryTransactionType> => {
  const response = await axiosInstance.put(`${API_PREFIX}/transaction-types/${id}`, data);
  return response.data;
};

export const deleteInventoryTransactionType = async (id: number): Promise<void> => {
  await axiosInstance.delete(`${API_PREFIX}/transaction-types/${id}`);
};

// Inventory Defaults
export const getInventoryDefaults = async (): Promise<InventoryDefaults> => {
  const response = await axiosInstance.get(`${API_PREFIX}/defaults`);
  return response.data;
};

export const updateInventoryDefaults = async (data: InventoryDefaultsUpdate): Promise<InventoryDefaults> => {
  const response = await axiosInstance.put(`${API_PREFIX}/defaults`, data);
  return response.data;
};

// Inventory Adjustments
export const processInventoryAdjustment = async (data: InventoryAdjustmentCreate): Promise<InventoryTransaction> => {
  const response = await axiosInstance.post(`${API_PREFIX}/adjustments`, data);
  return response.data;
};

// Warehouse Transfers
export const processWarehouseTransfer = async (data: WarehouseTransferCreate): Promise<InventoryTransaction[]> => {
  const response = await axiosInstance.post(`${API_PREFIX}/warehouse-transfers`, data);
  return response.data;
};

// Inventory Counts
export const startInventoryCount = async (data: InventoryCountSessionCreate): Promise<InventoryCountSession> => {
  const response = await axiosInstance.post(`${API_PREFIX}/counts/sessions`, data);
  return response.data;
};

export const getInventoryCountSession = async (sessionId: number): Promise<InventoryCountSession> => {
  const response = await axiosInstance.get(`${API_PREFIX}/counts/sessions/${sessionId}`);
  return response.data;
};

export const getInventoryCountLines = async (sessionId: number): Promise<InventoryCountLine[]> => {
  const response = await axiosInstance.get(`${API_PREFIX}/counts/sessions/${sessionId}/lines`);
  return response.data;
};

export const recordCountedQuantities = async (sessionId: number, counts: InventoryCountLineUpdate[]): Promise<void> => {
  await axiosInstance.put(`${API_PREFIX}/counts/sessions/${sessionId}/lines`, counts);
};

export const processCountVariances = async (sessionId: number): Promise<void> => {
  await axiosInstance.post(`${API_PREFIX}/counts/sessions/${sessionId}/process-variances`);
};

// Inventory Transactions
export const getInventoryTransactions = async (params?: {
  itemId?: number;
  warehouseId?: number;
  startDate?: string;
  endDate?: string;
  skip?: number;
  limit?: number;
}): Promise<InventoryTransaction[]> => {
  const response = await axiosInstance.get(`${API_PREFIX}/transactions`, { params });
  return response.data;
};

// Reports
export const getInventoryValuation = async (warehouseId?: number, asOfDate?: string): Promise<InventoryValuationItem[]> => {
  const response = await axiosInstance.get(`${API_PREFIX}/reports/valuation`, {
    params: { warehouse_id: warehouseId, as_of_date: asOfDate },
  });
  return response.data;
};

export const getInventoryMovement = async (
  itemId: number,
  startDate: string,
  endDate: string,
  warehouseId?: number
): Promise<InventoryTransaction[]> => {
  const response = await axiosInstance.get(`${API_PREFIX}/reports/movement`, {
    params: { item_id: itemId, start_date: startDate, end_date: endDate, warehouse_id: warehouseId },
  });
  return response.data;
};

export const getStockQuantities = async (warehouseId?: number): Promise<StockQuantityItem[]> => {
  const response = await axiosInstance.get(`${API_PREFIX}/reports/stock-quantity`, {
    params: { warehouse_id: warehouseId },
  });
  return response.data;
};

export const getItemListing = async (activeOnly = true): Promise<any[]> => {
  const response = await axiosInstance.get(`${API_PREFIX}/reports/item-listing`, {
    params: { active_only: activeOnly },
  });
  return response.data;
};
