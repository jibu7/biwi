'use client';


import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { glService } from '@/services/glService';
import { format } from 'date-fns';
import '@/styles/reports.css';

export default function BankReconciliationPage() {
  const [glAccountId, setGlAccountId] = useState<number | null>(null);
  const [reconciliationDate, setReconciliationDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const printRef = useRef<HTMLDivElement>(null);

  const { data: accounts } = useQuery({
    queryKey: ['gl-accounts'],
    queryFn: () => glService.getGLAccounts()
  });

  // Placeholder data - would need to implement in backend
  const { data: reconciliationData, isLoading, refetch } = useQuery({
    queryKey: ['bank-reconciliation', glAccountId, reconciliationDate],
    queryFn: () => Promise.resolve({
      bank_balance: 15750.00,
      book_balance: 14250.00,
      outstanding_deposits: [
        { date: '2024-06-14', description: 'Customer Payment - INV001', amount: 2500.00 },
        { date: '2024-06-13', description: 'Customer Payment - INV002', amount: 1750.00 }
      ],
      outstanding_checks: [
        { check_number: '1234', date: '2024-06-12', payee: 'Office Supplies Inc', amount: 850.00 },
        { check_number: '1235', date: '2024-06-11', payee: 'Utility Company', amount: 325.00 },
        { check_number: '1236', date: '2024-06-10', payee: 'Rent Payment', amount: 2200.00 }
      ],
      bank_fees: [
        { description: 'Monthly Service Fee', amount: 25.00 },
        { description: 'Wire Transfer Fee', amount: 15.00 }
      ],
      reconciled_balance: 15750.00
    }),
    enabled: !!glAccountId
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const bankAccounts = accounts?.filter(account => 
    account.account_type === 'Asset' && 
    (account.account_name.toLowerCase().includes('bank') || 
     account.account_name.toLowerCase().includes('cash'))
  ) || [];

  const selectedAccount = accounts?.find(account => account.id === glAccountId);

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
    if (!reconciliationData) return;
    
    const csvData = [];
    csvData.push(['Bank Reconciliation Report']);
    csvData.push(['Date', reconciliationDate]);
    csvData.push(['Account', selectedAccount?.account_name || '']);
    csvData.push([]);
    csvData.push(['Bank Balance', reconciliationData.bank_balance.toString()]);
    csvData.push(['Book Balance', reconciliationData.book_balance.toString()]);
    csvData.push([]);
    csvData.push(['Outstanding Deposits']);
    reconciliationData.outstanding_deposits.forEach(deposit => {
      csvData.push([deposit.date, deposit.description, deposit.amount.toString()]);
    });
    csvData.push([]);
    csvData.push(['Outstanding Checks']);
    reconciliationData.outstanding_checks.forEach(check => {
      csvData.push([check.date, `${check.check_number} - ${check.payee}`, check.amount.toString()]);
    });
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bank-reconciliation-${reconciliationDate}.csv`;
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
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Bank Reconciliation</h1>
        
        {/* Report Parameters */}
        <div className="bg-white shadow rounded-lg mb-6 print:shadow-none">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Reconciliation Parameters</h2>
          </div>
          <div className="p-6 print:hidden">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account</label>
                <select
                  value={glAccountId?.toString() || ''}
                  onChange={(e) => setGlAccountId(e.target.value ? parseInt(e.target.value) : null)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">Select account</option>
                  {bankAccounts.map((account) => (
                    <option key={account.id} value={account.id.toString()}>
                      {account.account_code} - {account.account_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reconciliation Date</label>
                <input
                  type="date"
                  value={reconciliationDate}
                  onChange={(e) => setReconciliationDate(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => refetch()}
                  disabled={!glAccountId}
                  className="w-full bg-indigo-600 border border-transparent rounded-md shadow-sm py-2 px-4 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
                >
                  Generate Report
                </button>
              </div>
              <div className="flex items-end space-x-2">
                <button
                  onClick={handleExportCSV}
                  disabled={!reconciliationData}
                  className="w-full bg-green-600 border border-transparent rounded-md shadow-sm py-2 px-4 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400"
                >
                  Export CSV
                </button>
                <button
                  onClick={handlePrint}
                  disabled={!reconciliationData}
                  className="w-full bg-gray-600 border border-transparent rounded-md shadow-sm py-2 px-4 text-base font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:bg-gray-400"
                >
                  Print
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bank Reconciliation Report */}
        {reconciliationData && selectedAccount && (
          <div ref={printRef} className="bg-white shadow rounded-lg print:shadow-none">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="text-center">
                <h2 className="text-xl font-medium text-gray-900">Bank Reconciliation</h2>
                <p className="text-sm text-gray-500">
                  {selectedAccount.account_code} - {selectedAccount.account_name}
                </p>
                <p className="text-sm text-gray-500">
                  As of {format(new Date(reconciliationDate), 'MMMM dd, yyyy')}
                </p>
              </div>
            </div>
            
            <div className="p-6">
              {/* Summary Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg print:border">
                  <h3 className="text-sm font-medium text-blue-600">Bank Statement Balance</h3>
                  <p className="text-2xl font-bold text-blue-900">{formatCurrency(reconciliationData.bank_balance)}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg print:border">
                  <h3 className="text-sm font-medium text-green-600">Book Balance</h3>
                  <p className="text-2xl font-bold text-green-900">{formatCurrency(reconciliationData.book_balance)}</p>
                </div>
              </div>

              {/* Outstanding Deposits */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-800">Outstanding Deposits</h3>
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50 print:bg-white">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black">Description</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reconciliationData.outstanding_deposits.map((deposit, index) => (
                        <tr key={index} className="hover:bg-gray-50 print:hover:bg-white">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{format(new Date(deposit.date), 'MM/dd/yyyy')}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{deposit.description}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">{formatCurrency(deposit.amount)}</td>
                        </tr>
                      ))}
                      <tr className="border-t-2 border-gray-300 font-bold bg-blue-50 print:bg-white">
                        <td colSpan={2} className="px-6 py-4 text-sm text-gray-900">Total Outstanding Deposits</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatCurrency(reconciliationData.outstanding_deposits.reduce((sum, deposit) => sum + deposit.amount, 0))}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Outstanding Checks */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-800">Outstanding Checks</h3>
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50 print:bg-white">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black">Check #</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black">Payee</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reconciliationData.outstanding_checks.map((check, index) => (
                        <tr key={index} className="hover:bg-gray-50 print:hover:bg-white">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{format(new Date(check.date), 'MM/dd/yyyy')}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{check.check_number}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{check.payee}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">{formatCurrency(check.amount)}</td>
                        </tr>
                      ))}
                      <tr className="border-t-2 border-gray-300 font-bold bg-red-50 print:bg-white">
                        <td colSpan={3} className="px-6 py-4 text-sm text-gray-900">Total Outstanding Checks</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatCurrency(reconciliationData.outstanding_checks.reduce((sum, check) => sum + check.amount, 0))}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Reconciliation Summary */}
              <div className="border-t-2 border-gray-300 pt-4">
                <h3 className="text-lg font-semibold mb-3 text-gray-800">Reconciliation Summary</h3>
                <div className="bg-gray-50 p-4 rounded-lg print:border">
                  <div className="flex justify-between py-2">
                    <span>Bank Statement Balance</span>
                    <span className="font-medium">{formatCurrency(reconciliationData.bank_balance)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span>Add: Outstanding Deposits</span>
                    <span className="font-medium">{formatCurrency(reconciliationData.outstanding_deposits.reduce((sum, d) => sum + d.amount, 0))}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span>Less: Outstanding Checks</span>
                    <span className="font-medium">({formatCurrency(reconciliationData.outstanding_checks.reduce((sum, c) => sum + c.amount, 0))})</span>
                  </div>
                  <div className="flex justify-between py-2 font-bold text-lg border-t border-gray-300">
                    <span>Adjusted Bank Balance</span>
                    <span>{formatCurrency(reconciliationData.reconciled_balance)}</span>
                  </div>
                  <div className="flex justify-between py-2 mt-2">
                    <span>Book Balance</span>
                    <span className="font-medium">{formatCurrency(reconciliationData.book_balance)}</span>
                  </div>
                  <div className="flex justify-between py-2 font-bold text-lg border-t border-gray-300">
                    <span>Difference</span>
                    <span className={reconciliationData.reconciled_balance === reconciliationData.book_balance ? 'text-green-600' : 'text-red-600'}>
                      {formatCurrency(reconciliationData.reconciled_balance - reconciliationData.book_balance)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
