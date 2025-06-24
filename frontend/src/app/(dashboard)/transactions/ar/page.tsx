'use client';

import Link from 'next/link';
import { FileText, CreditCard, Receipt, Minus, AlertTriangle } from 'lucide-react';

export default function ARTransactionsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Accounts Receivable Transactions</h1>
          <p className="text-gray-600 mt-2">
            Manage customer transactions and allocations
          </p>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/transactions/ar/invoices">
          <div className="group cursor-pointer rounded-lg border border-gray-200 p-6 hover:bg-gray-50 hover:border-gray-300 transition-colors bg-white">
            <div className="flex items-center space-x-4">
              <div className="p-2 rounded-md bg-blue-100 text-blue-600 group-hover:bg-blue-200">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Invoices</h3>
                <p className="text-sm text-gray-600">
                  Create and manage customer invoices
                </p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/transactions/ar/credit-notes">
          <div className="group cursor-pointer rounded-lg border border-gray-200 p-6 hover:bg-gray-50 hover:border-gray-300 transition-colors bg-white">
            <div className="flex items-center space-x-4">
              <div className="p-2 rounded-md bg-red-100 text-red-600 group-hover:bg-red-200">
                <Minus className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Credit Notes</h3>
                <p className="text-sm text-gray-600">
                  Issue credit notes and refunds
                </p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/transactions/ar/receipts">
          <div className="group cursor-pointer rounded-lg border border-gray-200 p-6 hover:bg-gray-50 hover:border-gray-300 transition-colors bg-white">
            <div className="flex items-center space-x-4">
              <div className="p-2 rounded-md bg-green-100 text-green-600 group-hover:bg-green-200">
                <Receipt className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Receipts</h3>
                <p className="text-sm text-gray-600">
                  Record customer payments
                </p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/transactions/ar/allocations">
          <div className="group cursor-pointer rounded-lg border border-gray-200 p-6 hover:bg-gray-50 hover:border-gray-300 transition-colors bg-white">
            <div className="flex items-center space-x-4">
              <div className="p-2 rounded-md bg-purple-100 text-purple-600 group-hover:bg-purple-200">
                <CreditCard className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">AR Allocations</h3>
                <p className="text-sm text-gray-600">
                  Allocate receipts to outstanding invoices
                </p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/transactions/ar/writeoffs">
          <div className="group cursor-pointer rounded-lg border border-gray-200 p-6 hover:bg-gray-50 hover:border-gray-300 transition-colors bg-white">
            <div className="flex items-center space-x-4">
              <div className="p-2 rounded-md bg-orange-100 text-orange-600 group-hover:bg-orange-200">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Write-offs</h3>
                <p className="text-sm text-gray-600">
                  Manage bad debt write-offs and approvals
                </p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/transactions/ar/list">
          <div className="group cursor-pointer rounded-lg border border-gray-200 p-6 hover:bg-gray-50 hover:border-gray-300 transition-colors bg-white">
            <div className="flex items-center space-x-4">
              <div className="p-2 rounded-md bg-gray-100 text-gray-600 group-hover:bg-gray-200">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">All Transactions</h3>
                <p className="text-sm text-gray-600">
                  View all AR transactions
                </p>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
    </div>
  );
}
