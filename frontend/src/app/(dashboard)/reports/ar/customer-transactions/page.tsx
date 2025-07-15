'use client';


import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import reportingService, { CustomerTransaction } from '@/services/reportingService';
import { format } from 'date-fns';
import '@/styles/reports.css';

export default function CustomerTransactionsPage() {
  const searchParams = useSearchParams();
  const customerId = searchParams.get('customer_id');
  const asOfDate = searchParams.get('as_of_date') || format(new Date(), 'yyyy-MM-dd');
  
  const [currentAsOfDate, setCurrentAsOfDate] = useState(asOfDate);
  const printRef = useRef<HTMLDivElement>(null);

  const { data: transactions, isLoading, refetch } = useQuery({
    queryKey: ['customer-transactions', customerId, currentAsOfDate],
    queryFn: () => reportingService.getCustomerTransactions(Number(customerId), currentAsOfDate),
    enabled: !!customerId
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
    csvData.push(['Date', 'Reference', 'Description', 'Type', 'Amount']);
    
    transactions.forEach((tx: CustomerTransaction) => {
      csvData.push([
        tx.transaction_date,
        tx.reference_number,
        tx.description,
        tx.transaction_type,
        tx.amount.toString()
      ]);
    });
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customer-transactions-${customerId}-${currentAsOfDate}.csv`;
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
          Customer Transactions - Customer ID: {customerId}
        </h1>
        
        <div className="bg-white shadow rounded-lg mb-6 print:shadow-none print:border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Filter Parameters</h2>
          </div>
          <div className="p-6 print:hidden">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">As Of Date</label>
                <input
                  type="date"
                  value={currentAsOfDate}
                  onChange={(e) => setCurrentAsOfDate(e.target.value)}
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
                As of: {format(new Date(currentAsOfDate), 'MMM dd, yyyy')}
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black print:border">
                      Type
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black print:border">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 print:bg-white">
                  {transactions.map((transaction: CustomerTransaction, index: number) => (
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 print:text-black print:border">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          transaction.transaction_type === 'Invoice' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {transaction.transaction_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right print:text-black print:border">
                        {formatCurrency(transaction.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500">No transactions found for this customer.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
