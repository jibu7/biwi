'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Shield, 
  Lock, 
  Key, 
  Eye, 
  AlertTriangle, 
  CheckCircle, 
  Settings,
  UserCheck,
  Database,
  Network,
  Activity
} from 'lucide-react';
import { platformService } from '@/services/platformService';

export default function PlatformSecurityPage() {
  const [mfaEnabled, setMfaEnabled] = useState(true);
  const [ipWhitelistEnabled, setIpWhitelistEnabled] = useState(false);
  const [auditLoggingEnabled, setAuditLoggingEnabled] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState('24');

  // Fetch security statistics
  const { data: securityStats, isLoading: statsLoading } = useQuery({
    queryKey: ['platform-security-stats'],
    queryFn: platformService.getSecurityStats,
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch recent security events
  const { data: securityEvents, isLoading: eventsLoading } = useQuery({
    queryKey: ['platform-security-events'],
    queryFn: () => platformService.getSecurityEvents({ limit: 10 }),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Platform Security</h1>
          <p className="mt-2 text-gray-600">
            Configure security settings and monitor security events
          </p>
        </div>
        <Button>
          <Settings className="h-4 w-4 mr-2" />
          Security Settings
        </Button>
      </div>

      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Successful Logins</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{securityStats?.successful_logins_24h || 0}</div>
            <p className="text-xs text-muted-foreground">
              Last 24 hours
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin Actions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityStats?.admin_actions_7d || 0}</div>
            <p className="text-xs text-muted-foreground">
              Last 7 days
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Logins</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{securityStats?.failed_logins_24h || 0}</div>
            <p className="text-xs text-muted-foreground">
              Last 24 hours
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspended Companies</CardTitle>
            <Shield className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{securityStats?.suspended_companies || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total suspended
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Security Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Multi-Factor Authentication</Label>
                <div className="text-sm text-muted-foreground">
                  Require MFA for all platform administrators
                </div>
              </div>
              <input 
                type="checkbox" 
                checked={mfaEnabled}
                onChange={(e) => setMfaEnabled(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">IP Whitelist</Label>
                <div className="text-sm text-muted-foreground">
                  Restrict access to specific IP addresses
                </div>
              </div>
              <input 
                type="checkbox" 
                checked={ipWhitelistEnabled}
                onChange={(e) => setIpWhitelistEnabled(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="session-timeout">Session Timeout (hours)</Label>
              <Input
                id="session-timeout"
                type="number"
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(e.target.value)}
                className="w-24"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Key className="h-4 w-4 mr-2" />
                Manage API Keys
              </Button>
              <Button variant="outline" size="sm">
                <UserCheck className="h-4 w-4 mr-2" />
                User Permissions
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Audit & Monitoring</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Audit Logging</Label>
                <div className="text-sm text-muted-foreground">
                  Log all platform administrator actions
                </div>
              </div>
              <input 
                type="checkbox" 
                checked={auditLoggingEnabled}
                onChange={(e) => setAuditLoggingEnabled(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>

            <div className="space-y-2">
              <Label>Log Retention Period</Label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>90 days</option>
                <option>180 days</option>
                <option>1 year</option>
                <option>2 years</option>
              </select>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Database className="h-4 w-4 mr-2" />
                Export Logs
              </Button>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                View Audit Trail
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Events */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Security Events</CardTitle>
        </CardHeader>
        <CardContent>
          {eventsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {securityEvents?.slice(0, 5).map((event, index) => (
                <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                  <Shield className="h-5 w-5 text-blue-500" />
                  <div className="flex-1">
                    <p className="font-medium">{event.action.replace(/_/g, ' ').toUpperCase()}</p>
                    <p className="text-sm text-muted-foreground">
                      User ID: {event.user_id} | {new Date(event.timestamp).toLocaleString()}
                    </p>
                    {event.details && (
                      <p className="text-xs text-muted-foreground">
                        Details: {JSON.stringify(event.details).slice(0, 100)}...
                      </p>
                    )}
                  </div>
                  <Badge variant="outline">Logged</Badge>
                </div>
              ))}
              {(!securityEvents || securityEvents.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  No recent security events
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Compliance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Compliance Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Data Encryption</span>
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Compliant
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Access Controls</span>
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Compliant
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Audit Logging</span>
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Compliant
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Data Retention</span>
                <Badge className="bg-yellow-100 text-yellow-800">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Review Required
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                <Shield className="h-4 w-4 mr-2" />
                Run Security Scan
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Lock className="h-4 w-4 mr-2" />
                Force Password Reset
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Key className="h-4 w-4 mr-2" />
                Rotate API Keys
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Database className="h-4 w-4 mr-2" />
                Generate Compliance Report
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
