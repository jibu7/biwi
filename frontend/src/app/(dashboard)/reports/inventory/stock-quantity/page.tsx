'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { getStockQuantities, getWarehouses } from '@/services/inventoryService';

export default function StockQuantityReportPage() {
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | undefined>(undefined);

  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => getWarehouses(),
  });

  const { data: stockQuantities = [], isLoading } = useQuery({
    queryKey: ['stock-quantities', selectedWarehouse],
    queryFn: () => getStockQuantities(selectedWarehouse),
  });

  const handleExport = () => {
    // Convert to CSV
    const headers = ['Item Code', 'Description', 'Warehouse', 'On Hand', 'Committed', 'On Order', 'Available'];
    const rows = stockQuantities.map(item => [
      item.item_code,
      item.description,
      item.warehouse_name,
      item.quantity_on_hand,
      item.quantity_committed,
      item.quantity_on_order,
      item.available_quantity,
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock-quantity-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const totalValue = stockQuantities.reduce((sum, item) => sum + (item.quantity_on_hand * 1), 0); // Note: We'd need average cost for actual value

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Stock Quantity Report</h1>
        <button
          onClick={handleExport}
          className="bg-green-500 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-green-600"
        >
          <Download size={20} />
          Export CSV
        </button>
      </div>

      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Warehouse Filter
            </label>
            <select
              value={selectedWarehouse || ''}
              onChange={(e) => setSelectedWarehouse(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">All Warehouses</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Item Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Warehouse
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                On Hand
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Committed
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                On Order
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Available
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {stockQuantities.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {item.item_code}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.description}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.warehouse_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  {item.quantity_on_hand.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                  {item.quantity_committed.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                  {item.quantity_on_order.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600 text-right">
                  {item.available_quantity.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td colSpan={3} className="px-6 py-3 text-sm font-medium text-gray-900">
                Total Items: {stockQuantities.length}
              </td>
              <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                {stockQuantities.reduce((sum, item) => sum + item.quantity_on_hand, 0).toFixed(2)}
              </td>
              <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                {stockQuantities.reduce((sum, item) => sum + item.quantity_committed, 0).toFixed(2)}
              </td>
              <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                {stockQuantities.reduce((sum, item) => sum + item.quantity_on_order, 0).toFixed(2)}
              </td>
              <td className="px-6 py-3 text-right text-sm font-medium text-green-600">
                {stockQuantities.reduce((sum, item) => sum + item.available_quantity, 0).toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
