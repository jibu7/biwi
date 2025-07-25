'use client';


import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Trash2, MapPin } from 'lucide-react';
import Link from 'next/link';
import { getWarehouses, deleteWarehouse } from '@/services/inventoryService';
import { usePermissions } from '@/hooks/usePermissions';
import { INV_SETUP_MANAGE } from '@/lib/permissions';

export default function WarehousesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: warehouses = [], isLoading, error } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => getWarehouses(),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteWarehouse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
    },
  });

  const filteredWarehouses = warehouses.filter(
    (warehouse) =>
      warehouse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      warehouse.warehouse_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (warehouse.location && warehouse.location.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this warehouse? This action cannot be undone.')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (error) {
        alert('Failed to delete warehouse. It may have inventory transactions.');
      }
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading warehouses</div>;

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Warehouses</h1>
        {hasPermission(INV_SETUP_MANAGE) && (
          <Link
            href="/maintenance/inventory/warehouses/new"
            className="bg-blue-500 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-blue-600"
          >
            <Plus size={20} />
            Add New Warehouse
          </Link>
        )}
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name, code, or location..."
          className="w-full md:w-96 px-4 py-2 border rounded-md"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredWarehouses.map((warehouse) => (
          <div key={warehouse.id} className="bg-white shadow-md rounded-lg p-6 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <MapPin size={20} className="text-blue-500" />
                <div>
                  <h3 className="text-lg font-semibold">{warehouse.name}</h3>
                  <p className="text-sm text-gray-500">Code: {warehouse.warehouse_code}</p>
                </div>
                {warehouse.is_default && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    Default
                  </span>
                )}
              </div>
              <span
                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  warehouse.is_active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {warehouse.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>

            {warehouse.location && (
              <p className="text-gray-600 mb-4">{warehouse.location}</p>
            )}

            {hasPermission(INV_SETUP_MANAGE) && (
              <div className="flex justify-end gap-2">
                <Link
                  href={`/maintenance/inventory/warehouses/${warehouse.id}`}
                  className="text-indigo-600 hover:text-indigo-900 p-1"
                >
                  <Edit size={18} />
                </Link>
                <button
                  onClick={() => handleDelete(warehouse.id)}
                  className="text-red-600 hover:text-red-900 p-1"
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredWarehouses.length === 0 && (
        <div className="text-center py-12">
          <MapPin size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No warehouses found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm ? 'Try adjusting your search terms.' : 'Get started by creating your first warehouse.'}
          </p>
          {hasPermission(INV_SETUP_MANAGE) && !searchTerm && (
            <Link
              href="/maintenance/inventory/warehouses/new"
              className="inline-flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
            >
              <Plus size={20} />
              Add New Warehouse
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
