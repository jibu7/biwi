'use client';


import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { arReportsService } from '@/services/arService';
import { CustomerAgingReportItem } from '@/types/ar';
import { Table } from '@/components/ui/Table';

export default function CustomerAgeAnalysisPage() {
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: ageingData = [], isLoading } = useQuery({
    queryKey: ['customerAgeing', asOfDate],
    queryFn: () => arReportsService.getCustomerAging(asOfDate),
    enabled: !!asOfDate,
  });

  const columns = [
    { header: 'Customer ID', accessor: 'customer_id' as keyof CustomerAgingReportItem },
    { header: 'Customer Name', accessor: 'customer_name' as keyof CustomerAgingReportItem },
    {
      header: 'Current',
      accessor: (item: CustomerAgingReportItem) => (
        <span className="font-mono">
          {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
          }).format(item.current)}
        </span>
      ),
    },
    {
      header: '1-30 Days',
      accessor: (item: CustomerAgingReportItem) => (
        <span className="font-mono">
          {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
          }).format(item.days_1_30)}
        </span>
      ),
    },
    {
      header: '31-60 Days',
      accessor: (item: CustomerAgingReportItem) => (
        <span className="font-mono">
          {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
          }).format(item.days_31_60)}
        </span>
      ),
    },
    {
      header: '61-90 Days',
      accessor: (item: CustomerAgingReportItem) => (
        <span className="font-mono">
          {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
          }).format(item.days_61_90)}
        </span>
      ),
    },
    {
      header: 'Over 90 Days',
      accessor: (item: CustomerAgingReportItem) => (
        <span className="font-mono text-red-600">
          {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
          }).format(item.over_90)}
        </span>
      ),
    },
    {
      header: 'Total Due',
      accessor: (item: CustomerAgingReportItem) => (
        <span className="font-mono font-bold">
          {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
          }).format(item.current_balance)}
        </span>
      ),
    },
  ];

  // Calculate totals
  const totals = ageingData.reduce(
    (acc, item) => ({
      current: acc.current + item.current,
      days_1_30: acc.days_1_30 + item.days_1_30,
      days_31_60: acc.days_31_60 + item.days_31_60,
      days_61_90: acc.days_61_90 + item.days_61_90,
      over_90: acc.over_90 + item.over_90,
      current_balance: acc.current_balance + item.current_balance,
    }),
    { current: 0, days_1_30: 0, days_31_60: 0, days_61_90: 0, over_90: 0, current_balance: 0 }
  );

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Customer Age Analysis</h1>
        <p className="mt-1 text-sm text-gray-600">
          View outstanding customer balances by age
        </p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700">
          As of Date
        </label>
        <input
          type="date"
          value={asOfDate}
          onChange={(e) => setAsOfDate(e.target.value)}
          className="mt-1 block w-full md:w-64 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <Table 
        data={ageingData.map((item, index) => ({ ...item, id: item.customer_id || index }))} 
        columns={columns} 
      />

      {/* Summary Totals */}
      <div className="mt-6 bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Current</p>
            <p className="text-lg font-semibold">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
              }).format(totals.current)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">1-30 Days</p>
            <p className="text-lg font-semibold">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
              }).format(totals.days_1_30)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">31-60 Days</p>
            <p className="text-lg font-semibold">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
              }).format(totals.days_31_60)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">61-90 Days</p>
            <p className="text-lg font-semibold">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
              }).format(totals.days_61_90)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Over 90 Days</p>
            <p className="text-lg font-semibold text-red-600">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
              }).format(totals.over_90)}
            </p>
          </div>
          <div className="md:col-span-3">
            <p className="text-sm text-gray-600">Total Outstanding</p>
            <p className="text-xl font-bold">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
              }).format(totals.current_balance)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
