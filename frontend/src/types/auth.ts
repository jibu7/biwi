export interface User {
  id: number;
  email: string;
  full_name?: string;
  is_active: boolean;
  is_superuser: boolean;
  company_id: number;
}

export interface Company {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  tax_id?: string;
}

export interface Role {
  id: number;
  name: string;
  description?: string;
  permissions: string[];
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
  company: Company;
}

export interface LoginCredentials {
  email: string;
  password: string;
}
