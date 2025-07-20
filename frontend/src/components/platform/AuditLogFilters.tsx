'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EnhancedSelect, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AuditLogFilters as Filters } from '@/services/platformService';

interface AuditLogFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  onSearch: () => void;
}

export function AuditLogFilters({ filters, onFiltersChange, onSearch }: AuditLogFiltersProps) {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleFilterChange = (key: keyof Filters, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
  };

  const handleSearch = () => {
    onFiltersChange(localFilters);
    onSearch();
  };

  const handleReset = () => {
    const resetFilters = {
      company_id: null,
      user_id: null,
      action: null,
      resource_type: null,
      start_date: null,
      end_date: null,
      limit: 100,
      offset: 0,
    };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Filter Audit Logs</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="company_id">Company ID</Label>
          <Input
            id="company_id"
            type="number"
            placeholder="Enter company ID"
            value={localFilters.company_id || ''}
            onChange={(e) => handleFilterChange('company_id', e.target.value ? parseInt(e.target.value) : null)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="user_id">User ID</Label>
          <Input
            id="user_id"
            type="number"
            placeholder="Enter user ID"
            value={localFilters.user_id || ''}
            onChange={(e) => handleFilterChange('user_id', e.target.value ? parseInt(e.target.value) : null)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="action">Action</Label>
          <EnhancedSelect
            value={localFilters.action || ''}
            onValueChange={(value: string) => handleFilterChange('action', value || null)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Actions</SelectItem>
              <SelectItem value="company_create">Company Create</SelectItem>
              <SelectItem value="company_update">Company Update</SelectItem>
              <SelectItem value="company_suspend">Company Suspend</SelectItem>
              <SelectItem value="company_activate">Company Activate</SelectItem>
              <SelectItem value="user_create">User Create</SelectItem>
              <SelectItem value="user_update">User Update</SelectItem>
              <SelectItem value="user_delete">User Delete</SelectItem>
              <SelectItem value="impersonate">Impersonate</SelectItem>
              <SelectItem value="platform_access">Platform Access</SelectItem>
            </SelectContent>
          </EnhancedSelect>
        </div>

        <div className="space-y-2">
          <Label htmlFor="resource_type">Resource Type</Label>
          <EnhancedSelect
            value={localFilters.resource_type || ''}
            onValueChange={(value: string) => handleFilterChange('resource_type', value || null)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select resource type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Types</SelectItem>
              <SelectItem value="company">Company</SelectItem>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="billing">Billing</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </EnhancedSelect>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_date">Start Date</Label>
          <Input
            id="start_date"
            type="datetime-local"
            value={localFilters.start_date || ''}
            onChange={(e) => handleFilterChange('start_date', e.target.value || null)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="end_date">End Date</Label>
          <Input
            id="end_date"
            type="datetime-local"
            value={localFilters.end_date || ''}
            onChange={(e) => handleFilterChange('end_date', e.target.value || null)}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSearch}>Search</Button>
        <Button variant="outline" onClick={handleReset}>Reset</Button>
      </div>
    </div>
  );
}
