import axiosInstance from '@/lib/axiosInstance';

export interface CompanyFilters {
  search?: string;
  status?: string;
  skip?: number;
  limit?: number;
}

export interface AuditLogFilters {
  company_id?: number;
  user_id?: number;
  action?: string;
  start_date?: string;
  end_date?: string;
  skip?: number;
  limit?: number;
}

export interface CompanyWithStats {
  company: {
    id: number;
    name: string;
    code: string;
    subscription_status: string;
    subscription_plan?: string;
    subscription_expires?: string;
    storage_limit_gb: number;
    user_limit: number;
    primary_contact_email?: string;
    billing_email?: string;
    created_at?: string;
    is_active: boolean;
    is_deleted: boolean;
  };
  user_count: number;
  active_users_30d: number;
  transaction_count: number;
  storage_used_gb: number;
}

export interface PlatformMetrics {
  total_companies: number;
  active_companies: number;
  suspended_companies: number;
  trial_companies: number;
  total_users: number;
  active_users_today: number;
  total_transactions: number;
  revenue_this_month: number;
}

export interface PlatformAuditLog {
  id: number;
  user_id: number;
  company_id?: number;
  action: string;
  resource_type?: string;
  resource_id?: number;
  details?: any;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
}

export interface CompanyCreate {
  name: string;
  code: string;
  address?: any;
  contact_info?: any;
  default_currency_code?: string;
  subscription_status?: string;
  subscription_plan?: string;
  subscription_expires?: string;
  storage_limit_gb?: number;
  user_limit?: number;
  primary_contact_email?: string;
  billing_email?: string;
}

export interface ImpersonationResponse {
  access_token: string;
  token_type: string;
  company: any;
  expires_in: number;
}

export const platformService = {
  // Companies
  getCompanies: async (filters?: CompanyFilters): Promise<CompanyWithStats[]> => {
    const response = await axiosInstance.get('/platform/companies', { params: filters });
    return response.data;
  },
  
  createCompany: async (data: CompanyCreate) => {
    const response = await axiosInstance.post('/platform/companies', data);
    return response.data;
  },
  
  impersonateCompany: async (companyId: number, reason?: string): Promise<ImpersonationResponse> => {
    const response = await axiosInstance.post(`/platform/companies/${companyId}/impersonate`, {
      reason: reason || 'Platform administration'
    });
    return response.data;
  },
  
  getCompanyHealth: async (companyId: number) => {
    const response = await axiosInstance.get(`/platform/companies/${companyId}/health`);
    return response.data;
  },
  
  suspendCompany: async (companyId: number, reason: string) => {
    const response = await axiosInstance.post(`/platform/companies/${companyId}/suspend`, { reason });
    return response.data;
  },
  
  activateCompany: async (companyId: number, reason: string) => {
    const response = await axiosInstance.post(`/platform/companies/${companyId}/activate`, { reason });
    return response.data;
  },
  
  // Metrics
  getMetrics: async (): Promise<PlatformMetrics> => {
    const response = await axiosInstance.get('/platform/metrics/summary');
    return response.data;
  },
  
  // Audit Logs
  getAuditLogs: async (filters?: AuditLogFilters): Promise<PlatformAuditLog[]> => {
    const response = await axiosInstance.get('/platform/audit-logs', { params: filters });
    return response.data;
  },
};
