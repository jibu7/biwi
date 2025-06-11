import { useAuth } from '@/store/authStore';
import { roleService } from '@/services/roleService';
import { useQuery } from '@tanstack/react-query';
import { Role } from '@/types';

export const usePermissions = () => {
  const { user } = useAuth();
  
  const { data: userRoles = [] } = useQuery({
    queryKey: ['userRoles', user?.id],
    queryFn: async () => {
      if (!user) return [];
      // For now, we'll fetch all roles and filter
      // In production, you'd want a specific endpoint for user's roles
      const allRoles = await roleService.getRoles();
      return allRoles.filter(role => role.company_id === user.company_id);
    },
    enabled: !!user,
  });

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.is_superuser) return true;
    
    // Aggregate all permissions from user's roles
    const permissions = userRoles.flatMap(role => role.permissions || []);
    return permissions.includes(permission);
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!user) return false;
    if (user.is_superuser) return true;
    
    return permissions.some(permission => hasPermission(permission));
  };

  return {
    hasPermission,
    hasAnyPermission,
  };
};
