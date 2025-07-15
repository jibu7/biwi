'use client';


import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { posService } from '@/services/posService';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DataTable, Column } from '@/components/ui/data-table';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CashierSalesReport } from '@/types/pos';
import { Download, Users, DollarSign, TrendingUp } from 'lucide-react';

export default function CashierSalesReportPage() {
  const [dateRange, setDateRange] = useState({
    start: new Date(),
    end: new Date(),
  });

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['pos-cashier-sales', dateRange],
    queryFn: () => posService.getCashierSalesReport(
      dateRange.start.toISOString().split('T')[0],
      dateRange.end.toISOString().split('T')[0]
    ),
  });

  const report = reportData?.data || [];

  const columns: Column<CashierSalesReport>[] = [
    { 
      accessorKey: 'cashier_name', 
      header: 'Cashier',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-gray-500" />
          <span className="font-medium">{row.original.cashier_name}</span>
        </div>
      )
    },
    { 
      accessorKey: 'transaction_count', 
      header: 'Transactions',
      cell: ({ row }) => (
        <span className="font-mono">{row.original.transaction_count}</span>
      )
    },
    { 
      accessorKey: 'total_sales', 
      header: 'Total Sales',
      cell: ({ row }) => (
        <span className="font-mono text-green-600">
          ${row.original.total_sales.toFixed(2)}
        </span>
      )
    },
    { 
      accessorKey: 'total_returns', 
      header: 'Returns',
      cell: ({ row }) => (
        <span className="font-mono text-red-600">
          ${row.original.total_returns.toFixed(2)}
        </span>
      )
    },
    { 
      accessorKey: 'net_sales', 
      header: 'Net Sales',
      cell: ({ row }) => (
        <span className="font-mono font-semibold">
          ${row.original.net_sales.toFixed(2)}
        </span>
      )
    },
    { 
      accessorKey: 'average_transaction', 
      header: 'Avg Transaction',
      cell: ({ row }) => (
        <span className="font-mono">
          ${row.original.average_transaction.toFixed(2)}
        </span>
      )
    },
  ];

  const calculateTotals = () => {
    return report.reduce(
      (totals, item) => ({
        total_transactions: totals.total_transactions + item.transaction_count,
        total_sales: totals.total_sales + item.total_sales,
        total_returns: totals.total_returns + item.total_returns,
        net_sales: totals.net_sales + item.net_sales,
      }),
      {
        total_transactions: 0,
        total_sales: 0,
        total_returns: 0,
        net_sales: 0,
      }
    );
  };

  const totals = calculateTotals();

  const exportToCSV = () => {
    const headers = ['Cashier', 'Transactions', 'Total Sales', 'Returns', 'Net Sales', 'Average Transaction'];
    const csvData = report.map(item => [
      item.cashier_name,
      item.transaction_count,
      item.total_sales.toFixed(2),
      item.total_returns.toFixed(2),
      item.net_sales.toFixed(2),
      item.average_transaction.toFixed(2)
    ]);
    
    const csvContent = [headers, ...csvData]
      .map(row => row.join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cashier-sales-report-${dateRange.start.toISOString().split('T')[0]}-to-${dateRange.end.toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">Cashier Sales Report</h1>
          <p className="text-gray-600">Sales performance by cashier</p>
        </div>
        <Button
          onClick={exportToCSV}
          disabled={!report.length}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>
      
      <Card className="p-6">
        <DateRangePicker
          value={dateRange}
          onChange={setDateRange}
        />
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-600">Total Cashiers</div>
              <div className="text-2xl font-bold">{report.length}</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-600">Total Transactions</div>
              <div className="text-2xl font-bold">{totals.total_transactions}</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-600">Total Sales</div>
              <div className="text-2xl font-bold text-green-600">
                ${totals.total_sales.toFixed(2)}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-600">Net Sales</div>
              <div className="text-2xl font-bold text-purple-600">
                ${totals.net_sales.toFixed(2)}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Data Table */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Cashier Performance</h2>
          <div className="text-sm text-gray-500">
            {dateRange.start.toLocaleDateString()} - {dateRange.end.toLocaleDateString()}
          </div>
        </div>
        
        <DataTable
          columns={columns}
          data={report}
        />

        {report.length === 0 && !isLoading && (
          <div className="text-center py-8 text-gray-500">
            No sales data found for the selected date range.
          </div>
        )}

        {isLoading && (
          <div className="text-center py-8 text-gray-500">
            Loading report data...
          </div>
        )}
      </Card>

      {/* Summary Section */}
      {report.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Transactions:</span>
                <span className="font-mono">{totals.total_transactions}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Sales:</span>
                <span className="font-mono text-green-600">${totals.total_sales.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Returns:</span>
                <span className="font-mono text-red-600">${totals.total_returns.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-2">
                <span>Net Sales:</span>
                <span className="font-mono">${totals.net_sales.toFixed(2)}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Average per Cashier:</span>
                <span className="font-mono">
                  ${report.length > 0 ? (totals.net_sales / report.length).toFixed(2) : '0.00'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Average Transaction Size:</span>
                <span className="font-mono">
                  ${totals.total_transactions > 0 ? (totals.net_sales / totals.total_transactions).toFixed(2) : '0.00'}
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
