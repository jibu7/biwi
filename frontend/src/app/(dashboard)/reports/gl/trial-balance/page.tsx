'use client';


import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileDown } from 'lucide-react';
import { glService } from '@/services/glService';

export default function TrialBalancePage() {
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: trialBalanceData, isLoading, error } = useQuery({
    queryKey: ['trialBalance', endDate],
    queryFn: () => glService.getTrialBalance(endDate),
    enabled: !!endDate,
  });

  // Extract accounts array from the response
  const safeTrialBalance = trialBalanceData?.accounts || [];
  const totalDebit = trialBalanceData?.total_debit || 0;
  const totalCredit = trialBalanceData?.total_credit || 0;

  const handleExport = () => {
    // Implement CSV export functionality
    const csvContent = [
      ['Account Code', 'Account Name', 'Debit Balance', 'Credit Balance'],
      ...safeTrialBalance.map(item => [
        item.account_code,
        item.account_name,
        (item.debit || 0).toString(),
        (item.credit || 0).toString(),
      ]),
      ['', 'TOTALS', totalDebit.toString(), totalCredit.toString()],
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `trial-balance-${endDate}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trial Balance</h1>
          <p className="mt-2 text-sm text-gray-700">
            View account balances as of a specific date.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={handleExport}
            disabled={safeTrialBalance.length === 0}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
          >
            <FileDown className="h-4 w-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="mt-8">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700">
            As of Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="mt-1 block w-48 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="text-gray-500">Loading trial balance...</div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-800">
              Error loading trial balance: {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Trial Balance as of {trialBalanceData?.as_of_date ? new Date(trialBalanceData.as_of_date).toLocaleDateString('en-US', {timeZone: 'UTC'}) : new Date(endDate).toLocaleDateString('en-US', {timeZone: 'UTC'})}
              </h3>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Account Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Account Name
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Debit Balance
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Credit Balance
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {safeTrialBalance.map((item, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.account_code}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.account_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {(item.debit || 0) > 0 ? (
                            new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: 'USD',
                            }).format(item.debit || 0)
                          ) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {(item.credit || 0) > 0 ? (
                            new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: 'USD',
                            }).format(item.credit || 0)
                          ) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-100">
                    <tr>
                      <td colSpan={2} className="px-6 py-4 text-sm font-bold text-gray-900">
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
                    </tr>
                  </tfoot>
                </table>
              </div>

              {Math.abs(totalDebit - totalCredit) > 0.01 && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
                  <p className="text-sm text-red-800">
                    Warning: Trial balance is out of balance. Difference:{' '}
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    }).format(Math.abs(totalDebit - totalCredit))}
                  </p>
                </div>
              )}

              {safeTrialBalance.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No account balances found for the selected date.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
