'use client';


import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, ChevronDown, Building } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useQuery } from '@tanstack/react-query';
import { companyService } from '@/services/companyService';
import { cn } from '@/lib/utils';

export function Header() {
  const router = useRouter();
  const { user, company, logout, selectedCompanyId, setTargetCompany } = useAuthStore();
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);

  const { data: companies } = useQuery({
    queryKey: ['companies'],
    queryFn: () => companyService.getCompanies(),
    enabled: user?.is_superuser || false,
  });

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleCompanyChange = (companyId: string) => {
    setTargetCompany(parseInt(companyId, 10));
    setShowCompanyDropdown(false);
    // Refresh page to reload data for new company
    window.location.reload();
  };

  return (
    <header className="bg-white shadow-md px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {company && (
            <div className="relative">
              <button
                onClick={() => setShowCompanyDropdown(!showCompanyDropdown)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                <Building className="h-4 w-4" />
                <span className="font-medium">{company.name}</span>
                {user?.is_superuser && <ChevronDown className="h-4 w-4" />}
              </button>
              {user?.is_superuser && showCompanyDropdown && companies && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                  {companies.map((comp) => (
                    <button
                      key={comp.id}
                      onClick={() => handleCompanyChange(comp.id.toString())}
                      className={cn(
                        'w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors',
                        selectedCompanyId === comp.id && 'bg-blue-50'
                      )}
                    >
                      {comp.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{user?.full_name || user?.email}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
