'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Plus, ArrowLeftRight, Calendar, Package, Building2 } from 'lucide-react';
import { getInventoryTransactions } from '@/services/inventoryService';
import { usePermissions } from '@/hooks/usePermissions';
import { INV_TRANSACTIONS_ADJUST } from '@/lib/permissions';
import { formatDate, safeCurrency } from '@/lib/formatters';

export default function WarehouseTransfersPage() {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    endDate: new Date().toISOString().split('T')[0],
  });

  const { hasPermission } = usePermissions();

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['inventory-transactions', 'transfer', dateRange],
    queryFn: () => getInventoryTransactions({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    }),
  });

  // Group transfer transactions by reference document ID
  const transferGroups = transactions.reduce((groups: any, transaction: any) => {
    if (transaction.reference_document_type === 'WarehouseTransfer') {
      const key = transaction.reference_document_id || transaction.id;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(transaction);
    }
    return groups;
  }, {});

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Warehouse Transfers</h1>
          <p className="text-gray-600 mt-1">
            View and manage inventory transfers between warehouses
          </p>
        </div>
        {hasPermission(INV_TRANSACTIONS_ADJUST) && (
          <Link
            href="/transactions/inventory/transfers/new"
            className="inline-flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            <Plus className="h-4 w-4" />
            New Transfer
          </Link>
        )}
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium">Date Range:</span>
          </div>
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
            className="px-3 py-1 border rounded text-sm"
          />
          <span className="text-gray-500">to</span>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
            className="px-3 py-1 border rounded text-sm"
          />
        </div>
      </div>

      {/* Transfers List */}
      <div className="bg-white rounded-lg shadow">
        {Object.keys(transferGroups).length === 0 ? (
          <div className="p-8 text-center">
            <ArrowLeftRight className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No transfers found</h3>
            <p className="text-gray-500 mb-4">
              No warehouse transfers found for the selected date range.
            </p>
            {hasPermission(INV_TRANSACTIONS_ADJUST) && (
              <Link
                href="/transactions/inventory/transfers/new"
                className="inline-flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
              >
                <Plus className="h-4 w-4" />
                Create First Transfer
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y">
            {Object.entries(transferGroups).map(([groupId, groupTransactions]: [string, any]) => {
              const outTransaction = groupTransactions.find((t: any) => t.quantity < 0);
              const inTransaction = groupTransactions.find((t: any) => t.quantity > 0);
              
              if (!outTransaction || !inTransaction) return null;

              return (
                <div key={groupId} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Header */}
                      <div className="flex items-center gap-3 mb-3">
                        <ArrowLeftRight className="h-5 w-5 text-blue-500" />
                        <div>
                          <h3 className="font-medium">
                            {outTransaction.item?.item_code} - {outTransaction.item?.description}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Transfer #{outTransaction.id} • {formatDate(outTransaction.transaction_date)}
                          </p>
                        </div>
                      </div>

                      {/* Transfer Details */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* From Warehouse */}
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">From</p>
                            <p className="text-sm text-gray-600">{outTransaction.warehouse?.name}</p>
                          </div>
                        </div>

                        {/* To Warehouse */}
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">To</p>
                            <p className="text-sm text-gray-600">{inTransaction.warehouse?.name}</p>
                          </div>
                        </div>

                        {/* Quantity & Value */}
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {Math.abs(outTransaction.quantity)} units
                            </p>
                            <p className="text-sm text-gray-600">
                              {safeCurrency(Math.abs(outTransaction.total_value))} value
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Notes */}
                      {outTransaction.notes && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-md">
                          <p className="text-sm text-gray-700">{outTransaction.notes}</p>
                        </div>
                      )}
                    </div>

                    {/* Status Badge */}
                    <div className="ml-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Completed
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {Object.keys(transferGroups).length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total Transfers</h3>
            <p className="text-2xl font-bold text-gray-900">{Object.keys(transferGroups).length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total Value Transferred</h3>
            <p className="text-2xl font-bold text-gray-900">
              {safeCurrency(
                Object.values(transferGroups).reduce((total: number, group: any) => {
                  const outTransaction = group.find((t: any) => t.quantity < 0);
                  return total + (outTransaction ? Math.abs(outTransaction.total_value) : 0);
                }, 0)
              )}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Average Transfer Value</h3>
            <p className="text-2xl font-bold text-gray-900">
              {safeCurrency(
                Object.values(transferGroups).reduce((total: number, group: any) => {
                  const outTransaction = group.find((t: any) => t.quantity < 0);
                  return total + (outTransaction ? Math.abs(outTransaction.total_value) : 0);
                }, 0) / Object.keys(transferGroups).length
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
