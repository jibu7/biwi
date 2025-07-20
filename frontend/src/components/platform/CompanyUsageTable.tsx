'use client';

import { useQuery } from '@tanstack/react-query';
import { platformService } from '@/services/platformService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { CompanyWithStats } from '@/types/platform';

export function CompanyUsageTable() {
  const { data: companies } = useQuery({
    queryKey: ['company-usage'],
    queryFn: () => platformService.getCompanies({ sortBy: 'usage', sortOrder: 'desc' }),
  });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Company</TableHead>
          <TableHead>Users</TableHead>
          <TableHead>Storage Used</TableHead>
          <TableHead>Transactions (MTD)</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {companies?.map((company: CompanyWithStats) => (
          <TableRow key={company.id || company.company?.id}>
            <TableCell>{company.name || company.company?.name}</TableCell>
            <TableCell>{company.user_count || 0}</TableCell>
            <TableCell>{(company.storage_used_gb || company.storage_gb || 0).toFixed(2)} GB</TableCell>
            <TableCell>{company.transaction_count || company.transactions_mtd || 0}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
