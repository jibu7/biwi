'use client';

import { useQuery } from '@tanstack/react-query';
import { platformService } from '@/services/platformService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';

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
        {companies?.map((company: any) => (
          <TableRow key={company.id}>
            <TableCell>{company.name}</TableCell>
            <TableCell>{company.user_count}</TableCell>
            <TableCell>{(company.storage_gb).toFixed(2)} GB</TableCell>
            <TableCell>{company.transactions_mtd}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
