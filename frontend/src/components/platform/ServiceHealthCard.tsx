'use client';

import { Card } from '@/components/ui/card';
import { CheckCircle2, AlertTriangle, XCircle, Activity } from 'lucide-react';

interface ServiceHealthCardProps {
  service: string;
  data: any;
}

export function ServiceHealthCard({ service, data }: ServiceHealthCardProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'operational':
        return {
          icon: CheckCircle2,
          color: 'text-green-500',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          label: 'Operational'
        };
      case 'degraded':
        return {
          icon: AlertTriangle,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          label: 'Degraded'
        };
      case 'outage':
        return {
          icon: XCircle,
          color: 'text-red-500',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          label: 'Outage'
        };
      default:
        return {
          icon: Activity,
          color: 'text-gray-500',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          label: 'Unknown'
        };
    }
  };

  const status = typeof data === 'string' ? data : data?.status || 'unknown';
  const { icon: Icon, color, bgColor, borderColor, label } = getStatusConfig(status);

  const formatServiceName = (name: string) => {
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <Card className={`p-4 ${bgColor} ${borderColor} border-2`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-900">{formatServiceName(service)}</h3>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      
      <div className="space-y-2">
        <div className={`text-sm font-medium ${color}`}>
          {label}
        </div>
        
        {typeof data === 'object' && data?.metrics && (
          <div className="space-y-1">
            {data.metrics.response_time && (
              <div className="text-xs text-gray-600">
                Response: {data.metrics.response_time}ms
              </div>
            )}
            {data.metrics.uptime && (
              <div className="text-xs text-gray-600">
                Uptime: {data.metrics.uptime}%
              </div>
            )}
            {data.metrics.cpu_usage && (
              <div className="text-xs text-gray-600">
                CPU: {data.metrics.cpu_usage}%
              </div>
            )}
            {data.metrics.memory_usage && (
              <div className="text-xs text-gray-600">
                Memory: {data.metrics.memory_usage}%
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
