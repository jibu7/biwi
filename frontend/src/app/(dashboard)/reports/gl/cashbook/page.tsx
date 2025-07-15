'use client';


import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import reportingService, { CashbookData } from '@/services/reportingService';
import { glService } from '@/services/glService';
import { GLAccount } from '@/types/gl';
import { format, subMonths } from 'date-fns';
import '@/styles/reports.css';

export default function CashbookPage() {
  const [glAccountId, setGlAccountId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState(format(subMonths(new Date(), 1), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const printRef = useRef<HTMLDivElement>(null);

  const { data: accounts } = useQuery({
    queryKey: ['gl-accounts'],
    queryFn: () => glService.getGLAccounts()
  });

  const { data: cashbookData, isLoading, refetch } = useQuery({
    queryKey: ['cashbook', glAccountId, startDate, endDate],
    queryFn: () => reportingService.getCashbookReport(glAccountId!, startDate, endDate),
    enabled: !!glAccountId && !!startDate && !!endDate
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
    if (!cashbookData) return;
    
    const csvData = [];
    csvData.push(['Date', 'Reference', 'Description', 'Debit', 'Credit', 'Balance']);
    
    cashbookData.transactions.forEach(transaction => {
      csvData.push([
        transaction.date,
        transaction.reference,
        transaction.description,
        transaction.debit?.toString() || '',
        transaction.credit?.toString() || '',
        transaction.balance?.toString() || ''
      ]);
    });
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cashbook-${selectedAccount?.account_code}-${startDate}-${endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Filter accounts to show only cash/bank accounts (you might want to add account types)
  const cashBankAccounts = accounts?.filter((account: GLAccount) => 
    account.account_type === 'Asset' && 
    (account.account_name.toLowerCase().includes('cash') || 
     account.account_name.toLowerCase().includes('bank'))
  ) || [];

  const selectedAccount = accounts?.find((account: GLAccount) => account.id === glAccountId);

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
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Cashbook Report</h1>
        
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Report Parameters</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cash/Bank Account</label>
                <select
                  value={glAccountId?.toString() || ''}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
                    setGlAccountId(e.target.value ? parseInt(e.target.value) : null)
                  }
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">Select account</option>
                  {cashBankAccounts.map((account: GLAccount) => (
                    <option key={account.id} value={account.id.toString()}>
                      {account.account_code} - {account.account_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => refetch()}
                  disabled={!glAccountId}
                  className="w-full bg-indigo-600 border border-transparent rounded-md shadow-sm py-2 px-4 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Generate Report
                </button>
              </div>
              <div className="flex items-end space-x-2 print:hidden">
                <button
                  onClick={handleExportCSV}
                  disabled={!cashbookData}
                  className="w-full bg-green-600 border border-transparent rounded-md shadow-sm py-2 px-4 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Export CSV
                </button>
                <button
                  onClick={handlePrint}
                  disabled={!cashbookData}
                  className="w-full bg-gray-600 border border-transparent rounded-md shadow-sm py-2 px-4 text-base font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Print Report
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {cashbookData && selectedAccount && (
        <div className="bg-white shadow rounded-lg print:shadow-none print:border" ref={printRef}>
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-medium text-gray-900 text-center">
              Cashbook Report
              <br />
              {selectedAccount.account_code} - {selectedAccount.account_name}
              <br />
              For the Period {format(new Date(startDate), 'MMMM dd, yyyy')} to {format(new Date(endDate), 'MMMM dd, yyyy')}
            </h2>
          </div>
          <div className="p-6">
            {/* Summary Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg print:border print:shadow-none">
                <h3 className="text-sm font-medium text-gray-700">Opening Balance</h3>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(cashbookData.opening_balance)}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg print:border print:shadow-none">
                <h3 className="text-sm font-medium text-gray-700">Total Debits</h3>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(cashbookData.total_debits)}
                </p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg print:border print:shadow-none">
                <h3 className="text-sm font-medium text-gray-700">Total Credits</h3>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(cashbookData.total_credits)}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg print:border print:shadow-none">
                <h3 className="text-sm font-medium text-gray-700">Closing Balance</h3>
                <p className="text-2xl font-bold text-gray-600">
                  {formatCurrency(cashbookData.closing_balance)}
                </p>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="overflow-x-auto">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
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
                        Running Balance
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 print:bg-white">
                    {/* Opening Balance Row */}
                    <tr className="bg-blue-50 font-medium">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {format(new Date(startDate), 'MM/dd/yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        Opening
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        Opening Balance
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        -
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        -
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-bold">
                        {formatCurrency(cashbookData.opening_balance)}
                      </td>
                    </tr>

                    {/* Transaction Rows */}
                    {cashbookData.transactions.map((transaction, index) => (
                      <tr key={index} className="hover:bg-gray-50 print:hover:bg-white">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 print:text-black print:border">
                          {format(new Date(transaction.date), 'MM/dd/yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 print:text-black print:border">
                          {transaction.reference}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 print:text-black print:border">
                          {transaction.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right print:text-black print:border">
                          {transaction.debit > 0 ? formatCurrency(transaction.debit) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right print:text-black print:border">
                          {transaction.credit > 0 ? formatCurrency(transaction.credit) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium print:text-black print:border">
                          {formatCurrency(transaction.balance)}
                        </td>
                      </tr>
                    ))}

                    {/* Closing Balance Row */}
                    <tr className="border-t-2 border-gray-300 font-bold bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {format(new Date(endDate), 'MM/dd/yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        Closing
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        Closing Balance
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatCurrency(cashbookData.total_debits)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatCurrency(cashbookData.total_credits)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatCurrency(cashbookData.closing_balance)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Reconciliation Note */}
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="text-sm font-medium text-yellow-800 mb-2">Reconciliation Check</h4>
              <p className="text-sm text-yellow-700">
                Opening Balance + Total Debits - Total Credits = Closing Balance
                <br />
                {formatCurrency(cashbookData.opening_balance)} + {formatCurrency(cashbookData.total_debits)} - {formatCurrency(cashbookData.total_credits)} = {formatCurrency(cashbookData.closing_balance)}
              </p>
            </div>

            {/* Print and Export Buttons */}
            <div className="mt-4 flex justify-end space-x-4">
              <button
                onClick={handlePrint}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Print Report
              </button>
              <button
                onClick={handleExportCSV}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Export to CSV
              </button>
            </div>
          </div>
        </div>
      )}

      {/* No Account Selected State */}
      {!glAccountId && (
        <div className="bg-white shadow rounded-lg">
          <div className="p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Account Selected</h3>
            <p className="text-gray-500">Please select a cash or bank account to generate the cashbook report.</p>
          </div>
        </div>
      )}
    </div>
  );
}
