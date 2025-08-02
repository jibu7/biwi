'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { errorService, BugReport, BugReportFilters } from '@/services/errorService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Bug, CheckCircle, XCircle, Clock, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';

const SEVERITY_COLORS = {
  critical: 'bg-red-100 text-red-800 border-red-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-blue-100 text-blue-800 border-blue-200',
};

const STATUS_COLORS = {
  new: 'bg-red-100 text-red-800 border-red-200',
  investigating: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  fixed: 'bg-green-100 text-green-800 border-green-200',
  cannot_reproduce: 'bg-gray-100 text-gray-800 border-gray-200',
};

const TYPE_ICONS = {
  frontend: Bug,
  backend: AlertTriangle,
  integration: XCircle,
};

export default function ErrorReportsPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<BugReportFilters>({
    limit: 50,
    skip: 0,
  });
  const [selectedReport, setSelectedReport] = useState<BugReport | null>(null);
  const [statusUpdate, setStatusUpdate] = useState({ status: '', resolution_notes: '' });

  // Fetch bug reports
  const { data: bugReports, isLoading } = useQuery({
    queryKey: ['bugReports', filters],
    queryFn: () => errorService.getBugReports(filters),
  });

  // Fetch statistics
  const { data: stats } = useQuery({
    queryKey: ['bugReportStats'],
    queryFn: errorService.getBugReportStats,
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, update }: { id: number; update: { status: string; resolution_notes?: string } }) =>
      errorService.updateBugReportStatus(id, update),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bugReports'] });
      queryClient.invalidateQueries({ queryKey: ['bugReportStats'] });
      toast.success('Bug report status updated');
      setSelectedReport(null);
      setStatusUpdate({ status: '', resolution_notes: '' });
    },
    onError: () => {
      toast.error('Failed to update bug report status');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: errorService.deleteBugReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bugReports'] });
      queryClient.invalidateQueries({ queryKey: ['bugReportStats'] });
      toast.success('Bug report deleted');
    },
    onError: () => {
      toast.error('Failed to delete bug report');
    },
  });

  const handleStatusUpdate = () => {
    if (selectedReport && statusUpdate.status) {
      updateStatusMutation.mutate({
        id: selectedReport.id,
        update: statusUpdate,
      });
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString();
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Error Reports</h1>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">New Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.by_status.new}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Critical</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.by_severity.critical}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Fixed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.by_status.fixed}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select
                value={filters.status || ''}
                onValueChange={(value) => setFilters({ ...filters, status: value || undefined })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="investigating">Investigating</SelectItem>
                  <SelectItem value="fixed">Fixed</SelectItem>
                  <SelectItem value="cannot_reproduce">Cannot Reproduce</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="severity-filter">Severity</Label>
              <Select
                value={filters.severity || ''}
                onValueChange={(value) => setFilters({ ...filters, severity: value || undefined })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All severities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All severities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="type-filter">Type</Label>
              <Select
                value={filters.error_type || ''}
                onValueChange={(value) => setFilters({ ...filters, error_type: value || undefined })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value="frontend">Frontend</SelectItem>
                  <SelectItem value="backend">Backend</SelectItem>
                  <SelectItem value="integration">Integration</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bug Reports List */}
      <Card>
        <CardHeader>
          <CardTitle>Bug Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {bugReports?.map((report) => {
              const TypeIcon = TYPE_ICONS[report.error_type as keyof typeof TYPE_ICONS] || Bug;
              
              return (
                <div key={report.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <TypeIcon className="h-5 w-5 text-gray-500 mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-medium text-gray-900">{report.error_id}</h3>
                          {report.status && (
                            <Badge className={STATUS_COLORS[report.status as keyof typeof STATUS_COLORS] || 'bg-gray-100'}>
                              {report.status}
                            </Badge>
                          )}
                          {report.severity && (
                            <Badge className={SEVERITY_COLORS[report.severity as keyof typeof SEVERITY_COLORS] || 'bg-gray-100'}>
                              {report.severity}
                            </Badge>
                          )}
                          <Badge variant="outline">
                            Count: {report.occurrence_count || 1}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{report.error_message}</p>
                        <div className="text-xs text-gray-500">
                          <div>Last seen: {formatDate(report.last_seen)}</div>
                          <div>URL: {report.url}</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedReport(report)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Bug Report Details - {report.error_id}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Status</Label>
                                <Select
                                  value={statusUpdate.status || report.status || ''}
                                  onValueChange={(value) => setStatusUpdate({ ...statusUpdate, status: value })}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="new">New</SelectItem>
                                    <SelectItem value="investigating">Investigating</SelectItem>
                                    <SelectItem value="fixed">Fixed</SelectItem>
                                    <SelectItem value="cannot_reproduce">Cannot Reproduce</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Severity</Label>
                                <div className="mt-2">
                                  {report.severity && (
                                    <Badge className={SEVERITY_COLORS[report.severity as keyof typeof SEVERITY_COLORS]}>
                                      {report.severity}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <Label>Resolution Notes</Label>
                              <Textarea
                                value={statusUpdate.resolution_notes}
                                onChange={(e) => setStatusUpdate({ ...statusUpdate, resolution_notes: e.target.value })}
                                placeholder="Enter resolution notes..."
                                className="mt-2"
                              />
                            </div>

                            <div>
                              <Label>Error Message</Label>
                              <div className="mt-2 p-3 bg-gray-50 rounded font-mono text-sm">
                                {report.error_message}
                              </div>
                            </div>

                            {report.stack_trace && (
                              <div>
                                <Label>Stack Trace</Label>
                                <div className="mt-2 p-3 bg-gray-50 rounded font-mono text-xs max-h-40 overflow-y-auto">
                                  <pre>{report.stack_trace}</pre>
                                </div>
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <Label>First Seen</Label>
                                <div className="mt-1">{formatDate(report.first_seen)}</div>
                              </div>
                              <div>
                                <Label>Last Seen</Label>
                                <div className="mt-1">{formatDate(report.last_seen)}</div>
                              </div>
                              <div>
                                <Label>Occurrence Count</Label>
                                <div className="mt-1">{report.occurrence_count}</div>
                              </div>
                              <div>
                                <Label>User Agent</Label>
                                <div className="mt-1 truncate">{report.user_agent}</div>
                              </div>
                            </div>

                            <div className="flex justify-between">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setSelectedReport(null);
                                  setStatusUpdate({ status: '', resolution_notes: '' });
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={handleStatusUpdate}
                                disabled={updateStatusMutation.isPending}
                              >
                                {updateStatusMutation.isPending ? 'Updating...' : 'Update Status'}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteMutation.mutate(report.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}