import axiosInstance from '@/lib/axiosInstance';
import { 
  Till, TillCreate, TillUpdate,
  POSTransactionType, POSTransactionTypeCreate, POSTransactionTypeUpdate,
  POSDefaults, POSDefaultsUpdate,
  POSSession, POSSessionCreate, POSSessionClose,
  POSTransaction, POSTransactionCreate,
  POSCashMovement, POSCashMovementCreate,
  CashierSalesReport, InventorySalesReport,
  ReceiptData
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

  // Additional session methods for till management
  getCurrentSession: (tillId: number) => 
    axiosInstance.get<POSSession>(`/pos/sessions/current?till_id=${tillId}`),
  
  getSessionHistory: (tillId: number) => 
    axiosInstance.get<POSSession[]>(`/pos/sessions/history?till_id=${tillId}`),
  
  reconcileSession: (sessionId: number, reconciliationData: any) => 
    axiosInstance.post<POSSession>(`/pos/sessions/${sessionId}/reconcile`, reconciliationData),

  // Daily summary report
  getDailySummary: (params: { date: Date; tillId?: number | null }) => {
    const searchParams = new URLSearchParams({
      date: params.date.toISOString().split('T')[0],
    });
    if (params.tillId) searchParams.append('till_id', params.tillId.toString());
    return axiosInstance.get(`/pos/reports/daily-summary?${searchParams}`);
  },

  // Additional methods from specification
  getReceiptData: (transactionId: number) => 
    axiosInstance.get(`/pos/transactions/${transactionId}/receipt`),

  markReceiptPrinted: (transactionId: number) => 
    axiosInstance.post(`/pos/transactions/${transactionId}/receipt/print`),

  updateTransactionType: (id: number, data: POSTransactionTypeUpdate) => 
    axiosInstance.put<POSTransactionType>(`/pos/transaction-types/${id}`, data),

  // Alternative method names for compatibility
  createSale: (data: any) => {
    const { tillSessionId, ...transactionData } = data;
    return axiosInstance.post(
      `/pos/transactions?till_session_id=${tillSessionId}`,
      transactionData
    );
  },

  processReturnCompat: (data: any) => {
    const { tillSessionId, ...returnData } = data;
    return axiosInstance.post(
      `/pos/transactions/return?till_session_id=${tillSessionId}`,
      returnData
    );
  },

  getItemSales: (params: { 
    startDate: Date; 
    endDate: Date; 
    topN?: number 
  }) => {
    return axiosInstance.get('/pos/reports/item-sales', {
      params: {
        start_date: params.startDate.toISOString().split('T')[0],
        end_date: params.endDate.toISOString().split('T')[0],
        top_n: params.topN || 50
      }
    });
  },
};
