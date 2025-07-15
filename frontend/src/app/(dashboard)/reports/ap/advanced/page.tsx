'use client';


import Link from 'next/link';
import { Building, TrendingDown, FileText, Clock } from 'lucide-react';

export default function APAdvancedReportsPage() {
  const reports = [
    {
      title: 'Detailed Age Analysis',
      description: 'Comprehensive aging analysis with supplier drill-down capabilities',
      href: '/reports/ap/detailed-age-analysis',
      icon: TrendingDown,
      color: 'bg-blue-50 border-blue-200 text-blue-700'
    },
    {
      title: 'Supplier Analysis',
      description: 'In-depth supplier performance and payment pattern analysis',
      href: '/reports/ap/supplier-analysis',
      icon: Building,
      color: 'bg-green-50 border-green-200 text-green-700'
    },
    {
      title: 'Age Analysis',
      description: 'Standard aging report showing outstanding payables by period',
      href: '/reports/ap/age-analysis',
      icon: Clock,
      color: 'bg-yellow-50 border-yellow-200 text-yellow-700'
    },
    {
      title: 'Supplier Statements',
      description: 'Generate detailed supplier account statements',
      href: '/reports/ap/statement',
      icon: FileText,
      color: 'bg-purple-50 border-purple-200 text-purple-700'
    }
  ];

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Advanced AP Reports</h1>
        <p className="text-lg text-gray-600">
          Advanced accounts payable reporting tools for supplier management and cash flow analysis.
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
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Additional AP Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/reports/ap/supplier-listing"
            className="text-indigo-600 hover:text-indigo-800 font-medium"
          >
            → Supplier Listing
          </Link>
          <Link
            href="/reports/ap/allocation-report"
            className="text-indigo-600 hover:text-indigo-800 font-medium"
          >
            → Allocation Report
          </Link>
        </div>
      </div>
    </div>
  );
}
