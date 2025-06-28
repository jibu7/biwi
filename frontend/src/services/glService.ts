import axiosInstance from '@/lib/axiosInstance';
import {
  GLAccount,
  GLAccountCreate,
  GLAccountUpdate,
  GLJournalEntry,
  GLJournalEntryCreate,
  GLTransactionType,
  GLTransactionTypeCreate,
  GLTransactionTypeUpdate,
  GLDefaults,
  GLDefaultsUpdate,
  TrialBalanceItem,
  AccountTransaction,
} from '@/types/gl';

export const glService = {
  // GL Accounts
  async getGLAccounts(includeInactive = false): Promise<GLAccount[]> {
    try {
      console.log('Making request to:', '/gl/accounts');
      const response = await axiosInstance.get<GLAccount[]>('/gl/accounts', {
        params: { include_inactive: includeInactive }
      });
      return response.data;
    } catch (error: any) {
      console.error('GL Service error:', error);
      console.error('Request config:', error.config);
      throw error;
    }
  },

  async testConnection(): Promise<any> {
    try {
      console.log('Testing connection to backend...');
      const response = await axiosInstance.get('/gl/accounts/test');
      return response.data;
    } catch (error: any) {
      console.error('Test connection failed:', error);
      throw error;
    }
  },

  async getGLAccount(id: number): Promise<GLAccount> {
    const response = await axiosInstance.get<GLAccount>(`/gl/accounts/${id}`);
    return response.data;
  },

  async createGLAccount(data: GLAccountCreate): Promise<GLAccount> {
    const response = await axiosInstance.post<GLAccount>('/gl/accounts', data);
    return response.data;
  },

  async updateGLAccount(id: number, data: GLAccountUpdate): Promise<GLAccount> {
    const response = await axiosInstance.put<GLAccount>(`/gl/accounts/${id}`, data);
    return response.data;
  },

  async deleteGLAccount(id: number): Promise<GLAccount> {
    const response = await axiosInstance.delete<GLAccount>(`/gl/accounts/${id}`);
    return response.data;
  },

  // Journal Entries
  async createJournalEntry(data: GLJournalEntryCreate): Promise<GLJournalEntry> {
    const response = await axiosInstance.post<GLJournalEntry>('/gl/journal-entries', data);
    return response.data;
  },

  async getJournalEntries(params?: {
    skip?: number;
    limit?: number;
    start_date?: string;
    end_date?: string;
  }): Promise<GLJournalEntry[]> {
    const response = await axiosInstance.get<GLJournalEntry[]>('/gl/journal-entries', { params });
    return response.data;
  },

  async getJournalEntry(id: number): Promise<GLJournalEntry> {
    const response = await axiosInstance.get<GLJournalEntry>(`/gl/journal-entries/${id}`);
    return response.data;
  },

  // Transaction Types
  async getGLTransactionTypes(): Promise<GLTransactionType[]> {
    const response = await axiosInstance.get<GLTransactionType[]>('/gl/transaction-types');
    return response.data;
  },

  async getGLTransactionType(id: number): Promise<GLTransactionType> {
    const response = await axiosInstance.get<GLTransactionType>(`/gl/transaction-types/${id}`);
    return response.data;
  },

  async createGLTransactionType(data: GLTransactionTypeCreate): Promise<GLTransactionType> {
    const response = await axiosInstance.post<GLTransactionType>('/gl/transaction-types', data);
    return response.data;
  },

  async updateGLTransactionType(id: number, data: GLTransactionTypeUpdate): Promise<GLTransactionType> {
    const response = await axiosInstance.put<GLTransactionType>(`/gl/transaction-types/${id}`, data);
    return response.data;
  },

  async deleteGLTransactionType(id: number): Promise<GLTransactionType> {
    const response = await axiosInstance.delete<GLTransactionType>(`/gl/transaction-types/${id}`);
    return response.data;
  },

  // GL Defaults
  async getGLDefaults(): Promise<GLDefaults> {
    const response = await axiosInstance.get<GLDefaults>('/gl/defaults');
    return response.data;
  },

  async updateGLDefaults(data: GLDefaultsUpdate): Promise<GLDefaults> {
    const response = await axiosInstance.put<GLDefaults>('/gl/defaults', data);
    return response.data;
  },

  // Reports
  async getTrialBalance(endDate: string): Promise<TrialBalanceItem[]> {
    const response = await axiosInstance.get<TrialBalanceItem[]>('/gl/reports/trial-balance', {
      params: { end_date: endDate }
    });
    return response.data;
  },

  async getAccountTransactions(
    accountId: number,
    startDate: string,
    endDate: string
  ): Promise<AccountTransaction[]> {
    const response = await axiosInstance.get<AccountTransaction[]>('/gl/reports/account-transactions', {
      params: {
        account_id: accountId,
        start_date: startDate,
        end_date: endDate,
      }
    });
    return response.data;
  },
};
