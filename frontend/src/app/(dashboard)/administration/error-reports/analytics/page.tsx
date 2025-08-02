'use client';

import { useQuery } from '@tanstack/react-query';
import { errorService } from '@/services/errorService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Bug, TrendingUp, TrendingDown, Clock, CheckCircle } from 'lucide-react';

export default function ErrorAnalyticsPage() {
  // Fetch statistics
  const { data: stats, isLoading } = useQuery({
    queryKey: ['bugReportStats'],
    queryFn: errorService.getBugReportStats,
  });

  // Fetch recent reports for trends
  const { data: recentReports } = useQuery({
    queryKey: ['recentBugReports'],
    queryFn: () => errorService.getBugReports({ limit: 20 }),
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-gray-500">No error statistics available</p>
        </div>
      </div>
    );
  }

  // Calculate percentages and trends
  const totalErrors = stats.total;
  const resolvedErrors = stats.by_status.fixed + stats.by_status.cannot_reproduce;
  const pendingErrors = stats.by_status.new + stats.by_status.investigating;
  const resolutionRate = totalErrors > 0 ? (resolvedErrors / totalErrors) * 100 : 0;
  const criticalRate = totalErrors > 0 ? (stats.by_severity.critical / totalErrors) * 100 : 0;

  // Get recent error trends (last 24 hours simulation)
  const recentCritical = recentReports?.filter(r => r.severity === 'critical').length || 0;
  const recentFixed = recentReports?.filter(r => r.status === 'fixed').length || 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Error Analytics Dashboard</h1>
        <div className="text-sm text-gray-500">
          Real-time error tracking and analysis
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
              <Bug className="h-4 w-4 mr-2" />
              Total Errors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalErrors}</div>
            <div className="text-xs text-gray-500 mt-1">All time</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Critical Errors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.by_severity.critical}</div>
            <div className="text-xs text-gray-500 mt-1">
              {criticalRate.toFixed(1)}% of total
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              Resolution Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{resolutionRate.toFixed(1)}%</div>
            <div className="text-xs text-gray-500 mt-1">
              {resolvedErrors} of {totalErrors} resolved
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Pending Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pendingErrors}</div>
            <div className="text-xs text-gray-500 mt-1">
              Require attention
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Error Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats.by_status).map(([status, count]) => {
                const percentage = totalErrors > 0 ? (count / totalErrors) * 100 : 0;
                const colors = {
                  new: 'bg-red-500',
                  investigating: 'bg-yellow-500',
                  fixed: 'bg-green-500',
                  cannot_reproduce: 'bg-gray-500'
                };
                
                return (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${colors[status as keyof typeof colors]}`} />
                      <span className="text-sm font-medium capitalize">{status.replace('_', ' ')}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">{count}</span>
                      <span className="text-xs text-gray-500">({percentage.toFixed(1)}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Severity Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats.by_severity).map(([severity, count]) => {
                const percentage = totalErrors > 0 ? (count / totalErrors) * 100 : 0;
                const colors = {
                  critical: 'bg-red-600',
                  high: 'bg-orange-500',
                  medium: 'bg-yellow-500',
                  low: 'bg-blue-500'
                };
                
                return (
                  <div key={severity} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${colors[severity as keyof typeof colors]}`} />
                      <span className="text-sm font-medium capitalize">{severity}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">{count}</span>
                      <span className="text-xs text-gray-500">({percentage.toFixed(1)}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Type Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Error Type Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(stats.by_type).map(([type, count]) => {
              const percentage = totalErrors > 0 ? (count / totalErrors) * 100 : 0;
              const icons = {
                frontend: Bug,
                backend: AlertTriangle,
                integration: TrendingUp
              };
              const Icon = icons[type as keyof typeof icons] || Bug;
              
              return (
                <div key={type} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Icon className="h-4 w-4 text-gray-500" />
                      <span className="font-medium capitalize">{type}</span>
                    </div>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                  <div className="text-xs text-gray-500">
                    {percentage.toFixed(1)}% of total errors
                  </div>
                  <div className="mt-2 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Health Score */}
      <Card>
        <CardHeader>
          <CardTitle>System Health Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-green-600">
                {Math.max(0, 100 - criticalRate - (pendingErrors / totalErrors * 20)).toFixed(0)}
              </div>
              <div className="text-sm text-gray-500">
                Health Score (0-100)
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex items-center">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-2" />
                  <span>{recentFixed} fixed recently</span>
                </div>
                <div className="flex items-center">
                  <TrendingDown className="h-4 w-4 text-red-500 mr-2" />
                  <span>{recentCritical} critical issues</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="text-xs text-gray-500 mb-2">Health Factors:</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Resolution Rate</span>
                <span className="text-green-600">+{resolutionRate.toFixed(0)} points</span>
              </div>
              <div className="flex justify-between">
                <span>Critical Error Rate</span>
                <span className="text-red-600">-{criticalRate.toFixed(0)} points</span>
              </div>
              <div className="flex justify-between">
                <span>Pending Issues Impact</span>
                <span className="text-orange-600">-{((pendingErrors / totalErrors) * 20).toFixed(0)} points</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}