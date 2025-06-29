import axiosInstance from '@/lib/axiosInstance';
import { 
  Till, TillCreate, TillUpdate,
  POSTransactionType, POSTransactionTypeCreate, POSTransactionTypeUpdate,
  POSDefaults, POSDefaultsUpdate,
  POSSession, POSSessionCreate, POSSessionClose,
  POSTransaction, POSTransactionCreate,
  POSCashMovement, POSCashMovementCreate,
  CashierSalesReport, InventorySalesReport
} from '@/types/pos';

export const posService = {
  // Till Management
  createTill: (data: TillCreate) => 
    axiosInstance.post<Till>('/pos/tills', data),
  
  getTills: () => 
    axiosInstance.get<Till[]>('/pos/tills'),
  
  getTill: (id: number) => 
    axiosInstance.get<Till>(`/pos/tills/${id}`),
  
  updateTill: (id: number, data: TillUpdate) => 
    axiosInstance.put<Till>(`/pos/tills/${id}`, data),
  
  // Transaction Types
  createTransactionType: (data: POSTransactionTypeCreate) => 
    axiosInstance.post<POSTransactionType>('/pos/transaction-types', data),
  
  getTransactionTypes: () => 
    axiosInstance.get<POSTransactionType[]>('/pos/transaction-types'),
  
  // POS Defaults
  getPOSDefaults: () => 
    axiosInstance.get<POSDefaults>('/pos/defaults'),
  
  updatePOSDefaults: (data: POSDefaultsUpdate) => 
    axiosInstance.put<POSDefaults>('/pos/defaults', data),
  
  // Session Management
  openSession: (data: POSSessionCreate) => 
    axiosInstance.post<POSSession>('/pos/sessions/open', data),
  
  getActiveSession: (tillId: number) => 
    axiosInstance.get<POSSession>(`/pos/sessions/active?till_id=${tillId}`),
  
  closeSession: (sessionId: number, data: POSSessionClose) => 
    axiosInstance.post<POSSession>(`/pos/sessions/${sessionId}/close`, data),
  
  // Sales Processing
  processSale: (sessionId: number, data: POSTransactionCreate) => 
    axiosInstance.post<POSTransaction>(`/pos/sessions/${sessionId}/sales`, data),
  
  processReturn: (sessionId: number, data: POSTransactionCreate) => 
    axiosInstance.post<POSTransaction>(`/pos/sessions/${sessionId}/returns`, data),
  
  getTransaction: (transactionId: number) => 
    axiosInstance.get<POSTransaction>(`/pos/transactions/${transactionId}`),
  
  // Cash Management
  recordCashMovement: (sessionId: number, data: POSCashMovementCreate) => 
    axiosInstance.post<POSCashMovement>(`/pos/sessions/${sessionId}/cash-movements`, data),
  
  // Reports
  getCashierSalesReport: (startDate: string, endDate: string, cashierId?: number) => {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
    });
    if (cashierId) params.append('cashier_id', cashierId.toString());
    return axiosInstance.get<CashierSalesReport[]>(`/pos/reports/cashier-sales?${params}`);
  },
  
  getInventorySalesReport: (startDate: string, endDate: string, warehouseId?: number) => {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
    });
    if (warehouseId) params.append('warehouse_id', warehouseId.toString());
    return axiosInstance.get<InventorySalesReport[]>(`/pos/reports/inventory-sales?${params}`);
  },
};
