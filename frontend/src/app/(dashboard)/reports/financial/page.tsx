'use client';


import Link from 'next/link';
import { BarChart3, FileText, TrendingUp, DollarSign } from 'lucide-react';

const reportItems = [
  {
    title: 'GL Advanced Reports',
    description: 'Comprehensive general ledger reporting tools for detailed financial analysis and account management.',
    href: '/reports/gl/advanced',
    icon: BarChart3,
    color: 'bg-blue-100 text-blue-600',
  },
  {
    title: 'Cashbook Report',
    description: 'Detailed cash and bank account transactions with reconciliation',
    href: '/reports/gl/cashbook',
    icon: DollarSign,
    color: 'bg-green-100 text-green-600',
  },
  {
    title: 'AR Advanced Reports',
    description: 'Advanced accounts receivable reporting tools for customer management and credit analysis.',
    href: '/reports/ar/advanced',
    icon: TrendingUp,
    color: 'bg-purple-100 text-purple-600',
  },
  {
    title: 'AP Advanced Reports',
    description: 'Advanced accounts payable reporting tools for supplier management and cash flow analysis.',
    href: '/reports/ap/advanced',
    icon: FileText,
    color: 'bg-yellow-100 text-yellow-600',
  },
];

export default function FinancialReportsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Financial Reports</h1>
        <p className="text-gray-600 mt-2">
          Generate comprehensive financial statements and analysis reports for your organization.
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
          <h3 className="text-lg font-medium text-blue-900 mb-2">Quick Access</h3>
          <div className="space-y-2">
            <Link
              href="/reports/gl/account-transactions"
              className="block text-blue-800 hover:text-blue-600 text-sm font-medium"
            >
              → Account Transactions
            </Link>
            <Link
              href="/reports/gl/trial-balance"
              className="block text-blue-800 hover:text-blue-600 text-sm font-medium"
            >
              → Trial Balance
            </Link>
          </div>
        </div>

        <div className="bg-green-50 p-6 rounded-lg">
          <h3 className="text-lg font-medium text-green-900 mb-2">Financial Statements</h3>
          <div className="space-y-2">
            <Link
              href="/reports/financial/balance-sheet"
              className="block text-green-800 hover:text-green-600 text-sm font-medium"
            >
              → Balance Sheet
            </Link>
            <Link
              href="/reports/financial/income-statement"
              className="block text-green-800 hover:text-green-600 text-sm font-medium"
            >
              → Income Statement
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
