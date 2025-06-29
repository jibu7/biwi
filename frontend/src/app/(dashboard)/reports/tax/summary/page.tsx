'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { taxReportService } from '@/services/taxReportService';
import { formatCurrency } from '@/lib/utils';
import { Card } from '@/components/ui/card';

export default function TaxSummaryReportPage() {
  const [dateRange, setDateRange] = useState({
    startDate: startOfMonth(new Date()),
    endDate: endOfMonth(new Date())
  });
  
  const { data: taxSummary, isLoading } = useQuery({
    queryKey: ['taxSummary', dateRange],
    queryFn: () => taxReportService.getTaxSummary(dateRange.startDate, dateRange.endDate)
  });
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Tax Summary Report</h1>
      
      {/* Date Range Selector */}
      <div className="mb-6 flex gap-4">
        <input 
          type="date" 
          value={format(dateRange.startDate, 'yyyy-MM-dd')}
          onChange={(e) => setDateRange({...dateRange, startDate: new Date(e.target.value)})}
          className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input 
          type="date" 
          value={format(dateRange.endDate, 'yyyy-MM-dd')}
          onChange={(e) => setDateRange({...dateRange, endDate: new Date(e.target.value)})}
          className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Sales Taxes */}
          <Card className="p-6">
            <h2 className="font-semibold mb-4 text-lg">Sales Taxes (Output Tax)</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4 font-semibold">Tax Type</th>
                    <th className="text-center py-2 px-4 font-semibold">Rate</th>
                    <th className="text-right py-2 px-4 font-semibold">Tax Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(taxSummary?.salesTaxes || {}).map(([taxName, data]) => (
                    <tr key={taxName} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-4">{taxName}</td>
                      <td className="py-2 px-4 text-center">{data.rate}%</td>
                      <td className="py-2 px-4 text-right font-mono">{formatCurrency(data.taxAmount)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-semibold bg-gray-50">
                    <td colSpan={2} className="py-3 px-4">Total Sales Tax</td>
                    <td className="py-3 px-4 text-right font-mono">{formatCurrency(taxSummary?.totals.totalSalesTax || 0)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
          
          {/* Purchase Taxes */}
          <Card className="p-6">
            <h2 className="font-semibold mb-4 text-lg">Purchase Taxes (Input Tax)</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4 font-semibold">Tax Type</th>
                    <th className="text-center py-2 px-4 font-semibold">Rate</th>
                    <th className="text-right py-2 px-4 font-semibold">Tax Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(taxSummary?.purchaseTaxes || {}).map(([taxName, data]) => (
                    <tr key={taxName} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-4">{taxName}</td>
                      <td className="py-2 px-4 text-center">{data.rate}%</td>
                      <td className="py-2 px-4 text-right font-mono">{formatCurrency(data.taxAmount)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-semibold bg-gray-50">
                    <td colSpan={2} className="py-3 px-4">Total Purchase Tax</td>
                    <td className="py-3 px-4 text-right font-mono">{formatCurrency(taxSummary?.totals.totalPurchaseTax || 0)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
          
          {/* Net Tax Payable */}
          <Card className="p-6 bg-blue-50 border-blue-200">
            <h2 className="font-semibold text-lg text-blue-900">Net Tax Payable</h2>
            <p className="text-3xl font-bold mt-3 text-blue-900">
              {formatCurrency(taxSummary?.totals.netTaxPayable || 0)}
            </p>
            <p className="text-sm text-blue-700 mt-2">
              Sales Tax - Purchase Tax = Net Payable
            </p>
            <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-blue-600">Sales Tax:</span>
                <div className="font-mono font-semibold">{formatCurrency(taxSummary?.totals.totalSalesTax || 0)}</div>
              </div>
              <div>
                <span className="text-blue-600">Purchase Tax:</span>
                <div className="font-mono font-semibold">({formatCurrency(taxSummary?.totals.totalPurchaseTax || 0)})</div>
              </div>
              <div>
                <span className="text-blue-600">Net Payable:</span>
                <div className="font-mono font-bold text-lg">{formatCurrency(taxSummary?.totals.netTaxPayable || 0)}</div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
