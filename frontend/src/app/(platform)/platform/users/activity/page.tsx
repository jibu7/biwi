"use client";
import React, { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { AuditLogTable } from "@/components/platform/AuditLogTable";
import { AuditLogFilters } from "@/components/platform/AuditLogFilters";
import { PlatformAuditLog, AuditLogFilters as Filters } from "@/services/platformService";
import axios from "axios";

type AnyObject = { [key: string]: any };
const fetchAuditLogs = async (filters: Filters): Promise<PlatformAuditLog[]> => {
  const params: AnyObject = { ...filters };
  Object.keys(params).forEach((k) => (params[k] == null) && delete params[k]);
  const res = await axios.get("/api/platform/audit-logs", { params });
  return res.data;
};

export default function UserActivityPage() {
  const [filters, setFilters] = useState<Filters>({ limit: 100, offset: 0 });
  const [page, setPage] = useState(0);

  const { data, isLoading, error, refetch } = useQuery<PlatformAuditLog[]>({
    queryKey: ["platform-audit-logs", filters],
    queryFn: () => fetchAuditLogs(filters),
  });

  const handleFiltersChange = useCallback((newFilters: Filters) => {
    setFilters((prev) => ({ ...prev, ...newFilters, offset: 0 }));
    setPage(0);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    setFilters((prev) => ({ ...prev, offset: newPage * (prev.limit || 100) }));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">User Activity Log</h1>
      <div className="mb-6">
        <AuditLogFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onSearch={refetch}
        />
      </div>
      <AuditLogTable
        logs={data ?? []}
        isLoading={isLoading}
        onPageChange={handlePageChange}
      />
      {error && <div className="text-red-500 mt-4">Error loading activity logs.</div>}
    </div>
  );
}
