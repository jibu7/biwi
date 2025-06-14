"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { commonService, TaxType } from '@/services/commonService';
import { usePermissions } from '@/hooks/usePermissions';
import { COMMON_SETUP_TAXES } from '@/lib/permissions';

export default function TaxTypesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  const { data: taxTypes, isLoading } = useQuery({
    queryKey: ['taxTypes'],
    queryFn: commonService.getTaxTypes,
  });

  const deleteMutation = useMutation({
    mutationFn: commonService.deleteTaxType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxTypes'] });
    },
  });

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this tax type?')) {
      deleteMutation.mutate(id);
    }
  };

  if (!hasPermission(COMMON_SETUP_TAXES)) {
    return <div>Access denied</div>;
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const getTaxNatureBadgeColor = (nature: string) => {
    switch (nature) {
      case 'Sales':
        return 'bg-green-100 text-green-800';
      case 'Purchases':
        return 'bg-blue-100 text-blue-800';
      case 'Exempt':
        return 'bg-gray-100 text-gray-800';
      case 'ZeroRated':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tax Types Management</h1>
        <button
          onClick={() => router.push('/maintenance/system/tax-types/new')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={20} />
          Add Tax Type
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rate %
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tax Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nature
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {taxTypes?.map((taxType) => (
              <tr key={taxType.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {taxType.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {taxType.rate_percentage}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {taxType.tax_code || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${getTaxNatureBadgeColor(taxType.tax_nature)}`}>
                    {taxType.tax_nature}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    taxType.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {taxType.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => router.push(`/maintenance/system/tax-types/${taxType.id}`)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(taxType.id)}
                      className="text-red-600 hover:text-red-900"
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
