'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { companyService } from '@/services/companyService';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2 } from 'lucide-react';

export function CompanySwitcher() {
  const { user, selectedCompanyId, setSelectedCompanyId } = useAuthStore();
  
  const { data: companies } = useQuery({
    queryKey: ['companies'],
    queryFn: companyService.getCompanies,
    enabled: user?.is_superuser === true,
  });

  if (!user?.is_superuser || !companies || companies.length <= 1) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-4 w-4 text-gray-600" />
      <Select
        value={selectedCompanyId?.toString()}
        onValueChange={(value) => setSelectedCompanyId(parseInt(value))}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select company" />
        </SelectTrigger>
        <SelectContent>
          {companies.map((company) => (
            <SelectItem key={company.id} value={company.id.toString()}>
              {company.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
