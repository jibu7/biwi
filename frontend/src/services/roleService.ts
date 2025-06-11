import axiosInstance from '@/lib/axiosInstance';
import { Role, RoleCreate, RoleUpdate } from '@/types';

export const roleService = {
  async getRoles(skip = 0, limit = 100): Promise<Role[]> {
    const response = await axiosInstance.get<Role[]>('/roles', {
      params: { skip, limit }
    });
    return response.data;
  },

  async getRole(id: number): Promise<Role> {
    const response = await axiosInstance.get<Role>(`/roles/${id}`);
    return response.data;
  },

  async createRole(data: RoleCreate): Promise<Role> {
    const response = await axiosInstance.post<Role>('/roles', data);
    return response.data;
  },

  async updateRole(id: number, data: RoleUpdate): Promise<Role> {
    const response = await axiosInstance.put<Role>(`/roles/${id}`, data);
    return response.data;
  },

  async deleteRole(id: number): Promise<Role> {
    const response = await axiosInstance.delete<Role>(`/roles/${id}`);
    return response.data;
  },

  async getAllPermissions(): Promise<string[]> {
    const response = await axiosInstance.get<string[]>('/roles/permissions/all');
    return response.data;
  }
};
