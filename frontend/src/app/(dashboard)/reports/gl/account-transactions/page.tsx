'use client';


import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useRouter } from 'next/navigation';
import reportingService, { AccountTransaction } from '@/services/reportingService';
import { glService } from '@/services/glService';
import { format } from 'date-fns';
import '@/styles/reports.css';

export default function AccountTransactionsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const accountCode = searchParams.get('account_code');
  const startDate = searchParams.get('start_date') || format(new Date(), 'yyyy-MM-dd');
  const endDate = searchParams.get('end_date') || format(new Date(), 'yyyy-MM-dd');
  
  const [currentStartDate, setCurrentStartDate] = useState(startDate);
  const [currentEndDate, setCurrentEndDate] = useState(endDate);
  const [selectedAccountCode, setSelectedAccountCode] = useState(accountCode || '');
  const printRef = useRef<HTMLDivElement>(null);

  // Get list of GL accounts for the selector
  const { data: accounts, isLoading: accountsLoading, error: accountsError } = useQuery({
    queryKey: ['gl-accounts'],
    queryFn: () => glService.getGLAccounts(),
    retry: (failureCount, error: any) => {
      console.error('GL Accounts query error:', error);
      // Don't retry on authentication errors
      if (error?.response?.status === 401) {
        console.log('Authentication error - redirecting to login');
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: transactions, isLoading: transactionsLoading, error: transactionsError, refetch } = useQuery({
    queryKey: ['account-transactions', accountCode, currentStartDate, currentEndDate],
    queryFn: () => reportingService.getAccountTransactions(accountCode!, currentStartDate, currentEndDate),
    enabled: !!accountCode,
    retry: 2,
    refetchOnWindowFocus: false,
  });

  const handleAccountSelect = () => {
    if (selectedAccountCode) {
      const params = new URLSearchParams();
      params.set('account_code', selectedAccountCode);
      params.set('start_date', currentStartDate);
      params.set('end_date', currentEndDate);
      router.push(`/reports/gl/account-transactions?${params.toString()}`);
    }
  };

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAccountSelect();
  };

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

  if (transactionsLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Account Transactions
            </h1>
            <p className="text-lg text-gray-600">
              Loading transaction history...
            </p>
          </div>
          <div className="flex justify-center items-center min-h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading transactions for account {accountCode}...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Account Transactions
          </h1>
          <p className="text-lg text-gray-600">
            View detailed transaction history for any general ledger account
          </p>
        </div>

        {/* Filter Panel */}
        <div className="bg-white shadow-lg rounded-xl mb-8 border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <svg className="w-6 h-6 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.586V4z" />
              </svg>
              Filter Parameters
            </h2>
          </div>
          
          <div className="p-6">
            <form onSubmit={handleFilterSubmit}>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Account Selector */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Select Account <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedAccountCode}
                    onChange={(e) => setSelectedAccountCode(e.target.value)}
                    disabled={accountsLoading}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {accountsLoading ? "Loading accounts..." : accountsError ? "Error loading accounts" : "Select an account..."}
                    </option>
                    {accounts?.map((account) => (
                      <option key={account.id} value={account.account_code}>
                        {account.account_code} - {account.account_name}
                        {account.current_balance && String(account.current_balance) !== "0.00" && 
                          ` (${parseFloat(String(account.current_balance)) >= 0 ? '$' : '-$'}${Math.abs(parseFloat(String(account.current_balance))).toFixed(2)})`
                        }
                      </option>
                    ))}
                  </select>
                  {accountsLoading && (
                    <p className="text-sm text-blue-600 mt-2 flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading accounts...
                    </p>
                  )}
                  {accountsError && (
                    <p className="text-sm text-red-600 mt-2 flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Error loading accounts. Please refresh the page.
                    </p>
                  )}
                  {!accountsLoading && !accountsError && accounts && accounts.length === 0 && (
                    <p className="text-sm text-amber-600 mt-2 flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      No accounts found. Please set up GL accounts first.
                    </p>
                  )}
                </div>
                
                {/* Date Range */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={currentStartDate}
                    onChange={(e) => setCurrentStartDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={currentEndDate}
                    onChange={(e) => setCurrentEndDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
              </div>
              
              {/* Action Button */}
              <div className="mt-6 flex justify-center">
                <button
                  type="submit"
                  disabled={!selectedAccountCode || accountsLoading || !!accountsError}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 disabled:transform-none flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span>View Transactions</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Results Panel */}
        <div ref={printRef} className="bg-white shadow-lg rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-slate-50 rounded-t-xl">              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                  <svg className="w-6 h-6 mr-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Transaction Details
                  {accountCode && (
                    <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                      {accountCode}
                    </span>
                  )}
                  {transactions && transactions.length > 0 && (
                    <span className="ml-2 px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                      {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </h3>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <span className="text-sm text-gray-500 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {format(new Date(currentStartDate), 'MMM dd, yyyy')} - {format(new Date(currentEndDate), 'MMM dd, yyyy')}
                </span>
                
                {accountCode && transactions && transactions.length > 0 && (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleExportCSV}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 flex items-center space-x-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Export CSV</span>
                    </button>
                    <button
                      onClick={handlePrint}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 flex items-center space-x-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      <span>Print</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Transaction Table */}
          <div className="overflow-hidden">
            {transactionsError ? (
              <div className="px-6 py-16 text-center">
                <div className="max-w-md mx-auto">
                  <svg className="mx-auto h-16 w-16 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Transactions</h3>
                  <p className="text-gray-500 mb-4">
                    There was an error loading transactions for account <strong>{accountCode}</strong>.
                  </p>
                  <button
                    onClick={() => refetch()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            ) : transactions && transactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200">
                        Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200">
                        Reference
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200">
                        Description
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200">
                        Debit
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200">
                        Credit
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Running Balance
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((transaction: AccountTransaction, index: number) => (
                      <tr key={index} className="hover:bg-blue-50 transition-colors duration-150 group">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-100 group-hover:border-blue-200">
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {format(new Date(transaction.transaction_date), 'MMM dd, yyyy')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm border-r border-gray-100 group-hover:border-blue-200">
                          <span className="text-blue-600 font-medium hover:text-blue-800 cursor-pointer">
                            {transaction.reference_number}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-md border-r border-gray-100 group-hover:border-blue-200">
                          <div className="truncate" title={transaction.description}>
                            {transaction.description}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right border-r border-gray-100 group-hover:border-blue-200">
                          {transaction.debit_amount ? (
                            <span className="text-green-600 font-semibold bg-green-50 px-2 py-1 rounded">
                              {formatCurrency(transaction.debit_amount)}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right border-r border-gray-100 group-hover:border-blue-200">
                          {transaction.credit_amount ? (
                            <span className="text-red-600 font-semibold bg-red-50 px-2 py-1 rounded">
                              {formatCurrency(transaction.credit_amount)}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-right">
                          {transaction.running_balance ? (
                            <span className={`px-3 py-1 rounded-full font-semibold ${
                              transaction.running_balance >= 0 
                                ? 'text-green-700 bg-green-100' 
                                : 'text-red-700 bg-red-100'
                            }`}>
                              {formatCurrency(transaction.running_balance)}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {/* Transaction Summary */}
                {transactions && transactions.length > 0 && (
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4 border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">{transactions.length}</span> transaction{transactions.length !== 1 ? 's' : ''} found
                      </div>
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center">
                          <span className="text-gray-600 mr-2">Total Debits:</span>
                          <span className="font-semibold text-green-600">
                            {formatCurrency(transactions.reduce((sum, tx) => sum + (tx.debit_amount || 0), 0))}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-gray-600 mr-2">Total Credits:</span>
                          <span className="font-semibold text-red-600">
                            {formatCurrency(transactions.reduce((sum, tx) => sum + (tx.credit_amount || 0), 0))}
                          </span>
                        </div>
                        {transactions.length > 0 && (
                          <div className="flex items-center">
                            <span className="text-gray-600 mr-2">Ending Balance:</span>
                            <span className={`font-bold ${
                              (transactions[transactions.length - 1]?.running_balance || 0) >= 0 
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`}>
                              {formatCurrency(transactions[transactions.length - 1]?.running_balance || 0)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="px-6 py-16 text-center">
                {!accountCode ? (
                  <div className="max-w-md mx-auto">
                    <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select an Account</h3>
                    <p className="text-gray-500 mb-4">
                      Please select a general ledger account above to view its transaction history and running balances.
                    </p>
                    <div className="bg-blue-50 rounded-lg p-4 mt-4">
                      <p className="text-sm text-blue-800">
                        <strong>Tip:</strong> You can view account balances in the dropdown to help you select the right account.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-md mx-auto">
                    <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Transactions Found</h3>
                    <p className="text-gray-500 mb-4">
                      No transactions were found for account <strong>{accountCode}</strong> during the selected period.
                    </p>
                    <div className="bg-yellow-50 rounded-lg p-4 mt-4">
                      <p className="text-sm text-yellow-800">
                        <strong>Try:</strong> Expanding the date range or checking if transactions have been posted to this account.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
