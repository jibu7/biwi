'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Search, Filter, Download, RefreshCw } from 'lucide-react';
import { getInventoryTransactions, getInventoryItems, getWarehouses } from '@/services/inventoryService';
import { usePermissions } from '@/hooks/usePermissions';
import { INV_REPORTS_VIEW } from '@/lib/permissions';

export default function InventoryHistoryPage() {
  const { hasPermission } = usePermissions();
  const [filters, setFilters] = useState({
    itemId: '',
    warehouseId: '',
    startDate: '',
    endDate: '',
    transactionType: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const { data: transactions = [], isLoading, error, refetch } = useQuery({
    queryKey: ['inventory-transactions', filters],
    queryFn: () => getInventoryTransactions({
      itemId: filters.itemId ? parseInt(filters.itemId) : undefined,
      warehouseId: filters.warehouseId ? parseInt(filters.warehouseId) : undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
      skip: 0,
      limit: 1000,
    }),
    enabled: hasPermission(INV_REPORTS_VIEW),
  });

  const { data: items = [] } = useQuery({
    queryKey: ['inventory-items'],
    queryFn: () => getInventoryItems(),
    enabled: hasPermission(INV_REPORTS_VIEW),
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => getWarehouses(),
    enabled: hasPermission(INV_REPORTS_VIEW),
  });

  if (!hasPermission(INV_REPORTS_VIEW)) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to view inventory reports.</p>
        </div>
      </div>
    );
  }

  const filteredTransactions = transactions.filter(transaction => {
    const item = items.find(i => i.id === transaction.item_id);
    const warehouse = warehouses.find(w => w.id === transaction.warehouse_id);
    
    const matchesSearch = 
      item?.item_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item?.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      warehouse?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.reference_document_type?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      itemId: '',
      warehouseId: '',
      startDate: '',
      endDate: '',
      transactionType: '',
    });
    setSearchTerm('');
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Item Code', 'Description', 'Warehouse', 'Transaction Type', 'Quantity', 'Unit Cost', 'Reference'];
    const csvData = filteredTransactions.map(transaction => {
      const item = items.find(i => i.id === transaction.item_id);
      const warehouse = warehouses.find(w => w.id === transaction.warehouse_id);
      
      return [
        format(new Date(transaction.transaction_date), 'yyyy-MM-dd'),
        item?.item_code || '',
        item?.description || '',
        warehouse?.name || '',
        transaction.reference_document_type || 'Adjustment',
        transaction.quantity.toString(),
        transaction.unit_cost?.toString() || '0',
        transaction.reference_document_id?.toString() || '',
      ];
    });

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inventory-history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) return <div className="container mx-auto py-6">Loading transactions...</div>;
  if (error) return <div className="container mx-auto py-6">Error loading transactions</div>;

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Inventory Transaction History</h1>
        <div className="flex gap-2">
          <button
            onClick={() => refetch()}
            className="bg-gray-500 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-gray-600"
          >
            <RefreshCw size={20} />
            Refresh
          </button>
          <button
            onClick={exportToCSV}
            className="bg-green-500 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-green-600"
          >
            <Download size={20} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by item code, description, warehouse, or reference..."
                className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="bg-blue-500 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-blue-600"
          >
            <Filter size={20} />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item</label>
              <select
                value={filters.itemId}
                onChange={(e) => handleFilterChange('itemId', e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Items</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.item_code} - {item.description}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse</label>
              <select
                value={filters.warehouseId}
                onChange={(e) => handleFilterChange('warehouseId', e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
              <select
                value={filters.transactionType}
                onChange={(e) => handleFilterChange('transactionType', e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="adjustment">Adjustment</option>
                <option value="transfer">Transfer</option>
                <option value="count">Count Variance</option>
                <option value="receipt">Receipt</option>
                <option value="issue">Issue</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Total Transactions</h3>
          <p className="text-2xl font-bold text-blue-600">{filteredTransactions.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Positive Adjustments</h3>
          <p className="text-2xl font-bold text-green-600">
            {filteredTransactions.filter(t => t.quantity > 0 && t.reference_document_type !== 'TRANSFER').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Negative Adjustments</h3>
          <p className="text-2xl font-bold text-red-600">
            {filteredTransactions.filter(t => t.quantity < 0 && t.reference_document_type !== 'TRANSFER').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Transfers</h3>
          <p className="text-2xl font-bold text-purple-600">
            {filteredTransactions.filter(t => t.reference_document_type === 'TRANSFER').length}
          </p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Warehouse
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transaction Type
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit Cost
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reference
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => {
                const item = items.find(i => i.id === transaction.item_id);
                const warehouse = warehouses.find(w => w.id === transaction.warehouse_id);
                
                return (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(transaction.transaction_date), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {item?.item_code || `Item ${transaction.item_id}`}
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-48">
                          {item?.description || 'Unknown Item'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {warehouse?.name || `Warehouse ${transaction.warehouse_id}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        transaction.quantity > 0 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {transaction.reference_document_type || 'Adjustment'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-mono">
                      <span className={transaction.quantity > 0 ? 'text-green-600' : 'text-red-600'}>
                        {transaction.quantity > 0 ? '+' : ''}{transaction.quantity.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-mono">
                      ${(transaction.unit_cost || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-mono">
                      <span className={transaction.quantity > 0 ? 'text-green-600' : 'text-red-600'}>
                        ${((transaction.unit_cost || 0) * Math.abs(transaction.quantity)).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.reference_document_id ? `#${transaction.reference_document_id}` : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredTransactions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No transactions found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
