'use client';


import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { bomService } from '@/services/bomService';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ManufacturingOrder } from '@/types/bom';

interface Stats {
  totalOrders: number;
  completedOrders: number;
  inProgressOrders: number;
  plannedOrders: number;
  totalQuantityManufactured: number;
  averageCompletionTime: string;
}

export default function ManufacturingProcessReportPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const { data: orders } = useQuery({
    queryKey: ['manufacturing-orders-report', statusFilter, dateRange],
    queryFn: () => bomService.getManufacturingOrders(statusFilter || undefined)
  });

  // Calculate statistics
  const stats: Stats | null = orders ? {
    totalOrders: orders.length,
    completedOrders: orders.filter(o => o.status === 'Completed').length,
    inProgressOrders: orders.filter(o => o.status === 'In Progress' || o.status === 'Released').length,
    plannedOrders: orders.filter(o => o.status === 'Planned').length,
    totalQuantityManufactured: orders
      .filter(o => o.status === 'Completed')
      .reduce((sum, o) => sum + parseFloat(o.quantity_completed.toString()), 0),
    averageCompletionTime: calculateAverageCompletionTime(orders.filter(o => o.status === 'Completed'))
  } : null;

  function calculateAverageCompletionTime(completedOrders: ManufacturingOrder[]): string {
    if (completedOrders.length === 0) return '0';
    
    const totalDays = completedOrders.reduce((sum, order) => {
      if (order.start_date && order.completion_date) {
        const start = new Date(order.start_date);
        const end = new Date(order.completion_date);
        const days = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
        return sum + days;
      }
      return sum;
    }, 0);
    
    return (totalDays / completedOrders.length).toFixed(1);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Manufacturing Process Report</h1>

      <div className="grid grid-cols-4 gap-4">
        <div className="col-span-1">
          <label className="text-sm font-medium">Status Filter</label>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="Planned">Planned</option>
            <option value="Released">Released</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </Select>
        </div>

        <div className="col-span-1">
          <label className="text-sm font-medium">Start Date</label>
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
            className="w-full px-3 py-2 border rounded"
          />
        </div>

        <div className="col-span-1">
          <label className="text-sm font-medium">End Date</label>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
            className="w-full px-3 py-2 border rounded"
          />
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Total Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.totalOrders}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Completed Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{stats.completedOrders}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">{stats.inProgressOrders}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Total Quantity Manufactured</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.totalQuantityManufactured.toFixed(2)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Average Completion Time</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.averageCompletionTime} days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Planned Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-yellow-600">{stats.plannedOrders}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Order Details</h2>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                BOM Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Qty to Make
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Qty Completed
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Due Date
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders?.map((order) => (
              <tr key={order.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {order.order_number}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {order.bom_header?.bom_code}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 py-1 rounded text-xs ${
                    order.status === 'Completed' ? 'bg-green-100 text-green-800' :
                    order.status === 'Released' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {order.quantity_to_manufacture}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {order.quantity_completed}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {new Date(order.order_date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {order.due_date ? new Date(order.due_date).toLocaleDateString() : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
