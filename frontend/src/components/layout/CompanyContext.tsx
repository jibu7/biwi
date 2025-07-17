'use client';

import { useAuthStore } from '@/store/authStore';
import { useQuery } from '@tanstack/react-query';
import { companyService } from '@/services/companyService';
import { Company } from '@/types';
import { Building2 } from 'lucide-react';

export function CompanyContext() {
  const { user, company, selectedCompanyId } = useAuthStore();
  
  const { data: companies } = useQuery<Company[]>({
    queryKey: ['companies'],
    queryFn: () => companyService.getCompanies(),
    enabled: user?.is_superuser === true,
  });

  // For regular users, show their assigned company
  if (!user?.is_superuser) {
    if (company) {
      return (
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-md">
          <Building2 className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-900">{company.name}</span>
        </div>
      );
    }
    return null;
  }

  // For superadmins, show the selected company context
  const selectedCompany = companies?.find(c => c.id === selectedCompanyId);
  
  if (!selectedCompany) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-md">
        <Building2 className="h-4 w-4 text-yellow-600" />
        <span className="text-sm font-medium text-yellow-900">No company selected</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-md">
      <Building2 className="h-4 w-4 text-green-600" />
      <span className="text-sm font-medium text-green-900">
        Viewing: {selectedCompany.name}
      </span>
    </div>
  );
}
