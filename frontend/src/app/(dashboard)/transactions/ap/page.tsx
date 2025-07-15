'use client';


import Link from 'next/link';
import { FileText, CreditCard, Receipt, Minus, ArrowUpDown, List } from 'lucide-react';

export default function APTransactionsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Accounts Payable Transactions</h1>
          <p className="text-gray-600 mt-2">
            Manage supplier transactions, payments, and allocations
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/transactions/ap/invoices">
            <div className="group cursor-pointer rounded-lg border border-gray-200 p-6 hover:bg-gray-50 hover:border-gray-300 transition-colors bg-white">
              <div className="flex items-center space-x-4">
                <div className="p-2 rounded-md bg-orange-100 text-orange-600 group-hover:bg-orange-200">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Supplier Invoices</h3>
                  <p className="text-sm text-gray-600">
                    Record and manage supplier invoices
                  </p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/transactions/ap/debit-notes">
            <div className="group cursor-pointer rounded-lg border border-gray-200 p-6 hover:bg-gray-50 hover:border-gray-300 transition-colors bg-white">
              <div className="flex items-center space-x-4">
                <div className="p-2 rounded-md bg-red-100 text-red-600 group-hover:bg-red-200">
                  <Minus className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Debit Notes</h3>
                  <p className="text-sm text-gray-600">
                    Issue debit notes and purchase returns
                  </p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/transactions/ap/payments">
            <div className="group cursor-pointer rounded-lg border border-gray-200 p-6 hover:bg-gray-50 hover:border-gray-300 transition-colors bg-white">
              <div className="flex items-center space-x-4">
                <div className="p-2 rounded-md bg-green-100 text-green-600 group-hover:bg-green-200">
                  <CreditCard className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Payments</h3>
                  <p className="text-sm text-gray-600">
                    Process supplier payments
                  </p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/transactions/ap/allocations">
            <div className="group cursor-pointer rounded-lg border border-gray-200 p-6 hover:bg-gray-50 hover:border-gray-300 transition-colors bg-white">
              <div className="flex items-center space-x-4">
                <div className="p-2 rounded-md bg-purple-100 text-purple-600 group-hover:bg-purple-200">
                  <ArrowUpDown className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">AP Allocations</h3>
                  <p className="text-sm text-gray-600">
                    Allocate payments to outstanding invoices
                  </p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/transactions/ap/list">
            <div className="group cursor-pointer rounded-lg border border-gray-200 p-6 hover:bg-gray-50 hover:border-gray-300 transition-colors bg-white">
              <div className="flex items-center space-x-4">
                <div className="p-2 rounded-md bg-gray-100 text-gray-600 group-hover:bg-gray-200">
                  <List className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">All Transactions</h3>
                  <p className="text-sm text-gray-600">
                    View all AP transactions
                  </p>
                </div>
              </div>
            </div>
          </Link>

          <div className="group cursor-pointer rounded-lg border border-gray-200 p-6 bg-white opacity-50">
            <div className="flex items-center space-x-4">
              <div className="p-2 rounded-md bg-blue-100 text-blue-600">
                <Receipt className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Purchase Orders</h3>
                <p className="text-sm text-gray-600">
                  Create and manage purchase orders (Coming Soon)
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">AP Transaction Workflow</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Standard Process</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                <li>Receive supplier invoice</li>
                <li>Record invoice in system</li>
                <li>Verify and approve for payment</li>
                <li>Process payment to supplier</li>
                <li>Allocate payment to invoice</li>
              </ol>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Quick Actions</h3>
              <div className="space-y-2">
                <Link href="/transactions/ap/invoices/new" className="block text-sm text-orange-600 hover:text-orange-800">
                  → Record New Invoice
                </Link>
                <Link href="/transactions/ap/payments/new" className="block text-sm text-green-600 hover:text-green-800">
                  → Process Payment
                </Link>
                <Link href="/transactions/ap/allocations/new" className="block text-sm text-purple-600 hover:text-purple-800">
                  → Allocate Payment
                </Link>
                <Link href="/transactions/ap/list" className="block text-sm text-blue-600 hover:text-blue-800">
                  → View All Transactions
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
