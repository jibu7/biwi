'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Settings, Monitor, DollarSign } from 'lucide-react';

export default function POSMaintenancePage() {
  const router = useRouter();

  const menuItems = [
    {
      title: 'Till Management',
      description: 'Configure and manage POS tills',
      icon: Monitor,
      href: '/maintenance/pos/tills',
      color: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Transaction Types',
      description: 'Manage payment methods and transaction types',
      icon: DollarSign,
      href: '/maintenance/pos/transaction-types',
      color: 'bg-green-100 text-green-600',
    },
    {
      title: 'POS Settings',
      description: 'Configure general POS system settings',
      icon: Settings,
      href: '/maintenance/pos/settings',
      color: 'bg-purple-100 text-purple-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">POS Maintenance</h1>
        <p className="text-gray-600">Manage Point of Sale system configuration</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map((item, index) => {
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
                    className="w-full"
                  >
                    Manage
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
