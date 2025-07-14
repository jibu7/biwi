'use client';

import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import '@/styles/reports.css';

interface CustomerAnalysisData {
  id: number;
  customer_code: string;
  customer_name: string;
  total_sales: number;
  total_receipts: number;
  outstanding_balance: number;
  avg_days_to_pay: number;
  largest_invoice: number;
  last_payment_date: string;
  credit_limit: number;
  risk_score: 'Low' | 'Medium' | 'High';
  sales_trend: 'Increasing' | 'Stable' | 'Decreasing';
}

export default function CustomerAnalysisPage() {
  const [dateFrom, setDateFrom] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [customerGroup, setCustomerGroup] = useState('');
  const [riskLevel, setRiskLevel] = useState('');
  const [sortBy, setSortBy] = useState('total_sales');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedCustomer, setExpandedCustomer] = useState<number | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // Mock data for demonstration
  const mockCustomerAnalysis: CustomerAnalysisData[] = [
    {
      id: 1,
      customer_code: 'CUST001',
      customer_name: 'ABC Corporation',
      total_sales: 150000,
      total_receipts: 140000,
      outstanding_balance: 10000,
      avg_days_to_pay: 35,
      largest_invoice: 25000,
      last_payment_date: '2024-01-15',
      credit_limit: 50000,
      risk_score: 'Low',
      sales_trend: 'Increasing'
    },
    {
      id: 2,
      customer_code: 'CUST002',
      customer_name: 'XYZ Limited',
      total_sales: 85000,
      total_receipts: 70000,
      outstanding_balance: 15000,
      avg_days_to_pay: 45,
      largest_invoice: 18000,
      last_payment_date: '2024-01-10',
      credit_limit: 30000,
      risk_score: 'Medium',
      sales_trend: 'Stable'
    },
    {
      id: 3,
      customer_code: 'CUST003',
      customer_name: 'Quick Solutions Inc',
      total_sales: 45000,
      total_receipts: 30000,
      outstanding_balance: 15000,
      avg_days_to_pay: 65,
      largest_invoice: 12000,
      last_payment_date: '2023-12-20',
      credit_limit: 20000,
      risk_score: 'High',
      sales_trend: 'Decreasing'
    }
  ];

  const { data: customerAnalysis = mockCustomerAnalysis, isLoading } = useQuery({
    queryKey: ['customer-analysis', dateFrom, dateTo, customerGroup, riskLevel],
    queryFn: () => Promise.resolve(mockCustomerAnalysis),
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handlePrint = () => {
    if (printRef.current) {
      const printContent = printRef.current.innerHTML;
      const originalContent = document.body.innerHTML;
      document.body.innerHTML = printContent;
      window.print();
      document.body.innerHTML = originalContent;
      window.location.reload();
    }
  };

  const handleExportCSV = () => {
    const csvData = [];
    csvData.push([
      'Customer Code', 'Customer Name', 'Total Sales', 'Total Receipts', 
      'Outstanding Balance', 'Avg Days to Pay', 'Largest Invoice', 
      'Last Payment Date', 'Credit Limit', 'Risk Score', 'Sales Trend'
    ]);
    
    sortedData.forEach(customer => {
      csvData.push([
        customer.customer_code,
        customer.customer_name,
        customer.total_sales.toString(),
        customer.total_receipts.toString(),
        customer.outstanding_balance.toString(),
        customer.avg_days_to_pay.toString(),
        customer.largest_invoice.toString(),
        customer.last_payment_date,
        customer.credit_limit.toString(),
        customer.risk_score,
        customer.sales_trend
      ]);
    });
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customer-analysis-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Filter and sort data
  const filteredData = customerAnalysis.filter(customer => {
    if (riskLevel && customer.risk_score !== riskLevel) return false;
    return true;
  });

  const sortedData = [...filteredData].sort((a, b) => {
    const aValue = a[sortBy as keyof CustomerAnalysisData];
    const bValue = b[sortBy as keyof CustomerAnalysisData];
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    const aStr = String(aValue).toLowerCase();
    const bStr = String(bValue).toLowerCase();
    return sortOrder === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
  });

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'High': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'Increasing': return '📈';
      case 'Stable': return '➡️';
      case 'Decreasing': return '📉';
      default: return '❓';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const totalSales = sortedData.reduce((sum, customer) => sum + customer.total_sales, 0);
  const totalOutstanding = sortedData.reduce((sum, customer) => sum + customer.outstanding_balance, 0);
  const avgDaysToPay = sortedData.reduce((sum, customer) => sum + customer.avg_days_to_pay, 0) / sortedData.length;

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Customer Analysis Report</h1>
        
        {/* Report Parameters */}
        <div className="bg-white shadow rounded-lg mb-6 print:shadow-none">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Report Parameters</h2>
          </div>
          <div className="p-6 print:hidden">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Group</label>
                <select
                  value={customerGroup}
                  onChange={(e) => setCustomerGroup(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">All Groups</option>
                  <option value="retail">Retail</option>
                  <option value="wholesale">Wholesale</option>
                  <option value="corporate">Corporate</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Risk Level</label>
                <select
                  value={riskLevel}
                  onChange={(e) => setRiskLevel(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">All Levels</option>
                  <option value="Low">Low Risk</option>
                  <option value="Medium">Medium Risk</option>
                  <option value="High">High Risk</option>
                </select>
              </div>
              <div className="flex items-end space-x-2">
                <button
                  onClick={handleExportCSV}
                  className="flex-1 bg-green-600 border border-transparent rounded-md shadow-sm py-2 px-4 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Export CSV
                </button>
                <button
                  onClick={handlePrint}
                  className="flex-1 bg-gray-600 border border-transparent rounded-md shadow-sm py-2 px-4 text-base font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Print
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4 print:border">
            <div className="text-sm font-medium text-gray-600">Total Customers</div>
            <div className="text-2xl font-bold text-gray-900">{sortedData.length}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 print:border">
            <div className="text-sm font-medium text-gray-600">Total Sales</div>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalSales)}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 print:border">
            <div className="text-sm font-medium text-gray-600">Total Outstanding</div>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalOutstanding)}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 print:border">
            <div className="text-sm font-medium text-gray-600">Avg Days to Pay</div>
            <div className="text-2xl font-bold text-blue-600">{Math.round(avgDaysToPay)} days</div>
          </div>
        </div>

        {/* Customer Analysis Table */}
        <div ref={printRef} className="bg-white shadow rounded-lg print:shadow-none">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="text-center">
              <h2 className="text-xl font-medium text-gray-900">Customer Analysis Report</h2>
              <p className="text-sm text-gray-500">
                Period: {format(new Date(dateFrom), 'MMM dd, yyyy')} - {format(new Date(dateTo), 'MMM dd, yyyy')}
              </p>
            </div>
          </div>
          
          <div className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50 print:bg-white">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black">
                      <button onClick={() => handleSort('customer_name')} className="hover:text-gray-700">
                        Customer
                      </button>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black">
                      <button onClick={() => handleSort('total_sales')} className="hover:text-gray-700">
                        Total Sales
                      </button>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black">
                      <button onClick={() => handleSort('outstanding_balance')} className="hover:text-gray-700">
                        Outstanding
                      </button>
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black">
                      <button onClick={() => handleSort('avg_days_to_pay')} className="hover:text-gray-700">
                        Avg Days
                      </button>
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black">
                      Risk Score
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black">
                      Trend
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black print:hidden">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 print:bg-white">
                  {sortedData.map((customer) => (
                    <>
                      <tr key={customer.id} className="hover:bg-gray-50 print:hover:bg-white">
                        <td className="px-6 py-4 whitespace-nowrap print:text-black">
                          <div>
                            <div className="text-sm font-medium text-gray-900 print:text-black">
                              {customer.customer_name}
                            </div>
                            <div className="text-sm text-gray-500 print:text-black">
                              {customer.customer_code}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right print:text-black">
                          {formatCurrency(customer.total_sales)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right print:text-black">
                          {formatCurrency(customer.outstanding_balance)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center print:text-black">
                          {customer.avg_days_to_pay} days
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskBadgeColor(customer.risk_score)}`}>
                            {customer.risk_score}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm print:text-black">
                          {getTrendIcon(customer.sales_trend)} {customer.sales_trend}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium print:hidden">
                          <button
                            onClick={() => setExpandedCustomer(expandedCustomer === customer.id ? null : customer.id)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            {expandedCustomer === customer.id ? (
                              <span className="text-lg">▼</span>
                            ) : (
                              <span className="text-lg">▶</span>
                            )}
                          </button>
                        </td>
                      </tr>
                      {expandedCustomer === customer.id && (
                        <tr className="bg-gray-50 print:bg-white print:hidden">
                          <td colSpan={7} className="px-6 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <strong>Credit Limit:</strong> {formatCurrency(customer.credit_limit)}
                              </div>
                              <div>
                                <strong>Largest Invoice:</strong> {formatCurrency(customer.largest_invoice)}
                              </div>
                              <div>
                                <strong>Last Payment:</strong> {format(new Date(customer.last_payment_date), 'MMM dd, yyyy')}
                              </div>
                              <div>
                                <strong>Total Receipts:</strong> {formatCurrency(customer.total_receipts)}
                              </div>
                              <div>
                                <strong>Collection Efficiency:</strong> {((customer.total_receipts / customer.total_sales) * 100).toFixed(1)}%
                              </div>
                              <div>
                                <strong>Credit Utilization:</strong> {((customer.outstanding_balance / customer.credit_limit) * 100).toFixed(1)}%
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
