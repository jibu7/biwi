import axiosInstance from '@/lib/axiosInstance';
import { Company, CompanyCreate, CompanyUpdate } from '@/types';

export const companyService = {
  async getCompanies(skip = 0, limit = 100): Promise<Company[]> {
    const response = await axiosInstance.get<Company[]>('/companies', {
      params: { skip, limit }
    });
    return response.data;
  },

  async getCompany(id: number): Promise<Company> {
    const response = await axiosInstance.get<Company>(`/companies/${id}`);
    return response.data;
  },

  async getCurrentCompany(): Promise<Company> {
    const response = await axiosInstance.get<Company>('/companies/current');
    return response.data;
  },

  async createCompany(data: CompanyCreate): Promise<Company> {
    const response = await axiosInstance.post<Company>('/companies', data);
    return response.data;
  },

  async updateCompany(id: number, data: CompanyUpdate): Promise<Company> {
    const response = await axiosInstance.put<Company>(`/companies/${id}`, data);
    return response.data;
  }
};
