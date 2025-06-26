'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Calendar, 
  Building2, 
  CheckCircle, 
  AlertCircle, 
  Edit3,
  Save,
  X,
  Package,
  ClipboardCheck
} from 'lucide-react';
import Link from 'next/link';
import { 
  getInventoryCountSession, 
  getInventoryCountLines,
  recordCountedQuantities,
  processCountVariances 
} from '@/services/inventoryService';
import { usePermissions } from '@/hooks/usePermissions';
import { INV_TRANSACTIONS_ADJUST } from '@/lib/permissions';
import { formatDate, safeQuantity } from '@/lib/formatters';
import { InventoryCountLine, InventoryCountLineUpdate } from '@/types/inventory';

export default function InventoryCountSessionPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const sessionId = parseInt(params.sessionId as string);
  
  const [editingLines, setEditingLines] = useState<Set<number>>(new Set());
  const [countValues, setCountValues] = useState<Record<number, string>>({});

  // Fetch count session
  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ['inventory-count-session', sessionId],
    queryFn: () => getInventoryCountSession(sessionId),
    enabled: !isNaN(sessionId),
  });

  // Fetch count lines
  const { data: countLines = [], isLoading: linesLoading } = useQuery({
    queryKey: ['inventory-count-lines', sessionId],
    queryFn: () => getInventoryCountLines(sessionId),
    enabled: !isNaN(sessionId),
  });

  // Record counted quantities mutation
  const recordCountsMutation = useMutation({
    mutationFn: (updates: InventoryCountLineUpdate[]) => 
      recordCountedQuantities(sessionId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-count-lines', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['inventory-count-session', sessionId] });
      setEditingLines(new Set());
      setCountValues({});
    },
  });

  // Process variances mutation  
  const processVariancesMutation = useMutation({
    mutationFn: () => processCountVariances(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-count-session', sessionId] });
      router.push('/transactions/inventory/counts');
    },
  });

  const handleStartEdit = (line: InventoryCountLine) => {
    setEditingLines(prev => new Set([...prev, line.id]));
    setCountValues(prev => ({
      ...prev,
      [line.id]: line.counted_quantity?.toString() || ''
    }));
  };

  const handleCancelEdit = (lineId: number) => {
    setEditingLines(prev => {
      const newSet = new Set(prev);
      newSet.delete(lineId);
      return newSet;
    });
    setCountValues(prev => {
      const newValues = { ...prev };
      delete newValues[lineId];
      return newValues;
    });
  };

  const handleSaveCount = async (line: InventoryCountLine) => {
    const countedQuantity = parseFloat(countValues[line.id] || '0');
    
    const updates: InventoryCountLineUpdate[] = [{
      id: line.id,
      counted_quantity: countedQuantity
    }];

    await recordCountsMutation.mutateAsync(updates);
  };

  const handleProcessVariances = async () => {
    if (window.confirm('Are you sure you want to process count variances? This will create inventory adjustments and cannot be undone.')) {
      await processVariancesMutation.mutateAsync();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open':
        return 'bg-blue-100 text-blue-800';
      case 'Counting':
        return 'bg-yellow-100 text-yellow-800';
      case 'Review':
        return 'bg-purple-100 text-purple-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getVarianceColor = (variance: number) => {
    if (variance === 0) return 'text-gray-500';
    return variance > 0 ? 'text-green-600' : 'text-red-600';
  };

  const hasVariances = countLines.some(line => 
    line.counted_quantity !== null && 
    Math.abs((line.counted_quantity || 0) - line.system_quantity) > 0.001
  );

  if (sessionLoading || linesLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Count Session Not Found</h1>
          <Link 
            href="/transactions/inventory/counts"
            className="text-blue-600 hover:text-blue-800"
          >
            ← Back to Count Sessions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link 
          href="/transactions/inventory/counts"
          className="text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Inventory Count Session</h1>
          <p className="text-gray-600">Session #{session.id}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(session.status)}`}>
          {session.status}
        </span>
      </div>

      {/* Session Details */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-500">Count Date</p>
              <p className="text-lg">{formatDate(session.count_date)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-500">Warehouse</p>
              <p className="text-lg">{session.warehouse?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-500">Items to Count</p>
              <p className="text-lg">{countLines.length}</p>
            </div>
          </div>
        </div>
        {session.notes && (
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-700">{session.notes}</p>
          </div>
        )}
      </div>

      {/* Count Progress */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-medium mb-4">Count Progress</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{countLines.length}</p>
            <p className="text-sm text-gray-500">Total Items</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {countLines.filter(line => line.counted_quantity !== null).length}
            </p>
            <p className="text-sm text-gray-500">Counted</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">
              {countLines.filter(line => 
                line.counted_quantity !== null && 
                Math.abs((line.counted_quantity || 0) - line.system_quantity) > 0.001
              ).length}
            </p>
            <p className="text-sm text-gray-500">Variances</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {countLines.filter(line => line.counted_quantity === null).length}
            </p>
            <p className="text-sm text-gray-500">Remaining</p>
          </div>
        </div>
      </div>

      {/* Count Lines */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium">Count Lines</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  System Qty
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Counted Qty
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Variance
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                {hasPermission(INV_TRANSACTIONS_ADJUST) && session.status === 'Open' && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {countLines.map((line) => {
                const isEditing = editingLines.has(line.id);
                const variance = line.counted_quantity !== null 
                  ? (line.counted_quantity || 0) - line.system_quantity 
                  : 0;
                const isCounted = line.counted_quantity !== null;

                return (
                  <tr key={line.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {line.item?.item_code}
                        </p>
                        <p className="text-sm text-gray-500">
                          {line.item?.description}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                      {safeQuantity(line.system_quantity)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.01"
                          value={countValues[line.id] || ''}
                          onChange={(e) => setCountValues(prev => ({
                            ...prev,
                            [line.id]: e.target.value
                          }))}
                          className="w-20 px-2 py-1 border rounded text-right"
                          autoFocus
                        />
                      ) : (
                        <span className={isCounted ? 'text-gray-900' : 'text-gray-400'}>
                          {isCounted ? safeQuantity(line.counted_quantity!) : '-'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      {isCounted && (
                        <span className={`font-medium ${getVarianceColor(variance)}`}>
                          {variance > 0 ? '+' : ''}{safeQuantity(variance)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {isCounted ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-yellow-500 mx-auto" />
                      )}
                    </td>
                    {hasPermission(INV_TRANSACTIONS_ADJUST) && session.status === 'Open' && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {isEditing ? (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleSaveCount(line)}
                              disabled={recordCountsMutation.isPending}
                              className="text-green-600 hover:text-green-900"
                              title="Save"
                            >
                              <Save className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleCancelEdit(line.id)}
                              className="text-gray-600 hover:text-gray-900"
                              title="Cancel"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartEdit(line)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit Count"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actions */}
      {hasPermission(INV_TRANSACTIONS_ADJUST) && (session.status === 'Open' || session.status === 'Counting') && hasVariances && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleProcessVariances}
            disabled={processVariancesMutation.isPending}
            className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            <ClipboardCheck className="h-4 w-4" />
            {processVariancesMutation.isPending ? 'Processing...' : 'Process Count Variances'}
          </button>
        </div>
      )}

      {/* Help Text */}
      <div className="mt-6 bg-blue-50 p-4 rounded-md">
        <h4 className="text-sm font-medium text-blue-800 mb-2">How to Count Inventory</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <div>• Click the edit icon next to any item to record the physical count</div>
          <div>• Compare the system quantity with what you physically counted</div>
          <div>• Variances will be highlighted in red (shortage) or green (overage)</div>
          <div>• Once all counting is complete, process the variances to create adjustments</div>
        </div>
      </div>
    </div>
  );
}
