'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { reportService } from '@/services/reportService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EnhancedSelect as Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Clock, Mail, FileText } from 'lucide-react';
import { toast } from 'sonner';

const scheduleSchema = z.object({
  template_id: z.number().min(1, 'Please select a report template'),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']),
  hour: z.number().min(0).max(23),
  minute: z.number().min(0).max(59),
  day_of_week: z.number().min(0).max(6).optional(),
  day: z.number().min(1).max(31).optional(),
  recipient_emails: z.string().min(1, 'At least one email is required'),
  export_formats: z.array(z.string()).min(1, 'Select at least one format'),
  is_active: z.boolean(),
});

type ScheduleForm = z.infer<typeof scheduleSchema>;

export default function CreateSchedulePage() {
  const router = useRouter();
  const [selectedFormats, setSelectedFormats] = useState<string[]>(['pdf']);

  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['report-templates'],
    queryFn: reportService.getReportTemplates,
  });

  const form = useForm<ScheduleForm>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      frequency: 'monthly',
      hour: 9,
      minute: 0,
      export_formats: ['pdf'],
      is_active: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => reportService.createSchedule(data),
    onSuccess: () => {
      toast.success('Report schedule created successfully');
      router.push('/reports/scheduling/list');
    },
    onError: (error) => {
      toast.error('Failed to create schedule');
    },
  });

  const onSubmit = (data: ScheduleForm) => {
    const emails = data.recipient_emails.split(',').map(e => e.trim());
    
    const scheduleConfig: any = {
      hour: data.hour,
      minute: data.minute,
    };

    if (data.frequency === 'weekly' && data.day_of_week !== undefined) {
      scheduleConfig.day_of_week = data.day_of_week;
    }
    if (data.frequency === 'monthly' && data.day !== undefined) {
      scheduleConfig.day = data.day;
    }

    createMutation.mutate({
      template_id: data.template_id,
      frequency: data.frequency,
      schedule_config: scheduleConfig,
      recipient_emails: emails,
      export_formats: selectedFormats,
      is_active: data.is_active,
    });
  };

  const formatOptions = [
    { value: 'pdf', label: 'PDF' },
    { value: 'excel', label: 'Excel' },
    { value: 'csv', label: 'CSV' },
  ];

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create Report Schedule</h1>
        <p className="text-muted-foreground">
          Schedule reports to be generated and emailed automatically
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-6">
          {/* Report Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Report Selection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="template">Report Template</Label>
                <Select
                  value={form.watch('template_id')?.toString()}
                  onValueChange={(value) => form.setValue('template_id', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a report template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates?.map((template: any) => (
                      <SelectItem key={template.id} value={template.id.toString()}>
                        {template.name} ({template.report_type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.template_id && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.template_id.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Schedule Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Schedule Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="frequency">Frequency</Label>
                <Select
                  value={form.watch('frequency')}
                  onValueChange={(value) => form.setValue('frequency', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hour">Hour (24-hour format)</Label>
                  <Input
                    id="hour"
                    type="number"
                    min="0"
                    max="23"
                    {...form.register('hour', { valueAsNumber: true })}
                  />
                </div>
                <div>
                  <Label htmlFor="minute">Minute</Label>
                  <Input
                    id="minute"
                    type="number"
                    min="0"
                    max="59"
                    {...form.register('minute', { valueAsNumber: true })}
                  />
                </div>
              </div>

              {form.watch('frequency') === 'weekly' && (
                <div>
                  <Label htmlFor="day_of_week">Day of Week</Label>
                  <Select
                    value={form.watch('day_of_week')?.toString() || ''}
                    onValueChange={(value) => form.setValue('day_of_week', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Monday</SelectItem>
                      <SelectItem value="1">Tuesday</SelectItem>
                      <SelectItem value="2">Wednesday</SelectItem>
                      <SelectItem value="3">Thursday</SelectItem>
                      <SelectItem value="4">Friday</SelectItem>
                      <SelectItem value="5">Saturday</SelectItem>
                      <SelectItem value="6">Sunday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {form.watch('frequency') === 'monthly' && (
                <div>
                  <Label htmlFor="day">Day of Month</Label>
                  <Input
                    id="day"
                    type="number"
                    min="1"
                    max="31"
                    {...form.register('day', { valueAsNumber: true })}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delivery Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Delivery Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="emails">Recipient Email Addresses</Label>
                <Textarea
                  id="emails"
                  placeholder="email1@example.com, email2@example.com"
                  {...form.register('recipient_emails')}
                  rows={3}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Separate multiple emails with commas
                </p>
                {form.formState.errors.recipient_emails && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.recipient_emails.message}
                  </p>
                )}
              </div>

              <div>
                <Label>Export Formats</Label>
                <div className="space-y-2 mt-2">
                  {formatOptions.map((format) => (
                    <div key={format.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={format.value}
                        checked={selectedFormats.includes(format.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedFormats([...selectedFormats, format.value]);
                          } else {
                            setSelectedFormats(selectedFormats.filter(f => f !== format.value));
                          }
                        }}
                      />
                      <Label htmlFor={format.value}>{format.label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_active"
                  checked={form.watch('is_active')}
                  onChange={(e) => form.setValue('is_active', e.target.checked)}
                />
                <Label htmlFor="is_active">Schedule is active</Label>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/reports/scheduling/list')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Schedule'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
