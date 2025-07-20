'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { PlatformAuditLog } from '@/services/platformService';
import { Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface AuditLogTableProps {
  logs: PlatformAuditLog[];
  isLoading: boolean;
  onPageChange: (page: number) => void;
}

export function AuditLogTable({ logs, isLoading, onPageChange }: AuditLogTableProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedLog, setSelectedLog] = useState<PlatformAuditLog | null>(null);

  const getActionBadge = (action: string) => {
    const actionColors: Record<string, string> = {
      'company_create': 'bg-green-100 text-green-800',
      'company_update': 'bg-yellow-100 text-yellow-800',
      'company_suspend': 'bg-red-100 text-red-800',
      'company_activate': 'bg-green-100 text-green-800',
      'user_create': 'bg-blue-100 text-blue-800',
      'user_update': 'bg-yellow-100 text-yellow-800',
      'user_delete': 'bg-red-100 text-red-800',
      'impersonate': 'bg-purple-100 text-purple-800',
      'platform_access': 'bg-gray-100 text-gray-800',
    };

    return (
      <Badge className={actionColors[action] || 'bg-gray-100 text-gray-800'}>
        {action.replace(/_/g, ' ').toUpperCase()}
      </Badge>
    );
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const handlePreviousPage = () => {
    if (currentPage > 0) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      onPageChange(newPage);
    }
  };

  const handleNextPage = () => {
    const newPage = currentPage + 1;
    setCurrentPage(newPage);
    onPageChange(newPage);
  };

  const columns = [
    {
      accessorKey: 'created_at',
      header: 'Timestamp',
      cell: ({ row }: { row: { original: PlatformAuditLog } }) => (
        <span className="text-sm font-mono">
          {formatDate(row.original.created_at || row.original.timestamp)}
        </span>
      ),
    },
    {
      accessorKey: 'action',
      header: 'Action',
      cell: ({ row }: { row: { original: PlatformAuditLog } }) => 
        getActionBadge(row.original.action),
    },
    {
      accessorKey: 'user_id',
      header: 'User ID',
      cell: ({ row }: { row: { original: PlatformAuditLog } }) => (
        <span className="font-mono">{row.original.user_id}</span>
      ),
    },
    {
      accessorKey: 'company_id',
      header: 'Company ID',
      cell: ({ row }: { row: { original: PlatformAuditLog } }) => (
        <span className="font-mono">
          {row.original.company_id || 'N/A'}
        </span>
      ),
    },
    {
      accessorKey: 'resource_type',
      header: 'Resource Type',
      cell: ({ row }: { row: { original: PlatformAuditLog } }) => (
        <span className="capitalize">
          {row.original.resource_type || 'N/A'}
        </span>
      ),
    },
    {
      accessorKey: 'ip_address',
      header: 'IP Address',
      cell: ({ row }: { row: { original: PlatformAuditLog } }) => (
        <span className="font-mono text-sm">
          {row.original.ip_address || 'N/A'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: { row: { original: PlatformAuditLog } }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedLog(row.original)}
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={logs}
      />
      
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          Showing {logs.length} entries
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousPage}
            disabled={currentPage === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={logs.length < 100} // Assuming page size of 100
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full m-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Audit Log Details</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedLog(null)}
              >
                ×
              </Button>
            </div>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">Timestamp:</span>
                  <p className="text-sm font-mono">{formatDate(selectedLog.created_at || selectedLog.timestamp)}</p>
                </div>
                <div>
                  <span className="font-medium">Action:</span>
                  <p className="text-sm">{getActionBadge(selectedLog.action)}</p>
                </div>
                <div>
                  <span className="font-medium">User ID:</span>
                  <p className="text-sm font-mono">{selectedLog.user_id}</p>
                </div>
                <div>
                  <span className="font-medium">Company ID:</span>
                  <p className="text-sm font-mono">{selectedLog.company_id || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-medium">Resource Type:</span>
                  <p className="text-sm">{selectedLog.resource_type || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-medium">Resource ID:</span>
                  <p className="text-sm font-mono">{selectedLog.resource_id || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-medium">IP Address:</span>
                  <p className="text-sm font-mono">{selectedLog.ip_address || 'N/A'}</p>
                </div>
              </div>
              
              {selectedLog.new_values && (
                <div>
                  <span className="font-medium">Changes:</span>
                  <pre className="text-sm bg-gray-100 p-3 rounded mt-1 overflow-auto">
                    {JSON.stringify(selectedLog.new_values, null, 2)}
                  </pre>
                </div>
              )}
              
              {selectedLog.user_agent && (
                <div>
                  <span className="font-medium">User Agent:</span>
                  <p className="text-sm break-all">{selectedLog.user_agent}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
