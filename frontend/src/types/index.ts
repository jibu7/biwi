// Auth Types
export interface User {
  id: number;
  email: string;
  full_name?: string;
  user_type: 'platform_admin' | 'company_admin' | 'company_user';
  company_id?: number;
  is_active: boolean;
  is_superuser?: boolean;
  date_format_override?: string;
  locale?: string;
  timezone?: string;
  formatting_config?: {
    dateFormat: string;
    timeFormat: '12h' | '24h';
    decimalSeparator: string;
    thousandSeparator: string;
    currencyCode: string;
    currencySymbol: string;
    currencyPosition: 'prefix' | 'suffix';
    currencyDecimalPlaces: number;
    locale: string;
    timezone: string;
  };
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
  code: string;
  subscription_status: string;
  address?: any;
  contact_info?: any;
  default_currency_code?: string;
  is_active: boolean;
  date_format?: string;
  time_format?: '12h' | '24h';
  decimal_separator?: string;
  thousand_separator?: string;
  currency_position?: 'prefix' | 'suffix';
  default_currency?: {
    code: string;
    symbol: string;
    decimal_places: number;
  };
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

export interface CompanyFormattingUpdate {
  date_format?: string;
  time_format?: '12h' | '24h';
  decimal_separator?: string;
  thousand_separator?: string;
  currency_position?: 'prefix' | 'suffix';
}

export interface UserPreferencesUpdate {
  date_format_override?: string;
  locale?: string;
  timezone?: string;
}

export interface FormattingConfig {
  dateFormat: string;
  timeFormat: '12h' | '24h';
  decimalSeparator: string;
  thousandSeparator: string;
  currencyCode: string;
  currencySymbol: string;
  currencyPosition: 'prefix' | 'suffix';
  currencyDecimalPlaces: number;
  locale: string;
  timezone: string;
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
