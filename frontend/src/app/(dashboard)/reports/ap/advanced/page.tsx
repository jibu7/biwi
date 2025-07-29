'use client';


import Link from 'next/link';
import { Building, TrendingDown, FileText, Clock } from 'lucide-react';

const reportItems = [
  {
    title: 'Detailed Age Analysis',
    description: 'Comprehensive aging analysis with supplier drill-down capabilities',
    href: '/reports/ap/detailed-age-analysis',
    icon: TrendingDown,
    color: 'bg-blue-100 text-blue-600',
  },
  {
    title: 'Supplier Analysis',
    description: 'In-depth supplier performance and payment pattern analysis',
    href: '/reports/ap/supplier-analysis',
    icon: Building,
    color: 'bg-green-100 text-green-600',
  },
  {
    title: 'Age Analysis',
    description: 'Standard aging report showing outstanding payables by period',
    href: '/reports/ap/age-analysis',
    icon: Clock,
    color: 'bg-purple-100 text-purple-600',
  },
  {
    title: 'Supplier Statements',
    description: 'Generate detailed supplier account statements',
    href: '/reports/ap/statement',
    icon: FileText,
    color: 'bg-yellow-100 text-yellow-600',
  },
];

export default function APAdvancedReportsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Advanced AP Reports</h1>
        <p className="text-gray-600 mt-2">
          Advanced accounts payable reporting tools for supplier management and cash flow analysis.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 hover:border-blue-300"
            >
              <div className="flex items-center mb-4">
                <div className={`p-3 rounded-lg ${item.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 ml-3">
                  {item.title}
                </h3>
              </div>
              <p className="text-gray-600 text-sm">
                {item.description}
              </p>
            </Link>
          );
        })}
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-50 p-6 rounded-lg">
          <h3 className="text-lg font-medium text-blue-900 mb-2">Additional AP Reports</h3>
          <div className="space-y-2">
            <Link
              href="/reports/ap/supplier-listing"
              className="block text-blue-800 hover:text-blue-600 text-sm font-medium"
            >
              → Supplier Listing
            </Link>
            <p className="text-blue-700 text-xs">Complete list of suppliers with details</p>
          </div>
        </div>

        <div className="bg-green-50 p-6 rounded-lg">
          <h3 className="text-lg font-medium text-green-900 mb-2">Analysis Reports</h3>
          <div className="space-y-2">
            <Link
              href="/reports/ap/allocation-report"
              className="block text-green-800 hover:text-green-600 text-sm font-medium"
            >
              → Allocation Report
            </Link>
            <p className="text-green-700 text-xs">Payment allocation and matching analysis</p>
          </div>
        </div>
      </div>
    </div>
  );
}
