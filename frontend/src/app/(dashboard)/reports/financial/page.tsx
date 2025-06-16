'use client';

import Link from 'next/link';
import { BarChart3, FileText, TrendingUp, DollarSign } from 'lucide-react';

export default function FinancialReportsPage() {
  const reports = [
    {
      title: 'Balance Sheet',
      description: 'Statement of financial position showing assets, liabilities, and equity',
      href: '/reports/financial/balance-sheet',
      icon: BarChart3,
      color: 'bg-blue-50 border-blue-200 text-blue-700'
    },
    {
      title: 'Income Statement',
      description: 'Profit and loss statement showing revenue and expenses',
      href: '/reports/financial/income-statement',
      icon: TrendingUp,
      color: 'bg-green-50 border-green-200 text-green-700'
    },
    {
      title: 'Cash Flow Statement',
      description: 'Statement of cash flows from operating, investing, and financing activities',
      href: '/reports/financial/cash-flow',
      icon: DollarSign,
      color: 'bg-purple-50 border-purple-200 text-purple-700'
    },
    {
      title: 'Trial Balance',
      description: 'List of all general ledger accounts with their balances',
      href: '/reports/gl/trial-balance',
      icon: FileText,
      color: 'bg-gray-50 border-gray-200 text-gray-700'
    }
  ];

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Financial Reports</h1>
        <p className="text-lg text-gray-600">
          Generate comprehensive financial statements and analysis reports for your organization.
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
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Additional Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/reports/gl/account-transactions"
            className="text-indigo-600 hover:text-indigo-800 font-medium"
          >
            → Account Transactions Report
          </Link>
          <Link
            href="/reports/gl/advanced"
            className="text-indigo-600 hover:text-indigo-800 font-medium"
          >
            → Advanced GL Reports
          </Link>
        </div>
      </div>
    </div>
  );
}
