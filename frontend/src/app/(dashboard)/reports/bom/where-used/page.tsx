'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { bomService } from '@/services/bomService';
import { inventoryService } from '@/services/inventoryService';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

export default function WhereUsedReportPage() {
  const [selectedItemId, setSelectedItemId] = useState<number>(0);
  const [hasSearched, setHasSearched] = useState(false);

  const { data: items } = useQuery({
    queryKey: ['inventory-items'],
    queryFn: () => inventoryService.getItems(),
  });

  const { data: whereUsedData, isLoading, refetch } = useQuery({
    queryKey: ['where-used-report', selectedItemId],
    queryFn: () => bomService.getWhereUsedReport(selectedItemId),
    enabled: false, // Only run when manually triggered
  });

  const handleSearch = () => {
    if (!selectedItemId) return;
    setHasSearched(true);
    refetch();
  };

  const selectedItem = items?.find((item: any) => item.id === selectedItemId);

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Where Used Report</h1>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-blue-900 mb-2">About Where Used</h3>
        <p className="text-sm text-blue-700">
          This report shows all the BOMs that use a specific item as a component. 
          Select an item to see which finished goods require it for production.
        </p>
      </div>

      <div className="bg-white border rounded-lg p-6 mb-6">
        <h3 className="font-medium mb-4">Search Criteria</h3>
        <div className="flex space-x-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Select Item</label>
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose an item to search for...</option>
              {items?.map((item: any) => (
                <option key={item.id} value={item.id}>
                  {item.item_code} - {item.description}
                </option>
              ))}
            </select>
          </div>
          <Button 
            onClick={handleSearch}
            disabled={!selectedItemId || isLoading}
          >
            <Search className="mr-2 h-4 w-4" />
            {isLoading ? 'Searching...' : 'Search'}
          </Button>
        </div>
      </div>

      {hasSearched && selectedItem && (
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Searching for:</h3>
            <p className="text-gray-700">
              <strong>{selectedItem.item_code}</strong> - {selectedItem.description}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Category: {selectedItem.category} | Type: {selectedItem.item_type}
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-8">Searching for where this item is used...</div>
          ) : whereUsedData && whereUsedData.length > 0 ? (
            <div className="space-y-4">
              <h3 className="font-medium text-lg">
                Found in {whereUsedData.length} BOM{whereUsedData.length !== 1 ? 's' : ''}:
              </h3>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Qty Required
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Scrap %
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {whereUsedData.map((usage: any, index: number) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {usage.bom_code}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {usage.parent_item_code}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {usage.parent_item_description || usage.description || 'No description'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {usage.revision}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            usage.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {usage.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {usage.quantity_required} {usage.unit_of_measure || ''}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {usage.scrap_percentage || 0}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-gray-100 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Summary</h4>
                <div className="text-sm text-gray-700 space-y-1">
                  <p><strong>Total BOMs using this item:</strong> {whereUsedData.length}</p>
                  <p><strong>Active BOMs:</strong> {whereUsedData.filter((usage: any) => usage.is_active).length}</p>
                  <p><strong>Inactive BOMs:</strong> {whereUsedData.filter((usage: any) => !usage.is_active).length}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg mb-2">No BOMs found</p>
              <p className="text-sm">
                This item is not used as a component in any active BOMs.
              </p>
            </div>
          )}
        </div>
      )}

      {!hasSearched && (
        <div className="text-center py-12 text-gray-500">
          <Search className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <p className="text-lg">Select an item and click Search to see where it's used</p>
        </div>
      )}
    </div>
  );
}
