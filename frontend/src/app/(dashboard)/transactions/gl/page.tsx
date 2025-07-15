'use client';


import Link from 'next/link';
import { BookOpen, Plus, FileText, Eye } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import * as permissions from '@/lib/permissions';

export default function GLTransactionsPage() {
  const { hasPermission } = usePermissions();

  const transactionModules = [
    {
      title: 'New Journal Entry',
      description: 'Create a new general ledger journal entry with multiple debit and credit lines',
      href: '/transactions/gl/journal-entry/new',
      icon: Plus,
      permission: permissions.GL_JOURNAL_POST,
      color: 'bg-green-500',
    },
    {
      title: 'View Journal Entries',
      description: 'Browse and search existing journal entries with filtering options',
      href: '/transactions/gl/journal-entries',
      icon: Eye,
      permission: permissions.GL_REPORTS_VIEW,
      color: 'bg-blue-500',
    },
  ];

  const accessibleModules = transactionModules.filter(module => 
    hasPermission(module.permission)
  );

  if (accessibleModules.length === 0) {
    return (
      <div className="p-6">
        <div className="max-w-sm mx-auto text-center">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No Access</h3>
          <p className="mt-1 text-sm text-gray-500">
            You don&apos;t have permission to access GL transaction modules.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              General Ledger Transactions
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Create and manage journal entries for your general ledger.
            </p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {accessibleModules.map((module) => (
            <Link
              key={module.href}
              href={module.href}
              className="group relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div>
                <span className={`rounded-lg inline-flex p-3 ring-4 ring-white ${module.color}`}>
                  <module.icon className="h-6 w-6 text-white" aria-hidden="true" />
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium text-gray-900 group-hover:text-indigo-600">
                  {module.title}
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  {module.description}
                </p>
              </div>
              <span className="absolute inset-0" aria-hidden="true" />
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-12">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
          <div className="bg-white shadow rounded-lg p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {hasPermission(permissions.GL_JOURNAL_POST) && (
                <Link
                  href="/transactions/gl/journal-entry/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Journal Entry
                </Link>
              )}
              {hasPermission(permissions.GL_REPORTS_VIEW) && (
                <Link
                  href="/transactions/gl/journal-entries"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View All Entries
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
