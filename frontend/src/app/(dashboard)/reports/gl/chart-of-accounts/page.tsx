'use client';

import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { glService } from '@/services/glService';
import { format } from 'date-fns';
import '@/styles/reports.css';

export default function ChartOfAccountsPage() {
  const [accountType, setAccountType] = useState('');
  const [includeInactive, setIncludeInactive] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const { data: accounts = [], isLoading, refetch } = useQuery({
    queryKey: ['chart-of-accounts', accountType, includeInactive],
    queryFn: () => glService.getGLAccounts(),
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handlePrint = () => {
    if (printRef.current) {
      const printContent = printRef.current.innerHTML;
      const originalContent = document.body.innerHTML;
      document.body.innerHTML = printContent;
      window.print();
      document.body.innerHTML = originalContent;
      window.location.reload();
    }
  };

  const handleExportCSV = () => {
    if (!filteredAccounts.length) return;
    
    const csvData = [];
    csvData.push(['Account Code', 'Account Name', 'Account Type', 'Balance', 'Status']);
    
    filteredAccounts.forEach(account => {
      csvData.push([
        account.account_code,
        account.account_name,
        account.account_type,
        account.balance?.toString() || '0',
        account.is_active ? 'Active' : 'Inactive'
      ]);
    });
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chart-of-accounts-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Filter accounts based on type and active status
  const filteredAccounts = accounts.filter(account => {
    if (accountType && account.account_type !== accountType) return false;
    if (!includeInactive && !account.is_active) return false;
    return true;
  });

  // Group accounts by type
  const groupedAccounts = filteredAccounts.reduce((groups, account) => {
    const type = account.account_type;
    if (!groups[type]) groups[type] = [];
    groups[type].push(account);
    return groups;
  }, {} as Record<string, typeof accounts>);

  const accountTypes = ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Chart of Accounts</h1>
        
        {/* Report Parameters */}
        <div className="bg-white shadow rounded-lg mb-6 print:shadow-none">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Filter Options</h2>
          </div>
          <div className="p-6 print:hidden">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                <select
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">All Types</option>
                  {accountTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="includeInactive"
                  checked={includeInactive}
                  onChange={(e) => setIncludeInactive(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="includeInactive" className="ml-2 block text-sm text-gray-900">
                  Include inactive accounts
                </label>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => refetch()}
                  className="w-full bg-indigo-600 border border-transparent rounded-md shadow-sm py-2 px-4 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Refresh
                </button>
              </div>
              <div className="flex items-end space-x-2">
                <button
                  onClick={handleExportCSV}
                  className="w-full bg-green-600 border border-transparent rounded-md shadow-sm py-2 px-4 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Export CSV
                </button>
                <button
                  onClick={handlePrint}
                  className="w-full bg-gray-600 border border-transparent rounded-md shadow-sm py-2 px-4 text-base font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Print
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          {accountTypes.map(type => {
            const typeAccounts = groupedAccounts[type] || [];
            const totalBalance = typeAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
            return (
              <div key={type} className="bg-white border border-gray-200 rounded-lg p-4 print:border">
                <div className="text-sm font-medium text-gray-600">{type}</div>
                <div className="text-xl font-bold text-gray-900">{typeAccounts.length}</div>
                <div className="text-sm text-gray-500">{formatCurrency(totalBalance)}</div>
              </div>
            );
          })}
        </div>

        {/* Chart of Accounts */}
        <div ref={printRef} className="bg-white shadow rounded-lg print:shadow-none">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="text-center">
              <h2 className="text-xl font-medium text-gray-900">Chart of Accounts</h2>
              <p className="text-sm text-gray-500">
                As of {format(new Date(), 'MMMM dd, yyyy')}
              </p>
            </div>
          </div>
          
          <div className="p-6">
            {accountTypes.map(accountType => {
              const typeAccounts = groupedAccounts[accountType] || [];
              if (typeAccounts.length === 0) return null;

              return (
                <div key={accountType} className="mb-8">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b border-gray-300 pb-2">
                    {accountType} Accounts
                  </h3>
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50 print:bg-white">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black">
                            Account Code
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black">
                            Account Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black">
                            Description
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black">
                            Balance
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200 print:bg-white">
                        {typeAccounts.map((account) => (
                          <tr key={account.id} className="hover:bg-gray-50 print:hover:bg-white">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 print:text-black">
                              {account.account_code}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 print:text-black">
                              {account.account_name}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 print:text-black">
                              {account.description || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right print:text-black">
                              {formatCurrency(account.balance || 0)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                account.is_active 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {account.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                          </tr>
                        ))}
                        <tr className="border-t-2 border-gray-300 font-bold bg-gray-50 print:bg-white">
                          <td colSpan={3} className="px-6 py-4 text-sm text-gray-900">
                            Total {accountType} Accounts ({typeAccounts.length})
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                            {formatCurrency(typeAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0))}
                          </td>
                          <td></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}

            {filteredAccounts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No accounts found matching the selected criteria.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
