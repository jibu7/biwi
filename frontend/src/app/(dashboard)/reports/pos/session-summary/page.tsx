'use client';


import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { posService } from '@/services/posService';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DataTable, Column } from '@/components/ui/data-table';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { POSSession } from '@/types/pos';
import { Download, Clock, MapPin, User, DollarSign } from 'lucide-react';

interface SessionSummaryData extends POSSession {
  total_transactions?: number;
  total_sales?: number;
  total_returns?: number;
  net_sales?: number;
  session_duration?: string;
}

export default function SessionSummaryReportPage() {
  const [dateRange, setDateRange] = useState({
    start: new Date(),
    end: new Date(),
  });

  // Note: This would need to be implemented in the backend
  const { data: reportData, isLoading } = useQuery({
    queryKey: ['pos-session-summary', dateRange],
    queryFn: async () => {
      // For now, we'll use the getTills endpoint as a placeholder
      // In a real implementation, you would have a dedicated session summary endpoint
      const response = await posService.getTills();
      return { data: [] }; // Return empty data for now
    },
  });

  const report: SessionSummaryData[] = reportData?.data || [];

  const columns: Column<SessionSummaryData>[] = [
    { 
      accessorKey: 'id', 
      header: 'Session ID',
      cell: ({ row }) => (
        <span className="font-mono">#{row.original.id}</span>
      )
    },
    { 
      accessorKey: 'till_name', 
      header: 'Till',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-gray-500" />
          <span>{row.original.till_name}</span>
        </div>
      )
    },
    { 
      accessorKey: 'cashier_name', 
      header: 'Cashier',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-gray-500" />
          <span>{row.original.cashier_name}</span>
        </div>
      )
    },
    { 
      accessorKey: 'opened_at', 
      header: 'Opened',
      cell: ({ row }) => (
        <span className="font-mono text-sm">
          {new Date(row.original.opened_at).toLocaleString()}
        </span>
      )
    },
    { 
      accessorKey: 'closed_at', 
      header: 'Closed',
      cell: ({ row }) => (
        <span className="font-mono text-sm">
          {row.original.closed_at 
            ? new Date(row.original.closed_at).toLocaleString()
            : <span className="text-green-600">Active</span>
          }
        </span>
      )
    },
    { 
      accessorKey: 'opening_cash_amount', 
      header: 'Opening Cash',
      cell: ({ row }) => (
        <span className="font-mono">
          ${row.original.opening_cash_amount.toFixed(2)}
        </span>
      )
    },
    { 
      accessorKey: 'closing_cash_amount', 
      header: 'Closing Cash',
      cell: ({ row }) => (
        <span className="font-mono">
          {row.original.closing_cash_amount 
            ? `$${row.original.closing_cash_amount.toFixed(2)}`
            : '-'
          }
        </span>
      )
    },
    { 
      accessorKey: 'cash_variance', 
      header: 'Variance',
      cell: ({ row }) => (
        <span className={`font-mono ${
          row.original.cash_variance 
            ? row.original.cash_variance === 0 
              ? 'text-green-600' 
              : row.original.cash_variance > 0 
                ? 'text-blue-600' 
                : 'text-red-600'
            : ''
        }`}>
          {row.original.cash_variance !== null && row.original.cash_variance !== undefined
            ? `$${row.original.cash_variance.toFixed(2)}`
            : '-'
          }
        </span>
      )
    },
    { 
      accessorKey: 'net_sales', 
      header: 'Net Sales',
      cell: ({ row }) => (
        <span className="font-mono font-semibold text-green-600">
          {row.original.net_sales 
            ? `$${row.original.net_sales.toFixed(2)}`
            : '$0.00'
          }
        </span>
      )
    },
  ];

  const calculateTotals = () => {
    return report.reduce(
      (totals, session) => ({
        total_sessions: totals.total_sessions + 1,
        total_opening_cash: totals.total_opening_cash + session.opening_cash_amount,
        total_closing_cash: totals.total_closing_cash + (session.closing_cash_amount || 0),
        total_variance: totals.total_variance + (session.cash_variance || 0),
        total_sales: totals.total_sales + (session.net_sales || 0),
      }),
      {
        total_sessions: 0,
        total_opening_cash: 0,
        total_closing_cash: 0,
        total_variance: 0,
        total_sales: 0,
      }
    );
  };

  const totals = calculateTotals();

  const exportToCSV = () => {
    const headers = [
      'Session ID', 'Till', 'Cashier', 'Opened', 'Closed', 
      'Opening Cash', 'Closing Cash', 'Variance', 'Net Sales'
    ];
    const csvData = report.map(session => [
      session.id,
      session.till_name || '',
      session.cashier_name || '',
      new Date(session.opened_at).toLocaleString(),
      session.closed_at ? new Date(session.closed_at).toLocaleString() : 'Active',
      session.opening_cash_amount.toFixed(2),
      session.closing_cash_amount ? session.closing_cash_amount.toFixed(2) : '',
      session.cash_variance !== null && session.cash_variance !== undefined ? session.cash_variance.toFixed(2) : '',
      session.net_sales ? session.net_sales.toFixed(2) : '0.00'
    ]);
    
    const csvContent = [headers, ...csvData]
      .map(row => row.join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `session-summary-report-${dateRange.start.toISOString().split('T')[0]}-to-${dateRange.end.toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const activeSessions = report.filter(session => !session.closed_at);
  const closedSessions = report.filter(session => session.closed_at);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">Session Summary Report</h1>
          <p className="text-gray-600">Overview of POS sessions and cash management</p>
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
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-600">Total Sessions</div>
              <div className="text-2xl font-bold">{totals.total_sessions}</div>
              <div className="text-xs text-gray-500">
                {activeSessions.length} active, {closedSessions.length} closed
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-600">Opening Cash</div>
              <div className="text-2xl font-bold">
                ${totals.total_opening_cash.toFixed(2)}
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
              <div className="text-sm font-medium text-gray-600">Total Sales</div>
              <div className="text-2xl font-bold text-green-600">
                ${totals.total_sales.toFixed(2)}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              totals.total_variance === 0 
                ? 'bg-green-100' 
                : totals.total_variance > 0 
                  ? 'bg-blue-100' 
                  : 'bg-red-100'
            }`}>
              <DollarSign className={`h-5 w-5 ${
                totals.total_variance === 0 
                  ? 'text-green-600' 
                  : totals.total_variance > 0 
                    ? 'text-blue-600' 
                    : 'text-red-600'
              }`} />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-600">Cash Variance</div>
              <div className={`text-2xl font-bold ${
                totals.total_variance === 0 
                  ? 'text-green-600' 
                  : totals.total_variance > 0 
                    ? 'text-blue-600' 
                    : 'text-red-600'
              }`}>
                ${totals.total_variance.toFixed(2)}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Active Sessions Alert */}
      {activeSessions.length > 0 && (
        <Card className="p-4 border-orange-200 bg-orange-50">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-orange-600" />
            <div>
              <div className="font-medium text-orange-800">
                {activeSessions.length} Active Session{activeSessions.length > 1 ? 's' : ''}
              </div>
              <div className="text-sm text-orange-700">
                {activeSessions.map(session => 
                  `${session.till_name} (${session.cashier_name})`
                ).join(', ')}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Data Table */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Session Details</h2>
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
            No session data found for the selected date range.
            <div className="text-sm mt-2">
              This report requires backend implementation of session summary endpoint.
            </div>
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
                <span>Total Sessions:</span>
                <span className="font-mono">{totals.total_sessions}</span>
              </div>
              <div className="flex justify-between">
                <span>Active Sessions:</span>
                <span className="font-mono text-orange-600">{activeSessions.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Closed Sessions:</span>
                <span className="font-mono text-green-600">{closedSessions.length}</span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-2">
                <span>Total Sales:</span>
                <span className="font-mono text-green-600">${totals.total_sales.toFixed(2)}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Opening Cash:</span>
                <span className="font-mono">${totals.total_opening_cash.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Closing Cash:</span>
                <span className="font-mono">${totals.total_closing_cash.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Cash Variance:</span>
                <span className={`font-mono ${
                  totals.total_variance === 0 
                    ? 'text-green-600' 
                    : totals.total_variance > 0 
                      ? 'text-blue-600' 
                      : 'text-red-600'
                }`}>
                  ${totals.total_variance.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
