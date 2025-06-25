// Auth Types
export interface User {
  id: number;
  email: string;
  full_name?: string;
  is_active: boolean;
  is_superuser: boolean;
  company_id: number;
}

export interface UserCreate {
  email: string;
  password: string;
  full_name?: string;
  is_active?: boolean;
  is_superuser?: boolean;
}

export interface UserUpdate {
  email?: string;
  full_name?: string;
  password?: string;
  is_active?: boolean;
  is_superuser?: boolean;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

// Company Types
export interface Company {
  id: number;
  name: string;
  address?: any;
  contact_info?: any;
  default_currency_code?: string;
  is_active: boolean;
}

export interface CompanyCreate {
  name: string;
  address?: any;
  contact_info?: any;
  default_currency_code?: string;
  is_active?: boolean;
}

export interface CompanyUpdate {
  name?: string;
  address?: any;
  contact_info?: any;
  default_currency_code?: string;
  is_active?: boolean;
}

// Role Types
export interface Role {
  id: number;
  name: string;
  description?: string;
  permissions: string[];
  company_id: number;
}

export interface RoleCreate {
  name: string;
  description?: string;
  permissions: string[];
}

export interface RoleUpdate {
  name?: string;
  description?: string;
  permissions?: string[];
}

// Accounting Period Types
export interface AccountingPeriod {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  status: 'Open' | 'Closed' | 'Future';
  company_id: number;
}

export interface AccountingPeriodCreate {
  name: string;
  start_date: string;
  end_date: string;
  status?: 'Open' | 'Closed' | 'Future';
}

export interface AccountingPeriodUpdate {
  name?: string;
  start_date?: string;
  end_date?: string;
  status?: 'Open' | 'Closed' | 'Future';
}

// Export GL types
export * from './gl';

// Export BOM types
export * from './bom';
