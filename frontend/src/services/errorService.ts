import axiosInstance from '@/lib/axiosInstance';

export interface BugReport {
  id: number;
  company_id?: number;
  user_id?: number;
  error_id: string;
  error_type?: string;
  severity?: string;
  module?: string;
  error_message?: string;
  stack_trace?: string;
  user_agent?: string;
  url?: string;
  request_data?: any;
  response_data?: any;
  status?: string;
  occurrence_count?: number;
  first_seen?: string;
  last_seen?: string;
  resolved_at?: string;
  resolution_notes?: string;
}

export interface BugReportStats {
  total: number;
  by_status: {
    new: number;
    investigating: number;
    fixed: number;
    cannot_reproduce: number;
  };
  by_severity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  by_type: {
    frontend: number;
    backend: number;
    integration: number;
  };
}

export interface BugReportFilters {
  skip?: number;
  limit?: number;
  status?: string;
  severity?: string;
  error_type?: string;
}

export interface BugReportStatusUpdate {
  status: string;
  resolution_notes?: string;
}

export const errorService = {
  // Get all bug reports with optional filtering
  async getBugReports(filters?: BugReportFilters): Promise<BugReport[]> {
    const params: Record<string, string> = {};
    if (filters?.skip !== undefined) params.skip = filters.skip.toString();
    if (filters?.limit !== undefined) params.limit = filters.limit.toString();
    if (filters?.status) params.status = filters.status;
    if (filters?.severity) params.severity = filters.severity;
    if (filters?.error_type) params.error_type = filters.error_type;
    
    const response = await axiosInstance.get<BugReport[]>('/errors', { params });
    return response.data;
  },

  // Get bug report statistics
  async getBugReportStats(): Promise<BugReportStats> {
    const response = await axiosInstance.get<BugReportStats>('/errors/stats');
    return response.data;
  },

  // Get specific bug report
  async getBugReport(id: number): Promise<BugReport> {
    const response = await axiosInstance.get<BugReport>(`/errors/${id}`);
    return response.data;
  },

  // Update bug report status
  async updateBugReportStatus(id: number, update: BugReportStatusUpdate): Promise<BugReport> {
    const response = await axiosInstance.patch<BugReport>(`/errors/${id}/status`, update);
    return response.data;
  },

  // Delete bug report
  async deleteBugReport(id: number): Promise<void> {
    await axiosInstance.delete(`/errors/${id}`);
  },
};