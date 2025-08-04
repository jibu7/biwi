import axiosInstance from '@/lib/axiosInstance';
import { User, UserCreate, UserUpdate, Role, UserPreferencesUpdate } from '@/types';

export const userService = {
  async getUsers(skip = 0, limit = 100): Promise<User[]> {
    const response = await axiosInstance.get<User[]>('/users', {
      params: { skip, limit }
    });
    return response.data;
  },

  async getUser(id: number): Promise<User> {
    const response = await axiosInstance.get<User>(`/users/${id}`);
    return response.data;
  },

  async createUser(data: UserCreate): Promise<User> {
    const response = await axiosInstance.post<User>('/users', data);
    return response.data;
  },

  async updateUser(id: number, data: UserUpdate): Promise<User> {
    const response = await axiosInstance.put<User>(`/users/${id}`, data);
    return response.data;
  },

  async deleteUser(id: number): Promise<User> {
    const response = await axiosInstance.delete<User>(`/users/${id}`);
    return response.data;
  },

  async assignRole(userId: number, roleId: number): Promise<User> {
    const response = await axiosInstance.post<User>(`/users/${userId}/roles/${roleId}`);
    return response.data;
  },

  async revokeRole(userId: number, roleId: number): Promise<User> {
    const response = await axiosInstance.delete<User>(`/users/${userId}/roles/${roleId}`);
    return response.data;
  },

  async getUserRoles(userId?: number): Promise<Role[]> {
    if (userId) {
      // For getting another user's roles (if needed in the future)
      const response = await axiosInstance.get<Role[]>(`/users/${userId}/roles`);
      return response.data;
    } else {
      // Get current user's roles
      const response = await axiosInstance.get<Role[]>('/auth/me/roles');
      return response.data;
    }
  },

  async updateMyPreferences(data: UserPreferencesUpdate): Promise<User> {
    const response = await axiosInstance.put<User>('/users/me/preferences', data);
    return response.data;
  },

  async getMyFormattingConfig(): Promise<any> {
    const response = await axiosInstance.get('/users/me/formatting');
    return response.data;
  }
};
