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

        <div className="bg-white shadow overflow-x-auto sm:rounded-md">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Default Debit Account</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Default Credit Account</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tax Control Account</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactionTypes.map((type) => (
                <tr key={type.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{type.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{type.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{type.default_debit_account?.account_name || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{type.default_credit_account?.account_name || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{type.default_tax_control_account?.account_name || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{type.is_active ? 'Active' : 'Inactive'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link href={`/maintenance/gl/transaction-types/${type.id}`} className="text-blue-600 hover:text-blue-900">
                      <Edit className="h-4 w-4 inline-block" />
                    </Link>
                    <button onClick={() => handleDelete(type.id)} className="text-red-600 hover:text-red-900 ml-4">
                      <Trash2 className="h-4 w-4 inline-block" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
