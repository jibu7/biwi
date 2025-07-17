'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { companyService } from '@/services/companyService';
import { Company } from '@/types';
import {
  EnhancedSelect as Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2 } from 'lucide-react';

export function CompanySwitcher() {
  const { user, selectedCompanyId, setSelectedCompanyId } = useAuthStore();
  
  const { data: companies } = useQuery<Company[]>({
    queryKey: ['companies'],
    queryFn: () => companyService.getCompanies(),
    enabled: user?.is_superuser === true,
  });

  if (!user?.is_superuser || !companies || companies.length <= 1) {
    return null;
  }

  const selectedCompany = companies.find(c => c.id === selectedCompanyId);

  const handleCompanyChange = (value: string) => {
    const companyId = parseInt(value);
    setSelectedCompanyId(companyId);
    // Refresh page to reload data for new company context
    window.location.reload();
  };

  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-4 w-4 text-gray-600" />
      <Select
        value={selectedCompanyId?.toString() || ''}
        onValueChange={handleCompanyChange}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder={selectedCompany?.name || "Select company"} />
        </SelectTrigger>
        <SelectContent>
          {companies.map((company: Company) => (
            <SelectItem key={company.id} value={company.id.toString()}>
              {company.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
