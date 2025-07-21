import platformAxiosInstance from '@/lib/platformAxiosInstance';
import { BillingPlan, CreateBillingPlan, UpdateBillingPlan } from '@/types/platform';

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
  permissions?: string[];
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

export interface PlatformAuditLog {
  id: number;
  company_id?: number;
  user_id?: number;
  platform_admin_id?: number;
  action: string;
  resource_type: string;
  resource_id?: string;
  ip_address?: string;
  user_agent?: string;
  request_method?: string;
  request_path?: string;
  old_values?: any;
  new_values?: any;
  status_code?: number;
  error_message?: string;
  created_at: string;
  timestamp: string; // Alias for created_at for compatibility
}

export interface AuditLogFilters {
  company_id?: number | null;
  user_id?: number | null;
  action?: string | null;
  resource_type?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  limit?: number;
  offset?: number;
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
  getPlatformStats: async () => {
    const response = await platformAxiosInstance.get('/platform/dashboard/stats');
    return response.data;
  },
  getDashboardStats: async () => {
    const response = await platformAxiosInstance.get('/platform/dashboard/stats');
    return response.data;
  },
  getSystemHealth: async () => {
    const response = await platformAxiosInstance.get('/platform/dashboard/health');
    return response.data;
  },
  getSystemHealthDetailed: async () => {
    // For now, return mock detailed health data
    // In a real implementation, this would call a specific detailed health endpoint
    return {
      services: {
        database: {
          status: 'operational',
          metrics: {
            response_time: 45,
            uptime: 99.9,
            connections: 23
          }
        },
        api_server: {
          status: 'operational',
          metrics: {
            response_time: 120,
            uptime: 99.8,
            cpu_usage: 35,
            memory_usage: 42
          }
        },
        file_storage: {
          status: 'operational',
          metrics: {
            response_time: 80,
            uptime: 100,
            disk_usage: 65
          }
        },
        email_service: {
          status: 'degraded',
          metrics: {
            response_time: 250,
            uptime: 98.5,
            queue_size: 150
          }
        }
      }
    };
  },
  getRevenueChartData: async () => {
    const response = await platformAxiosInstance.get('/platform/dashboard/revenue-chart');
    return response.data;
  },

  // Companies
  getCompanies: async (params?: {
    skip?: number;
    limit?: number;
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
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

  queryAuditLogs: async (filters: AuditLogFilters): Promise<PlatformAuditLog[]> => {
    const params = {
      company_id: filters.company_id,
      user_id: filters.user_id,
      action: filters.action,
      resource_type: filters.resource_type,
      start_date: filters.start_date,
      end_date: filters.end_date,
      limit: filters.limit,
      skip: filters.offset,
    };
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
  },

  // Billing Plans
  getBillingPlans: async (): Promise<BillingPlan[]> => {
    const response = await platformAxiosInstance.get('/platform/billing/plans');
    return response.data;
  },

  createBillingPlan: async (data: CreateBillingPlan): Promise<BillingPlan> => {
    const response = await platformAxiosInstance.post('/platform/billing/plans', data);
    return response.data;
  },

  updateBillingPlan: async (id: number, data: UpdateBillingPlan): Promise<BillingPlan> => {
    const response = await platformAxiosInstance.put(`/platform/billing/plans/${id}`, data);
    return response.data;
  },

  deleteBillingPlan: async (id: number): Promise<void> => {
    await platformAxiosInstance.delete(`/platform/billing/plans/${id}`);
  },

  // Feature Flags
  getFeatureFlags: async () => {
    // Mock data for now - in a real implementation, you'd call a specific feature flags endpoint
    return [
      {
        id: 1,
        name: 'advanced_reporting',
        description: 'Enable advanced reporting features',
        is_enabled_globally: false,
        enabled_companies: [1, 3, 5],
        disabled_companies: [],
        rollout_percentage: 25,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 2,
        name: 'multi_currency',
        description: 'Enable multi-currency support',
        is_enabled_globally: true,
        enabled_companies: [],
        disabled_companies: [2],
        rollout_percentage: 100,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 3,
        name: 'beta_dashboard',
        description: 'New dashboard beta features',
        is_enabled_globally: false,
        enabled_companies: [1, 2],
        disabled_companies: [],
        rollout_percentage: 10,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ];
  },

  createFeatureFlag: async (data: any) => {
    // Mock implementation - in a real app, this would call the API
    return {
      id: Math.random(),
      name: data.name,
      description: data.description,
      is_enabled_globally: data.is_enabled_globally || false,
      enabled_companies: data.enabled_companies || [],
      disabled_companies: data.disabled_companies || [],
      rollout_percentage: data.rollout_percentage || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  },

  updateFeatureFlag: async (name: string, data: any) => {
    // Mock implementation - in a real app, this would call the API
    return {
      name,
      ...data,
      updated_at: new Date().toISOString(),
    };
  },

  checkFeatureFlag: async (name: string, companyId?: number) => {
    // Mock implementation - in a real app, this would call the API
    return {
      feature: name,
      enabled: Math.random() > 0.5,
    };
  }
};
