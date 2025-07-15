'use client';


import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Download } from 'lucide-react';
import { apService } from '@/services/apService';
import { Table } from '@/components/ui/Table';

export default function SupplierAgeAnalysisPage() {
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: agingData = [], isLoading } = useQuery({
    queryKey: ['supplierAging', asOfDate],
    queryFn: () => apService.getSupplierAgeing(asOfDate),
    enabled: !!asOfDate,
  });

  const columns = [
    { header: 'Supplier Code', accessor: 'supplier_code' as keyof typeof agingData[0] },
    { header: 'Supplier Name', accessor: 'supplier_name' as keyof typeof agingData[0] },
    {
      header: 'Current',
      accessor: (data: typeof agingData[0]) => (
        <span className={data.current > 0 ? 'text-red-600' : ''}>
          {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
          }).format(data.current)}
        </span>
      ),
    },
    {
      header: '1-30 Days',
      accessor: (data: typeof agingData[0]) => (
        <span className={data.days_30 > 0 ? 'text-red-600' : ''}>
          {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
          }).format(data.days_30)}
        </span>
      ),
    },
    {
      header: '31-60 Days',
      accessor: (data: typeof agingData[0]) => (
        <span className={data.days_60 > 0 ? 'text-red-600' : ''}>
          {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
          }).format(data.days_60)}
        </span>
      ),
    },
    {
      header: '61-90 Days',
      accessor: (data: typeof agingData[0]) => (
        <span className={data.days_90 > 0 ? 'text-red-600' : ''}>
          {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
          }).format(data.days_90)}
        </span>
      ),
    },
    {
      header: '90+ Days',
      accessor: (data: typeof agingData[0]) => (
        <span className={data.days_120_plus > 0 ? 'text-red-600' : ''}>
          {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
          }).format(data.days_120_plus)}
        </span>
      ),
    },
    {
      header: 'Total Due',
      accessor: (data: typeof agingData[0]) => (
        <span className={data.total_due > 0 ? 'text-red-600 font-semibold' : ''}>
          {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
          }).format(data.total_due)}
        </span>
      ),
    },
  ];

  const totals = agingData.reduce(
    (acc, item) => ({
      current: acc.current + item.current,
      days_30: acc.days_30 + item.days_30,
      days_60: acc.days_60 + item.days_60,
      days_90: acc.days_90 + item.days_90,
      days_120_plus: acc.days_120_plus + item.days_120_plus,
      total_due: acc.total_due + item.total_due,
    }),
    { current: 0, days_30: 0, days_60: 0, days_90: 0, days_120_plus: 0, total_due: 0 }
  );

  const handleExport = () => {
    // Implementation for exporting the report
    console.log('Export aging report');
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Supplier Age Analysis</h1>
          <p className="mt-1 text-sm text-gray-600">
            Analysis of outstanding amounts by age
          </p>
        </div>
        <button
          onClick={handleExport}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <Download className="h-4 w-4 mr-2" />
          Export
        </button>
      </div>

      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center mb-4">
          <Calendar className="h-5 w-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Report Parameters</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              As of Date
            </label>
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {agingData.length > 0 && (
        <>
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  {columns.map((column, index) => (
                    <th
                      key={index}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {agingData.map((item, index) => (
                  <tr key={`${item.supplier_id}-${index}`} className="hover:bg-gray-50">
                    {columns.map((column, colIndex) => (
                      <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm">
                        {typeof column.accessor === 'function'
                          ? column.accessor(item)
                          : String(item[column.accessor as keyof typeof item] || '-')
                        }
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Summary Totals</h3>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Current</p>
                <p className="text-lg font-semibold text-red-600">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(totals.current)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">1-30 Days</p>
                <p className="text-lg font-semibold text-red-600">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(totals.days_30)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">31-60 Days</p>
                <p className="text-lg font-semibold text-red-600">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(totals.days_60)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">61-90 Days</p>
                <p className="text-lg font-semibold text-red-600">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(totals.days_90)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">90+ Days</p>
                <p className="text-lg font-semibold text-red-600">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(totals.days_120_plus)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Total Due</p>
                <p className="text-xl font-bold text-red-600">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(totals.total_due)}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
