'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, ChevronRight, ChevronDown } from 'lucide-react';
import { glService } from '@/services/glService';
import { GLAccount } from '@/types/gl';
import { usePermissions } from '@/hooks/usePermissions';
import * as permissions from '@/lib/permissions';
import { cn } from '@/lib/utils';

export default function ChartOfAccountsPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const [expandedAccounts, setExpandedAccounts] = useState<Set<number>>(new Set());
  const [includeInactive, setIncludeInactive] = useState(false);

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['glAccounts', includeInactive],
    queryFn: () => glService.getGLAccounts(includeInactive),
  });

  const deleteMutation = useMutation({
    mutationFn: glService.deleteGLAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['glAccounts'] });
    },
  });

  // Build account hierarchy
  const buildAccountTree = (accounts: GLAccount[]) => {
    const accountMap = new Map<number, GLAccount & { children: GLAccount[] }>();
    const rootAccounts: (GLAccount & { children: GLAccount[] })[] = [];

    // Initialize all accounts with children array
    accounts.forEach(account => {
      accountMap.set(account.id, { ...account, children: [] });
    });

    // Build the tree
    accounts.forEach(account => {
      const accountWithChildren = accountMap.get(account.id)!;
      if (account.parent_account_id && accountMap.has(account.parent_account_id)) {
        accountMap.get(account.parent_account_id)!.children.push(accountWithChildren);
      } else {
        rootAccounts.push(accountWithChildren);
      }
    });

    // Sort accounts by account code
    const sortByCode = (a: GLAccount, b: GLAccount) => a.account_code.localeCompare(b.account_code);
    rootAccounts.sort(sortByCode);
    accountMap.forEach(account => account.children.sort(sortByCode));

    return rootAccounts;
  };

  const toggleExpanded = (accountId: number) => {
    const newExpanded = new Set(expandedAccounts);
    if (newExpanded.has(accountId)) {
      newExpanded.delete(accountId);
    } else {
      newExpanded.add(accountId);
    }
    setExpandedAccounts(newExpanded);
  };

  const handleDelete = async (account: GLAccount) => {
    if (window.confirm(`Are you sure you want to delete account "${account.account_name}"?`)) {
      try {
        await deleteMutation.mutateAsync(account.id);
      } catch (error) {
        console.error('Failed to delete account:', error);
        alert('Failed to delete account. It may be in use.');
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const AccountRow = ({ 
    account, 
    level = 0 
  }: { 
    account: GLAccount & { children: GLAccount[] }; 
    level?: number;
  }) => {
    const hasChildren = account.children.length > 0;
    const isExpanded = expandedAccounts.has(account.id);

    return (
      <>
        <tr className={cn(
          "hover:bg-gray-50",
          !account.is_active && "opacity-60 bg-gray-100"
        )}>
          <td className="px-6 py-3 text-sm font-medium text-gray-900" style={{ paddingLeft: `${24 + level * 24}px` }}>
            <div className="flex items-center">
              {hasChildren ? (
                <button
                  onClick={() => toggleExpanded(account.id)}
                  className="mr-2 p-1 hover:bg-gray-200 rounded"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              ) : (
                <div className="w-6 mr-2" />
              )}
              {account.account_code}
            </div>
          </td>
          <td className="px-6 py-3 text-sm text-gray-900">
            {account.account_name}
          </td>
          <td className="px-6 py-3 text-sm text-gray-500">
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
          </td>
          <td className="px-6 py-3 text-sm text-gray-900 text-right">
            {formatCurrency(account.current_balance)}
          </td>
          <td className="px-6 py-3 text-sm text-gray-500">
            <div className="flex space-x-2">
              {account.is_control_account && (
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                  Control
                </span>
              )}
              {!account.is_active && (
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                  Inactive
                </span>
              )}
            </div>
          </td>
          {hasPermission(permissions.GL_SETUP_MANAGE) && (
            <td className="px-6 py-3 text-right text-sm font-medium">
              <div className="flex justify-end space-x-2">
                <Link
                  href={`/maintenance/gl/accounts/${account.id}/edit`}
                  className="text-indigo-600 hover:text-indigo-900"
                >
                  <Pencil className="h-4 w-4" />
                </Link>
                <button
                  onClick={() => handleDelete(account)}
                  className="text-red-600 hover:text-red-900"
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </td>
          )}
        </tr>
        {hasChildren && isExpanded && account.children.map((childAccount) => (
          <AccountRow 
            key={childAccount.id} 
            account={childAccount as GLAccount & { children: GLAccount[] }} 
            level={level + 1}
          />
        ))}
      </>
    );
  };

  const accountTree = buildAccountTree(accounts);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Chart of Accounts</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your general ledger chart of accounts. Organize accounts in a hierarchical structure.
          </p>
        </div>
        {hasPermission(permissions.GL_SETUP_MANAGE) && (
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <Link
              href="/maintenance/gl/accounts/new"
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Account
            </Link>
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center space-x-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(e) => setIncludeInactive(e.target.checked)}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">Include inactive accounts</span>
        </label>
      </div>

      <div className="mt-8 overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Account Code
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Account Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Current Balance
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              {hasPermission(permissions.GL_SETUP_MANAGE) && (
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {accountTree.length === 0 ? (
              <tr>
                <td
                  colSpan={hasPermission(permissions.GL_SETUP_MANAGE) ? 6 : 5}
                  className="px-6 py-12 text-center text-sm text-gray-500"
                >
                  No accounts found. 
                  {hasPermission(permissions.GL_SETUP_MANAGE) && (
                    <>
                      {' '}
                      <Link
                        href="/maintenance/gl/accounts/new"
                        className="text-indigo-600 hover:text-indigo-900 font-medium"
                      >
                        Create your first account
                      </Link>
                    </>
                  )}
                </td>
              </tr>
            ) : (
              accountTree.map((account) => (
                <AccountRow key={account.id} account={account} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
