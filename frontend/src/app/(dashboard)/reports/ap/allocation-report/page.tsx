'use client';


import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Download } from 'lucide-react';
import { apService } from '@/services/apService';

export default function AllocationReportPage() {
  const [filters, setFilters] = useState({
    supplier_id: '',
    start_date: '',
    end_date: '',
  });

  const { data: allocations = [], isLoading } = useQuery({
    queryKey: ['apAllocations', filters],
    queryFn: () => apService.getAPAllocations({
      supplier_id: filters.supplier_id ? parseInt(filters.supplier_id) : undefined,
    }),
    enabled: !!(filters.supplier_id || filters.start_date || filters.end_date),
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => apService.getSuppliers(),
  });

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      supplier_id: '',
      start_date: '',
      end_date: '',
    });
  };

  const handleExport = () => {
    // Implementation for exporting the report
    console.log('Export allocation report');
  };

  const filteredAllocations = allocations.filter(allocation => {
    if (filters.start_date && new Date(allocation.allocation_date) < new Date(filters.start_date)) {
      return false;
    }
    if (filters.end_date && new Date(allocation.allocation_date) > new Date(filters.end_date)) {
      return false;
    }
    return true;
  });

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Allocation Report</h1>
          <p className="mt-1 text-sm text-gray-600">
            View transaction allocations and payment applications
          </p>
        </div>
        {filteredAllocations.length > 0 && (
          <button
            onClick={handleExport}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        )}
      </div>

      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center mb-4">
          <Calendar className="h-5 w-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Report Filters</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Supplier
            </label>
            <select
              value={filters.supplier_id}
              onChange={(e) => handleFilterChange('supplier_id', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">All Suppliers</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.supplier_code} - {supplier.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Start Date
            </label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => handleFilterChange('start_date', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              End Date
            </label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => handleFilterChange('end_date', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-gray-600">Loading allocations...</p>
        </div>
      )}

      {filteredAllocations.length > 0 && (
        <>
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Showing {filteredAllocations.length} allocations
            </p>
          </div>

          <div className="space-y-6">
            {filteredAllocations.map((allocation) => {
              const supplier = suppliers.find(s => s.id === allocation.supplier_id);
              const totalAllocated = allocation.lines.reduce((sum, line) => sum + line.allocated_amount, 0);

              return (
                <div key={allocation.id} className="bg-white shadow rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        Allocation #{allocation.id}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Supplier: {supplier ? `${supplier.supplier_code} - ${supplier.name}` : 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-600">
                        Date: {new Date(allocation.allocation_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Total Allocated</p>
                      <p className="text-lg font-semibold text-green-600">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD',
                        }).format(totalAllocated)}
                      </p>
                    </div>
                  </div>

                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Credit Transaction
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Debit Transaction
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Allocated Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {allocation.lines.map((line, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              Transaction #{line.credit_transaction_id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              Transaction #{line.debit_transaction_id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-green-600">
                              {new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'USD',
                              }).format(line.allocated_amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Total Allocations</p>
                <p className="text-2xl font-bold text-blue-600">{filteredAllocations.length}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Total Amount Allocated</p>
                <p className="text-2xl font-bold text-green-600">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(
                    filteredAllocations.reduce((sum, allocation) => 
                      sum + allocation.lines.reduce((lineSum, line) => lineSum + line.allocated_amount, 0), 0
                    )
                  )}
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {!isLoading && filteredAllocations.length === 0 && (filters.supplier_id || filters.start_date || filters.end_date) && (
        <div className="text-center py-8">
          <p className="text-gray-500">No allocations found for the selected criteria.</p>
        </div>
      )}

      {!filters.supplier_id && !filters.start_date && !filters.end_date && (
        <div className="text-center py-8">
          <p className="text-gray-500">Please select filters to view allocation report.</p>
        </div>
      )}
    </div>
  );
}
