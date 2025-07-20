'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { platformService } from '@/services/platformService';
import { AuditLogFilters } from '@/components/platform/AuditLogFilters';
import { AuditLogTable } from '@/components/platform/AuditLogTable';
import { Card } from '@/components/ui/card';

export default function AuditLogsPage() {
  const [filters, setFilters] = useState({
    company_id: null,
    user_id: null,
    action: null,
    resource_type: null,
    start_date: null,
    end_date: null,
    limit: 100,
    offset: 0,
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: () => platformService.queryAuditLogs(filters),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Audit Logs</h1>
      
      <Card className="p-6">
        <AuditLogFilters
          filters={filters}
          onFiltersChange={setFilters}
          onSearch={() => refetch()}
        />
      </Card>
      
      <AuditLogTable
        logs={data || []}
        isLoading={isLoading}
        onPageChange={(page: number) => setFilters({ ...filters, offset: page * filters.limit })}
      />
    </div>
  );
}
