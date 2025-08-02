import { apiClient } from './api';

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
  getBugReports: (filters?: BugReportFilters) => {
    const params = new URLSearchParams();
    if (filters?.skip !== undefined) params.append('skip', filters.skip.toString());
    if (filters?.limit !== undefined) params.append('limit', filters.limit.toString());
    if (filters?.status) params.append('status', filters.status);
    if (filters?.severity) params.append('severity', filters.severity);
    if (filters?.error_type) params.append('error_type', filters.error_type);
    
    return apiClient.get<BugReport[]>(`/errors?${params.toString()}`);
  },

  // Get bug report statistics
  getBugReportStats: () => apiClient.get<BugReportStats>('/errors/stats'),

  // Get specific bug report
  getBugReport: (id: number) => apiClient.get<BugReport>(`/errors/${id}`),

  // Update bug report status
  updateBugReportStatus: (id: number, update: BugReportStatusUpdate) =>
    apiClient.patch<BugReport>(`/errors/${id}/status`, update),

  // Delete bug report
  deleteBugReport: (id: number) => apiClient.delete(`/errors/${id}`),
};