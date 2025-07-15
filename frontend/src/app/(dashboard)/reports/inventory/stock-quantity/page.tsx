'use client';


import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, Package, Filter, TrendingUp, DollarSign, BarChart3 } from 'lucide-react';
import { getStockQuantities, getWarehouses } from '@/services/inventoryService';
import { safeQuantity, safeSum, safeToFixed, safeCurrency, calculateCostValue, getCostTypeDisplayName, getUnitCost } from '@/lib/formatters';

export default function StockQuantityReportPage() {
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | undefined>(undefined);
  const [costType, setCostType] = useState<'average' | 'standard' | 'selling'>('average');
  const [filterByValue, setFilterByValue] = useState<boolean>(false);
  const [minValue, setMinValue] = useState<number>(0);
  const [showZeroStock, setShowZeroStock] = useState<boolean>(true);
  const [sortBy, setSortBy] = useState<'item_code' | 'description' | 'value' | 'quantity'>('item_code');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => getWarehouses(),
  });

  const { data: stockQuantities = [], isLoading } = useQuery({
    queryKey: ['stock-quantities-v2', selectedWarehouse], // Changed key to force refresh
    queryFn: () => getStockQuantities(selectedWarehouse),
  });

  // Filter and sort data
  const filteredAndSortedData = stockQuantities
    .filter(item => {
      // Filter by zero stock
      if (!showZeroStock && item.quantity_on_hand <= 0) return false;
      
      // Filter by minimum value
      if (filterByValue) {
        const itemValue = calculateCostValue(item, costType, item.quantity_on_hand);
        if (itemValue < minValue) return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'item_code':
          aValue = a.item_code.toLowerCase();
          bValue = b.item_code.toLowerCase();
          break;
        case 'description':
          aValue = a.description.toLowerCase();
          bValue = b.description.toLowerCase();
          break;
        case 'value':
          aValue = calculateCostValue(a, costType, a.quantity_on_hand);
          bValue = calculateCostValue(b, costType, b.quantity_on_hand);
          break;
        case 'quantity':
          aValue = a.quantity_on_hand;
          bValue = b.quantity_on_hand;
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  const handleExport = () => {
    // Convert to CSV with cost information
    const headers = ['Item Code', 'Description', 'Warehouse', 'On Hand', 'Committed', 'On Order', 'Available', `Unit Cost (${getCostTypeDisplayName(costType)})`, 'Total Value'];
    const rows = filteredAndSortedData.map(item => [
      item.item_code,
      item.description,
      item.warehouse_name,
      safeQuantity(typeof item.quantity_on_hand === 'number' ? item.quantity_on_hand : null),
      safeQuantity(typeof item.quantity_committed === 'number' ? item.quantity_committed : null),
      safeQuantity(typeof item.quantity_on_order === 'number' ? item.quantity_on_order : null),
      safeQuantity(typeof item.available_quantity === 'number' ? item.available_quantity : null),
      safeToFixed(getUnitCost(item, costType)),
      safeToFixed(calculateCostValue(item, costType, item.quantity_on_hand)),
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock-quantity-${getCostTypeDisplayName(costType).toLowerCase().replace(' ', '-')}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Calculate summary statistics
  const totalItems = filteredAndSortedData.length;
  const totalQuantity = safeSum(filteredAndSortedData.map(item => item.quantity_on_hand));
  const totalValue = safeSum(filteredAndSortedData.map(item => calculateCostValue(item, costType, item.quantity_on_hand)));
  const totalAvailableQuantity = safeSum(filteredAndSortedData.map(item => item.available_quantity));
  const totalCommittedQuantity = safeSum(filteredAndSortedData.map(item => item.quantity_committed));
  const averageValue = totalItems > 0 ? totalValue / totalItems : 0;

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Advanced Stock Quantity Report</h1>
          <p className="text-gray-600 mt-1">
            Cost Type: <span className="font-semibold text-blue-600">{getCostTypeDisplayName(costType)}</span>
          </p>
        </div>
        <button
          onClick={handleExport}
          className="bg-green-500 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-green-600"
        >
          <Download size={20} />
          Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center">
            <BarChart3 className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Quantity</p>
              <p className="text-2xl font-bold text-gray-900">{safeToFixed(totalQuantity)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-purple-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">{safeCurrency(totalValue)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-orange-500">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-orange-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg. Item Value</p>
              <p className="text-2xl font-bold text-gray-900">{safeCurrency(averageValue)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="mb-6 bg-white p-6 rounded-lg shadow">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-medium text-gray-900">Filters & Options</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Warehouse Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Warehouse
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

          {/* Cost Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cost Type
            </label>
            <select
              value={costType}
              onChange={(e) => setCostType(e.target.value as 'average' | 'standard' | 'selling')}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="average">Average Cost</option>
              <option value="standard">Standard Cost</option>
              <option value="selling">Selling Price</option>
            </select>
          </div>

          {/* Sort Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort By
            </label>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field as any);
                setSortOrder(order as 'asc' | 'desc');
              }}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="item_code-asc">Item Code (A-Z)</option>
              <option value="item_code-desc">Item Code (Z-A)</option>
              <option value="description-asc">Description (A-Z)</option>
              <option value="description-desc">Description (Z-A)</option>
              <option value="quantity-desc">Quantity (High-Low)</option>
              <option value="quantity-asc">Quantity (Low-High)</option>
              <option value="value-desc">Value (High-Low)</option>
              <option value="value-asc">Value (Low-High)</option>
            </select>
          </div>

          {/* Value Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Value Filter
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={minValue}
                onChange={(e) => setMinValue(Number(e.target.value))}
                className="flex-1 px-3 py-2 border rounded-md"
                placeholder="0.00"
                step="0.01"
              />
              <button
                onClick={() => setFilterByValue(!filterByValue)}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  filterByValue 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {filterByValue ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        </div>

        {/* Toggle Options */}
        <div className="mt-4 flex gap-6">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showZeroStock}
              onChange={(e) => setShowZeroStock(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-700">Show Zero Stock Items</span>
          </label>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed">
            <colgroup>
              <col className="w-28" />
              <col className="w-64" />
              <col className="w-32" />
              <col className="w-20" />
              <col className="w-24" />
              <col className="w-20" />
              <col className="w-20" />
              <col className="w-24" />
              <col className="w-28" />
            </colgroup>
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item Code
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Warehouse
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  On Hand
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Committed
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  On Order
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Available
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit Cost
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Value
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedData.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.item_code}
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-500">
                    <div 
                      className="truncate max-w-full cursor-help" 
                      title={item.description}
                    >
                      {item.description}
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.warehouse_name}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {safeQuantity(item.quantity_on_hand)}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                    {safeQuantity(item.quantity_committed)}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                    {safeQuantity(item.quantity_on_order)}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-green-600 text-right">
                    {safeQuantity(item.available_quantity)}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {safeCurrency(getUnitCost(item, costType))}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm font-bold text-blue-600 text-right">
                    {safeCurrency(calculateCostValue(item, costType, item.quantity_on_hand))}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={3} className="px-3 py-3 text-sm font-medium text-gray-900">
                  Total Items: {totalItems} | Qty: {safeToFixed(totalQuantity)} | Available: {safeToFixed(totalAvailableQuantity)}
                </td>
                <td className="px-3 py-3 text-right text-sm font-medium text-gray-900">
                  {safeToFixed(safeSum(filteredAndSortedData.map(item => item.quantity_on_hand)))}
                </td>
                <td className="px-3 py-3 text-right text-sm font-medium text-gray-900">
                  {safeToFixed(safeSum(filteredAndSortedData.map(item => item.quantity_committed)))}
                </td>
                <td className="px-3 py-3 text-right text-sm font-medium text-gray-900">
                  {safeToFixed(safeSum(filteredAndSortedData.map(item => item.quantity_on_order)))}
                </td>
                <td className="px-3 py-3 text-right text-sm font-medium text-green-600">
                  {safeToFixed(safeSum(filteredAndSortedData.map(item => item.available_quantity)))}
                </td>
                <td className="px-3 py-3 text-right text-sm font-medium text-gray-900">
                  Avg: {safeCurrency(totalItems > 0 ? safeSum(filteredAndSortedData.map(item => getUnitCost(item, costType))) / totalItems : 0)}
                </td>
                <td className="px-3 py-3 text-right text-sm font-bold text-blue-600">
                  {safeCurrency(totalValue)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
