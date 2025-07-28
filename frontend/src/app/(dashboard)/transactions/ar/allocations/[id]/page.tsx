'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Calendar, 
  User, 
  DollarSign,
  FileText,
  ArrowUpDown,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  Copy
} from 'lucide-react';
import { ARAllocation } from '@/types/ar';
import { arAllocationService } from '@/services/arService';
import { usePermissions } from '@/hooks/usePermissions';
import { AR_TRANSACTIONS_POST, AR_REPORTS_VIEW } from '@/lib/permissions';

export default function AllocationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const allocationId = parseInt(params.id as string);

  const { data: allocation, isLoading, error } = useQuery({
    queryKey: ['ar-allocation', allocationId],
    queryFn: () => arAllocationService.getById(allocationId),
    enabled: !!allocationId && hasPermission(AR_REPORTS_VIEW),
  });

  const deleteMutation = useMutation({
    mutationFn: () => arAllocationService.delete(allocationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ar-allocations'] });
      router.push('/transactions/ar/allocations');
    },
    onError: (error: any) => {
      console.error('Error deleting allocation:', error);
      const errorMessage = error?.response?.data?.detail || 'Failed to delete allocation. Please try again.';
      alert(errorMessage);
    },
  });

  const handleDelete = async () => {
    if (!hasPermission(AR_TRANSACTIONS_POST)) {
      alert('You do not have permission to delete allocations');
      return;
    }

    setIsDeleting(true);
    try {
      await deleteMutation.mutateAsync();
    } catch (error) {
      // Error handled in mutation
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTotalAllocated = (allocation: ARAllocation) => {
    return allocation.lines.reduce((sum, line) => {
      const amount = typeof line.allocated_amount === 'number' && !isNaN(line.allocated_amount) 
        ? line.allocated_amount 
        : Number(line.allocated_amount) || 0;
      return sum + amount;
    }, 0);
  };

  const copyAllocationId = () => {
    navigator.clipboard.writeText(allocationId.toString());
    // You could add a toast notification here
  };

  if (!hasPermission(AR_REPORTS_VIEW)) {
    return (
      <div className="p-6">
        <div className="text-center">
          <ArrowUpDown className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">Access Denied</h3>
          <p className="mt-1 text-sm text-gray-500">
            You don&apos;t have permission to view allocations.
          </p>
          <Link
            href="/transactions/ar/allocations"
            className="mt-4 inline-flex items-center text-sm text-primary hover:underline"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Allocations
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
            <div>
              <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-48 mt-2 animate-pulse"></div>
            </div>
          </div>
          <div className="flex space-x-2">
            <div className="w-20 h-10 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-20 h-10 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="space-y-6">
          <div className="rounded-lg border p-6">
            <div className="h-6 bg-gray-200 rounded w-48 animate-pulse mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !allocation) {
    return (
      <div className="p-6">
        <div className="text-center">
          <ArrowUpDown className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">Allocation Not Found</h3>
          <p className="mt-1 text-sm text-gray-500">
            The allocation with ID {allocationId} could not be found. It may have been deleted or doesn&apos;t exist.
          </p>
          <div className="mt-4 space-x-2">
            <Link
              href="/transactions/ar/allocations"
              className="inline-flex items-center text-sm text-primary hover:underline"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Allocations
            </Link>
            <Link
              href="/transactions/ar/allocations/new"
              className="inline-flex items-center text-sm text-primary hover:underline"
            >
              Create New Allocation
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/transactions/ar/allocations"
            className="rounded-md p-2 hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                Allocation #{allocation.id}
              </h1>
              <button
                onClick={copyAllocationId}
                className="p-1 text-gray-400 hover:text-gray-600"
                title="Copy allocation ID"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <p className="text-gray-700">
              View allocation details and line items
            </p>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex space-x-2">
          {hasPermission(AR_TRANSACTIONS_POST) && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isDeleting}
              className="inline-flex items-center justify-center rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Allocation Summary */}
      <div className="rounded-lg border p-6">
        <h3 className="text-lg font-medium mb-4 text-gray-900">Allocation Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Customer */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600">Customer</label>
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">{allocation.customer_name}</span>
            </div>
          </div>

          {/* Allocation Date */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600">Allocation Date</label>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm">{formatDate(allocation.allocation_date)}</span>
            </div>
          </div>

          {/* Total Amount */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600">Total Allocated</label>
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-green-600">
                {formatCurrency(getTotalAllocated(allocation))}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Allocation Lines */}
      <div className="rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Allocation Lines</h3>
          <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
            {allocation.lines.length} line{allocation.lines.length !== 1 ? 's' : ''}
          </span>
        </div>

        {allocation.lines.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="mx-auto h-8 w-8 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">No allocation lines found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {allocation.lines.map((line, index) => (
              <div key={line.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-medium text-sm text-gray-900">Line {index + 1}</h4>
                  <span className="text-sm font-medium text-green-600">
                    {formatCurrency(line.allocated_amount)}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Debit Transaction */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                      Debit (Invoice)
                    </label>
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-red-500" />
                      <span className="text-sm">
                        {line.debit_transaction_document_number || `Transaction #${line.debit_transaction_id}`}
                      </span>
                    </div>
                  </div>

                  {/* Credit Transaction */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                      Credit (Receipt)
                    </label>
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-green-500" />
                      <span className="text-sm">
                        {line.credit_transaction_document_number || `Transaction #${line.credit_transaction_id}`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status and Metadata */}
      <div className="rounded-lg border p-6">
        <h3 className="text-lg font-medium mb-4 text-gray-900">Status & Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium text-green-700">Allocation Active</span>
            </div>
            <div className="text-xs text-gray-500">
              This allocation is currently active and has been applied to the respective transactions.
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="text-sm">
              <span className="font-medium text-gray-600">Company ID:</span>
              <span className="ml-2 text-gray-900">{allocation.company_id}</span>
            </div>
            <div className="text-sm">
              <span className="font-medium text-gray-600">Customer ID:</span>
              <span className="ml-2 text-gray-900">{allocation.customer_id}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <h3 className="text-lg font-medium text-gray-900">Delete Allocation</h3>
            </div>
            
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete Allocation #{allocation.id}? This action cannot be undone 
              and will reverse all allocations made to the related transactions.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50 inline-flex items-center"
              >
                {isDeleting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Allocation
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}