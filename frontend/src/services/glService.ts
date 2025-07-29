// frontend/src/services/glService.ts
import axiosInstance from '@/lib/axiosInstance';
import { GLAccount, GLAccountCreate, GLAccountUpdate, GLJournalEntry, GLJournalEntryCreate, GLDefaults, GLDefaultsUpdate, GLTransactionType, GLTransactionTypeCreate, GLTransactionTypeUpdate } from '@/types/gl';

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
    start_date?: string;
    end_date?: string;
    status?: string;
  }): Promise<GLJournalEntry[]> {
    const response = await axiosInstance.get('/gl/journal-entries', { params });
    return response.data;
  },

  async postJournalEntry(journalEntryId: number): Promise<any> {
    const response = await axiosInstance.post(`/gl/journal-entries/${journalEntryId}/post`);
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
  },

  // GL Defaults
  async getGLDefaults(): Promise<GLDefaults> {
    const response = await axiosInstance.get('/gl/defaults');
    return response.data;
  },

  async updateGLDefaults(data: GLDefaultsUpdate): Promise<GLDefaults> {
    const response = await axiosInstance.put('/gl/defaults', data);
    return response.data;
  },

  // Alias for getAccounts to match frontend usage
  async getGLAccounts(params?: {
    skip?: number;
    limit?: number;
    accountType?: string;
    isActive?: boolean;
  }): Promise<GLAccount[]> {
    return this.getAccounts(params);
  },

  // GL Transaction Types
  async getTransactionTypes(params?: {
    skip?: number;
    limit?: number;
    isActive?: boolean;
  }): Promise<GLTransactionType[]> {
    const response = await axiosInstance.get('/gl/transaction-types', { params });
    return response.data;
  },

  async getTransactionType(id: number): Promise<GLTransactionType> {
    const response = await axiosInstance.get(`/gl/transaction-types/${id}`);
    return response.data;
  },

  async createTransactionType(data: GLTransactionTypeCreate): Promise<GLTransactionType> {
    const response = await axiosInstance.post('/gl/transaction-types', data);
    return response.data;
  },

  async updateTransactionType(id: number, data: GLTransactionTypeUpdate): Promise<GLTransactionType> {
    const response = await axiosInstance.put(`/gl/transaction-types/${id}`, data);
    return response.data;
  },

  async deleteTransactionType(id: number): Promise<void> {
    await axiosInstance.delete(`/gl/transaction-types/${id}`);
  },

  // Aliases for transaction types to match frontend usage
  async getGLTransactionTypes(params?: {
    skip?: number;
    limit?: number;
    isActive?: boolean;
  }): Promise<GLTransactionType[]> {
    return this.getTransactionTypes(params);
  },

  async deleteGLTransactionType(id: number): Promise<void> {
    return this.deleteTransactionType(id);
  },

  async getGLTransactionType(id: number): Promise<GLTransactionType> {
    return this.getTransactionType(id);
  },

  async updateGLTransactionType(id: number, data: GLTransactionTypeUpdate): Promise<GLTransactionType> {
    return this.updateTransactionType(id, data);
  }
};
