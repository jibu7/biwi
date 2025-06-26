'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, DollarSign } from 'lucide-react';
import { getInventoryValuation, getWarehouses } from '@/services/inventoryService';
import { safeCurrency, safeQuantity, safeSum } from '@/lib/formatters';

export default function InventoryValuationReportPage() {
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | undefined>(undefined);
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => getWarehouses(),
  });

  const { data: valuationItems = [], isLoading, error } = useQuery({
    queryKey: ['inventory-valuation-v3', selectedWarehouse, asOfDate],
    queryFn: () => getInventoryValuation(selectedWarehouse, asOfDate),
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const handleExport = () => {
    // Convert to CSV
    const headers = ['Item Code', 'Description', 'Warehouse', 'Quantity', 'Average Cost', 'Total Value'];
    const rows = valuationItems.map(item => [
      item.item_code,
      item.description,
      item.warehouse_name,
      safeQuantity(typeof item.quantity_on_hand === 'number' ? item.quantity_on_hand : parseFloat(item.quantity_on_hand) || 0),
      safeCurrency(typeof item.average_cost === 'number' ? item.average_cost : parseFloat(item.average_cost) || 0),
      safeCurrency(typeof item.total_value === 'number' ? item.total_value : parseFloat(item.total_value) || 0),
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-valuation-${asOfDate}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const validTotalValues = valuationItems.map(item => {
    const value = item.total_value;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value) || 0;
    return 0;
  });
  const validQuantities = valuationItems.map(item => {
    const quantity = item.quantity_on_hand;
    if (typeof quantity === 'number') return quantity;
    if (typeof quantity === 'string') return parseFloat(quantity) || 0;
    return 0;
  });
  const totalValue = safeSum(validTotalValues);
  const totalQuantity = safeSum(validQuantities);

  if (isLoading) return <div>Loading...</div>;

  // DEBUG: Show error information
  if (error) {
    return (
      <div className="container mx-auto py-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h3 className="text-red-800 font-medium">API Error</h3>
          <p className="text-red-700 text-sm mt-1">
            {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Inventory Valuation Report</h1>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              As of Date
            </label>
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Inventory Value</p>
              <p className="text-2xl font-semibold text-gray-900">${totalValue.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="ml-4">
            <p className="text-sm text-gray-600">Total Items</p>
            <p className="text-2xl font-semibold text-gray-900">{valuationItems.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="ml-4">
            <p className="text-sm text-gray-600">Total Quantity</p>
            <p className="text-2xl font-semibold text-gray-900">{totalQuantity.toFixed(2)}</p>
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
                Quantity
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Average Cost
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Value
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {valuationItems.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {item.item_code}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {item.description}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.warehouse_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  {safeQuantity(typeof item.quantity_on_hand === 'number' ? item.quantity_on_hand : parseFloat(item.quantity_on_hand) || 0)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                  {safeCurrency(typeof item.average_cost === 'number' ? item.average_cost : parseFloat(item.average_cost) || 0)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600 text-right">
                  {safeCurrency(typeof item.total_value === 'number' ? item.total_value : parseFloat(item.total_value) || 0)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td colSpan={3} className="px-6 py-3 text-sm font-medium text-gray-900">
                Totals ({valuationItems.length} items)
              </td>
              <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                {totalQuantity.toFixed(2)}
              </td>
              <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                -
              </td>
              <td className="px-6 py-3 text-right text-sm font-medium text-green-600">
                ${totalValue.toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {valuationItems.length === 0 && (
        <div className="text-center py-12">
          <DollarSign size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No inventory found</h3>
          <p className="text-gray-500">
            No items with stock found for the selected criteria.
          </p>
        </div>
      )}

      <div className="mt-6 bg-blue-50 p-4 rounded-md">
        <h4 className="text-sm font-medium text-blue-800 mb-2">About This Report</h4>
        <p className="text-sm text-blue-700">
          This report shows the total value of inventory on hand as of the selected date. 
          Values are calculated using the average cost method. Only items with positive 
          quantities are included in the report.
        </p>
      </div>
    </div>
  );
}
