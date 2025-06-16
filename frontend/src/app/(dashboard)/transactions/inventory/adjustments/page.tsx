'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Eye } from 'lucide-react';
import { getInventoryTransactions } from '@/services/inventoryService';
import { safeCurrency, safeToFixed } from '@/lib/formatters';

export default function InventoryAdjustmentsPage() {
  const router = useRouter();
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });

  const { data: adjustments = [], isLoading } = useQuery({
    queryKey: ['inventory-adjustments', dateRange],
    queryFn: () => getInventoryTransactions({
      startDate: dateRange.from.toISOString().split('T')[0],
      endDate: dateRange.to.toISOString().split('T')[0]
    }),
  });

  const handleNewAdjustment = () => {
    router.push('/transactions/inventory/adjustments/new');
  };

  const handleViewAdjustment = (id: string) => {
    router.push(`/transactions/inventory/adjustments/${id}`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Inventory Adjustments</h1>
        <button
          onClick={handleNewAdjustment}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Adjustment
        </button>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Filter by Date Range</h3>
        <div className="flex gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={dateRange.from.toISOString().split('T')[0]}
              onChange={(e) => setDateRange(prev => ({
                ...prev,
                from: new Date(e.target.value)
              }))}
              className="border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={dateRange.to.toISOString().split('T')[0]}
              onChange={(e) => setDateRange(prev => ({
                ...prev,
                to: new Date(e.target.value)
              }))}
              className="border rounded-lg px-3 py-2"
            />
          </div>
        </div>
      </div>

      {/* Adjustments List */}
      <div className="bg-white rounded-lg shadow">
        {adjustments.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-500 mb-4">No inventory adjustments found</div>
            <button
              onClick={handleNewAdjustment}
              className="text-blue-600 hover:text-blue-800"
            >
              Create your first adjustment
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity Change
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Value Change
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {adjustments.map((adjustment: any) => (
                  <tr key={adjustment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {adjustment.reference || `ADJ-${adjustment.id}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(adjustment.transaction_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {adjustment.inventory_item?.item_code}
                        </div>
                        <div className="text-sm text-gray-500">
                          {adjustment.inventory_item?.description}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        (adjustment.quantity || 0) > 0 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {(adjustment.quantity || 0) > 0 ? '+' : ''}{adjustment.quantity || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`${
                        (adjustment.total_value || 0) > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {(adjustment.total_value || 0) > 0 ? '+' : ''}{safeCurrency(
                          typeof adjustment.total_value === 'number' 
                            ? adjustment.total_value 
                            : parseFloat(adjustment.total_value) || 0
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {adjustment.notes || 'No reason provided'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleViewAdjustment(adjustment.id)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
