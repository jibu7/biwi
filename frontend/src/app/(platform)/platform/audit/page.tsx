'use client';


import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { DataTable, Column } from '@/components/ui/data-table';
import { platformService, PlatformAuditLog } from '@/services/platformService';
import { AlertTriangle, Eye, User, Building, Activity } from 'lucide-react';

export default function PlatformAuditLogsPage() {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('');

  const { data: auditLogs, isLoading, error } = useQuery({
    queryKey: ['platform-audit-logs', actionFilter, userFilter],
    queryFn: () => platformService.getAuditLogs({
      action: actionFilter === 'all' ? undefined : actionFilter,
      user_id: userFilter ? parseInt(userFilter) : undefined,
    }),
  });

  const getActionBadge = (action: string) => {
    const actionColors: Record<string, string> = {
      'company_suspend': 'bg-red-100 text-red-800',
      'company_activate': 'bg-green-100 text-green-800',
      'impersonate': 'bg-blue-100 text-blue-800',
      'company_create': 'bg-purple-100 text-purple-800',
      'company_update': 'bg-yellow-100 text-yellow-800',
      'platform_access': 'bg-gray-100 text-gray-800',
    };

    return (
      <Badge className={actionColors[action] || 'bg-gray-100 text-gray-800'}>
        {action.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const columns: Column<PlatformAuditLog>[] = [
    {
      accessorKey: 'timestamp',
      header: 'Timestamp',
      cell: ({ row }: { row: { original: PlatformAuditLog } }) => (
        <span className="text-sm">
          {new Date(row.original.timestamp).toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: 'action',
      header: 'Action',
      cell: ({ row }: { row: { original: PlatformAuditLog } }) => getActionBadge(row.original.action),
    },
    {
      accessorKey: 'user_id',
      header: 'User',
      cell: ({ row }: { row: { original: PlatformAuditLog } }) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span>User ID: {row.original.user_id}</span>
        </div>
      ),
    },
    {
      accessorKey: 'company_id',
      header: 'Company',
      cell: ({ row }: { row: { original: PlatformAuditLog } }) => (
        row.original.company_id ? (
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-muted-foreground" />
            <span>Company ID: {row.original.company_id}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      ),
    },
    {
      accessorKey: 'details',
      header: 'Details',
      cell: ({ row }: { row: { original: PlatformAuditLog } }) => (
        <div className="max-w-md">
          {row.original.details ? (
            <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">
              {JSON.stringify(row.original.details, null, 2)}
            </pre>
          ) : (
            <span className="text-muted-foreground">No details</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'ip_address',
      header: 'IP Address',
      cell: ({ row }: { row: { original: PlatformAuditLog } }) => (
        <span className="font-mono text-sm">{row.original.ip_address}</span>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading audit logs...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span>Failed to load audit logs</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Platform Audit Logs</h1>
          <p className="text-muted-foreground">
            Monitor all platform administrator activities
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-green-500" />
          <span className="text-sm text-muted-foreground">
            {auditLogs?.length || 0} entries
          </span>
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <Input
            placeholder="Search logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
        >
          <option value="all">All Actions</option>
          <option value="company_suspend">Company Suspend</option>
          <option value="company_activate">Company Activate</option>
          <option value="impersonate">Impersonate</option>
          <option value="company_create">Company Create</option>
          <option value="company_update">Company Update</option>
          <option value="platform_access">Platform Access</option>
        </Select>
        <Input
          placeholder="Filter by user..."
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <DataTable
            data={auditLogs || []}
            columns={columns}
          />
        </CardContent>
      </Card>
    </div>
  );
}
