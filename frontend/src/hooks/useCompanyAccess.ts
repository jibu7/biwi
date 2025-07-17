import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { glService } from '@/services/glService';

export function useCompanyAccess() {
  const { user, selectedCompanyId, company } = useAuthStore();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      setIsLoading(true);
      
      try {
        // For regular users, they should have access to their assigned company
        if (!user?.is_superuser) {
          if (company) {
            const access = await glService.checkGLAccess();
            setHasAccess(access);
          } else {
            setHasAccess(false);
          }
        } else {
          // For superadmins, they need to have a company selected
          if (selectedCompanyId) {
            const access = await glService.checkGLAccess();
            setHasAccess(access);
          } else {
            setHasAccess(false);
          }
        }
      } catch (error) {
        console.error('Error checking company access:', error);
        setHasAccess(false);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      checkAccess();
    } else {
      setHasAccess(false);
      setIsLoading(false);
    }
  }, [user, selectedCompanyId, company]);

  return {
    hasAccess,
    isLoading,
    currentCompanyId: user?.is_superuser ? selectedCompanyId : user?.company_id,
    currentCompanyName: user?.is_superuser 
      ? (selectedCompanyId ? 'Selected Company' : 'No Company Selected')
      : company?.name || 'No Company'
  };
}

export function useRequireCompanyAccess() {
  const access = useCompanyAccess();
  
  useEffect(() => {
    if (!access.isLoading && !access.hasAccess) {
      console.warn('Company access check failed');
    }
  }, [access.hasAccess, access.isLoading]);
  
  return access;
}
