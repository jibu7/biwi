"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Trash2, MapPin, Building } from 'lucide-react';
import { commonService, Branch } from '@/services/commonService';
import { usePermissions } from '@/hooks/usePermissions';
import { COMMON_SETUP_BRANCHES } from '@/lib/permissions';

export default function BranchesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  const { data: branches, isLoading, error } = useQuery({
    queryKey: ['branches'],
    queryFn: commonService.getBranches,
  });

  const deleteMutation = useMutation({
    mutationFn: commonService.deleteBranch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
    },
    onError: (error: any) => {
      alert('Error deleting branch: ' + (error.response?.data?.detail || error.message));
    },
  });

  const handleDelete = async (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}" branch?`)) {
      deleteMutation.mutate(id);
    }
  };

  if (!hasPermission(COMMON_SETUP_BRANCHES)) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Access Denied</h3>
          <p className="text-red-600">You don't have permission to manage branches.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error Loading Branches</h3>
          <p className="text-red-600">
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building className="text-indigo-600" />
            Branches Management
          </h1>
          <p className="text-gray-600 mt-1">Manage your company branches and locations</p>
        </div>
        <button
          onClick={() => router.push('/maintenance/system/branches/new')}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors"
        >
          <Plus size={20} />
          Add Branch
        </button>
      </div>

      {/* Branches List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {!branches || branches.length === 0 ? (
          <div className="p-8 text-center">
            <MapPin className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No branches</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating your first branch.</p>
            <div className="mt-6">
              <button
                onClick={() => router.push('/maintenance/system/branches/new')}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="-ml-1 mr-2 h-5 w-5" />
                Add Branch
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                    Branch Name
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4 hidden sm:table-cell">
                    Address
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4 hidden md:table-cell">
                    Contact Info
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6 hidden lg:table-cell">
                    GL Segment
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
                    Status
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {branches.map((branch) => (
                  <tr key={branch.id} className="hover:bg-gray-50">
                    <td className="px-3 py-4 text-sm">
                      <div className="flex items-center">
                        <MapPin size={16} className="text-gray-400 mr-2 flex-shrink-0" />
                        <div>
                          <div className="font-medium text-gray-900 truncate">
                            {branch.name}
                          </div>
                          {/* Show address and contact on mobile */}
                          <div className="sm:hidden">
                            {branch.address && (
                              <div className="text-xs text-gray-500 truncate mt-1">
                                📍 {typeof branch.address === 'string' 
                                  ? branch.address 
                                  : JSON.stringify(branch.address).replace(/[{}]/g, '').replace(/"/g, '')
                                }
                              </div>
                            )}
                            {branch.contact_info && (
                              <div className="text-xs text-gray-500 truncate mt-1 md:hidden">
                                📞 {typeof branch.contact_info === 'string' 
                                  ? branch.contact_info 
                                  : JSON.stringify(branch.contact_info).replace(/[{}]/g, '').replace(/"/g, '')
                                }
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-500 hidden sm:table-cell">
                      <div className="max-w-[200px]">
                        {branch.address ? (
                          <div className="truncate" title={typeof branch.address === 'string' 
                            ? branch.address 
                            : JSON.stringify(branch.address).replace(/[{}]/g, '').replace(/"/g, '')
                          }>
                            {typeof branch.address === 'string' 
                              ? branch.address 
                              : JSON.stringify(branch.address).replace(/[{}]/g, '').replace(/"/g, '')
                            }
                          </div>
                        ) : (
                          <span className="text-gray-400">No address</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-500 hidden md:table-cell">
                      <div className="max-w-[200px]">
                        {branch.contact_info ? (
                          <div className="truncate" title={typeof branch.contact_info === 'string' 
                            ? branch.contact_info 
                            : JSON.stringify(branch.contact_info).replace(/[{}]/g, '').replace(/"/g, '')
                          }>
                            {typeof branch.contact_info === 'string' 
                              ? branch.contact_info 
                              : JSON.stringify(branch.contact_info).replace(/[{}]/g, '').replace(/"/g, '')
                            }
                          </div>
                        ) : (
                          <span className="text-gray-400">No contact info</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                      {branch.default_gl_segment_code || (
                        <span className="text-gray-400">None</span>
                      )}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        branch.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {branch.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => router.push(`/maintenance/system/branches/${branch.id}`)}
                          className="text-indigo-600 hover:text-indigo-900 transition-colors"
                          title="Edit branch"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(branch.id, branch.name)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                          disabled={deleteMutation.isPending}
                          title="Delete branch"
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
        )}
      </div>

      {/* Loading overlay for delete operation */}
      {deleteMutation.isPending && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Deleting branch...</p>
          </div>
        </div>
      )}
    </div>
  );
}
