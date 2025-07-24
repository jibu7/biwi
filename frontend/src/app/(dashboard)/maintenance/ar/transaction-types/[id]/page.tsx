'use client';

import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { arTransactionTypeService } from '@/services/arService';
import { glService } from '@/services/glService';
import { usePermissions } from '@/hooks/usePermissions';
import { AR_SETUP_MANAGE } from '@/lib/permissions';

export default function ARTransactionTypeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { hasPermission } = usePermissions();
  const transactionTypeId = params ? parseInt(params.id as string) : 0;

  const { data: transactionType, isLoading, error } = useQuery({
    queryKey: ['arTransactionType', transactionTypeId],
    queryFn: () => arTransactionTypeService.getById(transactionTypeId),
    enabled: transactionTypeId > 0,
  });

  const { data: glAccounts = [] } = useQuery({
    queryKey: ['glAccounts'],
    queryFn: () => glService.getGLAccounts(),
  });

  // Check permissions - after all hooks
  if (!hasPermission(AR_SETUP_MANAGE)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="text-gray-600 mt-2">You don't have permission to view AR transaction types.</p>
        </div>
      </div>
    );
  }

  const getAccountName = (accountId?: number) => {
    if (!accountId) return 'Not Set';
    const account = glAccounts.find(acc => acc.id === accountId);
    return account ? `${account.account_code} - ${account.account_name}` : 'Unknown Account';
  };

  const getBaseTypeColor = (baseType: string) => {
    switch (baseType) {
      case 'Invoice':
        return 'bg-blue-100 text-blue-800';
      case 'Receipt':
        return 'bg-green-100 text-green-800';
      case 'Credit Note':
        return 'bg-red-100 text-red-800';
      case 'Journal':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading transaction type...</p>
        </div>
      </div>
    );
  }

  if (error || !transactionType) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Transaction Type Not Found</h2>
          <p className="text-gray-600 mt-2">The requested AR transaction type could not be found.</p>
          <button 
            onClick={() => router.push('/maintenance/ar/transaction-types')}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Transaction Types
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/maintenance/ar/transaction-types')}
              className="rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                AR Transaction Type Details
              </h1>
              <p className="text-gray-600">
                View and manage AR transaction type configuration
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              href={`/maintenance/ar/transaction-types/${transactionTypeId}/edit`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Transaction Type Information</h3>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500">Name</label>
                <div className="mt-1 text-sm text-gray-900">{transactionType.name}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500">Base Type</label>
                <div className="mt-1">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getBaseTypeColor(transactionType.base_type)}`}>
                    {transactionType.base_type}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500">Balance Direction</label>
                <div className="mt-1">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    transactionType.affects_balance_direction === 'Debit' 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {transactionType.affects_balance_direction}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500">Status</label>
                <div className="mt-1">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    transactionType.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {transactionType.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-500">Description</label>
                <div className="mt-1 text-sm text-gray-900">
                  {transactionType.description || 'No description provided'}
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-md font-medium text-gray-900 mb-4">GL Account Configuration</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Default GL Account</label>
                  <div className="mt-1 text-sm text-gray-900">
                    {getAccountName(transactionType.default_gl_account_id)}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500">Default AR Control GL Account</label>
                  <div className="mt-1 text-sm text-gray-900">
                    {getAccountName(transactionType.default_ar_control_gl_account_id)}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-md font-medium text-gray-900 mb-4">System Information</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Transaction Type ID</label>
                  <div className="mt-1 text-sm text-gray-900">{transactionType.id}</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500">Company ID</label>
                  <div className="mt-1 text-sm text-gray-900">{transactionType.company_id}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => router.push('/maintenance/ar/transaction-types')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Transaction Types
          </button>
          
          <Link
            href={`/maintenance/ar/transaction-types/${transactionTypeId}/edit`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Transaction Type
          </Link>
        </div>
      </div>
    </div>
  );
}
