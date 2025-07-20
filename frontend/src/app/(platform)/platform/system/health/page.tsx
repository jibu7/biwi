'use client';

import { useQuery } from '@tanstack/react-query';
import { platformService } from '@/services/platformService';
import { ServiceHealthCard } from '@/components/platform/ServiceHealthCard';
import { HealthMetricsChart } from '@/components/platform/HealthMetricsChart';
import { AlertsList } from '@/components/platform/AlertsList';

export default function SystemHealthPage() {
  const { data: health, isLoading } = useQuery({
    queryKey: ['system-health-detailed'],
    queryFn: platformService.getSystemHealthDetailed,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  if (isLoading) return <div>Loading health data...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">System Health Monitor</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {health && health.services && Object.entries(health.services).map(([service, data]) => (
          <ServiceHealthCard
            key={service}
            service={service}
            data={data}
          />
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HealthMetricsChart />
        <AlertsList />
      </div>
    </div>
  );
}
