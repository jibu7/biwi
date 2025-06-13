'use client';

import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { apService } from '@/services/apService';
import { Table } from '@/components/ui/Table';

export default function SupplierListingPage() {
  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['supplierListing'],
    queryFn: () => apService.getSupplierListing(),
  });

  const columns = [
    { header: 'Code', accessor: 'supplier_code' as keyof typeof suppliers[0] },
    { header: 'Name', accessor: 'name' as keyof typeof suppliers[0] },
    { header: 'Payment Terms', accessor: 'payment_terms' as keyof typeof suppliers[0] },
    {
      header: 'Current Balance',
      accessor: (supplier: typeof suppliers[0]) => (
        <span className={supplier.current_balance > 0 ? 'text-red-600' : ''}>
          {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
          }).format(supplier.current_balance)}
        </span>
      ),
    },
    {
      header: 'Address',
      accessor: (supplier: typeof suppliers[0]) => {
        if (supplier.address) {
          const addr = supplier.address as any;
          return `${addr.street || ''} ${addr.city || ''} ${addr.state || ''}`.trim();
        }
        return '-';
      },
    },
    {
      header: 'Contact',
      accessor: (supplier: typeof suppliers[0]) => {
        if (supplier.contact_info) {
          const contact = supplier.contact_info as any;
          return contact.phone || contact.email || '-';
        }
        return '-';
      },
    },
    {
      header: 'Status',
      accessor: (supplier: typeof suppliers[0]) => (
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            supplier.is_active
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {supplier.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];

  const handleExport = () => {
    // Implementation for exporting the report
    console.log('Export supplier listing');
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Supplier Listing</h1>
          <p className="mt-1 text-sm text-gray-600">
            Complete list of all suppliers with their details
          </p>
        </div>
        <button
          onClick={handleExport}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <Download className="h-4 w-4 mr-2" />
          Export
        </button>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Showing {suppliers.length} suppliers
        </p>
      </div>

      <Table data={suppliers} columns={columns} />

      {suppliers.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Suppliers</p>
              <p className="text-2xl font-bold text-blue-600">{suppliers.length}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Active Suppliers</p>
              <p className="text-2xl font-bold text-green-600">
                {suppliers.filter(s => s.is_active).length}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Outstanding</p>
              <p className="text-2xl font-bold text-red-600">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                }).format(suppliers.reduce((sum, s) => sum + s.current_balance, 0))}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
