'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportService } from '@/services/reportService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EnhancedSelect as Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, Mail, Trash2, Play, Pause } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function ReportSchedulingPage() {
  const queryClient = useQueryClient();

  const { data: schedules, isLoading } = useQuery({
    queryKey: ['report-schedules'],
    queryFn: reportService.getSchedules,
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: reportService.deleteSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-schedules'] });
      toast.success('Schedule deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete schedule');
    },
  });

  const runScheduleMutation = useMutation({
    mutationFn: reportService.runScheduledReports,
    onSuccess: () => {
      toast.success('Scheduled reports are being generated');
    },
    onError: () => {
      toast.error('Failed to run scheduled reports');
    },
  });

  const getFrequencyBadge = (frequency: string) => {
    const colors: Record<string, string> = {
      daily: 'bg-blue-100 text-blue-800',
      weekly: 'bg-green-100 text-green-800',
      monthly: 'bg-purple-100 text-purple-800',
      quarterly: 'bg-orange-100 text-orange-800',
      yearly: 'bg-red-100 text-red-800',
    };
    
    return (
      <Badge className={colors[frequency] || 'bg-gray-100 text-gray-800'}>
        {frequency.charAt(0).toUpperCase() + frequency.slice(1)}
      </Badge>
    );
  };

  const formatNextRun = (nextRun: string) => {
    try {
      return format(new Date(nextRun), 'MMM dd, yyyy HH:mm');
    } catch {
      return 'Not scheduled';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p>Loading schedules...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Report Scheduling</h1>
          <p className="text-muted-foreground">
            Manage automated report generation and delivery
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => runScheduleMutation.mutate()}
            disabled={runScheduleMutation.isPending}
          >
            <Play className="h-4 w-4 mr-2" />
            Run All Schedules
          </Button>
          <Button asChild>
            <a href="/reports/scheduling/new">
              <Calendar className="h-4 w-4 mr-2" />
              New Schedule
            </a>
          </Button>
        </div>
      </div>

      {!schedules || schedules.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Schedules Found</h3>
              <p className="text-muted-foreground mb-4">
                Create your first automated report schedule to get started.
              </p>
              <Button asChild>
                <a href="/reports/scheduling/new">Create Schedule</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {schedules.map((schedule: any) => (
            <Card key={schedule.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {schedule.template_name || `Schedule ${schedule.id}`}
                      {getFrequencyBadge(schedule.frequency)}
                      <Badge 
                        variant={schedule.is_active ? 'default' : 'secondary'}
                      >
                        {schedule.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Report Type: {schedule.report_type || 'Custom'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Toggle active status
                        // This would require an API endpoint
                        toast.info('Feature coming soon');
                      }}
                    >
                      {schedule.is_active ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteScheduleMutation.mutate(schedule.id)}
                      disabled={deleteScheduleMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Next Run</p>
                      <p className="text-sm text-muted-foreground">
                        {formatNextRun(schedule.next_run_at)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Recipients</p>
                      <p className="text-sm text-muted-foreground">
                        {schedule.recipient_emails?.length || 0} recipients
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Last Run</p>
                      <p className="text-sm text-muted-foreground">
                        {schedule.last_run_at 
                          ? formatNextRun(schedule.last_run_at)
                          : 'Never'}
                      </p>
                    </div>
                  </div>
                </div>

                {schedule.recipient_emails && schedule.recipient_emails.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Email Recipients:</p>
                    <div className="flex flex-wrap gap-1">
                      {schedule.recipient_emails.map((email: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {email}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {schedule.export_formats && schedule.export_formats.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium mb-2">Export Formats:</p>
                    <div className="flex gap-1">
                      {schedule.export_formats.map((format: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {format.toUpperCase()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
