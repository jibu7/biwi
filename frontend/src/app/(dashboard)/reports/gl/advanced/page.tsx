'use client';


import Link from 'next/link';
import { Calculator, BookOpen, Banknote, GitBranch } from 'lucide-react';

const reportItems = [
  {
    title: 'Chart of Accounts',
    description: 'Complete listing of all general ledger accounts with hierarchy',
    href: '/reports/gl/chart-of-accounts',
    icon: GitBranch,
    color: 'bg-blue-100 text-blue-600',
  },
  {
    title: 'Cashbook Report',
    description: 'Detailed cash and bank account transactions with reconciliation',
    href: '/reports/gl/cashbook',
    icon: Banknote,
    color: 'bg-green-100 text-green-600',
  },
  {
    title: 'Bank Reconciliation',
    description: 'Match bank statements with book records',
    href: '/reports/gl/bank-reconciliation',
    icon: Calculator,
    color: 'bg-purple-100 text-purple-600',
  },
  {
    title: 'Trial Balance',
    description: 'Summary of all account balances to verify posting accuracy',
    href: '/reports/gl/trial-balance',
    icon: BookOpen,
    color: 'bg-yellow-100 text-yellow-600',
  },
];

export default function GLAdvancedReportsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Advanced GL Reports</h1>
        <p className="text-gray-600 mt-2">
          Comprehensive general ledger reporting tools for detailed financial analysis and account management.
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
            <p className="text-blue-700 text-xs">View transaction details by account</p>
          </div>
        </div>

        <div className="bg-green-50 p-6 rounded-lg">
          <h3 className="text-lg font-medium text-green-900 mb-2">Financial Statements</h3>
          <div className="space-y-2">
            <Link
              href="/reports/financial"
              className="block text-green-800 hover:text-green-600 text-sm font-medium"
            >
              → Financial Statements
            </Link>
            <p className="text-green-700 text-xs">Balance sheet, income statement, and more</p>
          </div>
        </div>
      </div>
    </div>
  );
}
