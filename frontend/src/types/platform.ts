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
