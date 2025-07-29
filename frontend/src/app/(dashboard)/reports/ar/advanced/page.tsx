'use client';


import Link from 'next/link';
import { Users, TrendingUp, FileText, Clock } from 'lucide-react';

const reportItems = [
  {
    title: 'Detailed Age Analysis',
    description: 'Comprehensive aging analysis with customer drill-down capabilities',
    href: '/reports/ar/detailed-age-analysis',
    icon: TrendingUp,
    color: 'bg-blue-100 text-blue-600',
  },
  {
    title: 'Customer Analysis',
    description: 'In-depth customer performance and payment pattern analysis',
    href: '/reports/ar/customer-analysis',
    icon: Users,
    color: 'bg-green-100 text-green-600',
  },
  {
    title: 'Customer Aging',
    description: 'Standard aging report showing outstanding balances by period',
    href: '/reports/ar/aging',
    icon: Clock,
    color: 'bg-purple-100 text-purple-600',
  },
  {
    title: 'Customer Statements',
    description: 'Generate detailed customer account statements',
    href: '/reports/ar/statement',
    icon: FileText,
    color: 'bg-yellow-100 text-yellow-600',
  },
];

export default function ARAdvancedReportsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Advanced AR Reports</h1>
        <p className="text-gray-600 mt-2">
          Advanced accounts receivable reporting tools for customer management and credit analysis.
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
          <h3 className="text-lg font-medium text-blue-900 mb-2">Additional AR Reports</h3>
          <div className="space-y-2">
            <Link
              href="/reports/ar/customer-listing"
              className="block text-blue-800 hover:text-blue-600 text-sm font-medium"
            >
              → Customer Listing
            </Link>
            <p className="text-blue-700 text-xs">Complete list of customers with details</p>
          </div>
        </div>

        <div className="bg-green-50 p-6 rounded-lg">
          <h3 className="text-lg font-medium text-green-900 mb-2">Transaction Reports</h3>
          <div className="space-y-2">
            <Link
              href="/reports/ar/customer-transactions"
              className="block text-green-800 hover:text-green-600 text-sm font-medium"
            >
              → Customer Transactions
            </Link>
            <p className="text-green-700 text-xs">Detailed transaction history by customer</p>
          </div>
        </div>
      </div>
    </div>
  );
}
