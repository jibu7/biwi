'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Download, DollarSign, Users, AlertTriangle } from 'lucide-react';
import { CustomerAgingReportItem } from '@/types/ar';
import { arReportsService } from '@/services/arService';
import { usePermissions } from '@/hooks/usePermissions';
import { AR_REPORTS_VIEW } from '@/lib/permissions';
import { formatCurrency, safePercentage } from '@/lib/numberUtils';

export default function CustomerAgingReportPage() {
  const { hasPermission } = usePermissions();
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: agingData = [], isLoading, error, refetch } = useQuery({
    queryKey: ['customer-aging', asOfDate],
    queryFn: () => arReportsService.getCustomerAging(asOfDate),
    enabled: hasPermission(AR_REPORTS_VIEW) && !!asOfDate,
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getTotals = () => {
    return agingData.reduce(
      (totals, item) => ({
        current_balance: totals.current_balance + (item.total_due || item.current_balance || 0),
        current: totals.current + item.current,
        days_1_30: totals.days_1_30 + (item.days_30 || item.days_1_30 || 0),
        days_31_60: totals.days_31_60 + (item.days_60 || item.days_31_60 || 0),
        days_61_90: totals.days_61_90 + (item.days_90 || item.days_61_90 || 0),
        over_90: totals.over_90 + (item.days_120_plus || item.over_90 || 0),
      }),
      {
        current_balance: 0,
        current: 0,
        days_1_30: 0,
        days_31_60: 0,
        days_61_90: 0,
        over_90: 0,
      }
    );
  };

  const exportToCSV = () => {
    const headers = ['Customer', 'Current Balance', 'Current', '1-30 Days', '31-60 Days', '61-90 Days', 'Over 90 Days'];
    const csvContent = [
      headers.join(','),
      ...agingData.map(item => [
        `"${item.customer_name}"`,
        item.current_balance,
        item.current,
        item.days_1_30,
        item.days_31_60,
        item.days_61_90,
        item.over_90,
      ].join(',')),
      // Add totals row
      [
        '"TOTALS"',
        getTotals().current_balance,
        getTotals().current,
        getTotals().days_1_30,
        getTotals().days_31_60,
        getTotals().days_61_90,
        getTotals().over_90,
      ].join(','),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customer-aging-${asOfDate}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (!hasPermission(AR_REPORTS_VIEW)) {
    return (
      <div className="p-6">
        <div className="text-center">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">Access Denied</h3>
          <p className="mt-1 text-sm text-gray-500">
            You don&apos;t have permission to view AR reports.
          </p>
        </div>
      </div>
    );
  }

  const totals = getTotals();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customer Aging Report</h1>
          <p className="text-gray-600">
            View outstanding customer balances by aging periods
          </p>
        </div>
        {agingData.length > 0 && (
          <button
            onClick={exportToCSV}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </button>
        )}
      </div>

      {/* Date Selection */}
      <div className="rounded-lg border p-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-600" />
            <label className="text-sm font-medium">As of Date:</label>
          </div>
          <input
            type="date"
            value={asOfDate}
            onChange={(e) => setAsOfDate(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
          <button
            onClick={() => refetch()}
            className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            Refresh
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-6">
          <div className="text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">Error</h3>
            <p className="mt-1 text-sm text-gray-500">
              Failed to load aging report. Please try again.
            </p>
          </div>
        </div>
      )}

      {!isLoading && !error && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-lg border p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Outstanding</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(totals.current_balance)}</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-600">Customers with Balance</p>
                  <p className="text-2xl font-bold">{agingData.filter(item => (item.current_balance || item.total_due || 0) > 0).length}</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm text-gray-600">Over 90 Days</p>
                  <p className="text-2xl font-bold text-orange-600">{formatCurrency(totals.over_90)}</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-600">Report Date</p>
                  <p className="text-lg font-medium">{formatDate(asOfDate)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Aging Table */}
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="h-12 px-4 text-left align-middle font-medium text-gray-600">
                      Customer
                    </th>
                    <th className="h-12 px-4 text-right align-middle font-medium text-gray-600">
                      Current Balance
                    </th>
                    <th className="h-12 px-4 text-right align-middle font-medium text-gray-600">
                      Current
                    </th>
                    <th className="h-12 px-4 text-right align-middle font-medium text-gray-600">
                      1-30 Days
                    </th>
                    <th className="h-12 px-4 text-right align-middle font-medium text-gray-600">
                      31-60 Days
                    </th>
                    <th className="h-12 px-4 text-right align-middle font-medium text-gray-600">
                      61-90 Days
                    </th>
                    <th className="h-12 px-4 text-right align-middle font-medium text-gray-600">
                      Over 90 Days
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {agingData.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="h-32 text-center">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <Users className="h-8 w-8 text-gray-600" />
                          <p className="text-sm text-gray-600">
                            No customer balances found for the selected date.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <>
                      {agingData
                        .filter(item => item.current_balance > 0)
                        .sort((a, b) => b.current_balance - a.current_balance)
                        .map((item) => (
                          <tr key={item.customer_id} className="border-b hover:bg-muted/50">
                            <td className="px-4 py-4">
                              <div className="flex items-center space-x-2">
                                <Users className="h-4 w-4 text-gray-600" />
                                <span className="font-medium">{item.customer_name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-right font-medium">
                              {formatCurrency(item.current_balance)}
                            </td>
                            <td className="px-4 py-4 text-right">
                              {formatCurrency(item.current)}
                            </td>
                            <td className="px-4 py-4 text-right">
                              <span className={item.days_1_30 > 0 ? 'text-yellow-600' : ''}>
                                {formatCurrency(item.days_1_30)}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-right">
                              <span className={item.days_31_60 > 0 ? 'text-orange-600' : ''}>
                                {formatCurrency(item.days_31_60)}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-right">
                              <span className={item.days_61_90 > 0 ? 'text-red-600' : ''}>
                                {formatCurrency(item.days_61_90)}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-right">
                              <span className={item.over_90 > 0 ? 'text-red-800 font-medium' : ''}>
                                {formatCurrency(item.over_90)}
                              </span>
                            </td>
                          </tr>
                        ))
                      }
                      {/* Totals Row */}
                      <tr className="border-b-2 border-gray-300 bg-muted/30 font-medium">
                        <td className="px-4 py-4 font-bold">TOTALS</td>
                        <td className="px-4 py-4 text-right font-bold text-red-600">
                          {formatCurrency(totals.current_balance)}
                        </td>
                        <td className="px-4 py-4 text-right font-bold">
                          {formatCurrency(totals.current)}
                        </td>
                        <td className="px-4 py-4 text-right font-bold text-yellow-600">
                          {formatCurrency(totals.days_1_30)}
                        </td>
                        <td className="px-4 py-4 text-right font-bold text-orange-600">
                          {formatCurrency(totals.days_31_60)}
                        </td>
                        <td className="px-4 py-4 text-right font-bold text-red-600">
                          {formatCurrency(totals.days_61_90)}
                        </td>
                        <td className="px-4 py-4 text-right font-bold text-red-800">
                          {formatCurrency(totals.over_90)}
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Analysis */}
          {agingData.length > 0 && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <h3 className="font-medium text-blue-900 mb-2">Aging Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                <div>
                  <p><strong>Current & 1-30 Days:</strong> {formatCurrency(totals.current + totals.days_1_30)} 
                    ({safePercentage(totals.current + totals.days_1_30, totals.current_balance)}%)</p>
                  <p><strong>31-90 Days:</strong> {formatCurrency(totals.days_31_60 + totals.days_61_90)} 
                    ({safePercentage(totals.days_31_60 + totals.days_61_90, totals.current_balance)}%)</p>
                </div>
                <div>
                  <p><strong>Over 90 Days:</strong> {formatCurrency(totals.over_90)} 
                    ({safePercentage(totals.over_90, totals.current_balance)}%)</p>
                  <p><strong>Customers:</strong> {agingData.filter(item => item.current_balance > 0).length} with outstanding balances</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
