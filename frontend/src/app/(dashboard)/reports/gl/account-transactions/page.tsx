'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileDown, Calendar } from 'lucide-react';
import { glService } from '@/services/glService';

export default function AccountTransactionsPage() {
  const [filters, setFilters] = useState({
    account_id: '',
    start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['glAccounts'],
    queryFn: () => glService.getGLAccounts(),
  });

  const { data: transactions = [], isLoading, error } = useQuery({
    queryKey: ['accountTransactions', filters],
    queryFn: () => glService.getAccountTransactions(
      Number(filters.account_id),
      filters.start_date,
      filters.end_date
    ),
    enabled: !!filters.account_id,
  });

  const selectedAccount = accounts.find(account => account.id === Number(filters.account_id));
  
  // Safely calculate totals - ensure transactions is an array
  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const totalDebit = safeTransactions.reduce((sum, txn) => sum + (txn.debit_amount || 0), 0);
  const totalCredit = safeTransactions.reduce((sum, txn) => sum + (txn.credit_amount || 0), 0);
  const netAmount = totalDebit - totalCredit;

  const handleExport = () => {
    if (!selectedAccount) return;
    
    const csvContent = [
      ['Date', 'Reference', 'Description', 'Debit', 'Credit', 'Balance'],
      ...safeTransactions.map(txn => [
        txn.date,
        txn.reference || '',
        txn.description || '',
        (txn.debit_amount || 0).toString(),
        (txn.credit_amount || 0).toString(),
        (txn.balance || 0).toString(),
      ]),
      ['', '', 'TOTALS', totalDebit.toString(), totalCredit.toString(), netAmount.toString()],
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `account-transactions-${selectedAccount.account_code}-${filters.start_date}-${filters.end_date}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Account Transactions</h1>
          <p className="mt-2 text-sm text-gray-700">
            View detailed transaction history for a specific account.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={handleExport}
            disabled={transactions.length === 0}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
          >
            <FileDown className="h-4 w-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="mt-8">
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h3 className="text-lg font-medium mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Account
              </label>
              <select
                value={filters.account_id}
                onChange={(e) => setFilters(prev => ({ ...prev, account_id: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select Account</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.account_code} - {account.account_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Start Date
              </label>
              <input
                type="date"
                value={filters.start_date}
                onChange={(e) => setFilters(prev => ({ ...prev, start_date: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                End Date
              </label>
              <input
                type="date"
                value={filters.end_date}
                onChange={(e) => setFilters(prev => ({ ...prev, end_date: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {selectedAccount && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {selectedAccount.account_code} - {selectedAccount.account_name}
                </h3>
                <p className="text-sm text-gray-500">
                  {new Date(filters.start_date).toLocaleDateString()} to {new Date(filters.end_date).toLocaleDateString()}
                </p>
              </div>

              {isLoading ? (
                <div>Loading...</div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Reference
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Description
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Debit
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Credit
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Balance
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {transactions.map((transaction, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="flex items-center">
                                <Calendar className="flex-shrink-0 mr-2 h-4 w-4 text-gray-400" />
                                {new Date(transaction.date).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {transaction.reference || '-'}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {transaction.description || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                              {transaction.debit_amount > 0 ? (
                                new Intl.NumberFormat('en-US', {
                                  style: 'currency',
                                  currency: 'USD',
                                }).format(transaction.debit_amount)
                              ) : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                              {transaction.credit_amount > 0 ? (
                                new Intl.NumberFormat('en-US', {
                                  style: 'currency',
                                  currency: 'USD',
                                }).format(transaction.credit_amount)
                              ) : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                              {new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'USD',
                              }).format(transaction.balance)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      {transactions.length > 0 && (
                        <tfoot className="bg-gray-100">
                          <tr>
                            <td colSpan={3} className="px-6 py-4 text-sm font-bold text-gray-900">
                              TOTALS
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                              {new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'USD',
                              }).format(totalDebit)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                              {new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'USD',
                              }).format(totalCredit)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                              {new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'USD',
                              }).format(netAmount)}
                            </td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>

                  {transactions.length === 0 && filters.account_id && (
                    <div className="text-center py-8 text-gray-500">
                      No transactions found for the selected account and date range.
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {!filters.account_id && (
          <div className="bg-white shadow rounded-lg p-8">
            <div className="text-center text-gray-500">
              Please select an account to view transactions.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
