// frontend/src/services/reportService.ts
import axiosInstance from '@/lib/axiosInstance';
import { 
  BalanceSheetRequest, 
  IncomeStatementRequest, 
  CashFlowRequest,
  CustomReportBuilder,
  ReportSchedule,
  ExportFormat 
} from '@/types/reports';

export const reportService = {
  // Financial Reports
  async generateBalanceSheet(params: BalanceSheetRequest) {
    const response = await axiosInstance.post('/reports/balance-sheet', params);
    return response.data;
  },

  async generateIncomeStatement(params: IncomeStatementRequest) {
    const response = await axiosInstance.post('/reports/income-statement', params);
    return response.data;
  },

  async generateCashFlow(params: CashFlowRequest) {
    const response = await axiosInstance.post('/reports/cash-flow', params);
    return response.data;
  },

  // Custom Reports
  async buildCustomReport(builder: CustomReportBuilder) {
    const response = await axiosInstance.post('/reports/custom', builder);
    return response.data;
  },

  async getReportTemplates() {
    const response = await axiosInstance.get('/reports/templates');
    return response.data;
  },

  async createReportTemplate(template: any) {
    const response = await axiosInstance.post('/reports/templates', template);
    return response.data;
  },

  // Export
  async exportReport(reportType: string, params: any, format: ExportFormat) {
    const response = await axiosInstance.post('/reports/export', 
      {
        report_type: reportType,
        parameters: params,
        format: format
      },
      {
        responseType: 'blob'
      }
    );
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${reportType}_${new Date().toISOString().split('T')[0]}.${format}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    return response.data;
  },

  // Scheduling
  async getSchedules() {
    const response = await axiosInstance.get('/reports/schedules');
    return response.data;
  },

  async createSchedule(schedule: Partial<ReportSchedule>) {
    const response = await axiosInstance.post('/reports/schedules', schedule);
    return response.data;
  },

  async updateSchedule(id: number, schedule: Partial<ReportSchedule>) {
    const response = await axiosInstance.put(`/reports/schedules/${id}`, schedule);
    return response.data;
  },

  // Delete schedule
  deleteSchedule: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/reports/schedules/${id}`);
  },

  // Run scheduled reports
  runScheduledReports: async () => {
    const response = await axiosInstance.post('/reports/schedules/run');
    return response.data;
  },

  // Get report history
  getReportHistory: async (limit: number = 50): Promise<any[]> => {
    const response = await axiosInstance.get('/reports/history', {
      params: { limit },
    });
    return response.data;
  },
};
