'use client';

import Link from 'next/link';
import { Users, TrendingUp, FileText, Clock } from 'lucide-react';

export default function ARAdvancedReportsPage() {
  const reports = [
    {
      title: 'Detailed Age Analysis',
      description: 'Comprehensive aging analysis with customer drill-down capabilities',
      href: '/reports/ar/detailed-age-analysis',
      icon: TrendingUp,
      color: 'bg-blue-50 border-blue-200 text-blue-700'
    },
    {
      title: 'Customer Analysis',
      description: 'In-depth customer performance and payment pattern analysis',
      href: '/reports/ar/customer-analysis',
      icon: Users,
      color: 'bg-green-50 border-green-200 text-green-700'
    },
    {
      title: 'Customer Aging',
      description: 'Standard aging report showing outstanding balances by period',
      href: '/reports/ar/aging',
      icon: Clock,
      color: 'bg-yellow-50 border-yellow-200 text-yellow-700'
    },
    {
      title: 'Customer Statements',
      description: 'Generate detailed customer account statements',
      href: '/reports/ar/statement',
      icon: FileText,
      color: 'bg-purple-50 border-purple-200 text-purple-700'
    }
  ];

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Advanced AR Reports</h1>
        <p className="text-lg text-gray-600">
          Advanced accounts receivable reporting tools for customer management and credit analysis.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {reports.map((report) => {
          const IconComponent = report.icon;
          return (
            <Link
              key={report.href}
              href={report.href}
              className="block group"
            >
              <div className={`border-2 rounded-lg p-6 transition-all duration-200 hover:shadow-lg hover:scale-105 ${report.color}`}>
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <IconComponent className="w-8 h-8" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2 group-hover:underline">
                      {report.title}
                    </h3>
                    <p className="text-sm opacity-80">
                      {report.description}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-12 bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Additional AR Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/reports/ar/customer-listing"
            className="text-indigo-600 hover:text-indigo-800 font-medium"
          >
            → Customer Listing
          </Link>
          <Link
            href="/reports/ar/customer-transactions"
            className="text-indigo-600 hover:text-indigo-800 font-medium"
          >
            → Customer Transactions
          </Link>
        </div>
      </div>
    </div>
  );
}
