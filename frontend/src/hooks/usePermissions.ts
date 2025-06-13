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
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  // Memoize the aggregated permissions to prevent unnecessary recalculations
  const allPermissions = useMemo(() => {
    return userRoles.flatMap(role => role.permissions || []);
  }, [userRoles]);

  // Memoize user properties to prevent dependency changes
  const userMemo = useMemo(() => ({
    id: user?.id,
    is_superuser: user?.is_superuser,
  }), [user?.id, user?.is_superuser]);

  const hasPermission = useCallback((permission: string): boolean => {
    if (!userMemo.id) return false;
    if (userMemo.is_superuser) return true;
    
    return allPermissions.includes(permission);
  }, [userMemo.id, userMemo.is_superuser, allPermissions]);

  const hasAnyPermission = useCallback((permissions: string[]): boolean => {
    if (!userMemo.id) return false;
    if (userMemo.is_superuser) return true;
    
    return permissions.some(permission => hasPermission(permission));
  }, [userMemo.id, userMemo.is_superuser, hasPermission]);

  return {
    hasPermission,
    hasAnyPermission,
  };
};
