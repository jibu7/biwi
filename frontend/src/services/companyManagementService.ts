import axiosInstance from '@/lib/axiosInstance';
import platformAxiosInstance from '@/lib/platformAxiosInstance';
import { User, Role } from '@/types';
import { PlatformUser, CreatePlatformUser } from '@/types/platform';

// Company Management specific interfaces
export interface CreateCompanyUserRequest {
  email: string;
  password: string;
  full_name?: string;
  user_type: 'company_admin' | 'company_user';
  company_id: number;
  is_active?: boolean;
  role_ids?: number[];
}

export interface CreateCompanyUserResponse {
  id: number;
  email: string;
  full_name?: string;
  user_type: string;
  company_id: number;
  is_active: boolean;
  created_at: string;
  roles?: Role[];
}

export interface AssignRoleRequest {
  user_id: number;
  role_id: number;
  company_id: number;
}

export interface RoleAssignmentResponse {
  user_id: number;
  role_id: number;
  company_id: number;
  assigned_at: string;
}

export interface AvailableRole {
  id: number;
  name: string;
  description?: string;
  permissions: string[];
  company_id: number;
  is_default?: boolean;
}

export interface CompanyUserWithRoles extends User {
  roles: Role[];
  role_names: string[];
}

export interface UserRoleManagementRequest {
  user_id: number;
  company_id: number;
  role_ids: number[];
}

export interface BulkUserCreateRequest {
  users: CreateCompanyUserRequest[];
  send_welcome_email?: boolean;
}

export interface BulkUserCreateResponse {
  created_users: CreateCompanyUserResponse[];
  failed_users: {
    email: string;
    error: string;
  }[];
  total_created: number;
  total_failed: number;
}

