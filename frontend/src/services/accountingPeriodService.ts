import axiosInstance from '@/lib/axiosInstance';
import { AccountingPeriod, AccountingPeriodCreate, AccountingPeriodUpdate } from '@/types';

export const accountingPeriodService = {
  async getAccountingPeriods(skip = 0, limit = 100): Promise<AccountingPeriod[]> {
    const response = await axiosInstance.get<AccountingPeriod[]>('/accounting-periods', {
      params: { skip, limit }
    });
    return response.data;
  },

  async createAccountingPeriod(data: AccountingPeriodCreate): Promise<AccountingPeriod> {
    const response = await axiosInstance.post<AccountingPeriod>('/accounting-periods', data);
    return response.data;
  },

  async updateAccountingPeriod(id: number, data: AccountingPeriodUpdate): Promise<AccountingPeriod> {
    const response = await axiosInstance.put<AccountingPeriod>(`/accounting-periods/${id}`, data);
    return response.data;
  }
};
