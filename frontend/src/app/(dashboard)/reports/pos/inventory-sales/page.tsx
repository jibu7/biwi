'use client';


import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { posService } from '@/services/posService';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DataTable, Column } from '@/components/ui/data-table';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InventorySalesReport } from '@/types/pos';
import { Download, Package, TrendingUp, DollarSign, Hash } from 'lucide-react';

export default function InventorySalesReportPage() {
  const [dateRange, setDateRange] = useState({
    start: new Date(),
    end: new Date(),
  });

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['pos-inventory-sales', dateRange],
    queryFn: () => posService.getInventorySalesReport(
      dateRange.start.toISOString().split('T')[0],
      dateRange.end.toISOString().split('T')[0]
    ),
  });

  const report = reportData?.data || [];

  const columns: Column<InventorySalesReport>[] = [
    { 
      accessorKey: 'inventory_item_code', 
      header: 'Item Code',
      cell: ({ row }) => (
        <span className="font-mono font-medium">{row.original.inventory_item_code}</span>
      )
    },
    { 
      accessorKey: 'inventory_item_name', 
      header: 'Item Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-gray-500" />
          <span>{row.original.inventory_item_name}</span>
        </div>
      )
    },
    { 
      accessorKey: 'quantity_sold', 
      header: 'Qty Sold',
      cell: ({ row }) => (
        <span className="font-mono">{row.original.quantity_sold}</span>
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
      accessorKey: 'average_price', 
      header: 'Avg Price',
      cell: ({ row }) => (
        <span className="font-mono">
          ${row.original.average_price.toFixed(2)}
        </span>
      )
    },
  ];

  const calculateTotals = () => {
    return report.reduce(
      (totals, item) => ({
        total_items: totals.total_items + 1,
        total_quantity: totals.total_quantity + item.quantity_sold,
        total_sales: totals.total_sales + item.total_sales,
      }),
      {
        total_items: 0,
        total_quantity: 0,
        total_sales: 0,
      }
    );
  };

  const totals = calculateTotals();

  // Sort report by total sales descending
  const sortedReport = [...report].sort((a, b) => b.total_sales - a.total_sales);

  const exportToCSV = () => {
    const headers = ['Item Code', 'Item Name', 'Quantity Sold', 'Total Sales', 'Average Price'];
    const csvData = report.map(item => [
      item.inventory_item_code,
      item.inventory_item_name,
      item.quantity_sold,
      item.total_sales.toFixed(2),
      item.average_price.toFixed(2)
    ]);
    
    const csvContent = [headers, ...csvData]
      .map(row => row.join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-sales-report-${dateRange.start.toISOString().split('T')[0]}-to-${dateRange.end.toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Get top selling items
  const topSellingItems = sortedReport.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">Inventory Sales Report</h1>
          <p className="text-gray-600">Sales performance by inventory item</p>
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
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-600">Items Sold</div>
              <div className="text-2xl font-bold">{totals.total_items}</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Hash className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-600">Total Quantity</div>
              <div className="text-2xl font-bold">{totals.total_quantity}</div>
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
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-600">Avg per Item</div>
              <div className="text-2xl font-bold text-purple-600">
                ${totals.total_items > 0 ? (totals.total_sales / totals.total_items).toFixed(2) : '0.00'}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Top Selling Items */}
      {topSellingItems.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Top Selling Items</h2>
          <div className="space-y-3">
            {topSellingItems.map((item, index) => (
              <div key={item.inventory_item_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                  </div>
                  <div>
                    <div className="font-medium">{item.inventory_item_name}</div>
                    <div className="text-sm text-gray-600">{item.inventory_item_code}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">${item.total_sales.toFixed(2)}</div>
                  <div className="text-sm text-gray-600">{item.quantity_sold} units</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Data Table */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Item Sales Details</h2>
          <div className="text-sm text-gray-500">
            {dateRange.start.toLocaleDateString()} - {dateRange.end.toLocaleDateString()}
          </div>
        </div>
        
        <DataTable
          columns={columns}
          data={sortedReport}
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
                <span>Unique Items Sold:</span>
                <span className="font-mono">{totals.total_items}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Quantity Sold:</span>
                <span className="font-mono">{totals.total_quantity}</span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-2">
                <span>Total Sales:</span>
                <span className="font-mono text-green-600">${totals.total_sales.toFixed(2)}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Average per Item:</span>
                <span className="font-mono">
                  ${totals.total_items > 0 ? (totals.total_sales / totals.total_items).toFixed(2) : '0.00'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Average per Unit:</span>
                <span className="font-mono">
                  ${totals.total_quantity > 0 ? (totals.total_sales / totals.total_quantity).toFixed(2) : '0.00'}
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
