'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { platformService } from '@/services/platformService';
import { AlertTriangle, CheckCircle, XCircle, Clock, Trash2 } from 'lucide-react';

interface Alert {
  id: number;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: string;
  resolved: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export function AlertsList() {
  const { data: alerts, isLoading, refetch } = useQuery({
    queryKey: ['system-alerts'],
    queryFn: async () => {
      // Mock data for now - in a real implementation, you'd call platformService.getAlerts()
      const mockAlerts: Alert[] = [
        {
          id: 1,
          type: 'error',
          title: 'High Memory Usage',
          message: 'Memory usage has exceeded 85% on the main application server',
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          resolved: false,
          severity: 'high'
        },
        {
          id: 2,
          type: 'warning',
          title: 'Slow Database Queries',
          message: 'Database response time is above normal thresholds',
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          resolved: false,
          severity: 'medium'
        },
        {
          id: 3,
          type: 'info',
          title: 'Scheduled Maintenance',
          message: 'System maintenance scheduled for tomorrow at 2:00 AM UTC',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          resolved: false,
          severity: 'low'
        },
        {
          id: 4,
          type: 'success',
          title: 'Backup Completed',
          message: 'Daily database backup completed successfully',
          timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          resolved: true,
          severity: 'low'
        }
      ];
      return mockAlerts;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const severityConfig = {
      critical: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-blue-100 text-blue-800 border-blue-200'
    };

    return (
      <Badge className={severityConfig[severity as keyof typeof severityConfig] || severityConfig.low}>
        {severity.toUpperCase()}
      </Badge>
    );
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffMins < 1440) {
      return `${Math.floor(diffMins / 60)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleDismissAlert = (alertId: number) => {
    // In a real implementation, you'd call an API to dismiss the alert
    console.log('Dismissing alert:', alertId);
    refetch();
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">System Alerts</h3>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  const activeAlerts = alerts?.filter(alert => !alert.resolved) || [];
  const recentAlerts = alerts?.slice(0, 5) || [];

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">System Alerts</h3>
        <Badge variant="outline" className="text-xs">
          {activeAlerts.length} active
        </Badge>
      </div>
      
      {recentAlerts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
          <p>All systems operational</p>
          <p className="text-sm">No active alerts</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recentAlerts.map((alert) => (
            <div 
              key={alert.id} 
              className={`p-3 rounded-lg border ${
                alert.resolved ? 'bg-gray-50 opacity-75' : 'bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  {getAlertIcon(alert.type)}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className={`text-sm font-medium ${
                        alert.resolved ? 'text-gray-600 line-through' : 'text-gray-900'
                      }`}>
                        {alert.title}
                      </h4>
                      {getSeverityBadge(alert.severity)}
                    </div>
                    <p className={`text-xs ${
                      alert.resolved ? 'text-gray-500' : 'text-gray-600'
                    }`}>
                      {alert.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatTimestamp(alert.timestamp)}
                    </p>
                  </div>
                </div>
                
                {!alert.resolved && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDismissAlert(alert.id)}
                    className="ml-2 h-6 w-6 p-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-4 text-xs text-gray-500 text-center">
        Alerts updated every 30 seconds
      </div>
    </Card>
  );
}
