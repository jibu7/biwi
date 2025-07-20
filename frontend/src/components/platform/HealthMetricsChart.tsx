'use client';

import { Card } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { Activity, Cpu, MemoryStick, Clock } from 'lucide-react';

export function HealthMetricsChart() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['health-metrics'],
    queryFn: async () => {
      // Mock data for now - in a real implementation, you'd call a specific metrics endpoint
      return {
        cpu: Math.random() * 30 + 20,
        memory: Math.random() * 40 + 30,
        responseTime: Math.random() * 100 + 50,
        uptime: 99.9,
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">System Metrics</h3>
        <div className="h-64 flex items-center justify-center">
          <div>Loading metrics...</div>
        </div>
      </Card>
    );
  }

  const metricCards = [
    {
      name: 'CPU Usage',
      value: `${metrics?.cpu?.toFixed(1) || '0.0'}%`,
      icon: Cpu,
      color: (metrics?.cpu || 0) > 80 ? 'text-red-500' : (metrics?.cpu || 0) > 60 ? 'text-yellow-500' : 'text-green-500',
      bgColor: (metrics?.cpu || 0) > 80 ? 'bg-red-50' : (metrics?.cpu || 0) > 60 ? 'bg-yellow-50' : 'bg-green-50',
    },
    {
      name: 'Memory Usage',
      value: `${metrics?.memory?.toFixed(1) || '0.0'}%`,
      icon: MemoryStick,
      color: (metrics?.memory || 0) > 80 ? 'text-red-500' : (metrics?.memory || 0) > 60 ? 'text-yellow-500' : 'text-green-500',
      bgColor: (metrics?.memory || 0) > 80 ? 'bg-red-50' : (metrics?.memory || 0) > 60 ? 'bg-yellow-50' : 'bg-green-50',
    },
    {
      name: 'Response Time',
      value: `${metrics?.responseTime?.toFixed(0) || '0'}ms`,
      icon: Clock,
      color: (metrics?.responseTime || 0) > 200 ? 'text-red-500' : (metrics?.responseTime || 0) > 100 ? 'text-yellow-500' : 'text-green-500',
      bgColor: (metrics?.responseTime || 0) > 200 ? 'bg-red-50' : (metrics?.responseTime || 0) > 100 ? 'bg-yellow-50' : 'bg-green-50',
    },
    {
      name: 'Uptime',
      value: `${metrics?.uptime?.toFixed(1) || '0.0'}%`,
      icon: Activity,
      color: (metrics?.uptime || 0) < 99 ? 'text-red-500' : (metrics?.uptime || 0) < 99.5 ? 'text-yellow-500' : 'text-green-500',
      bgColor: (metrics?.uptime || 0) < 99 ? 'bg-red-50' : (metrics?.uptime || 0) < 99.5 ? 'bg-yellow-50' : 'bg-green-50',
    },
  ];

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">System Metrics</h3>
      
      <div className="grid grid-cols-2 gap-4">
        {metricCards.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.name} className={`p-4 rounded-lg ${metric.bgColor}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{metric.name}</p>
                  <p className={`text-2xl font-bold ${metric.color}`}>{metric.value}</p>
                </div>
                <Icon className={`h-8 w-8 ${metric.color}`} />
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 text-xs text-gray-500 text-center">
        Metrics updated every 30 seconds
      </div>
    </Card>
  );
}
