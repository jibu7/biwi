import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

const HealthItem = ({ name, status }: { name: string; status: string }) => {
  const statusConfig = {
    operational: { icon: CheckCircle2, color: 'text-green-500', label: 'Operational' },
    degraded: { icon: AlertTriangle, color: 'text-yellow-500', label: 'Degraded' },
    outage: { icon: XCircle, color: 'text-red-500', label: 'Outage' },
  };

  const { icon: Icon, color, label } = statusConfig[status as keyof typeof statusConfig] || statusConfig.degraded;

  return (
    <div className="flex items-center justify-between">
      <span>{name}</span>
      <div className={`flex items-center ${color}`}>
        <Icon className="h-4 w-4 mr-2" />
        <span>{label}</span>
      </div>
    </div>
  );
};

export const SystemHealthWidget = ({ health }: { health: any }) => {
  if (!health) return <div>Loading health...</div>;

  return (
    <div className="space-y-4">
      {Object.entries(health).map(([service, status]) => (
        <HealthItem key={service} name={service} status={status as string} />
      ))}
    </div>
  );
};
