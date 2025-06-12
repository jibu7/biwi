'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Pencil, ArrowLeft, Building2, Hash } from 'lucide-react';
import { glService } from '@/services/glService';
import { usePermissions } from '@/hooks/usePermissions';
import * as permissions from '@/lib/permissions';
import { cn } from '@/lib/utils';

export default function GLAccountDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const accountId = parseInt(params.id);

  const { data: account, isLoading, error } = useQuery({
    queryKey: ['glAccount', accountId],
    queryFn: () => glService.getGLAccount(accountId),
    enabled: !isNaN(accountId),
  });

  const { data: allAccounts = [] } = useQuery({
    queryKey: ['glAccounts'],
    queryFn: () => glService.getGLAccounts(true),
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getParentAccount = () => {
    if (!account?.parent_account_id) return null;
    return allAccounts.find(acc => acc.id === account.parent_account_id);
  };

  const getChildAccounts = () => {
    if (!account) return [];
    return allAccounts.filter(acc => acc.parent_account_id === account.id);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !account) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Account not found</h3>
          <p className="mt-1 text-sm text-gray-500">
            The account you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.
          </p>
          <button
            onClick={() => router.push('/maintenance/gl/accounts')}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-100 hover:bg-indigo-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Accounts
          </button>
        </div>
      </div>
    );
  }

  const parentAccount = getParentAccount();
  const childAccounts = getChildAccounts();

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <button
            onClick={() => router.push('/maintenance/gl/accounts')}
            className="mr-4 p-2 text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">
              {account.account_code} - {account.account_name}
            </h1>
            <p className="mt-1 text-sm text-gray-600">GL Account Details</p>
          </div>
          {hasPermission(permissions.GL_SETUP_MANAGE) && (
            <Link
              href={`/maintenance/gl/accounts/${account.id}/edit`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit Account
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Account Information
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                General ledger account details and configuration.
              </p>
            </div>
            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <Hash className="h-4 w-4 mr-2" />
                    Account Code
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 font-mono">
                    {account.account_code}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Account Name</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {account.account_name}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Account Type</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <span className={cn(
                      "inline-flex px-2 py-1 text-xs font-semibold rounded-full",
                      account.account_type === 'Asset' && "bg-blue-100 text-blue-800",
                      account.account_type === 'Liability' && "bg-red-100 text-red-800",
                      account.account_type === 'Equity' && "bg-purple-100 text-purple-800",
                      account.account_type === 'Income' && "bg-green-100 text-green-800",
                      account.account_type === 'Expense' && "bg-orange-100 text-orange-800"
                    )}>
                      {account.account_type}
                    </span>
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Current Balance</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <span className={cn(
                      "font-mono text-lg",
                      account.current_balance >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {formatCurrency(Math.abs(account.current_balance))}
                      {account.current_balance < 0 && ' CR'}
                    </span>
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    <Building2 className="h-4 w-4 mr-2 inline" />
                    Company ID
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    #{account.company_id}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <div className="flex space-x-2">
                      <span className={cn(
                        "inline-flex px-2 py-1 text-xs font-semibold rounded-full",
                        account.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                      )}>
                        {account.is_active ? 'Active' : 'Inactive'}
                      </span>
                      {account.is_control_account && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Control Account
                        </span>
                      )}
                    </div>
                  </dd>
                </div>
                {parentAccount && (
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Parent Account</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      <Link
                        href={`/maintenance/gl/accounts/${parentAccount.id}`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        {parentAccount.account_code} - {parentAccount.account_name}
                      </Link>
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Child Accounts */}
          {childAccounts.length > 0 && (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Sub-accounts ({childAccounts.length})
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Accounts that are children of this account.
                </p>
              </div>
              <div className="border-t border-gray-200">
                <ul className="divide-y divide-gray-200">
                  {childAccounts.map((child) => (
                    <li key={child.id}>
                      <Link
                        href={`/maintenance/gl/accounts/${child.id}`}
                        className="block px-4 py-4 hover:bg-gray-50"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {child.account_code}
                            </p>
                            <p className="text-sm text-gray-500">
                              {child.account_name}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-mono text-gray-900">
                              {formatCurrency(child.current_balance)}
                            </p>
                            {!child.is_active && (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                                Inactive
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          {hasPermission(permissions.GL_SETUP_MANAGE) && (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Quick Actions
                </h3>
              </div>
              <div className="border-t border-gray-200">
                <div className="px-4 py-4 space-y-3">
                  <Link
                    href={`/maintenance/gl/accounts/${account.id}/edit`}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Account
                  </Link>
                  <Link
                    href="/maintenance/gl/accounts/new"
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Create New Account
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
