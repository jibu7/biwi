'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  Eye, 
  Calendar,
  DollarSign,
  User,
  FileText,
  ArrowUpDown
} from 'lucide-react';
import { ARAllocation } from '@/types/ar';
import { arAllocationService } from '@/services/arService';
import { usePermissions } from '@/hooks/usePermissions';
import { AR_TRANSACTIONS_POST, AR_REPORTS_VIEW } from '@/lib/permissions';

export default function ARAllocationsPage() {
  const { hasPermission } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: allocations = [], isLoading, error, refetch } = useQuery({
    queryKey: ['ar-allocations'],
    queryFn: () => arAllocationService.getAll(),
    enabled: hasPermission(AR_REPORTS_VIEW),
  });

  // Compute filtered allocations directly in render instead of using useEffect
  const filteredAllocations = allocations.filter((allocation: ARAllocation) =>
    allocation.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    allocation.id.toString().includes(searchTerm)
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getTotalAllocated = (allocation: ARAllocation) => {
    return allocation.lines.reduce((sum, line) => sum + line.allocated_amount, 0);
  };

  if (!hasPermission(AR_REPORTS_VIEW)) {
    return (
      <div className="p-6">
        <div className="text-center">
          <ArrowUpDown className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">Access Denied</h3>
          <p className="mt-1 text-sm text-gray-500">
            You don&apos;t have permission to view AR allocations.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center">
          <ArrowUpDown className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">Error</h3>
          <p className="mt-1 text-sm text-gray-500">
            Failed to load allocations. Please try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">AR Allocations</h1>
          <p className="text-gray-700">
            View and manage payment allocations to invoices
          </p>
        </div>
        {hasPermission(AR_TRANSACTIONS_POST) && (
          <Link
            href="/transactions/ar/allocations/new"
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-600/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Allocation
          </Link>
        )}
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
          <input
            type="text"
            placeholder="Search allocations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-10 py-2 text-sm ring-offset-background placeholder:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>
      </div>

      {/* Information Panel */}
      <div className="rounded-lg border p-4 bg-amber-50">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center">
              <ArrowUpDown className="h-3 w-3 text-amber-600" />
            </div>
          </div>
          <div className="text-sm">
            <p className="font-medium text-amber-900">Why Allocations Are Critical:</p>
            <div className="text-amber-800 mt-1 space-y-1">
              <p>• <strong>Invoices create debits</strong> (customer owes you money)</p>
              <p>• <strong>Receipts create credits</strong> (customer paid you money)</p>
              <p>• <strong>Without allocation:</strong> System shows customer still owes money even after payment!</p>
              <p>• <strong>With allocation:</strong> Payment is matched to specific invoices, marking them as paid</p>
            </div>
            <div className="mt-2 p-2 bg-amber-100 rounded-md">
              <p className="text-xs font-semibold text-amber-900">Example:</p>
              <p className="text-xs text-amber-800">
                Invoice INV-001 ($400) + Receipt RCP-001 ($400) → Without allocation: Customer balance = $400 
                <br />Invoice INV-001 ($400) ↔ Receipt RCP-001 ($400) → With allocation: Customer balance = $0
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Allocations Table */}
      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="h-12 px-4 text-left align-middle font-medium text-gray-600">
                  Allocation #
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-gray-600">
                  Customer
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-gray-600">
                  Date
                </th>
                <th className="h-12 px-4 text-center align-middle font-medium text-gray-600">
                  Lines
                </th>
                <th className="h-12 px-4 text-right align-middle font-medium text-gray-600">
                  Total Allocated
                </th>
                <th className="h-12 px-4 text-center align-middle font-medium text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAllocations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <ArrowUpDown className="h-8 w-8 text-gray-600" />
                      <p className="text-sm text-gray-600">
                        {searchTerm ? 'No allocations found matching your search.' : 'No allocations found.'}
                      </p>
                      {hasPermission(AR_TRANSACTIONS_POST) && !searchTerm && (
                        <Link
                          href="/transactions/ar/allocations/new"
                          className="text-sm text-primary hover:underline"
                        >
                          Create your first allocation
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAllocations.map((allocation) => (
                  <tr key={allocation.id} className="border-b hover:bg-gray-100/50">
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-2">
                        <ArrowUpDown className="h-4 w-4 text-gray-600" />
                        <span className="font-medium">#{allocation.id}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-600" />
                        <span>{allocation.customer_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-600" />
                        <span>{formatDate(allocation.allocation_date)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                        {allocation.lines.length} line{allocation.lines.length !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <DollarSign className="h-4 w-4 text-gray-600" />
                        <span className="font-medium text-green-600">
                          {formatCurrency(getTotalAllocated(allocation))}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center space-x-2">
                        <Link
                          href={`/transactions/ar/allocations/${allocation.id}`}
                          className="rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                          title="View allocation details"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      {filteredAllocations.length > 0 && (
        <div className="rounded-md border p-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">
              Showing {filteredAllocations.length} allocation{filteredAllocations.length !== 1 ? 's' : ''}
            </span>
            <div className="flex space-x-6">
              <span>
                Total Allocated: {formatCurrency(
                  filteredAllocations.reduce((sum, alloc) => sum + getTotalAllocated(alloc), 0)
                )}
              </span>
              <span>
                Total Lines: {filteredAllocations.reduce((sum, alloc) => sum + alloc.lines.length, 0)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
              <FileText className="h-3 w-3 text-blue-600" />
            </div>
          </div>
          <div className="text-sm">
            <p className="font-medium text-blue-900">About AR Allocations</p>
            <p className="text-blue-800 mt-1">
              Allocations match receipts and credit notes to outstanding invoices. This process reduces the open amount 
              on both transactions and helps track which payments apply to which invoices. Once allocated, the amounts 
              are no longer available for further allocation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
