'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { glService } from '@/services/glService';
import { GLTransactionType } from '@/types/gl';

export default function TransactionTypesPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: transactionTypes = [], isLoading } = useQuery({
    queryKey: ['glTransactionTypes'],
    queryFn: () => glService.getGLTransactionTypes(),
  });

  const deleteMutation = useMutation({
    mutationFn: glService.deleteGLTransactionType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['glTransactionTypes'] });
    },
  });

  const filteredTransactionTypes = transactionTypes.filter(
    (type: GLTransactionType) =>
      type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      type.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this transaction type?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transaction Types</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage GL transaction types and their configurations.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            href="/maintenance/gl/transaction-types/new"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Transaction Type
          </Link>
        </div>
      </div>

      <div className="mt-8">
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search transaction types..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredTransactionTypes.map((type) => (
              <li key={type.id}>
                <div className="px-4 py-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {type.name}
                        </p>
                        {type.description && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {type.is_active ? 'Active' : 'Inactive'}
                          </span>
                        )}
                      </div>
                      {type.description && (
                        <p className="mt-1 text-sm text-gray-500 truncate">
                          {type.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/maintenance/gl/transaction-types/${type.id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(type.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          {filteredTransactionTypes.length === 0 && (
            <div className="px-4 py-8 text-center text-gray-500">
              No transaction types found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
