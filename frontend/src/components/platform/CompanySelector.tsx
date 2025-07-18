import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import axiosInstance from '@/lib/axiosInstance';

interface Company {
  id: number;
  name: string;
  code: string;
  subscription_status: string;
  is_active: boolean;
}

export const CompanySelector: React.FC = () => {
  const { selectedCompanyId, setTargetCompany, isPlatformAdmin } = useAuthStore();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isPlatformAdmin) return;

    const fetchCompanies = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get('/platform/companies');
        setCompanies(response.data);
        setError(null);
      } catch (err) {
        setError('Failed to load companies');
        console.error('Error fetching companies:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, [isPlatformAdmin]);

  const handleCompanyChange = (companyId: string) => {
    const id = companyId ? parseInt(companyId, 10) : null;
    setTargetCompany(id);
  };

  if (!isPlatformAdmin) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        <span className="text-sm text-gray-600">Loading companies...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      <label htmlFor="company-select" className="text-sm font-medium text-gray-700">
        Impersonate Company:
      </label>
      <select
        id="company-select"
        value={selectedCompanyId || ''}
        onChange={(e) => handleCompanyChange(e.target.value)}
        className="block w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      >
        <option value="">Select a company...</option>
        {companies.map((company) => (
          <option key={company.id} value={company.id}>
            {company.name} ({company.code}) - {company.subscription_status}
          </option>
        ))}
      </select>
      {selectedCompanyId && (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          Impersonating
        </span>
      )}
    </div>
  );
};
