'use client';

import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import reportingService, { AccountTransaction } from '@/services/reportingService';
import { format } from 'date-fns';
import '@/styles/reports.css';

export default function AccountTransactionsPage() {
  const searchParams = useSearchParams();
  const accountCode = searchParams.get('account_code');
  const startDate = searchParams.get('start_date') || format(new Date(), 'yyyy-MM-dd');
  const endDate = searchParams.get('end_date') || format(new Date(), 'yyyy-MM-dd');
  
  const [currentStartDate, setCurrentStartDate] = useState(startDate);
  const [currentEndDate, setCurrentEndDate] = useState(endDate);
  const printRef = useRef<HTMLDivElement>(null);

  const { data: transactions, isLoading, refetch } = useQuery({
    queryKey: ['account-transactions', accountCode, currentStartDate, currentEndDate],
    queryFn: () => reportingService.getAccountTransactions(accountCode!, currentStartDate, currentEndDate),
    enabled: !!accountCode
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
    if (!transactions) return;
    
    const csvData = [];
    csvData.push(['Date', 'Reference', 'Description', 'Debit', 'Credit', 'Balance']);
    
    transactions.forEach((tx: AccountTransaction) => {
      csvData.push([
        tx.transaction_date,
        tx.reference_number,
        tx.description,
        tx.debit_amount?.toString() || '',
        tx.credit_amount?.toString() || '',
        tx.running_balance?.toString() || ''
      ]);
    });
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `account-transactions-${accountCode}-${currentStartDate}-${currentEndDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

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
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Account Transactions - {accountCode}
        </h1>
        
        <div className="bg-white shadow rounded-lg mb-6 print:shadow-none print:border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Filter Parameters</h2>
          </div>
          <div className="p-6 print:hidden">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={currentStartDate}
                  onChange={(e) => setCurrentStartDate(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={currentEndDate}
                  onChange={(e) => setCurrentEndDate(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div className="flex items-end space-x-2">
                <button
                  onClick={() => refetch()}
                  className="bg-indigo-600 border border-transparent rounded-md shadow-sm py-2 px-4 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Filter
                </button>
                <button
                  onClick={handleExportCSV}
                  className="bg-green-600 border border-transparent rounded-md shadow-sm py-2 px-4 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Export CSV
                </button>
                <button
                  onClick={handlePrint}
                  className="bg-gray-600 border border-transparent rounded-md shadow-sm py-2 px-4 text-base font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Print
                </button>
              </div>
            </div>
          </div>
        </div>

        <div ref={printRef} className="bg-white shadow rounded-lg print:shadow-none print:border">
          <div className="px-6 py-4 border-b border-gray-200 print:border-b">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Transaction Details</h3>
              <span className="text-sm text-gray-500">
                Period: {format(new Date(currentStartDate), 'MMM dd, yyyy')} - {format(new Date(currentEndDate), 'MMM dd, yyyy')}
              </span>
            </div>
          </div>
          
          {transactions && transactions.length > 0 ? (
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50 print:bg-white">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black print:border">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black print:border">
                      Reference
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black print:border">
                      Description
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black print:border">
                      Debit
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black print:border">
                      Credit
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black print:border">
                      Balance
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 print:bg-white">
                  {transactions.map((transaction: AccountTransaction, index: number) => (
                    <tr key={index} className="hover:bg-gray-50 print:hover:bg-white">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 print:text-black print:border">
                        {format(new Date(transaction.transaction_date), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 print:text-black print:border">
                        {transaction.reference_number}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 print:text-black print:border">
                        {transaction.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right print:text-black print:border">
                        {transaction.debit_amount ? formatCurrency(transaction.debit_amount) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right print:text-black print:border">
                        {transaction.credit_amount ? formatCurrency(transaction.credit_amount) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right print:text-black print:border">
                        {transaction.running_balance ? formatCurrency(transaction.running_balance) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500">No transactions found for the selected period.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
