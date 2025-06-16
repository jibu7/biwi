'use client';

import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import reportingService, { ARAgingDetail } from '@/services/reportingService';
import { format } from 'date-fns';
import '@/styles/reports.css';

export default function DetailedARAgingPage() {
  const [asOfDate, setAsOfDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [showOnlyOverdue, setShowOnlyOverdue] = useState(false);
  const [minAmount, setMinAmount] = useState<number>(0);
  const printRef = useRef<HTMLDivElement>(null);

  const { data: agingData, isLoading, refetch } = useQuery({
    queryKey: ['ar-aging-detail', asOfDate],
    queryFn: () => reportingService.getDetailedARAging(asOfDate),
    enabled: !!asOfDate
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const calculateTotals = () => {
    if (!agingData) return {
      total: 0, current: 0, days30: 0, days60: 0, days90: 0, days120Plus: 0
    };

    return agingData.reduce((acc, customer) => ({
      total: acc.total + customer.total_outstanding,
      current: acc.current + customer.current,
      days30: acc.days30 + customer.days_30,
      days60: acc.days60 + customer.days_60,
      days90: acc.days90 + customer.days_90,
      days120Plus: acc.days120Plus + customer.days_120_plus
    }), { total: 0, current: 0, days30: 0, days60: 0, days90: 0, days120Plus: 0 });
  };

  // Filter data based on user preferences
  const filteredData = agingData?.filter(customer => {
    if (showOnlyOverdue && (customer.days_30 + customer.days_60 + customer.days_90 + customer.days_120_plus) === 0) {
      return false;
    }
    if (customer.total_outstanding < minAmount) {
      return false;
    }
    return true;
  }) || [];

  const totals = calculateTotals();

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
    if (!filteredData) return;
    
    const csvData = [];
    csvData.push([
      'Customer Code', 'Customer Name', 'Credit Limit', 'Current', 
      '1-30 Days', '31-60 Days', '61-90 Days', '90+ Days', 
      'Total Outstanding', 'Last Payment'
    ]);
    
    filteredData.forEach(customer => {
      csvData.push([
        customer.customer_code,
        customer.customer_name,
        customer.credit_limit.toString(),
        customer.current.toString(),
        customer.days_30.toString(),
        customer.days_60.toString(),
        customer.days_90.toString(),
        customer.days_120_plus.toString(),
        customer.total_outstanding.toString(),
        customer.last_payment_date || ''
      ]);
    });
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ar-aging-${asOfDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDrillDown = (customerId: number) => {
    const url = `/reports/ar/customer-transactions?customer_id=${customerId}&as_of_date=${asOfDate}`;
    window.open(url, '_blank');
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
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Detailed AR Aging Analysis</h1>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 print:border print:shadow-none">
            <div className="text-sm font-medium text-blue-600">Total Outstanding</div>
            <div className="text-2xl font-bold text-blue-900">{formatCurrency(totals.total)}</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 print:border print:shadow-none">
            <div className="text-sm font-medium text-green-600">Current</div>
            <div className="text-2xl font-bold text-green-900">{formatCurrency(totals.current)}</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 print:border print:shadow-none">
            <div className="text-sm font-medium text-yellow-600">1-30 Days</div>
            <div className="text-2xl font-bold text-yellow-900">{formatCurrency(totals.days30)}</div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 print:border print:shadow-none">
            <div className="text-sm font-medium text-orange-600">31-60 Days</div>
            <div className="text-2xl font-bold text-orange-900">{formatCurrency(totals.days60)}</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 print:border print:shadow-none">
            <div className="text-sm font-medium text-red-600">61-90 Days</div>
            <div className="text-2xl font-bold text-red-900">{formatCurrency(totals.days90)}</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 print:border print:shadow-none">
            <div className="text-sm font-medium text-purple-600">90+ Days</div>
            <div className="text-2xl font-bold text-purple-900">{formatCurrency(totals.days120Plus)}</div>
          </div>
        </div>

        {/* Report Parameters */}
        <div className="bg-white shadow rounded-lg mb-6 print:shadow-none print:border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Report Parameters</h2>
          </div>
          <div className="p-6 print:hidden">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">As Of Date</label>
                <input
                  type="date"
                  value={asOfDate}
                  onChange={(e) => setAsOfDate(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Amount</label>
                <input
                  type="number"
                  value={minAmount}
                  onChange={(e) => setMinAmount(Number(e.target.value))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="0.00"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showOnlyOverdue"
                  checked={showOnlyOverdue}
                  onChange={(e) => setShowOnlyOverdue(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="showOnlyOverdue" className="ml-2 block text-sm text-gray-900">
                  Show only overdue
                </label>
              </div>
              <div className="flex items-end space-x-2">
                <button
                  onClick={() => refetch()}
                  className="bg-indigo-600 border border-transparent rounded-md shadow-sm py-2 px-4 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
                  Print Report
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Report Data */}
        <div ref={printRef} className="bg-white shadow rounded-lg print:shadow-none print:border">
          <div className="px-6 py-4 border-b border-gray-200 print:border-b">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">AR Aging Details</h3>
              <span className="text-sm text-gray-500">
                As of: {format(new Date(asOfDate), 'MMM dd, yyyy')}
              </span>
            </div>
          </div>
          
          {filteredData && filteredData.length > 0 ? (
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50 print:bg-white">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black print:border">
                      Customer Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black print:border">
                      Customer Name
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black print:border">
                      Credit Limit
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black print:border">
                      Current
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black print:border">
                      1-30 Days
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black print:border">
                      31-60 Days
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black print:border">
                      61-90 Days
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black print:border">
                      90+ Days
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black print:border">
                      Total Outstanding
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black print:border">
                      Last Payment
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 print:bg-white">
                  {filteredData.map((customer) => (
                    <tr key={customer.customer_id} className="hover:bg-gray-50 print:hover:bg-white">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 print:text-black print:border">
                        {customer.customer_code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 print:text-black print:border">
                        <button
                          onClick={() => handleDrillDown(customer.customer_id)}
                          className="text-indigo-600 hover:text-indigo-900 print:text-black"
                        >
                          {customer.customer_name}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right print:text-black print:border">
                        {formatCurrency(customer.credit_limit)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right print:text-black print:border">
                        {formatCurrency(customer.current)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right print:text-black print:border">
                        {formatCurrency(customer.days_30)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right print:text-black print:border">
                        {formatCurrency(customer.days_60)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right print:text-black print:border">
                        {formatCurrency(customer.days_90)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right print:text-black print:border">
                        {formatCurrency(customer.days_120_plus)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right print:text-black print:border">
                        {formatCurrency(customer.total_outstanding)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right print:text-black print:border">
                        {customer.last_payment_date ? format(new Date(customer.last_payment_date), 'MMM dd, yyyy') : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500">No aging data found for the selected criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
