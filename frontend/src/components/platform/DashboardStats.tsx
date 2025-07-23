import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Building2, DollarSign, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, change, changeType, color, bgGradient }: any) => (
  <Card className={`border-0 shadow-md hover:shadow-lg transition-all duration-300 group cursor-pointer ${bgGradient}`}>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
      <CardTitle className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">
        {title}
      </CardTitle>
      <div className={`p-2 rounded-xl shadow-sm group-hover:scale-110 transition-transform duration-300 ${color}`}>
        <Icon className="h-4 w-4 text-white" />
      </div>
    </CardHeader>
    <CardContent className="pt-0">
      <div className="text-3xl font-bold text-slate-900 mb-2 group-hover:scale-105 transition-transform duration-300">
        {value}
      </div>
      {change && (
        <div className="flex items-center gap-1">
          {changeType === 'increase' ? (
            <TrendingUp className="h-3 w-3 text-green-600" />
          ) : (
            <TrendingDown className="h-3 w-3 text-red-500" />
          )}
          <p className={`text-xs font-medium ${changeType === 'increase' ? 'text-green-600' : 'text-red-500'}`}>
            {change}
          </p>
        </div>
      )}
    </CardContent>
  </Card>
);

export const DashboardStats = ({ stats }: { stats: any }) => {
  if (!stats) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-0 shadow-md bg-gradient-to-br from-slate-50 to-slate-100">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="h-4 w-24 bg-slate-200 rounded animate-pulse"></div>
                <div className="h-8 w-8 bg-slate-200 rounded-xl animate-pulse"></div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-8 w-16 bg-slate-200 rounded animate-pulse mb-2"></div>
              <div className="h-3 w-12 bg-slate-200 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statItems = [
    { 
      title: 'Total Companies', 
      value: stats.total_companies?.toLocaleString() || '0', 
      icon: Building2,
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      bgGradient: 'bg-gradient-to-br from-blue-50 to-blue-100/50',
      change: '+12.5%',
      changeType: 'increase'
    },
    { 
      title: 'Active Subscriptions', 
      value: stats.active_subscriptions?.toLocaleString() || '0', 
      icon: Users,
      color: 'bg-gradient-to-br from-green-500 to-emerald-600',
      bgGradient: 'bg-gradient-to-br from-green-50 to-emerald-100/50',
      change: '+8.2%',
      changeType: 'increase'
    },
    { 
      title: 'Revenue (MTD)', 
      value: `$${((stats.total_revenue_mtd || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 
      icon: DollarSign,
      color: 'bg-gradient-to-br from-purple-500 to-purple-600',
      bgGradient: 'bg-gradient-to-br from-purple-50 to-purple-100/50',
      change: '+15.3%',
      changeType: 'increase'
    },
    { 
      title: 'System Issues', 
      value: stats.system_issues?.toLocaleString() || '0', 
      icon: AlertTriangle,
      color: stats.system_issues > 0 ? 'bg-gradient-to-br from-red-500 to-red-600' : 'bg-gradient-to-br from-slate-400 to-slate-500',
      bgGradient: stats.system_issues > 0 ? 'bg-gradient-to-br from-red-50 to-red-100/50' : 'bg-gradient-to-br from-slate-50 to-slate-100/50',
      change: stats.system_issues > 0 ? '+2.1%' : '-100%',
      changeType: stats.system_issues > 0 ? 'increase' : 'decrease'
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {statItems.map((item) => (
        <StatCard key={item.title} {...item} />
      ))}
    </div>
  );
};
