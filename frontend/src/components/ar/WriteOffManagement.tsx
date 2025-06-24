'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Eye, Check, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/badge';
import { writeOffService, customerService } from '@/services/arService';
import { ARWriteOff, ARWriteOffApproval } from '@/types/ar';
import { formatCurrency, formatDate } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';
import { AR_WRITEOFF_APPROVE } from '@/lib/permissions';
import WriteOffCreateDialog from './WriteOffCreateDialog';

interface WriteOffManagementProps {
  className?: string;
}

const WriteOffManagement: React.FC<WriteOffManagementProps> = ({ className }) => {
  const { hasPermission } = usePermissions();
  const queryClient = useQueryClient();
  const [selectedWriteOff, setSelectedWriteOff] = useState<ARWriteOff | null>(null);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);

  const canApprove = hasPermission(AR_WRITEOFF_APPROVE);

  // Fetch write-offs
  const { data: writeOffs = [], isLoading } = useQuery({
    queryKey: ['ar-writeoffs'],
    queryFn: () => writeOffService.getAll(),
  });

  // Approve write-off mutation
  const approveMutation = useMutation({
    mutationFn: ({ id, approval }: { id: number; approval: ARWriteOffApproval }) =>
      writeOffService.approve(id, approval),
    onSuccess: () => {
      toast.success('Write-off approved successfully');
      queryClient.invalidateQueries({ queryKey: ['ar-writeoffs'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to approve write-off');
    },
  });

  // Reject write-off mutation
  const rejectMutation = useMutation({
    mutationFn: ({ id, approval }: { id: number; approval: ARWriteOffApproval }) =>
      writeOffService.reject(id, approval),
    onSuccess: () => {
      toast.success('Write-off rejected');
      queryClient.invalidateQueries({ queryKey: ['ar-writeoffs'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to reject write-off');
    },
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      Draft: { variant: 'outline' as const, color: 'bg-yellow-100 text-yellow-800', label: 'Draft' },
      Posted: { variant: 'outline' as const, color: 'bg-green-100 text-green-800', label: 'Posted' },
      Rejected: { variant: 'outline' as const, color: 'bg-red-100 text-red-800', label: 'Rejected' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || 
      { variant: 'outline' as const, color: 'bg-gray-100 text-gray-800', label: status };
    
    return (
      <Badge variant={config.variant} className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const handleApprove = (writeOff: ARWriteOff) => {
    const approval: ARWriteOffApproval = {
      approval_decision: 'APPROVE',
      approval_notes: `Approved write-off for ${formatCurrency(writeOff.writeoff_amount)}`,
    };
    approveMutation.mutate({ id: writeOff.id, approval });
  };

  const handleReject = (writeOff: ARWriteOff) => {
    const approval: ARWriteOffApproval = {
      approval_decision: 'REJECT',
      approval_notes: 'Write-off rejected after review',
    };
    rejectMutation.mutate({ id: writeOff.id, approval });
  };

  const columns = [
    {
      header: 'Document #',
      accessor: 'document_number' as keyof ARWriteOff,
    },
    {
      header: 'Date',
      accessor: ((writeOff: ARWriteOff) => formatDate(writeOff.writeoff_date)) as any,
    },
    {
      header: 'Customer',
      accessor: ((writeOff: ARWriteOff) => writeOff.customer?.name || 'N/A') as any,
    },
    {
      header: 'Invoice #',
      accessor: ((writeOff: ARWriteOff) => writeOff.original_invoice?.document_number || 'N/A') as any,
    },
    {
      header: 'Amount',
      accessor: ((writeOff: ARWriteOff) => formatCurrency(writeOff.writeoff_amount)) as any,
    },
    {
      header: 'Reason',
      accessor: 'reason_code' as keyof ARWriteOff,
    },
    {
      header: 'Status',
      accessor: ((writeOff: ARWriteOff) => getStatusBadge(writeOff.status)) as any,
    },
    {
      header: 'Requested By',
      accessor: ((writeOff: ARWriteOff) => writeOff.requested_by?.full_name || 'N/A') as any,
    },
  ];

  const actions = (writeOff: ARWriteOff) => (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setSelectedWriteOff(writeOff)}
      >
        <Eye className="h-4 w-4 mr-1" />
        View
      </Button>
      {writeOff.status === 'Draft' && canApprove && (
        <>
          <Button
            variant="outline"
            size="sm"
            className="text-green-600 hover:text-green-700"
            onClick={() => handleApprove(writeOff)}
            disabled={approveMutation.isPending}
          >
            <Check className="h-4 w-4 mr-1" />
            Approve
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-700"
            onClick={() => handleReject(writeOff)}
            disabled={rejectMutation.isPending}
          >
            <X className="h-4 w-4 mr-1" />
            Reject
          </Button>
        </>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AR Write-offs</h1>
          <p className="text-muted-foreground">
            Manage accounts receivable write-offs and approvals
          </p>
        </div>
        <Button onClick={() => setOpenCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Write-off
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Write-off Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {writeOffs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No write-offs found</p>
            </div>
          ) : (
            <Table
              data={writeOffs}
              columns={columns}
              actions={actions}
            />
          )}
        </CardContent>
      </Card>

      {/* Write-off details modal would go here */}
      {selectedWriteOff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Write-off Details</CardTitle>
              <Button
                variant="outline"
                size="sm"
                className="absolute top-4 right-4"
                onClick={() => setSelectedWriteOff(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Document Number</label>
                  <p className="text-sm text-muted-foreground">{selectedWriteOff.document_number}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedWriteOff.status)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Customer</label>
                  <p className="text-sm text-muted-foreground">{selectedWriteOff.customer?.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Amount</label>
                  <p className="text-sm text-muted-foreground">{formatCurrency(selectedWriteOff.writeoff_amount)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Date</label>
                  <p className="text-sm text-muted-foreground">{formatDate(selectedWriteOff.writeoff_date)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Reason Code</label>
                  <p className="text-sm text-muted-foreground">{selectedWriteOff.reason_code}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Reason Description</label>
                <p className="text-sm text-muted-foreground mt-1">{selectedWriteOff.reason_description}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Requested By</label>
                <p className="text-sm text-muted-foreground">{selectedWriteOff.requested_by?.full_name}</p>
              </div>
              {selectedWriteOff.approved_by && (
                <div>
                  <label className="text-sm font-medium">Approved By</label>
                  <p className="text-sm text-muted-foreground">{selectedWriteOff.approved_by.full_name}</p>
                </div>
              )}
              {selectedWriteOff.approval_notes && (
                <div>
                  <label className="text-sm font-medium">Approval Notes</label>
                  <p className="text-sm text-muted-foreground mt-1">{selectedWriteOff.approval_notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Write-off create dialog */}
      <WriteOffCreateDialog
        open={openCreateDialog}
        onClose={() => setOpenCreateDialog(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['ar-writeoffs'] });
          setOpenCreateDialog(false);
        }}
      />
    </div>
  );
};

export default WriteOffManagement;
