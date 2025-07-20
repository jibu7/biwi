import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Building2, FileText, AlertTriangle } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, change, changeType }: any) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {change && (
        <p className={`text-xs ${changeType === 'increase' ? 'text-green-500' : 'text-red-500'}`}>
          {change}
        </p>
      )}
    </CardContent>
  </Card>
);

export const DashboardStats = ({ stats }: { stats: any }) => {
  if (!stats) return null;

  const statItems = [
    { title: 'Total Companies', value: stats.total_companies, icon: Building2 },
    { title: 'Active Subscriptions', value: stats.active_subscriptions, icon: Users },
    { title: 'Total Revenue (MTD)', value: `$${(stats.total_revenue_mtd / 100).toFixed(2)}`, icon: FileText },
    { title: 'System Issues', value: stats.system_issues, icon: AlertTriangle },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statItems.map((item) => (
        <StatCard key={item.title} {...item} />
      ))}
    </div>
  );
};
