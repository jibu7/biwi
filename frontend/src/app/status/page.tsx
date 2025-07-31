'use client';

import React from 'react';
import { Logo } from '@/components/ui/Logo';
import { brandContent } from '@/components/ui/BrandKit';
import { CheckCircle, AlertCircle, XCircle, Clock } from 'lucide-react';

type ServiceStatus = 'operational' | 'degraded' | 'outage' | 'maintenance';

interface SystemService {
  name: string;
  status: ServiceStatus;
  uptime: string;
  description: string;
}

const systemStatus: SystemService[] = [
  {
    name: 'API Services',
    status: 'operational',
    uptime: '99.9%',
    description: 'All API endpoints are functioning normally',
  },
  {
    name: 'Database',
    status: 'operational',
    uptime: '99.8%',
    description: 'Database queries and transactions are processing normally',
  },
  {
    name: 'File Storage',
    status: 'operational',
    uptime: '99.9%',
    description: 'File uploads and downloads are working correctly',
  },
  {
    name: 'Authentication',
    status: 'operational',
    uptime: '99.9%',
    description: 'User authentication and authorization services are stable',
  },
  {
    name: 'Notifications',
    status: 'degraded',
    uptime: '98.2%',
    description: 'Email notifications may experience delays',
  },
];

const statusIcons: Record<ServiceStatus, { icon: any; color: string; bg: string }> = {
  operational: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100' },
  degraded: { icon: AlertCircle, color: 'text-yellow-500', bg: 'bg-yellow-100' },
  outage: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-100' },
  maintenance: { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-100' },
};

export default function StatusPage() {
  const overallStatus: ServiceStatus = systemStatus.every(service => service.status === 'operational') 
    ? 'operational' 
    : systemStatus.some(service => service.status === 'outage')
    ? 'outage'
    : 'degraded';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Logo size="lg" textSize="2xl" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">System Status</h1>
              <p className="text-gray-600">Current operational status of {brandContent.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Overall Status */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            {React.createElement(statusIcons[overallStatus].icon, {
              className: `h-8 w-8 ${statusIcons[overallStatus].color}`
            })}
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {overallStatus === 'operational' ? 'All Systems Operational' :
                 overallStatus === 'degraded' ? 'Some Systems Degraded' :
                 'System Outage'}
              </h2>
              <p className="text-gray-600">
                {overallStatus === 'operational' 
                  ? 'All systems are functioning normally'
                  : 'Some services may be experiencing issues'
                }
              </p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleString()}
          </div>
        </div>

        {/* Service Status */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Service Status</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {systemStatus.map((service) => {
              const statusConfig = statusIcons[service.status];
              return (
                <div key={service.name} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${statusConfig.bg}`}>
                        {React.createElement(statusConfig.icon, {
                          className: `h-4 w-4 ${statusConfig.color}`
                        })}
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{service.name}</h4>
                        <p className="text-sm text-gray-600">{service.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900 capitalize">
                        {service.status}
                      </div>
                      <div className="text-sm text-gray-600">
                        {service.uptime} uptime
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-2">
            Questions about our status? Contact us at{' '}
            <a 
              href={`mailto:${brandContent.supportEmail}`}
              className="text-blue-600 hover:text-blue-500"
            >
              {brandContent.supportEmail}
            </a>
          </p>
          <p className="text-sm text-gray-500">{brandContent.copyright}</p>
        </div>
      </div>
    </div>
  );
}
