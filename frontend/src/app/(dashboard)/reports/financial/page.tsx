'use client';

import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { ReportCard, ReportPageLayout } from '@/components/reports';
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

const quickAccessItems = [
  {
    title: 'Account Transactions',
    href: '/reports/gl/account-transactions',
  },
  {
    title: 'Trial Balance',
    href: '/reports/gl/trial-balance',
  },
];

const financialStatements = [
  {
    title: 'Balance Sheet',
    href: '/reports/financial/balance-sheet',
  },
  {
    title: 'Income Statement',
    href: '/reports/financial/income-statement',
  },
];

export default function FinancialReportsPage() {
  const router = useRouter();

  return (
    <ReportPageLayout
      title="Financial Reports"
      description="Generate comprehensive financial statements and analysis reports for your organization."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportItems.map((item, index) => (
          <ReportCard
            key={index}
            title={item.title}
            description={item.description}
            icon={item.icon}
            color={item.color}
            onClick={() => router.push(item.href)}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 bg-blue-50">
          <h3 className="text-lg font-medium text-blue-900 mb-4">Quick Access</h3>
          <div className="space-y-2">
            {quickAccessItems.map((item, index) => (
              <button
                key={index}
                onClick={() => router.push(item.href)}
                className="block w-full text-left text-blue-800 hover:text-blue-600 text-sm font-medium p-2 rounded hover:bg-blue-100 transition-colors"
              >
                → {item.title}
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-6 bg-green-50">
          <h3 className="text-lg font-medium text-green-900 mb-4">Financial Statements</h3>
          <div className="space-y-2">
            {financialStatements.map((item, index) => (
              <button
                key={index}
                onClick={() => router.push(item.href)}
                className="block w-full text-left text-green-800 hover:text-green-600 text-sm font-medium p-2 rounded hover:bg-green-100 transition-colors"
              >
                → {item.title}
              </button>
            ))}
          </div>
        </Card>
      </div>
    </ReportPageLayout>
  );
}
