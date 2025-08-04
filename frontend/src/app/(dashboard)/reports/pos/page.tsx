'use client';

import { useRouter } from 'next/navigation';
import { ReportCard, ReportPageLayout } from '@/components/reports';
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
    <ReportPageLayout
      title="POS Reports"
      description="Point of Sale reporting and analytics"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportItems.map((item, index) => (
          <ReportCard
            key={index}
            title={item.title}
            description={item.description}
            icon={item.icon}
            color={item.color}
            disabled={item.disabled}
            onClick={() => router.push(item.href)}
          />
        ))}
      </div>
    </ReportPageLayout>
  );
}
