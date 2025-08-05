'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { EnhancedSelect as Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DateDisplay } from '@/components/ui/DateDisplay';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import { companyService } from '@/services/companyService';
import { userService } from '@/services/userService';
import { toast } from 'sonner';

const DATE_FORMATS = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (31/12/2024)' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (12/31/2024)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2024-12-31)' },
  { value: 'DD.MM.YYYY', label: 'DD.MM.YYYY (31.12.2024)' },
  { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY (31-12-2024)' },
  { value: 'YYYY/MM/DD', label: 'YYYY/MM/DD (2024/12/31)' },
];

const TIME_FORMATS = [
  { value: '24h', label: '24-hour (14:30)' },
  { value: '12h', label: '12-hour (2:30 PM)' },
];

const DECIMAL_SEPARATORS = [
  { value: '.', label: 'Period (.)' },
  { value: ',', label: 'Comma (,)' },
];

const THOUSAND_SEPARATORS = [
  { value: ',', label: 'Comma (,)' },
  { value: '.', label: 'Period (.)' },
  { value: ' ', label: 'Space ( )' },
  { value: "'", label: "Apostrophe (')" },
];

const CURRENCY_POSITIONS = [
  { value: 'prefix', label: 'Before amount ($100)' },
  { value: 'suffix', label: 'After amount (100 €)' },
];

