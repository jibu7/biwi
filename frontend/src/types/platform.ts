export interface PlatformUser {
  id: number;
  email: string;
  full_name: string | null;
  user_type: 'platform_admin' | 'company_admin' | 'company_user';
  is_active: boolean;
  is_superuser: boolean;
  company_id: number | null;
  company_name?: string | null;
  company_code?: string | null;
  last_login?: string | null;
  created_at?: string;
  permissions?: string[];
}

export interface CreatePlatformUser {
  email: string;
  password: string;
  full_name?: string;
  user_type: 'platform_admin' | 'company_admin' | 'company_user';
  company_id?: number | null;
  is_active?: boolean;
  is_superuser?: boolean;
}

export interface UpdatePlatformUser {
  email?: string;
  full_name?: string;
  password?: string;
  user_type?: 'platform_admin' | 'company_admin' | 'company_user';
  company_id?: number | null;
  is_active?: boolean;
  is_superuser?: boolean;
}

export interface BillingPlan {
  id: number;
  name: string;
  plan_type: 'basic' | 'pro' | 'enterprise' | 'custom';
  monthly_price: number;
  yearly_price?: number;
  max_users?: number;
  max_storage_gb?: number;
  features: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateBillingPlan {
  name: string;
  plan_type: 'basic' | 'pro' | 'enterprise' | 'custom';
  monthly_price: number;
  yearly_price?: number;
  max_users?: number;
  max_storage_gb?: number;
  features: string[];
  is_active: boolean;
}

export interface UpdateBillingPlan {
  name?: string;
  plan_type?: 'basic' | 'pro' | 'enterprise' | 'custom';
  monthly_price?: number;
  yearly_price?: number;
  max_users?: number;
  max_storage_gb?: number;
  features?: string[];
  is_active?: boolean;
}
