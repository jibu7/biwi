import { useQuery } from '@tanstack/react-query';
import { platformService } from '@/services/platformService';
import { useAuthStore } from '@/store/authStore';
import { usePlatformAuthStore } from '@/store/platformAuthStore';

export function useFeatureFlag(featureName: string) {
  // Get auth state from both stores
  const { company } = useAuthStore();
  const { user: platformUser } = usePlatformAuthStore();
  
  // For platform admins, they can specify company ID, for regular users use their company
  const companyId = company?.id;
  
  const { data, isLoading } = useQuery({
    queryKey: ['feature-flag', featureName, companyId],
    queryFn: () => platformService.checkFeatureFlag(featureName, companyId),
    enabled: !!featureName,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });

  return {
    isEnabled: data?.enabled ?? false,
    isLoading,
    featureName,
    companyId,
  };
}

// Hook specifically for platform admins to check feature flags for any company
export function usePlatformFeatureFlag(featureName: string, targetCompanyId?: number) {
  const { user: platformUser } = usePlatformAuthStore();
  
  const { data, isLoading } = useQuery({
    queryKey: ['platform-feature-flag', featureName, targetCompanyId],
    queryFn: () => platformService.checkFeatureFlag(featureName, targetCompanyId),
    enabled: !!featureName && platformUser?.user_type === 'platform_admin',
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });

  return {
    isEnabled: data?.enabled ?? false,
    isLoading,
    featureName,
    companyId: targetCompanyId,
  };
}

// Hook for checking multiple feature flags at once
export function useFeatureFlags(featureNames: string[]) {
  const { company } = useAuthStore();
  const companyId = company?.id;
  
  const queries = useQuery({
    queryKey: ['feature-flags-batch', featureNames, companyId],
    queryFn: async () => {
      const results = await Promise.all(
        featureNames.map(name => 
          platformService.checkFeatureFlag(name, companyId)
        )
      );
      
      // Return as object with feature name as key
      return featureNames.reduce((acc, name, index) => {
        acc[name] = results[index]?.enabled ?? false;
        return acc;
      }, {} as Record<string, boolean>);
    },
    enabled: featureNames.length > 0,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return {
    features: queries.data ?? {},
    isLoading: queries.isLoading,
    companyId,
  };
}
