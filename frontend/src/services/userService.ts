import axiosInstance from '@/lib/axiosInstance';
import { User, UserCreate, UserUpdate } from '@/types';

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
  }
};
