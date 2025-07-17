import platformAxiosInstance from '@/lib/platformAxiosInstance';

export interface CompanyWithStats {
  company: {
    id: number;
    name: string;
    code: string;
    primary_contact_email?: string;
    subscription_status: string;
    subscription_plan?: string;
    subscription_expires?: string;
    storage_limit_gb: number;
    user_limit: number;
    is_active: boolean;
    created_at: string;
  };
  user_count: number;
  active_users_30d: number;
  transaction_count: number;
  storage_used_gb: number;
}

export interface PlatformUser {
  id: number;
  email: string;
  full_name?: string;
  user_type: string;
  is_active: boolean;
  company_id?: number;
  company_name?: string;
  created_at: string;
  last_login?: string;
}

export interface UserCreate {
  email: string;
  full_name?: string;
  user_type: string;
  company_id?: number;
  password: string;
}

export interface UserUpdate {
  email?: string;
  full_name?: string;
  user_type?: string;
  company_id?: number;
  is_active?: boolean;
}

export interface CompanyCreate {
  name: string;
  code: string;
  primary_contact_email?: string;
  subscription_plan?: string;
  storage_limit_gb?: number;
  user_limit?: number;
}

export const platformService = {
  // Dashboard
  getDashboardStats: async () => {
    const response = await platformAxiosInstance.get('/platform/dashboard/stats');
    return response.data;
  },

  // Companies
  getCompanies: async (params?: {
    skip?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) => {
    const response = await platformAxiosInstance.get('/platform/companies', { params });
    return response.data;
  },

  getCompany: async (companyId: number) => {
    const response = await platformAxiosInstance.get(`/platform/companies/${companyId}`);
    return response.data;
  },

  createCompany: async (data: any) => {
    const response = await platformAxiosInstance.post('/platform/companies', data);
    return response.data;
  },

  updateCompany: async (companyId: number, data: any) => {
    const response = await platformAxiosInstance.put(`/platform/companies/${companyId}`, data);
    return response.data;
  },

  suspendCompany: async (companyId: number) => {
    const response = await platformAxiosInstance.post(`/platform/companies/${companyId}/suspend`);
    return response.data;
  },

  activateCompany: async (companyId: number) => {
    const response = await platformAxiosInstance.post(`/platform/companies/${companyId}/activate`);
    return response.data;
  },

  impersonateCompany: async (companyId: number) => {
    const response = await platformAxiosInstance.post(`/platform/companies/${companyId}/impersonate`);
    return response.data;
  },

  stopImpersonation: async () => {
    const response = await platformAxiosInstance.post('/platform/stop-impersonation');
    return response.data;
  },

  // Audit Logs
  getAuditLogs: async (params?: {
    skip?: number;
    limit?: number;
    company_id?: number;
    user_id?: number;
    action?: string;
    start_date?: string;
    end_date?: string;
  }) => {
    const response = await platformAxiosInstance.get('/platform/audit-logs', { params });
    return response.data;
  },

  // Users
  getUsers: async (params?: {
    skip?: number;
    limit?: number;
    company_id?: number;
    search?: string;
    user_type?: string;
  }) => {
    const response = await platformAxiosInstance.get('/platform/users', { params });
    return response.data;
  },

  // Analytics (placeholder)
  getAnalytics: async () => {
    // TODO: Implement analytics endpoint
    return {
      revenue: [],
      usage: [],
      growth: []
    };
  },

  // Alerts (placeholder)
  getAlerts: async (params?: {
    alert_type?: string;
    resolved?: boolean;
    limit?: number;
    skip?: number;
  }) => {
    // TODO: Implement alerts endpoint
    return [];
  },

  // Security
  getSecuritySettings: async () => {
    // TODO: Implement security settings endpoint
    return {
      mfa_enabled: true,
      ip_whitelist: [],
      session_timeout: 60
    };
  },

  getSecurityStats: async () => {
    // TODO: Implement security stats endpoint
    return {
      failed_logins_24h: 0,
      suspicious_activities: 0,
      blocked_ips: 0,
      active_sessions: 0,
      mfa_enabled_users: 0,
      total_security_events: 0
    };
  },

  getSecurityEvents: async (params?: {
    skip?: number;
    limit?: number;
  }) => {
    // TODO: Implement security events endpoint
    return [];
  },

  // Settings
  getSettings: async () => {
    // TODO: Implement settings endpoint
    return {
      platform_name: "Biwi Platform",
      platform_description: "Multi-tenant ERP platform for modern businesses",
      support_email: "support@biwi.com",
      admin_email: "admin@biwi.com",
      maintenance_mode: false,
      registration_enabled: true,
      email_notifications: true,
      default_storage_limit: 10,
      default_user_limit: 5,
      default_trial_period: 30,
      default_currency: "USD",
      basic_plan_price: 29.99,
      pro_plan_price: 59.99,
      enterprise_plan_price: 99.99,
      smtp_host: "smtp.mailgun.org",
      smtp_port: 587,
      smtp_username: "",
      backup_frequency: "daily",
      backup_retention: 30,
      backup_location: "s3://platform-backups/"
    };
  },

  updateSettings: async (data: any) => {
    // TODO: Implement update settings endpoint
    return data;
  },

  // Additional Company methods
  deleteCompany: async (companyId: number) => {
    const response = await platformAxiosInstance.delete(`/platform/companies/${companyId}`);
    return response.data;
  }
};
