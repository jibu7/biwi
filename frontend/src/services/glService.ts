// frontend/src/services/glService.ts
import axiosInstance from '@/lib/axiosInstance';
import { GLAccount, GLAccountCreate, GLAccountUpdate, GLJournalEntry, GLJournalEntryCreate } from '@/types/gl';

export const glService = {
  // GL Accounts
  async getAccounts(params?: {
    skip?: number;
    limit?: number;
    accountType?: string;
    isActive?: boolean;
  }): Promise<GLAccount[]> {
    const response = await axiosInstance.get('/gl/accounts', { params });
    return response.data;
  },

  async getAccount(id: number): Promise<GLAccount> {
    const response = await axiosInstance.get(`/gl/accounts/${id}`);
    return response.data;
  },

  async createAccount(data: GLAccountCreate): Promise<GLAccount> {
    const response = await axiosInstance.post('/gl/accounts', data);
    return response.data;
  },

  async updateAccount(id: number, data: GLAccountUpdate): Promise<GLAccount> {
    const response = await axiosInstance.put(`/gl/accounts/${id}`, data);
    return response.data;
  },

  async deleteAccount(id: number): Promise<void> {
    await axiosInstance.delete(`/gl/accounts/${id}`);
  },

  async validateAccountCode(code: string): Promise<{
    valid: boolean;
    account?: {
      id: number;
      code: string;
      name: string;
      type: string;
    };
  }> {
    const response = await axiosInstance.get(`/gl/accounts/validate/${code}`);
    return response.data;
  },

  // Journal Entries
  async createJournalEntry(data: GLJournalEntryCreate): Promise<GLJournalEntry> {
    const response = await axiosInstance.post('/gl/journal-entries', data);
    return response.data;
  },

  async getJournalEntries(params?: {
    skip?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    status?: string;
  }): Promise<GLJournalEntry[]> {
    const response = await axiosInstance.get('/gl/journal-entries', { params });
    return response.data;
  },

  // Reports
  async getTrialBalance(endDate: string, onlyActive: boolean = true) {
    const response = await axiosInstance.get('/gl/reports/trial-balance', {
      params: { end_date: endDate, only_active: onlyActive }
    });
    return response.data;
  },

  // Helper function to check if user can access GL data
  async checkGLAccess(): Promise<boolean> {
    try {
      await axiosInstance.get('/gl/accounts', { params: { limit: 1 } });
      return true;
    } catch (error) {
      return false;
    }
  }
};
