'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { bomService } from '@/services/bomService';
import { inventoryService } from '@/services/inventoryService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Download } from 'lucide-react';

interface BOMFilter {
  item_id?: number;
  status?: string;
  effective_date_from?: string;
  effective_date_to?: string;
}

export default function BOMListingReportPage() {
  const [filters, setFilters] = useState<BOMFilter>({});
  const [showFilters, setShowFilters] = useState(false);

  const { data: boms, isLoading, refetch } = useQuery({
    queryKey: ['bom-listing-report', filters],
    queryFn: () => bomService.getBOMs(filters),
  });

  const { data: items } = useQuery({
    queryKey: ['inventory-items'],
    queryFn: () => inventoryService.getItems(),
  });

  const handleFilterChange = (field: keyof BOMFilter, value: string | number) => {
    setFilters(prev => ({ ...prev, [field]: value || undefined }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const exportToCSV = () => {
    if (!boms || boms.length === 0) return;

    const headers = ['BOM Code', 'Item Code', 'Description', 'Revision', 'Status', 'Effective Date', 'Expiry Date', 'Quantity Per Batch'];
    const csvContent = [
      headers.join(','),
      ...boms.map((bom: any) => [
        bom.bom_code,
        bom.parent_item?.item_code || '',
        `"${bom.description || ''}"`,
        bom.revision,
        bom.is_active ? 'Active' : 'Inactive',
        bom.effective_date,
        bom.expiry_date || '',
        bom.quantity_per_batch
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bom-listing-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">BOM Listing Report</h1>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)}
          >
            <FileText className="mr-2 h-4 w-4" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
          <Button 
            variant="outline" 
            onClick={exportToCSV}
            disabled={!boms || boms.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="font-medium mb-4">Filters</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Item</label>
              <select
                value={filters.item_id || ''}
                onChange={(e) => handleFilterChange('item_id', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Items</option>
                {items?.map((item: any) => (
                  <option key={item.id} value={item.id}>
                    {item.item_code} - {item.description}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Effective Date From</label>
              <Input
                type="date"
                value={filters.effective_date_from || ''}
                onChange={(e) => handleFilterChange('effective_date_from', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Effective Date To</label>
              <Input
                type="date"
                value={filters.effective_date_to || ''}
                onChange={(e) => handleFilterChange('effective_date_to', e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
            <Button onClick={() => refetch()}>
              Apply Filters
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8">Loading BOM listing...</div>
      ) : (
        <div className="space-y-4">
          <div className="text-sm text-gray-600 mb-4">
            Found {boms?.length || 0} BOMs
          </div>

          {boms && boms.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      BOM Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revision
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Effective Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Batch Qty
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Components
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {boms.map((bom: any) => (
                    <tr key={bom.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {bom.bom_code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {bom.parent_item?.item_code || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {bom.description || bom.parent_item?.description || 'No description'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {bom.revision}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          bom.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {bom.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(bom.effective_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {bom.quantity_per_batch}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {bom.components?.length || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No BOMs found matching the current filters.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
