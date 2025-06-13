'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Plus, Eye, PlayCircle, FileText } from 'lucide-react';
import Link from 'next/link';
import { getInventoryCountSession } from '@/services/inventoryService';
import { usePermissions } from '@/hooks/usePermissions';
import { INV_TRANSACTIONS_ADJUST } from '@/lib/permissions';

// Mock function for now - would need to implement in service
const getInventoryCountSessions = async () => {
  // This would be implemented in the service
  return [];
};

export default function InventoryCountSessionsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: countSessions = [], isLoading, error } = useQuery({
    queryKey: ['inventory-count-sessions'],
    queryFn: getInventoryCountSessions,
  });

  const filteredSessions = countSessions.filter((session: any) =>
    session.warehouse?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading count sessions</div>;

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Inventory Count Sessions</h1>
        {hasPermission(INV_TRANSACTIONS_ADJUST) && (
          <Link
            href="/transactions/inventory/counts/new"
            className="bg-blue-500 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-blue-600"
          >
            <Plus size={20} />
            Start New Count
          </Link>
        )}
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by warehouse or notes..."
          className="w-full md:w-96 px-4 py-2 border rounded-md"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Count Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Warehouse
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Notes
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredSessions.map((session: any) => (
              <tr key={session.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {new Date(session.count_date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {session.warehouse?.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(session.status)}`}
                  >
                    {session.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {session.notes || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {hasPermission(INV_TRANSACTIONS_ADJUST) && (
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/transactions/inventory/counts/${session.id}`}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </Link>
                      {session.status === 'Open' && (
                        <Link
                          href={`/transactions/inventory/counts/${session.id}/record`}
                          className="text-green-600 hover:text-green-900"
                          title="Record Counts"
                        >
                          <PlayCircle size={18} />
                        </Link>
                      )}
                      {session.status === 'Completed' && (
                        <button
                          className="text-blue-600 hover:text-blue-900"
                          title="View Report"
                        >
                          <FileText size={18} />
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredSessions.length === 0 && (
        <div className="text-center py-12">
          <FileText size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No count sessions found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm ? 'Try adjusting your search terms.' : 'Get started by creating your first inventory count session.'}
          </p>
          {hasPermission(INV_TRANSACTIONS_ADJUST) && !searchTerm && (
            <Link
              href="/transactions/inventory/counts/new"
              className="inline-flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
            >
              <Plus size={20} />
              Start New Count
            </Link>
          )}
        </div>
      )}

      <div className="mt-6 bg-blue-50 p-4 rounded-md">
        <h4 className="text-sm font-medium text-blue-800 mb-2">Inventory Count Process</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <div><strong>Open:</strong> Count session is created, system quantities are captured</div>
          <div><strong>Counting:</strong> Physical counts are being recorded</div>
          <div><strong>Review:</strong> Variances are being reviewed before processing</div>
          <div><strong>Completed:</strong> Count processed, adjustments posted</div>
        </div>
      </div>
    </div>
  );
}
