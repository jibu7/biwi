'use client';


import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import '@/styles/reports.css';

interface SupplierAnalysisData {
  id: number;
  supplier_code: string;
  supplier_name: string;
  total_purchases: number;
  total_payments: number;
  outstanding_balance: number;
  avg_days_to_pay: number;
  largest_invoice: number;
  last_payment_date: string;
  credit_limit: number;
  payment_terms: string;
  supplier_category: string;
  performance_rating: 'Excellent' | 'Good' | 'Average' | 'Poor';
  purchase_trend: 'Increasing' | 'Stable' | 'Decreasing';
  payment_history_score: number;
}

export default function SupplierAnalysisPage() {
  const [dateFrom, setDateFrom] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [supplierCategory, setSupplierCategory] = useState('');
  const [performanceRating, setPerformanceRating] = useState('');
  const [sortBy, setSortBy] = useState('total_purchases');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedSupplier, setExpandedSupplier] = useState<number | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // Mock data for demonstration
  const mockSupplierAnalysis: SupplierAnalysisData[] = [
    {
      id: 1,
      supplier_code: 'SUP001',
      supplier_name: 'Tech Solutions Ltd',
      total_purchases: 250000,
      total_payments: 230000,
      outstanding_balance: 20000,
      avg_days_to_pay: 28,
      largest_invoice: 45000,
      last_payment_date: '2024-01-20',
      credit_limit: 100000,
      payment_terms: 'Net 30',
      supplier_category: 'Technology',
      performance_rating: 'Excellent',
      purchase_trend: 'Increasing',
      payment_history_score: 95
    },
    {
      id: 2,
      supplier_code: 'SUP002',
      supplier_name: 'Office Supplies Co',
      total_purchases: 85000,
      total_payments: 82000,
      outstanding_balance: 3000,
      avg_days_to_pay: 25,
      largest_invoice: 8500,
      last_payment_date: '2024-01-18',
      credit_limit: 25000,
      payment_terms: 'Net 15',
      supplier_category: 'Office Supplies',
      performance_rating: 'Good',
      purchase_trend: 'Stable',
      payment_history_score: 88
    },
    {
      id: 3,
      supplier_code: 'SUP003',
      supplier_name: 'Industrial Equipment Inc',
      total_purchases: 180000,
      total_payments: 165000,
      outstanding_balance: 15000,
      avg_days_to_pay: 35,
      largest_invoice: 35000,
      last_payment_date: '2024-01-15',
      credit_limit: 75000,
      payment_terms: 'Net 45',
      supplier_category: 'Equipment',
      performance_rating: 'Good',
      purchase_trend: 'Decreasing',
      payment_history_score: 82
    },
    {
      id: 4,
      supplier_code: 'SUP004',
      supplier_name: 'Materials Direct',
      total_purchases: 65000,
      total_payments: 55000,
      outstanding_balance: 10000,
      avg_days_to_pay: 42,
      largest_invoice: 15000,
      last_payment_date: '2024-01-12',
      credit_limit: 40000,
      payment_terms: 'Net 30',
      supplier_category: 'Raw Materials',
      performance_rating: 'Average',
      purchase_trend: 'Stable',
      payment_history_score: 75
    }
  ];

  const { data: supplierAnalysis = mockSupplierAnalysis, isLoading } = useQuery({
    queryKey: ['supplier-analysis', dateFrom, dateTo, supplierCategory, performanceRating],
    queryFn: () => Promise.resolve(mockSupplierAnalysis),
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
      'Supplier Code', 'Supplier Name', 'Total Purchases', 'Total Payments', 
      'Outstanding Balance', 'Avg Days to Pay', 'Largest Invoice', 
      'Last Payment Date', 'Credit Limit', 'Payment Terms', 'Category',
      'Performance Rating', 'Purchase Trend', 'Payment History Score'
    ]);
    
    sortedData.forEach(supplier => {
      csvData.push([
        supplier.supplier_code,
        supplier.supplier_name,
        supplier.total_purchases.toString(),
        supplier.total_payments.toString(),
        supplier.outstanding_balance.toString(),
        supplier.avg_days_to_pay.toString(),
        supplier.largest_invoice.toString(),
        supplier.last_payment_date,
        supplier.credit_limit.toString(),
        supplier.payment_terms,
        supplier.supplier_category,
        supplier.performance_rating,
        supplier.purchase_trend,
        supplier.payment_history_score.toString()
      ]);
    });
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `supplier-analysis-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Filter and sort data
  const filteredData = supplierAnalysis.filter(supplier => {
    if (supplierCategory && supplier.supplier_category !== supplierCategory) return false;
    if (performanceRating && supplier.performance_rating !== performanceRating) return false;
    return true;
  });

  const sortedData = [...filteredData].sort((a, b) => {
    const aValue = a[sortBy as keyof SupplierAnalysisData];
    const bValue = b[sortBy as keyof SupplierAnalysisData];
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    const aStr = String(aValue).toLowerCase();
    const bStr = String(bValue).toLowerCase();
    return sortOrder === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
  });

  const getPerformanceBadgeColor = (rating: string) => {
    switch (rating) {
      case 'Excellent': return 'bg-green-100 text-green-800';
      case 'Good': return 'bg-blue-100 text-blue-800';
      case 'Average': return 'bg-yellow-100 text-yellow-800';
      case 'Poor': return 'bg-red-100 text-red-800';
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

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const totalPurchases = sortedData.reduce((sum, supplier) => sum + supplier.total_purchases, 0);
  const totalOutstanding = sortedData.reduce((sum, supplier) => sum + supplier.outstanding_balance, 0);
  const avgDaysToPay = sortedData.reduce((sum, supplier) => sum + supplier.avg_days_to_pay, 0) / sortedData.length;
  const avgScore = sortedData.reduce((sum, supplier) => sum + supplier.payment_history_score, 0) / sortedData.length;

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Supplier Analysis Report</h1>
        
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={supplierCategory}
                  onChange={(e) => setSupplierCategory(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">All Categories</option>
                  <option value="Technology">Technology</option>
                  <option value="Office Supplies">Office Supplies</option>
                  <option value="Equipment">Equipment</option>
                  <option value="Raw Materials">Raw Materials</option>
                  <option value="Services">Services</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Performance</label>
                <select
                  value={performanceRating}
                  onChange={(e) => setPerformanceRating(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">All Ratings</option>
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Average">Average</option>
                  <option value="Poor">Poor</option>
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4 print:border">
            <div className="text-sm font-medium text-gray-600">Total Suppliers</div>
            <div className="text-2xl font-bold text-gray-900">{sortedData.length}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 print:border">
            <div className="text-sm font-medium text-gray-600">Total Purchases</div>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalPurchases)}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 print:border">
            <div className="text-sm font-medium text-gray-600">Total Outstanding</div>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalOutstanding)}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 print:border">
            <div className="text-sm font-medium text-gray-600">Avg Days to Pay</div>
            <div className="text-2xl font-bold text-purple-600">{Math.round(avgDaysToPay)} days</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 print:border">
            <div className="text-sm font-medium text-gray-600">Avg Score</div>
            <div className={`text-2xl font-bold ${getScoreColor(avgScore)}`}>{Math.round(avgScore)}%</div>
          </div>
        </div>

        {/* Supplier Analysis Table */}
        <div ref={printRef} className="bg-white shadow rounded-lg print:shadow-none">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="text-center">
              <h2 className="text-xl font-medium text-gray-900">Supplier Analysis Report</h2>
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
                      <button onClick={() => handleSort('supplier_name')} className="hover:text-gray-700">
                        Supplier
                      </button>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black">
                      <button onClick={() => handleSort('total_purchases')} className="hover:text-gray-700">
                        Total Purchases
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
                      Performance
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black">
                      <button onClick={() => handleSort('payment_history_score')} className="hover:text-gray-700">
                        Score
                      </button>
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
                  {sortedData.map((supplier) => (
                    <>
                      <tr key={supplier.id} className="hover:bg-gray-50 print:hover:bg-white">
                        <td className="px-6 py-4 whitespace-nowrap print:text-black">
                          <div>
                            <div className="text-sm font-medium text-gray-900 print:text-black">
                              {supplier.supplier_name}
                            </div>
                            <div className="text-sm text-gray-500 print:text-black">
                              {supplier.supplier_code} • {supplier.supplier_category}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right print:text-black">
                          {formatCurrency(supplier.total_purchases)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right print:text-black">
                          {formatCurrency(supplier.outstanding_balance)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center print:text-black">
                          {supplier.avg_days_to_pay} days
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPerformanceBadgeColor(supplier.performance_rating)}`}>
                            {supplier.performance_rating}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm print:text-black">
                          <span className={`font-semibold ${getScoreColor(supplier.payment_history_score)}`}>
                            {supplier.payment_history_score}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm print:text-black">
                          {getTrendIcon(supplier.purchase_trend)} {supplier.purchase_trend}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium print:hidden">
                          <button
                            onClick={() => setExpandedSupplier(expandedSupplier === supplier.id ? null : supplier.id)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            {expandedSupplier === supplier.id ? (
                              <span className="text-lg">▼</span>
                            ) : (
                              <span className="text-lg">▶</span>
                            )}
                          </button>
                        </td>
                      </tr>
                      {expandedSupplier === supplier.id && (
                        <tr className="bg-gray-50 print:bg-white print:hidden">
                          <td colSpan={8} className="px-6 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <strong>Credit Limit:</strong> {formatCurrency(supplier.credit_limit)}
                              </div>
                              <div>
                                <strong>Payment Terms:</strong> {supplier.payment_terms}
                              </div>
                              <div>
                                <strong>Largest Invoice:</strong> {formatCurrency(supplier.largest_invoice)}
                              </div>
                              <div>
                                <strong>Last Payment:</strong> {format(new Date(supplier.last_payment_date), 'MMM dd, yyyy')}
                              </div>
                              <div>
                                <strong>Total Payments:</strong> {formatCurrency(supplier.total_payments)}
                              </div>
                              <div>
                                <strong>Payment Efficiency:</strong> {((supplier.total_payments / supplier.total_purchases) * 100).toFixed(1)}%
                              </div>
                              <div>
                                <strong>Credit Utilization:</strong> {((supplier.outstanding_balance / supplier.credit_limit) * 100).toFixed(1)}%
                              </div>
                              <div>
                                <strong>Purchase Volume Rank:</strong> #{sortedData.findIndex(s => s.id === supplier.id) + 1}
                              </div>
                              <div>
                                <strong>Days vs Terms:</strong> 
                                <span className={supplier.avg_days_to_pay <= parseInt(supplier.payment_terms.replace('Net ', '')) 
                                  ? 'text-green-600' : 'text-red-600'}>
                                  {supplier.avg_days_to_pay <= parseInt(supplier.payment_terms.replace('Net ', '')) 
                                    ? ' On Time' : ' Overdue'}
                                </span>
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
