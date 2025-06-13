import { useAuth } from '@/store/authStore';
import { roleService } from '@/services/roleService';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
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

  // Memoize the aggregated permissions to prevent unnecessary recalculations
  const allPermissions = useMemo(() => {
    return userRoles.flatMap(role => role.permissions || []);
  }, [userRoles]);

  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false;
    if (user.is_superuser) return true;
    
    return allPermissions.includes(permission);
  }, [user, allPermissions]);

  const hasAnyPermission = useCallback((permissions: string[]): boolean => {
    if (!user) return false;
    if (user.is_superuser) return true;
    
    return permissions.some(permission => hasPermission(permission));
  }, [user, hasPermission]);

  return {
    hasPermission,
    hasAnyPermission,
  };
};
