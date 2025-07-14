import platformAxiosInstance from '@/lib/platformAxiosInstance';

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

export interface PlatformUser {
  id: number;
  email: string;
  full_name: string;
  user_type: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  company_id?: number;
  company_name?: string;
  company_code?: string;
}

export interface UserCreate {
  email: string;
  full_name: string;
  password: string;
  user_type: string;
  company_id?: number;
  is_active?: boolean;
}

export interface UserUpdate {
  email?: string;
  full_name?: string;
  password?: string;
  user_type?: string;
  is_active?: boolean;
}

export interface UserStats {
  total_users: number;
  platform_admins: number;
  company_admins: number;
  company_users: number;
  active_today: number;
}

export interface PlatformAlert {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  company?: string;
  company_id?: number;
  timestamp: string;
  resolved: boolean;
}

export interface SecurityEvent {
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

export interface SecurityStats {
  failed_logins_24h: number;
  successful_logins_24h: number;
  admin_actions_7d: number;
  suspended_companies: number;
  total_companies: number;
}

export interface RevenueData {
  data: Array<{
    period: string;
    revenue: number;
    timestamp: string;
  }>;
}

export interface UsageData {
  data: Array<{
    company_name: string;
    company_id: number;
    value: number;
    limit: number;
    percentage: number;
  }>;
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
    const response = await platformAxiosInstance.get('/platform/companies', { params: filters });
    return response.data;
  },
  
  createCompany: async (data: CompanyCreate) => {
    const response = await platformAxiosInstance.post('/platform/companies', data);
    return response.data;
  },
  
  updateCompany: async (companyId: number, data: Partial<CompanyCreate>) => {
    const response = await platformAxiosInstance.put(`/platform/companies/${companyId}`, data);
    return response.data;
  },
  
  deleteCompany: async (companyId: number) => {
    const response = await platformAxiosInstance.delete(`/platform/companies/${companyId}`);
    return response.data;
  },
  
  impersonateCompany: async (companyId: number, reason?: string): Promise<ImpersonationResponse> => {
    const response = await platformAxiosInstance.post(`/platform/companies/${companyId}/impersonate`, {
      reason: reason || 'Platform administration'
    });
    return response.data;
  },
  
  getCompanyHealth: async (companyId: number) => {
    const response = await platformAxiosInstance.get(`/platform/companies/${companyId}/health`);
    return response.data;
  },
  
  suspendCompany: async (companyId: number, reason: string) => {
    const response = await platformAxiosInstance.post(`/platform/companies/${companyId}/suspend`, { reason });
    return response.data;
  },
  
  activateCompany: async (companyId: number, reason: string) => {
    const response = await platformAxiosInstance.post(`/platform/companies/${companyId}/activate`, { reason });
    return response.data;
  },

  // Users
  getUsers: async (filters?: {
    skip?: number;
    limit?: number;
    user_type?: string;
    company_id?: number;
    search?: string;
  }): Promise<PlatformUser[]> => {
    const response = await platformAxiosInstance.get('/platform/users', { params: filters });
    return response.data;
  },

  getUserStats: async (): Promise<UserStats> => {
    const response = await platformAxiosInstance.get('/platform/users/stats');
    return response.data;
  },

  createUser: async (userData: UserCreate): Promise<PlatformUser> => {
    const response = await platformAxiosInstance.post('/platform/users', userData);
    return response.data;
  },

  updateUser: async (userId: number, userData: UserUpdate): Promise<PlatformUser> => {
    const response = await platformAxiosInstance.put(`/platform/users/${userId}`, userData);
    return response.data;
  },

  deleteUser: async (userId: number): Promise<void> => {
    await platformAxiosInstance.delete(`/platform/users/${userId}`);
  },

  getUser: async (userId: number): Promise<PlatformUser> => {
    const response = await platformAxiosInstance.get(`/platform/users/${userId}`);
    return response.data;
  },

  // Alerts
  getAlerts: async (filters?: {
    skip?: number;
    limit?: number;
    alert_type?: string;
    resolved?: boolean;
  }): Promise<PlatformAlert[]> => {
    const response = await platformAxiosInstance.get('/platform/alerts', { params: filters });
    return response.data;
  },

  // Security
  getSecurityEvents: async (filters?: {
    skip?: number;
    limit?: number;
    event_type?: string;
    severity?: string;
  }): Promise<SecurityEvent[]> => {
    const response = await platformAxiosInstance.get('/platform/security/events', { params: filters });
    return response.data;
  },

  getSecurityStats: async (): Promise<SecurityStats> => {
    const response = await platformAxiosInstance.get('/platform/security/stats');
    return response.data;
  },

  // Analytics
  getRevenueAnalytics: async (period: string = 'month'): Promise<RevenueData> => {
    const response = await platformAxiosInstance.get('/platform/analytics/revenue', { params: { period } });
    return response.data;
  },

  getUsageAnalytics: async (metric: string = 'storage'): Promise<UsageData> => {
    const response = await platformAxiosInstance.get('/platform/analytics/usage', { params: { metric } });
    return response.data;
  },
  
  // Metrics
  getMetrics: async (): Promise<PlatformMetrics> => {
    const response = await platformAxiosInstance.get('/platform/metrics/summary');
    return response.data;
  },
  
  // Audit Logs
  getAuditLogs: async (filters?: AuditLogFilters): Promise<PlatformAuditLog[]> => {
    const response = await platformAxiosInstance.get('/platform/audit-logs', { params: filters });
    return response.data;
  },

  // Settings
  getSettings: async (): Promise<any> => {
    const response = await platformAxiosInstance.get('/platform/settings');
    return response.data;
  },

  updateSettings: async (settings: any): Promise<any> => {
    const response = await platformAxiosInstance.put('/platform/settings', settings);
    return response.data;
  },
};
