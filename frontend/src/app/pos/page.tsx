'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Calculator, 
  Settings, 
  Receipt, 
  FileText,
  BarChart3,
  CreditCard,
  Users,
  Package
} from 'lucide-react';

export default function POSMainPage() {
  const posModules = [
    {
      title: 'Point of Sale',
      description: 'Process sales and returns',
      icon: Calculator,
      href: '/pos/sale',
      color: 'bg-blue-500',
    },
    {
      title: 'Till Management',
      description: 'Manage cash registers and tills',
      icon: CreditCard,
      href: '/maintenance/pos/tills',
      color: 'bg-green-500',
    },
    {
      title: 'Transaction Types',
      description: 'Configure transaction types',
      icon: FileText,
      href: '/maintenance/pos/transaction-types',
      color: 'bg-purple-500',
    },
    {
      title: 'POS Defaults',
      description: 'Configure default POS settings',
      icon: Settings,
      href: '/maintenance/pos/defaults',
      color: 'bg-orange-500',
    },
    {
      title: 'Session Management',
      description: 'Open, close, and reconcile till sessions',
      icon: Users,
      href: '/pos/sessions',
      color: 'bg-teal-500',
    },
    {
      title: 'Reports',
      description: 'View sales and cashier reports',
      icon: BarChart3,
      href: '/pos/reports',
      color: 'bg-red-500',
    },
    {
      title: 'Inventory',
      description: 'Manage inventory items',
      icon: Package,
      href: '/inventory',
      color: 'bg-indigo-500',
    },
    {
      title: 'Receipt Preview',
      description: 'Preview and test receipt printing',
      icon: Receipt,
      href: '/pos/receipt-preview',
      color: 'bg-gray-500',
    },
  ];

  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Point of Sale System</h1>
        <p className="text-muted-foreground">
          Manage your retail operations with our comprehensive POS system
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {posModules.map((module) => (
          <Card key={module.href} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${module.color} text-white`}>
                  <module.icon className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">{module.title}</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                {module.description}
              </CardDescription>
              <Button asChild className="w-full">
                <Link href={module.href}>
                  Open {module.title}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
            <CardDescription>Today's performance overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sales Today</span>
                <span className="font-semibold">$0.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Transactions</span>
                <span className="font-semibold">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Active Tills</span>
                <span className="font-semibold">0</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>Set up your POS system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <Link href="/maintenance/pos/tills" className="text-sm hover:underline">
                  Configure your tills
                </Link>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <Link href="/maintenance/pos/transaction-types" className="text-sm hover:underline">
                  Set up transaction types
                </Link>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <Link href="/maintenance/pos/defaults" className="text-sm hover:underline">
                  Configure default settings
                </Link>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <Link href="/pos/sale" className="text-sm hover:underline">
                  Start processing sales
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
