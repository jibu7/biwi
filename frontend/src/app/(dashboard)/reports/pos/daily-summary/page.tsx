"use client";

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { posService } from '@/services/posService';
import { formatCurrency, formatDate } from '@/lib/utils';
import DatePicker from '@/components/ui/date-picker';
import { Download, Printer } from 'lucide-react';

export default function DailySummaryReport() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTill, setSelectedTill] = useState<number | null>(null);
  
  const { data: tills = [] } = useQuery({
    queryKey: ['pos', 'tills'],
    queryFn: async () => {
      const response = await posService.getTills();
      return response.data;
    },
  });
  
  const { data: summary, isLoading } = useQuery({
    queryKey: ['pos', 'daily-summary', selectedDate, selectedTill],
    queryFn: async () => {
      const response = await posService.getDailySummary({
        date: selectedDate,
        tillId: selectedTill
      });
      return response.data;
    },
    enabled: !!selectedDate,
  });
  
  const handlePrint = () => {
    window.print();
  };
  
  const handleExport = () => {
    // Implement CSV export
    const csv = generateCSV(summary);
    downloadCSV(csv, `daily-summary-${formatDate(selectedDate)}.csv`);
  };
  
  const generateCSV = (data: any) => {
    if (!data) return '';
    
    const lines = [
      'Daily Sales Summary',
      `Date,${formatDate(selectedDate)}`,
      '',
      'Key Metrics',
      'Total Transactions,Gross Sales,Total Tax,Total Discount',
      `${data.totalTransactions},${data.grossSales},${data.totalTax},${data.totalDiscount}`,
      '',
      'Payment Method Breakdown',
      'Payment Method,Count,Amount,Percentage',
      ...data.paymentBreakdown.map((p: any) => 
        `${p.method},${p.count},${p.amount},${((p.amount / data.grossSales) * 100).toFixed(1)}%`
      )
    ];
    
    return lines.join('\n');
  };
  
  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Daily Sales Summary</h1>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 border rounded hover:bg-gray-50"
          >
            <Printer className="h-4 w-4" />
            Print
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 border rounded hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <DatePicker
              value={selectedDate}
              onChange={setSelectedDate}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Till</label>
            <select
              value={selectedTill || ''}
              onChange={(e) => setSelectedTill(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full p-2 border rounded"
            >
              <option value="">All Tills</option>
              {tills.map((till: any) => (
                <option key={till.id} value={till.id}>
                  {till.name} ({till.till_code})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Summary Report */}
      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : summary ? (
        <div className="bg-white rounded-lg shadow p-6 print:shadow-none">
          <div className="text-center mb-6 print:mb-4">
            <h2 className="text-xl font-bold">Daily Sales Summary</h2>
            <p className="text-gray-600">{formatDate(selectedDate)}</p>
            {selectedTill && (
              <p className="text-gray-600">
                Till: {tills.find((t: any) => t.id === selectedTill)?.name}
              </p>
            )}
          </div>
          
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded">
              <div className="text-sm text-gray-600">Total Transactions</div>
              <div className="text-2xl font-bold">{summary.totalTransactions}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <div className="text-sm text-gray-600">Gross Sales</div>
              <div className="text-2xl font-bold">{formatCurrency(summary.grossSales)}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <div className="text-sm text-gray-600">Total Tax</div>
              <div className="text-2xl font-bold">{formatCurrency(summary.totalTax)}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <div className="text-sm text-gray-600">Total Discount</div>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(summary.totalDiscount)}
              </div>
            </div>
          </div>
          
          {/* Payment Breakdown */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Payment Method Breakdown</h3>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Payment Method</th>
                  <th className="px-4 py-2 text-center">Count</th>
                  <th className="px-4 py-2 text-right">Amount</th>
                  <th className="px-4 py-2 text-right">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {summary.paymentBreakdown.map((payment: any) => (
                  <tr key={payment.method} className="border-b">
                    <td className="px-4 py-2">{payment.method}</td>
                    <td className="px-4 py-2 text-center">{payment.count}</td>
                    <td className="px-4 py-2 text-right">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {((payment.amount / summary.grossSales) * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 font-semibold">
                <tr>
                  <td className="px-4 py-2">Total</td>
                  <td className="px-4 py-2 text-center">{summary.totalTransactions}</td>
                  <td className="px-4 py-2 text-right">{formatCurrency(summary.grossSales)}</td>
                  <td className="px-4 py-2 text-right">100.0%</td>
                </tr>
              </tfoot>
            </table>
          </div>
          
          {/* Hourly Breakdown */}
          {summary.hourlyBreakdown && (
            <div>
              <h3 className="font-semibold mb-3">Hourly Sales Distribution</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-1 text-left">Hour</th>
                      {Array.from({ length: 12 }, (_, i) => (
                        <th key={i} className="px-2 py-1 text-center">
                          {i === 0 ? '12am' : i < 12 ? `${i}am` : ''}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="px-2 py-1 font-semibold">Sales</td>
                      {summary.hourlyBreakdown.slice(0, 12).map((hour: any, i: number) => (
                        <td key={i} className="px-2 py-1 text-center">
                          {hour.sales > 0 ? formatCurrency(hour.sales) : '-'}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-1 text-left">Hour</th>
                      {Array.from({ length: 12 }, (_, i) => (
                        <th key={i + 12} className="px-2 py-1 text-center">
                          {i === 0 ? '12pm' : `${i}pm`}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-2 py-1 font-semibold">Sales</td>
                      {summary.hourlyBreakdown.slice(12, 24).map((hour: any, i: number) => (
                        <td key={i + 12} className="px-2 py-1 text-center">
                          {hour.sales > 0 ? formatCurrency(hour.sales) : '-'}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No data available for the selected date
        </div>
      )}
    </div>
  );
}
