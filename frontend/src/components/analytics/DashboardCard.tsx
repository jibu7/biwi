'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: LucideIcon;
  trend?: number[];
  className?: string;
  subtitle?: string;
  loading?: boolean;
}

export function DashboardCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  trend,
  className,
  subtitle,
  loading = false
}: DashboardCardProps) {
  if (loading) {
    return (
      <div className={cn("bg-white rounded-lg border shadow-sm p-6", className)}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("bg-white rounded-lg border shadow-sm p-6 hover:shadow-md transition-shadow", className)}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className="ml-4 p-3 bg-gray-50 rounded-lg">
            <Icon className="h-6 w-6 text-gray-600" />
          </div>
        )}
      </div>
      
      {change && (
        <div className="mt-4 flex items-center">
          <span className={cn(
            "text-sm font-medium",
            changeType === 'positive' && "text-green-600",
            changeType === 'negative' && "text-red-600",
            changeType === 'neutral' && "text-gray-600"
          )}>
            {change}
          </span>
          <span className="text-sm text-gray-500 ml-2">from last month</span>
        </div>
      )}
      
      {trend && trend.length > 0 && (
        <div className="mt-4">
          <div className="flex items-end space-x-1 h-8">
            {trend.map((value, index) => (
              <div
                key={index}
                className={cn(
                  "bg-blue-200 rounded-t",
                  changeType === 'positive' && "bg-green-200",
                  changeType === 'negative' && "bg-red-200"
                )}
                style={{ 
                  height: `${Math.max(4, (value / Math.max(...trend)) * 32)}px`,
                  width: `${100 / trend.length}%`
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
