import axiosInstance from '@/lib/axiosInstance';

export interface KPIData {
  value: string;
  change: string;
}

export interface ChartData {
  label: string;
  value: number;
}

export interface AlertData {
  type: 'info' | 'warning' | 'error';
  message: string;
}

export interface ExecutiveDashboardData {
  kpis: {
    totalRevenue: KPIData;
    netProfit: KPIData;
    cashFlow: KPIData;
    activeCustomers: KPIData;
    outstandingAR: KPIData;
    outstandingAP: KPIData;
  };
  charts: {
    revenueByMonth: ChartData[];
    expenseBreakdown: ChartData[];
    topCustomers: ChartData[];
    salesFunnel: ChartData[];
  };
  alerts: AlertData[];
  last_updated: string;
}

export type TimeRangeFilter = '7d' | '30d' | '90d' | '1y';

export const analyticsService = {
  /**
   * Get executive dashboard analytics data
   */
  getExecutiveDashboard: async (timeRange: TimeRangeFilter = '30d'): Promise<ExecutiveDashboardData> => {
    const response = await axiosInstance.get<ExecutiveDashboardData>(
      `/analytics/executive-dashboard?time_range=${timeRange}`
    );
    return response.data;
  },

  /**
   * Refresh dashboard data (for the refresh button)
   */
  refreshDashboard: async (timeRange: TimeRangeFilter = '30d'): Promise<ExecutiveDashboardData> => {
    // Add a cache-busting parameter to ensure fresh data
    const response = await axiosInstance.get<ExecutiveDashboardData>(
      `/analytics/executive-dashboard?time_range=${timeRange}&_t=${Date.now()}`
    );
    return response.data;
  }
};