export const companyManagementService = {
  /**
   * Create a new user within a company with role assignment
   */
  async createUser(data: CreateCompanyUserRequest): Promise<CreateCompanyUserResponse> {
    try {
      // First create the user
      const userCreateData: CreatePlatformUser = {
        email: data.email,
        password: data.password,
        full_name: data.full_name,
        user_type: data.user_type,
        company_id: data.company_id,
        is_active: data.is_active ?? true,
        is_superuser: false
      };

      // Use platform service for user creation (platform admin flow)
      const response = await platformAxiosInstance.post<CreateCompanyUserResponse>(
        '/platform/users',
        userCreateData
      );

      const createdUser = response.data;

      // If role_ids are provided, assign roles to the user
      if (data.role_ids && data.role_ids.length > 0) {
        await this.assignRolesToUser(createdUser.id, data.company_id, data.role_ids);
        
        // Fetch the user with roles to return complete data
        const userWithRoles = await this.getUserWithRoles(createdUser.id, data.company_id);
        return {
          ...createdUser,
          roles: userWithRoles.roles
        };
      }

      return createdUser;
    } catch (error: any) {
      if (error.response?.status === 400) {
        throw new Error(error.response.data.detail || 'Invalid user data provided');
      } else if (error.response?.status === 409) {
        throw new Error('User with this email already exists');
      } else if (error.response?.status === 403) {
        throw new Error('Insufficient permissions to create user');
      }
      throw new Error(`Failed to create user: ${error.message}`);
    }
  },

  /**
   * Get all available roles for a company
   */
  async getAvailableRoles(companyId: number): Promise<AvailableRole[]> {
    try {
      // Use company-specific role endpoint
      const response = await axiosInstance.get<AvailableRole[]>(`/companies/${companyId}/roles`);
      return response.data;
    } catch (error: any) {
      // Fallback to general roles endpoint if company-specific doesn't exist
      try {
        const response = await axiosInstance.get<Role[]>('/roles', {
          params: { company_id: companyId }
        });
        return response.data.map(role => ({
          ...role,
          company_id: companyId
        }));
      } catch (fallbackError: any) {
        if (error.response?.status === 404) {
          throw new Error('Company not found or no roles available');
        } else if (error.response?.status === 403) {
          throw new Error('Insufficient permissions to view roles');
        }
        throw new Error(`Failed to get available roles: ${error.message}`);
      }
    }
  },

  /**
   * Get all default/system roles that can be assigned
   */
  async getSystemRoles(): Promise<AvailableRole[]> {
    try {
      const response = await axiosInstance.get<AvailableRole[]>('/roles/system');
      return response.data;
    } catch (error: any) {
      // Fallback to getting all roles and filtering
      try {
        const response = await axiosInstance.get<Role[]>('/roles');
        return response.data.map(role => ({
          ...role,
          company_id: role.company_id,
          is_default: true
        }));
      } catch (fallbackError: any) {
        if (error.response?.status === 403) {
          throw new Error('Insufficient permissions to view system roles');
        }
        throw new Error(`Failed to get system roles: ${error.message}`);
      }
    }
  },

  /**
   * Assign a single role to a user
   */
  async assignRole(data: AssignRoleRequest): Promise<RoleAssignmentResponse> {
    try {
      const response = await axiosInstance.post<RoleAssignmentResponse>(
        `/users/${data.user_id}/roles/${data.role_id}`,
        { company_id: data.company_id }
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('User or role not found');
      } else if (error.response?.status === 409) {
        throw new Error('User already has this role assigned');
      } else if (error.response?.status === 403) {
        throw new Error('Insufficient permissions to assign roles');
      }
      throw new Error(`Failed to assign role: ${error.message}`);
    }
  },

  /**
   * Assign multiple roles to a user
   */
  async assignRolesToUser(userId: number, companyId: number, roleIds: number[]): Promise<void> {
    try {
      const requests = roleIds.map(roleId => 
        this.assignRole({ user_id: userId, role_id: roleId, company_id: companyId })
      );
      await Promise.all(requests);
    } catch (error: any) {
      throw new Error(`Failed to assign roles to user: ${error.message}`);
    }
  },

  /**
   * Remove a role from a user
   */
  async revokeRole(userId: number, roleId: number, companyId: number): Promise<void> {
    try {
      await axiosInstance.delete(`/users/${userId}/roles/${roleId}`, {
        data: { company_id: companyId }
      });
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('User, role, or role assignment not found');
      } else if (error.response?.status === 403) {
        throw new Error('Insufficient permissions to revoke roles');
      }
      throw new Error(`Failed to revoke role: ${error.message}`);
    }
  },

  /**
   * Update user role assignments (replace all current roles)
   */
  async updateUserRoles(data: UserRoleManagementRequest): Promise<CompanyUserWithRoles> {
    try {
      // First get current roles to determine what to remove
      const currentUser = await this.getUserWithRoles(data.user_id, data.company_id);
      const currentRoleIds = currentUser.roles.map(role => role.id);

      // Remove roles that are not in the new list
      const rolesToRemove = currentRoleIds.filter(roleId => !data.role_ids.includes(roleId));
      const rolesToAdd = data.role_ids.filter(roleId => !currentRoleIds.includes(roleId));

      // Remove old roles
      for (const roleId of rolesToRemove) {
        await this.revokeRole(data.user_id, roleId, data.company_id);
      }

      // Add new roles
      for (const roleId of rolesToAdd) {
        await this.assignRole({
          user_id: data.user_id,
          role_id: roleId,
          company_id: data.company_id
        });
      }

      // Return updated user with roles
      return await this.getUserWithRoles(data.user_id, data.company_id);
    } catch (error: any) {
      throw new Error(`Failed to update user roles: ${error.message}`);
    }
  },

  /**
   * Get a user with their assigned roles
   */
  async getUserWithRoles(userId: number, companyId: number): Promise<CompanyUserWithRoles> {
    try {
      const [userResponse, rolesResponse] = await Promise.all([
        axiosInstance.get<User>(`/users/${userId}`),
        axiosInstance.get<Role[]>(`/users/${userId}/roles`)
      ]);

      const user = userResponse.data;
      const roles = rolesResponse.data;

      return {
        ...user,
        roles,
        role_names: roles.map(role => role.name)
      };
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('User not found');
      } else if (error.response?.status === 403) {
        throw new Error('Insufficient permissions to view user details');
      }
      throw new Error(`Failed to get user with roles: ${error.message}`);
    }
  },

  /**
   * Get all users for a company with their roles
   */
  async getCompanyUsersWithRoles(companyId: number, skip = 0, limit = 100): Promise<CompanyUserWithRoles[]> {
    try {
      // Get users for the company
      const response = await platformAxiosInstance.get<PlatformUser[]>('/platform/users', {
        params: { company_id: companyId, skip, limit }
      });

      const users = response.data;

      // Get roles for each user
      const usersWithRoles = await Promise.all(
        users.map(async (user) => {
          try {
            const rolesResponse = await axiosInstance.get<Role[]>(`/users/${user.id}/roles`);
            return {
              ...user,
              roles: rolesResponse.data,
              role_names: rolesResponse.data.map(role => role.name)
            } as CompanyUserWithRoles;
          } catch (error) {
            // If we can't get roles, return user with empty roles
            return {
              ...user,
              roles: [],
              role_names: []
            } as CompanyUserWithRoles;
          }
        })
      );

      return usersWithRoles;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Company not found');
      } else if (error.response?.status === 403) {
        throw new Error('Insufficient permissions to view company users');
      }
      throw new Error(`Failed to get company users: ${error.message}`);
    }
  },

  /**
   * Create multiple users in bulk
   */
  async createUsersBulk(data: BulkUserCreateRequest): Promise<BulkUserCreateResponse> {
    const createdUsers: CreateCompanyUserResponse[] = [];
    const failedUsers: { email: string; error: string; }[] = [];

    for (const userData of data.users) {
      try {
        const createdUser = await this.createUser(userData);
        createdUsers.push(createdUser);
      } catch (error: any) {
        failedUsers.push({
          email: userData.email,
          error: error.message
        });
      }
    }

    return {
      created_users: createdUsers,
      failed_users: failedUsers,
      total_created: createdUsers.length,
      total_failed: failedUsers.length
    };
  },

  /**
   * Get all permissions available in the system
   */
  async getAllPermissions(): Promise<string[]> {
    try {
      const response = await axiosInstance.get<string[]>('/roles/permissions/all');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new Error('Insufficient permissions to view system permissions');
      }
      throw new Error(`Failed to get system permissions: ${error.message}`);
    }
  },

  /**
   * Check if a user has specific permissions
   */
  async checkUserPermissions(userId: number, permissions: string[]): Promise<{ [permission: string]: boolean }> {
    try {
      const response = await axiosInstance.post<{ [permission: string]: boolean }>(
        `/users/${userId}/permissions/check`,
        { permissions }
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('User not found');
      } else if (error.response?.status === 403) {
        throw new Error('Insufficient permissions to check user permissions');
      }
      throw new Error(`Failed to check user permissions: ${error.message}`);
    }
  },

  /**
   * Get available user types for company user creation
   */
  getAvailableUserTypes(): Array<{ value: 'company_admin' | 'company_user'; label: string; description: string }> {
    return [
      {
        value: 'company_admin',
        label: 'Company Admin',
        description: 'Full administrative access within the company'
      },
      {
        value: 'company_user',
        label: 'Company User',
        description: 'Standard user with limited permissions'
      }
    ];
  }
};
