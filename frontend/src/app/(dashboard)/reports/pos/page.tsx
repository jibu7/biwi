'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { BarChart, Users, Clock, TrendingUp } from 'lucide-react';

export default function POSReportsPage() {
  const router = useRouter();

  const reportItems = [
    {
      title: 'Cashier Sales Report',
      description: 'View sales performance by cashier',
      icon: Users,
      href: '/reports/pos/cashier-sales',
      color: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Inventory Sales Report',
      description: 'Analyze product sales and inventory movement',
      icon: BarChart,
      href: '/reports/pos/inventory-sales',
      color: 'bg-green-100 text-green-600',
    },
    {
      title: 'Session Summary Report',
      description: 'Review till sessions and cash reconciliation',
      icon: Clock,
      href: '/reports/pos/session-summary',
      color: 'bg-purple-100 text-purple-600',
    },
    {
      title: 'Sales Analytics',
      description: 'Advanced sales analytics and trends',
      icon: TrendingUp,
      href: '/reports/pos/analytics',
      color: 'bg-orange-100 text-orange-600',
      disabled: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">POS Reports</h1>
        <p className="text-gray-600">Point of Sale reporting and analytics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <Card key={index} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${item.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{item.description}</p>
                  <Button
                    onClick={() => router.push(item.href)}
                    disabled={item.disabled}
                    className="w-full"
                  >
                    {item.disabled ? 'Coming Soon' : 'View Report'}
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
