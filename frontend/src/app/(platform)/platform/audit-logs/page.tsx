'use client';


import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { platformService, PlatformAuditLog, AuditLogFilters } from '@/services/platformService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table } from '@/components/ui/Table'; // Corrected import
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useDebounce } from '@/hooks/useDebounce';
import { Activity } from 'lucide-react';

// Define columns for the custom Table component
const columns = [
	{
		header: 'Timestamp',
		accessor: (log: PlatformAuditLog) => format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss'),
	},
	{
		header: 'Action',
		accessor: (log: PlatformAuditLog) => <Badge variant="secondary">{log.action}</Badge>,
	},
	{
		header: 'User',
		accessor: (log: PlatformAuditLog) => `User ID: ${log.user_id}`,
	},
	{
		header: 'Company',
		accessor: (log: PlatformAuditLog) => (log.company_id ? `Company ID: ${log.company_id}` : 'N/A'),
	},
	{
		header: 'Resource',
		accessor: (log: PlatformAuditLog) =>
			log.resource_type && log.resource_id ? `${log.resource_type} #${log.resource_id}` : 'N/A',
	},
	{
		header: 'Details',
		accessor: (log: PlatformAuditLog) => (
			<pre className="text-xs bg-gray-100 p-2 rounded">
				{JSON.stringify(log.details, null, 2)}
			</pre>
		),
	},
];

export default function PlatformAuditLogsPage() {
	const [filters, setFilters] = useState<AuditLogFilters>({ skip: 0, limit: 20 });
	const debouncedFilters = useDebounce(filters, 500);

	const { data: logs, isLoading, error } = useQuery({
		queryKey: ['platform-audit-logs', debouncedFilters],
		queryFn: () => platformService.getAuditLogs(debouncedFilters),
		placeholderData: (previousData) => previousData,
	});

	const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFilters((prev) => ({ ...prev, [name]: value, skip: 0 }));
	};

	const handlePageChange = (newSkip: number) => {
		setFilters((prev) => ({ ...prev, skip: newSkip }));
	};

	return (
		<div className="space-y-6 p-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Platform Audit Logs</h1>
					<p className="text-muted-foreground">Track important events and changes across the platform.</p>
				</div>
			</div>

			{/* Filter Controls */}
			<Card>
				<CardHeader>
					<CardTitle>Filter Logs</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
						<Input
							placeholder="Action (e.g., created_company)"
							name="action"
							value={filters.action || ''}
							onChange={handleFilterChange}
						/>
						<Input
							placeholder="Company ID"
							name="company_id"
							type="number"
							value={filters.company_id || ''}
							onChange={handleFilterChange}
						/>
						<Input
							placeholder="User ID"
							name="user_id"
							type="number"
							value={filters.user_id || ''}
							onChange={handleFilterChange}
						/>
						<div className="flex gap-2">
							<Input
								placeholder="Start Date (YYYY-MM-DD)"
								name="start_date"
								type="date"
								value={filters.start_date || ''}
								onChange={handleFilterChange}
							/>
							<Input
								placeholder="End Date (YYYY-MM-DD)"
								name="end_date"
								type="date"
								value={filters.end_date || ''}
								onChange={handleFilterChange}
							/>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Audit Log Table */}
			<Card>
				<CardHeader>
					<CardTitle>Logs</CardTitle>
				</CardHeader>
				<CardContent>
					{isLoading && <p>Loading logs...</p>}
					{error && <p className="text-red-500">Error loading logs: {error.message}</p>}
					{!isLoading && !error && logs && (
						<>
							<Table<PlatformAuditLog> data={logs} columns={columns} />
							<div className="flex items-center justify-end space-x-2 py-4">
								<Button
									variant="outline"
									size="sm"
									onClick={() => handlePageChange(Math.max(0, (filters.skip || 0) - (filters.limit || 20)))}
									disabled={(filters.skip || 0) === 0}
								>
									Previous
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={() => handlePageChange((filters.skip || 0) + (filters.limit || 20))}
									disabled={!logs || logs.length < (filters.limit || 20)}
								>
									Next
								</Button>
							</div>
						</>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
