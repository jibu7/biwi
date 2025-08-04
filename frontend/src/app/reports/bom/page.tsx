'use client';

import { useRouter } from 'next/navigation';
import { ReportCard, ReportPageLayout } from '@/components/reports';
import { BarChart3, TrendingUp } from 'lucide-react';

export default function ReportsBomPage() {
  const router = useRouter();

  const reportItems = [
    {
      title: 'Material Requirements Planning',
      description: 'Plan material requirements based on production schedules',
      icon: TrendingUp,
      href: '/reports/bom/mrp',
      color: 'bg-purple-100 text-purple-600',
    },
    {
      title: 'Manufacturing Process Report',
      description: 'Monitor manufacturing processes and efficiency metrics',
      icon: BarChart3,
      href: '/reports/bom/manufacturing-process',
      color: 'bg-indigo-100 text-indigo-600',
    },
  ];

  return (
    <ReportPageLayout
      title="BOM Reports"
      description="View manufacturing and material planning reports"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportItems.map((item, index) => (
          <ReportCard
            key={index}
            title={item.title}
            description={item.description}
            icon={item.icon}
            color={item.color}
            onClick={() => router.push(item.href)}
          />
        ))}
      </div>
    </ReportPageLayout>
  );
}
