'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Edit } from 'lucide-react';
import Link from 'next/link';
import { bomService } from '@/services/bomService';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/hooks/usePermissions';
import { BOM_SETUP_MANAGE } from '@/lib/permissions';

export default function BOMListPage() {
  const { hasPermission } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: boms = [], isLoading, error } = useQuery({
    queryKey: ['boms'],
    queryFn: () => bomService.getBOMHeaders()
  });

  const filteredBoms = boms.filter(bom =>
    bom.bom_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bom.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bom.parent_item?.item_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading BOMs</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Bill of Materials</h1>
        {hasPermission(BOM_SETUP_MANAGE) && (
          <Link href="/maintenance/bom/bills/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New BOM
            </Button>
          </Link>
        )}
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by BOM code, description, or parent item..."
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
                BOM Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Parent Item
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Revision
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Batch Qty
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Active
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredBoms.map((bom) => (
              <tr key={bom.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {bom.bom_code}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {bom.parent_item?.item_code || 'N/A'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {bom.description || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {bom.revision}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  {bom.quantity_per_batch}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    bom.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {bom.is_active ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <Link href={`/maintenance/bom/bills/${bom.id}`}>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </Link>
                    {hasPermission(BOM_SETUP_MANAGE) && (
                      <Link href={`/maintenance/bom/bills/${bom.id}/edit`}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredBoms.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {boms.length === 0 ? 'No BOMs found' : 'No BOMs match your search'}
          </div>
        )}
      </div>
    </div>
  );
}
