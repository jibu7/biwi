'use client';


import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { FileText, Calculator, Receipt, Globe } from 'lucide-react';

export default function TaxReportsPage() {
  const router = useRouter();

  const reportItems = [
    {
      title: 'Tax Summary Report',
      description: 'View consolidated tax summary by type and period',
      icon: Calculator,
      href: '/reports/tax/summary',
      color: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Detailed Tax Report',
      description: 'View detailed tax transactions and calculations',
      icon: FileText,
      href: '/reports/tax/detailed',
      color: 'bg-green-100 text-green-600',
    },
    {
      title: 'Tax Return Data',
      description: 'Generate data for tax return preparation',
      icon: Receipt,
      href: '/reports/tax/return-data',
      color: 'bg-purple-100 text-purple-600',
    },
    {
      title: 'Multi-Currency Tax Report',
      description: 'View tax reports across multiple currencies',
      icon: Globe,
      href: '/reports/tax/multi-currency',
      color: 'bg-orange-100 text-orange-600',
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Tax Reports</h1>
      <p className="text-gray-600 mb-8">
        Generate comprehensive tax reports for your business needs, including summary reports, 
        detailed transaction analysis, and multi-currency tax calculations.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <Card key={item.href} className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg ${item.color}`}>
                  <IconComponent className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{item.description}</p>
                  <Button 
                    onClick={() => router.push(item.href)}
                    variant="outline" 
                    size="sm"
                  >
                    View Report
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
