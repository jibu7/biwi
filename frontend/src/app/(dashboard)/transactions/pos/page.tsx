'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ShoppingCart, CreditCard, Receipt, BarChart } from 'lucide-react';

export default function POSTransactionsPage() {
  const router = useRouter();

  const transactionItems = [
    {
      title: 'POS Terminal',
      description: 'Process sales and handle customer transactions',
      icon: ShoppingCart,
      href: '/transactions/pos/terminal',
      color: 'bg-blue-100 text-blue-600',
      primary: true,
    },
    {
      title: 'Payment Processing',
      description: 'Handle various payment methods and refunds',
      icon: CreditCard,
      href: '/transactions/pos/payments',
      color: 'bg-green-100 text-green-600',
      disabled: true,
    },
    {
      title: 'Receipt Management',
      description: 'Reprint receipts and manage transaction records',
      icon: Receipt,
      href: '/transactions/pos/receipts',
      color: 'bg-purple-100 text-purple-600',
      disabled: true,
    },
    {
      title: 'Quick Sales',
      description: 'Fast checkout for common items',
      icon: BarChart,
      href: '/transactions/pos/quick-sales',
      color: 'bg-orange-100 text-orange-600',
      disabled: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">POS Transactions</h1>
        <p className="text-gray-600">Point of Sale transaction processing</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {transactionItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <Card 
              key={index} 
              className={`p-6 hover:shadow-md transition-shadow ${
                item.primary ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${item.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{item.title}</h3>
                    {item.primary && (
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded-full">
                        Primary
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{item.description}</p>
                  <Button
                    onClick={() => router.push(item.href)}
                    disabled={item.disabled}
                    className="w-full"
                    variant={item.primary ? 'default' : 'outline'}
                  >
                    {item.disabled ? 'Coming Soon' : item.primary ? 'Open Terminal' : 'Access'}
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Quick Access Section */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Access</h2>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => router.push('/transactions/pos/terminal')}
            className="flex items-center gap-2"
          >
            <ShoppingCart className="h-4 w-4" />
            Start POS Terminal
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/reports/pos/cashier-sales')}
            className="flex items-center gap-2"
          >
            <BarChart className="h-4 w-4" />
            Today's Sales
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/maintenance/pos/tills')}
            className="flex items-center gap-2"
          >
            <Receipt className="h-4 w-4" />
            Manage Tills
          </Button>
        </div>
      </Card>
    </div>
  );
}
