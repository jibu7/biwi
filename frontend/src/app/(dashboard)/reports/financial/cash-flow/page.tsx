'use client';


import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, subMonths } from 'date-fns';
import reportingService, { CashFlowData } from '@/services/reportingService';
import '@/styles/reports.css';

export default function CashFlowPage() {
  const [startDate, setStartDate] = useState(format(subMonths(new Date(), 1), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const printRef = useRef<HTMLDivElement>(null);

  const { data: cashFlowData, isLoading, refetch } = useQuery<CashFlowData>({
    queryKey: ['cash-flow', startDate, endDate],
    queryFn: () => reportingService.getCashFlowStatement(startDate, endDate),
    enabled: !!startDate && !!endDate
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
    if (!cashFlowData) return;
    
    const csvData = [];
    csvData.push(['Activity', 'Description', 'Amount']);
    
    csvData.push(['Operating Activities', '', '']);
    cashFlowData.operating_activities.forEach(item => {
      csvData.push(['', item.account_name, item.amount.toString()]);
    });
    
    csvData.push(['Investing Activities', '', '']);
    cashFlowData.investing_activities.forEach(item => {
      csvData.push(['', item.account_name, item.amount.toString()]);
    });
    
    csvData.push(['Financing Activities', '', '']);
    cashFlowData.financing_activities.forEach(item => {
      csvData.push(['', item.account_name, item.amount.toString()]);
    });
    
    csvData.push(['Net Change in Cash', '', cashFlowData.net_change_in_cash.toString()]);
    csvData.push(['Beginning Cash', '', cashFlowData.beginning_cash.toString()]);
    csvData.push(['Ending Cash', '', cashFlowData.ending_cash.toString()]);
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cash-flow-${startDate}-to-${endDate}.csv`;
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
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Cash Flow Statement</h1>
        
        {/* Report Parameters */}
        <div className="bg-white shadow rounded-lg mb-6 print:shadow-none">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Report Parameters</h2>
          </div>
          <div className="p-6 print:hidden">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => refetch()}
                  className="w-full bg-indigo-600 border border-transparent rounded-md shadow-sm py-2 px-4 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Generate Report
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

        {/* Cash Flow Statement */}
        <div ref={printRef} className="bg-white shadow rounded-lg print:shadow-none">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="text-center">
              <h2 className="text-xl font-medium text-gray-900">Cash Flow Statement</h2>
              <p className="text-sm text-gray-500">
                For the Period {format(new Date(startDate), 'MMM dd, yyyy')} to {format(new Date(endDate), 'MMM dd, yyyy')}
              </p>
            </div>
          </div>
          
          {cashFlowData && (
            <div className="p-6">
              {/* Operating Activities */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-800">Cash Flows from Operating Activities</h3>
                <div className="ml-4">
                  {cashFlowData.operating_activities.map((item, index) => (
                    <div key={index} className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-900">{item.account_name}</span>
                      <span className="text-sm text-gray-900 font-medium">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-2 font-bold border-t-2 border-gray-300 mt-2">
                    <span>Net Cash from Operating Activities</span>
                    <span>{formatCurrency(cashFlowData.net_cash_from_operating)}</span>
                  </div>
                </div>
              </div>

              {/* Investing Activities */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-800">Cash Flows from Investing Activities</h3>
                <div className="ml-4">
                  {cashFlowData.investing_activities.map((item, index) => (
                    <div key={index} className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-900">{item.account_name}</span>
                      <span className="text-sm text-gray-900 font-medium">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-2 font-bold border-t-2 border-gray-300 mt-2">
                    <span>Net Cash from Investing Activities</span>
                    <span>{formatCurrency(cashFlowData.net_cash_from_investing)}</span>
                  </div>
                </div>
              </div>

              {/* Financing Activities */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-800">Cash Flows from Financing Activities</h3>
                <div className="ml-4">
                  {cashFlowData.financing_activities.map((item, index) => (
                    <div key={index} className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-900">{item.account_name}</span>
                      <span className="text-sm text-gray-900 font-medium">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-2 font-bold border-t-2 border-gray-300 mt-2">
                    <span>Net Cash from Financing Activities</span>
                    <span>{formatCurrency(cashFlowData.net_cash_from_financing)}</span>
                  </div>
                </div>
              </div>

              {/* Net Cash Flow Summary */}
              <div className="border-t-2 border-gray-300 pt-4">
                <div className="flex justify-between py-2">
                  <span className="font-medium">Opening Cash Balance</span>
                  <span className="font-medium">{formatCurrency(cashFlowData.beginning_cash)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="font-medium">Net Change in Cash</span>
                  <span className="font-medium">{formatCurrency(cashFlowData.net_change_in_cash)}</span>
                </div>
                <div className="flex justify-between py-2 font-bold text-lg border-t border-gray-300">
                  <span>Closing Cash Balance</span>
                  <span>{formatCurrency(cashFlowData.ending_cash)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
