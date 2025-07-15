'use client';


import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, AlertCircle, Info, CheckCircle, Bell, Settings } from 'lucide-react';
import { platformService, PlatformAlert } from '@/services/platformService';

const alertIcons = {
  critical: AlertTriangle,
  warning: AlertCircle,
  info: Info,
  success: CheckCircle,
};

const alertColors = {
  critical: 'bg-red-100 text-red-800 border-red-200',
  warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  info: 'bg-blue-100 text-blue-800 border-blue-200',
  success: 'bg-green-100 text-green-800 border-green-200',
};

const badgeColors = {
  critical: 'destructive',
  warning: 'default',
  info: 'secondary',
  success: 'default',
} as const;

export default function PlatformAlertsPage() {
  const [filter, setFilter] = useState<string>('all');

  // Fetch alerts from the API
  const { data: alerts = [], isLoading, refetch } = useQuery({
    queryKey: ['platform-alerts', filter],
    queryFn: () => platformService.getAlerts({
      alert_type: filter === 'all' ? undefined : filter,
      resolved: filter === 'unresolved' ? false : undefined,
      limit: 100,
    }),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true;
    if (filter === 'unresolved') return !alert.resolved;
    return alert.type === filter;
  });

  // Count alerts by type
  const alertCounts = {
    all: alerts.length,
    critical: alerts.filter(a => a.type === 'critical').length,
    warning: alerts.filter(a => a.type === 'warning').length,
    info: alerts.filter(a => a.type === 'info').length,
    success: alerts.filter(a => a.type === 'success').length,
    unresolved: alerts.filter(a => !a.resolved).length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const criticalCount = alerts.filter(a => a.type === 'critical' && !a.resolved).length;
  const warningCount = alerts.filter(a => a.type === 'warning' && !a.resolved).length;
  const unresolvedCount = alerts.filter(a => !a.resolved).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Platform Alerts</h1>
          <p className="mt-2 text-gray-600">
            Monitor system alerts and notifications across all tenant companies
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Alert Settings
          </Button>
          <Button>
            <Bell className="h-4 w-4 mr-2" />
            Configure Notifications
          </Button>
        </div>
      </div>

      {/* Alert Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{alertCounts.critical}</div>
            <p className="text-xs text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warnings</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{alertCounts.warning}</div>
            <p className="text-xs text-muted-foreground">
              Need monitoring
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unresolved</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alertCounts.unresolved}</div>
            <p className="text-xs text-muted-foreground">
              Total pending alerts
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Today</CardTitle>
            <Info className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alertCounts.all}</div>
            <p className="text-xs text-muted-foreground">
              All alerts today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Alert Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Button 
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
            >
              All Alerts ({alertCounts.all})
            </Button>
            <Button 
              variant={filter === 'unresolved' ? 'default' : 'outline'}
              onClick={() => setFilter('unresolved')}
            >
              Unresolved ({alertCounts.unresolved})
            </Button>
            <Button 
              variant={filter === 'critical' ? 'default' : 'outline'}
              onClick={() => setFilter('critical')}
            >
              Critical ({alertCounts.critical})
            </Button>
            <Button 
              variant={filter === 'warning' ? 'default' : 'outline'}
              onClick={() => setFilter('warning')}
            >
              Warnings ({alertCounts.warning})
            </Button>
            <Button 
              variant={filter === 'info' ? 'default' : 'outline'}
              onClick={() => setFilter('info')}
            >
              Info ({alertCounts.info})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.map((alert) => {
          const IconComponent = alertIcons[alert.type];
          return (
            <Card key={alert.id} className={`border-l-4 ${alertColors[alert.type]}`}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <IconComponent className="h-5 w-5 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{alert.title}</h3>
                        <Badge variant={badgeColors[alert.type]}>
                          {alert.type.charAt(0).toUpperCase() + alert.type.slice(1)}
                        </Badge>
                        {alert.resolved && (
                          <Badge variant="outline">Resolved</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{alert.message}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{new Date(alert.timestamp).toLocaleString()}</span>
                        {alert.company && (
                          <span>Company: {alert.company}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!alert.resolved && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          // In a real app, this would call an API to resolve the alert
                          refetch();
                        }}
                      >
                        Mark Resolved
                      </Button>
                    )}
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredAlerts.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Alerts Found</h3>
              <p className="text-gray-600">
                {filter === 'all' 
                  ? "No alerts to display" 
                  : `No ${filter} alerts at this time`
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
