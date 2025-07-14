'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Settings, 
  Save, 
  Globe, 
  Mail, 
  Database, 
  Server,
  Bell,
  Shield,
  CreditCard,
  Users
} from 'lucide-react';
import { platformService } from '@/services/platformService';

export default function PlatformSettingsPage() {
  const queryClient = useQueryClient();
  
  const [settings, setSettings] = useState({
    // General Settings
    platform_name: 'Vinea ERP Platform',
    platform_description: 'Multi-tenant ERP platform for modern businesses',
    support_email: 'support@biwi.com',
    admin_email: 'admin@biwi.com',
    
    // Company Defaults
    default_storage_limit: 10,
    default_user_limit: 5,
    default_trial_period: 30,
    
    // Billing Settings
    default_currency: 'USD',
    basic_plan_price: 29.99,
    pro_plan_price: 59.99,
    enterprise_plan_price: 99.99,
    
    // Email Settings
    smtp_host: 'smtp.mailgun.org',
    smtp_port: 587,
    smtp_username: '',
    
    // Backup Settings
    backup_frequency: 'daily',
    backup_retention: 30,
    backup_location: 's3://platform-backups/',
  });

  // Fetch current settings
  const { data: currentSettings, isLoading } = useQuery({
    queryKey: ['platform-settings'],
    queryFn: platformService.getSettings,
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: platformService.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-settings'] });
      alert('Settings saved successfully!');
    },
    onError: (error) => {
      console.error('Error updating settings:', error);
      alert('Failed to save settings. Please try again.');
    },
  });

  // Update local state when settings are loaded
  useEffect(() => {
    if (currentSettings) {
      setSettings(currentSettings);
    }
  }, [currentSettings]);

  const handleInputChange = (key: string, value: string | number) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    updateSettingsMutation.mutate(settings);
  };

  if (isLoading) {
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
          <h1 className="text-3xl font-bold">Platform Settings</h1>
          <p className="mt-2 text-gray-600">
            Configure global platform settings and defaults
          </p>
        </div>
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            General Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="platformName">Platform Name</Label>
              <Input
                id="platformName"
                value={settings.platform_name}
                onChange={(e) => handleInputChange('platform_name', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supportEmail">Support Email</Label>
              <Input
                id="supportEmail"
                type="email"
                value={settings.support_email}
                onChange={(e) => handleInputChange('support_email', e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="platformDescription">Platform Description</Label>
            <Textarea
              id="platformDescription"
              value={settings.platform_description}
              onChange={(e) => handleInputChange('platform_description', e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Company Defaults */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Company Defaults
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="defaultStorageLimit">Default Storage Limit (GB)</Label>
              <Input
                id="defaultStorageLimit"
                type="number"
                value={settings.default_storage_limit}
                onChange={(e) => handleInputChange('default_storage_limit', parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultUserLimit">Default User Limit</Label>
              <Input
                id="defaultUserLimit"
                type="number"
                value={settings.default_user_limit}
                onChange={(e) => handleInputChange('default_user_limit', parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultTrialPeriod">Trial Period (days)</Label>
              <Input
                id="defaultTrialPeriod"
                type="number"
                value={settings.default_trial_period}
                onChange={(e) => handleInputChange('default_trial_period', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billing Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Billing Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="defaultCurrency">Default Currency</Label>
              <select
                id="defaultCurrency"
                value={settings.default_currency}
                onChange={(e) => handleInputChange('default_currency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="RWF">RWF - Rwandan Franc</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="basicPlanPrice">Basic Plan Price</Label>
              <Input
                id="basicPlanPrice"
                type="number"
                step="0.01"
                value={settings.basic_plan_price}
                onChange={(e) => handleInputChange('basic_plan_price', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proPlanPrice">Pro Plan Price</Label>
              <Input
                id="proPlanPrice"
                type="number"
                step="0.01"
                value={settings.pro_plan_price}
                onChange={(e) => handleInputChange('pro_plan_price', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="enterprisePlanPrice">Enterprise Plan Price</Label>
              <Input
                id="enterprisePlanPrice"
                type="number"
                step="0.01"
                value={settings.enterprise_plan_price}
                onChange={(e) => handleInputChange('enterprise_plan_price', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="smtpHost">SMTP Host</Label>
              <Input
                id="smtpHost"
                value={settings.smtp_host}
                onChange={(e) => handleInputChange('smtp_host', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtpPort">SMTP Port</Label>
              <Input
                id="smtpPort"
                type="number"
                value={settings.smtp_port}
                onChange={(e) => handleInputChange('smtp_port', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="smtpUsername">SMTP Username</Label>
              <Input
                id="smtpUsername"
                value={settings.smtp_username}
                onChange={(e) => handleInputChange('smtp_username', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtpPassword">SMTP Password</Label>
              <Input
                id="smtpPassword"
                type="password"
                value="" 
                onChange={(e) => handleInputChange('smtp_password', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Backup Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Backup Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="backupFrequency">Backup Frequency</Label>
              <select
                id="backupFrequency"
                value={settings.backup_frequency}
                onChange={(e) => handleInputChange('backup_frequency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="backupRetention">Retention Period (days)</Label>
              <Input
                id="backupRetention"
                type="number"
                value={settings.backup_retention}
                onChange={(e) => handleInputChange('backup_retention', parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="backupLocation">Backup Location</Label>
              <Input
                id="backupLocation"
                value={settings.backup_location}
                onChange={(e) => handleInputChange('backup_location', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            System Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Platform Version:</span>
                <span className="text-sm font-medium">v2.1.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Database Version:</span>
                <span className="text-sm font-medium">PostgreSQL 15.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">API Version:</span>
                <span className="text-sm font-medium">v1</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Last Backup:</span>
                <span className="text-sm font-medium">2 hours ago</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">System Status:</span>
                <span className="text-sm font-medium text-green-600">Healthy</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Uptime:</span>
                <span className="text-sm font-medium">15 days, 4 hours</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        <Button variant="outline">Reset to Defaults</Button>
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Save All Settings
        </Button>
      </div>
    </div>
  );
}