export default function SettingsPage() {
  const { user, company } = useAuth();
  const queryClient = useQueryClient();
  
  const [companySettings, setCompanySettings] = useState({
    date_format: company?.date_format || 'YYYY-MM-DD',
    time_format: company?.time_format || '24h',
    decimal_separator: company?.decimal_separator || '.',
    thousand_separator: company?.thousand_separator || ',',
    currency_position: company?.currency_position || 'prefix',
  });
  
  const [userSettings, setUserSettings] = useState({
    date_format_override: user?.date_format_override || '',
    locale: user?.locale || 'en-US',
    timezone: user?.timezone || 'UTC',
  });

  // Sample data for preview
  const sampleDate = new Date();
  const sampleAmount = 1234567.89;

  // Preview formatting functions based on current form settings
  const formatPreviewDate = (date: Date, settings: typeof companySettings) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    switch (settings.date_format) {
      case 'DD/MM/YYYY': return `${day}/${month}/${year}`;
      case 'MM/DD/YYYY': return `${month}/${day}/${year}`;
      case 'YYYY-MM-DD': return `${year}-${month}-${day}`;
      case 'DD.MM.YYYY': return `${day}.${month}.${year}`;
      case 'DD-MM-YYYY': return `${day}-${month}-${year}`;
      case 'YYYY/MM/DD': return `${year}/${month}/${day}`;
      default: return `${year}-${month}-${day}`;
    }
  };

  const formatPreviewDateTime = (date: Date, settings: typeof companySettings) => {
    const dateStr = formatPreviewDate(date, settings);
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    let timeStr: string;
    if (settings.time_format === '12h') {
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      timeStr = `${displayHours}:${minutes} ${period}`;
    } else {
      timeStr = `${String(hours).padStart(2, '0')}:${minutes}`;
    }
    
    return `${dateStr} ${timeStr}`;
  };

  const formatPreviewCurrency = (amount: number, settings: typeof companySettings) => {
    const parts = amount.toFixed(2).split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, settings.thousand_separator);
    const formattedNumber = parts.length > 1 
      ? integerPart + settings.decimal_separator + parts[1]
      : integerPart;
    
    const symbol = company?.default_currency?.symbol || '$';
    return settings.currency_position === 'prefix' 
      ? `${symbol}${formattedNumber}`
      : `${formattedNumber} ${symbol}`;
  };

  const formatPreviewNumber = (amount: number, settings: typeof companySettings) => {
    const parts = amount.toFixed(2).split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, settings.thousand_separator);
    return parts.length > 1 
      ? integerPart + settings.decimal_separator + parts[1]
      : integerPart;
  };

  // Personal preview formatting with user overrides
  const formatPersonalPreviewDate = (date: Date, userOpts: { date_format_override: string }, companyOpts: { date_format: string }) => {
    const effectiveDateFormat = userOpts.date_format_override || companyOpts.date_format;
    return formatPreviewDate(date, { ...companySettings, date_format: effectiveDateFormat });
  };

  const formatPersonalPreviewDateTime = (date: Date, userOpts: { date_format_override: string }, companyOpts: { date_format: string, time_format: string }) => {
    const effectiveDateFormat = userOpts.date_format_override || companyOpts.date_format;
    return formatPreviewDateTime(date, { ...companySettings, date_format: effectiveDateFormat });
  };

  // Mutations
  const updateCompanyMutation = useMutation({
    mutationFn: (data: any) => companyService.updateCompanyFormatting(company!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company'] });
      toast.success('Company formatting settings updated');
    },
    onError: () => {
      toast.error('Failed to update company settings');
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: (data: any) => userService.updateMyPreferences(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      toast.success('Your preferences have been updated');
    },
    onError: () => {
      toast.error('Failed to update user preferences');
    }
  });

  const handleCompanySave = () => {
    updateCompanyMutation.mutate(companySettings);
  };

  const handleUserSave = () => {
    updateUserMutation.mutate(userSettings);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Formatting Settings</h1>
        <p className="text-muted-foreground">
          Configure how dates, numbers, and currencies are displayed throughout the system
        </p>
      </div>

      <Tabs defaultValue="company" className="space-y-4">
        <TabsList>
          <TabsTrigger value="company">Company Settings</TabsTrigger>
          <TabsTrigger value="personal">Personal Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Company-wide Formatting</CardTitle>
              <CardDescription>
                These settings apply to all users in your company by default
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="date-format">Date Format</Label>
                  <Select
                    value={companySettings.date_format}
                    onValueChange={(value: string) => 
                      setCompanySettings(prev => ({ ...prev, date_format: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DATE_FORMATS.map(format => (
                        <SelectItem key={format.value} value={format.value}>
                          {format.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time-format">Time Format</Label>
                  <Select
                    value={companySettings.time_format}
                    onValueChange={(value: string) => 
                      setCompanySettings(prev => ({ ...prev, time_format: value as '12h' | '24h' }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_FORMATS.map(format => (
                        <SelectItem key={format.value} value={format.value}>
                          {format.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="decimal-separator">Decimal Separator</Label>
                  <Select
                    value={companySettings.decimal_separator}
                    onValueChange={(value: string) => 
                      setCompanySettings(prev => ({ ...prev, decimal_separator: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DECIMAL_SEPARATORS.map(sep => (
                        <SelectItem key={sep.value} value={sep.value}>
                          {sep.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="thousand-separator">Thousand Separator</Label>
                  <Select
                    value={companySettings.thousand_separator}
                    onValueChange={(value: string) => 
                      setCompanySettings(prev => ({ ...prev, thousand_separator: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {THOUSAND_SEPARATORS.map(sep => (
                        <SelectItem key={sep.value} value={sep.value}>
                          {sep.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency-position">Currency Symbol Position</Label>
                  <Select
                    value={companySettings.currency_position}
                    onValueChange={(value: string) => 
                      setCompanySettings(prev => ({ ...prev, currency_position: value as 'prefix' | 'suffix' }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCY_POSITIONS.map(pos => (
                        <SelectItem key={pos.value} value={pos.value}>
                          {pos.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Preview</Label>
                <Card className="p-4 bg-muted">
                  <div className="space-y-2">
                    <div>Date: {formatPreviewDate(sampleDate, companySettings)}</div>
                    <div>Date & Time: {formatPreviewDateTime(sampleDate, companySettings)}</div>
                    <div>Currency: {formatPreviewCurrency(sampleAmount, companySettings)}</div>
                    <div>Number: {formatPreviewNumber(sampleAmount, companySettings)}</div>
                  </div>
                </Card>
              </div>

              <Button 
                onClick={handleCompanySave}
                disabled={updateCompanyMutation.isPending}
              >
                {updateCompanyMutation.isPending ? 'Saving...' : 'Save Company Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="personal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal Preferences</CardTitle>
              <CardDescription>
                Override company settings with your personal preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="user-date-format">Personal Date Format</Label>
                  <Select
                    value={userSettings.date_format_override || ''}
                    onValueChange={(value: string) => 
                      setUserSettings(prev => ({ 
                        ...prev, 
                        date_format_override: value === 'default' ? '' : value 
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Use company default" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Use company default</SelectItem>
                      {DATE_FORMATS.map(format => (
                        <SelectItem key={format.value} value={format.value}>
                          {format.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="locale">Language/Locale</Label>
                  <Select
                    value={userSettings.locale}
                    onValueChange={(value: string) => 
                      setUserSettings(prev => ({ ...prev, locale: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en-US">English (US)</SelectItem>
                      <SelectItem value="en-GB">English (UK)</SelectItem>
                      <SelectItem value="de-DE">Deutsch</SelectItem>
                      <SelectItem value="fr-FR">Français</SelectItem>
                      <SelectItem value="es-ES">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={userSettings.timezone}
                    onValueChange={(value: string) => 
                      setUserSettings(prev => ({ ...prev, timezone: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      <SelectItem value="Europe/London">London</SelectItem>
                      <SelectItem value="Europe/Paris">Paris</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Preview with Your Preferences</Label>
                <Card className="p-4 bg-muted">
                  <div className="space-y-2">
                    <div>Date: {formatPersonalPreviewDate(sampleDate, userSettings, companySettings)}</div>
                    <div>Date & Time: {formatPersonalPreviewDateTime(sampleDate, userSettings, companySettings)}</div>
                    <div>Currency: {formatPreviewCurrency(sampleAmount, companySettings)}</div>
                    <div>Number: {formatPreviewNumber(sampleAmount, companySettings)}</div>
                  </div>
                </Card>
              </div>

              <Button 
                onClick={handleUserSave}
                disabled={updateUserMutation.isPending}
              >
                {updateUserMutation.isPending ? 'Saving...' : 'Save Personal Preferences'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
