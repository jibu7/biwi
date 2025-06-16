import axiosInstance from '@/lib/axiosInstance';

// Currency interfaces
export interface Currency {
  id: number;
  company_id: number;
  code: string;
  name: string;
  symbol?: string;
  exchange_rate_to_base: number;
  is_base_currency: boolean;
  is_active: boolean;
}

export interface CurrencyCreate {
  code: string;
  name: string;
  symbol?: string;
  exchange_rate_to_base?: string | number;
  is_base_currency?: boolean;
  is_active?: boolean;
}

export interface CurrencyUpdate {
  code?: string;
  name?: string;
  symbol?: string;
  exchange_rate_to_base?: number;
  is_base_currency?: boolean;
  is_active?: boolean;
}

// Tax Type interfaces
export interface TaxType {
  id: number;
  company_id: number;
  name: string;
  rate_percentage: number;
  tax_authority_gl_account_id?: number;
  tax_code?: string;
  tax_nature: 'Sales' | 'Purchases' | 'Exempt' | 'ZeroRated';
  is_active: boolean;
}

export interface TaxTypeCreate {
  name: string;
  rate_percentage: number;
  tax_authority_gl_account_id?: number;
  tax_code?: string;
  tax_nature: 'Sales' | 'Purchases' | 'Exempt' | 'ZeroRated';
  is_active?: boolean;
}

export interface TaxTypeUpdate {
  name?: string;
  rate_percentage?: number;
  tax_authority_gl_account_id?: number;
  tax_code?: string;
  tax_nature?: 'Sales' | 'Purchases' | 'Exempt' | 'ZeroRated';
  is_active?: boolean;
}

// Branch interfaces
export interface Branch {
  id: number;
  company_id: number;
  name: string;
  address?: any;
  contact_info?: any;
  default_gl_segment_code?: string;
  is_active: boolean;
}

export interface BranchCreate {
  name: string;
  address?: any;
  contact_info?: any;
  default_gl_segment_code?: string;
  is_active?: boolean;
}

export interface BranchUpdate {
  name?: string;
  address?: any;
  contact_info?: any;
  default_gl_segment_code?: string;
  is_active?: boolean;
}

// Currency API functions
export const commonService = {
  // Currency methods
  getCurrencies: async (): Promise<Currency[]> => {
    const response = await axiosInstance.get('/common/currencies/');
    return response.data;
  },

  getCurrency: async (id: number): Promise<Currency> => {
    const response = await axiosInstance.get(`/common/currencies/${id}`);
    return response.data;
  },

  createCurrency: async (data: CurrencyCreate): Promise<Currency> => {
    const response = await axiosInstance.post('/common/currencies/', data);
    return response.data;
  },

  updateCurrency: async (id: number, data: CurrencyUpdate): Promise<Currency> => {
    const response = await axiosInstance.put(`/common/currencies/${id}`, data);
    return response.data;
  },

  deleteCurrency: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/common/currencies/${id}`);
  },

  // Tax Type methods
  getTaxTypes: async (): Promise<TaxType[]> => {
    const response = await axiosInstance.get('/common/tax-types/');
    return response.data;
  },

  getTaxType: async (id: number): Promise<TaxType> => {
    const response = await axiosInstance.get(`/common/tax-types/${id}`);
    return response.data;
  },

  createTaxType: async (data: TaxTypeCreate): Promise<TaxType> => {
    const response = await axiosInstance.post('/common/tax-types/', data);
    return response.data;
  },

  updateTaxType: async (id: number, data: TaxTypeUpdate): Promise<TaxType> => {
    const response = await axiosInstance.put(`/common/tax-types/${id}`, data);
    return response.data;
  },

  deleteTaxType: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/common/tax-types/${id}`);
  },

  // Branch methods
  getBranches: async (): Promise<Branch[]> => {
    const response = await axiosInstance.get('/common/branches/');
    return response.data;
  },

  getBranch: async (id: number): Promise<Branch> => {
    const response = await axiosInstance.get(`/common/branches/${id}`);
    return response.data;
  },

  createBranch: async (data: BranchCreate): Promise<Branch> => {
    const response = await axiosInstance.post('/common/branches/', data);
    return response.data;
  },

  updateBranch: async (id: number, data: BranchUpdate): Promise<Branch> => {
    const response = await axiosInstance.put(`/common/branches/${id}`, data);
    return response.data;
  },

  deleteBranch: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/common/branches/${id}`);
  },
};
