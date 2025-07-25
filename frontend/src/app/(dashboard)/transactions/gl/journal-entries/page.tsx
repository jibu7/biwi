'use client';


import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Calendar, FileText, CheckCircle } from 'lucide-react';
import { glService } from '@/services/glService';

export default function JournalEntriesPage() {
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState({
    start_date: '2024-01-01', // Start from 2024 to catch the manual example
    end_date: new Date().toISOString().split('T')[0],
  });

  const { data: journalEntries = [], isLoading, error } = useQuery({
    queryKey: ['journalEntries', dateRange],
    queryFn: () => glService.getJournalEntries(dateRange),
  });

  const postMutation = useMutation({
    mutationFn: glService.postJournalEntry,
    onSuccess: () => {
      // Refetch journal entries to show updated status
      queryClient.invalidateQueries({ queryKey: ['journalEntries'] });
    },
    onError: (error) => {
      console.error('Error posting journal entry:', error);
      alert('Error posting journal entry. Please try again.');
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red-600">Error loading journal entries: {error.message}</div>;
  }

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Journal Entries</h1>
          <p className="mt-2 text-sm text-gray-700">
            View and manage all journal entries.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            href="/transactions/gl/journal-entry/new"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Journal Entry
          </Link>
        </div>
      </div>

      <div className="mt-8">
        <div className="mb-4 flex gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.start_date}
              onChange={(e) => setDateRange(prev => ({ ...prev, start_date: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.end_date}
              onChange={(e) => setDateRange(prev => ({ ...prev, end_date: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {journalEntries.map((entry) => {
              const totalAmount = entry.lines.reduce((sum, line) => sum + (parseFloat(line.debit_amount) || 0), 0);
              
              return (
                <li key={entry.id}>
                  <div className="px-4 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <FileText className="h-6 w-6 text-gray-400" />
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center">
                            <p className="text-sm font-medium text-gray-900">
                              Journal Entry #{entry.id}
                            </p>
                            <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              entry.status === 'posted' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {entry.status}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center text-sm text-gray-500">
                            <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                            {new Date(entry.entry_date).toLocaleDateString()}
                            {entry.reference && (
                              <>
                                <span className="mx-2">•</span>
                                <span>Ref: {entry.reference}</span>
                              </>
                            )}
                          </div>
                          {entry.description && (
                            <p className="mt-1 text-sm text-gray-500">
                              {entry.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: 'USD',
                            }).format(totalAmount)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {entry.lines.length} lines
                          </p>
                        </div>
                        {entry.status === 'Draft' && (
                          <button
                            onClick={() => postMutation.mutate(entry.id)}
                            disabled={postMutation.isPending}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 disabled:opacity-50"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {postMutation.isPending ? 'Posting...' : 'Post'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          {journalEntries.length === 0 && (
            <div className="px-4 py-8 text-center text-gray-500">
              No journal entries found for the selected date range.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
