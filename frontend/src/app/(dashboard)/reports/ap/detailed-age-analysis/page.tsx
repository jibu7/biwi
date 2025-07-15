'use client';


import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import '@/styles/reports.css';

interface APDetailedAgeData {
  id: number;
  supplier_code: string;
  supplier_name: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  original_amount: number;
  outstanding_amount: number;
  days_outstanding: number;
  age_bracket: 'Current' | '1-30' | '31-60' | '61-90' | '90+';
  purchase_order: string;
  reference: string;
}

export default function APDetailedAgeAnalysisPage() {
  const [asOfDate, setAsOfDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [supplierGroup, setSupplierGroup] = useState('');
  const [ageBracket, setAgeBracket] = useState('');
  const [minimumAmount, setMinimumAmount] = useState('');
  const [showZeroBalances, setShowZeroBalances] = useState(false);
  const [sortBy, setSortBy] = useState('days_outstanding');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedSupplier, setExpandedSupplier] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // Mock data for demonstration
  const mockDetailedAgeData: APDetailedAgeData[] = [
    {
      id: 1,
      supplier_code: 'SUP001',
      supplier_name: 'Tech Solutions Ltd',
      invoice_number: 'INV-2024-001',
      invoice_date: '2023-12-15',
      due_date: '2024-01-15',
      original_amount: 15000,
      outstanding_amount: 15000,
      days_outstanding: 45,
      age_bracket: '31-60',
      purchase_order: 'PO-2023-150',
      reference: 'Hardware purchase'
    },
    {
      id: 2,
      supplier_code: 'SUP001',
      supplier_name: 'Tech Solutions Ltd',
      invoice_number: 'INV-2024-002',
      invoice_date: '2024-01-10',
      due_date: '2024-02-10',
      original_amount: 8500,
      outstanding_amount: 8500,
      days_outstanding: 15,
      age_bracket: 'Current',
      purchase_order: 'PO-2024-001',
      reference: 'Software license'
    },
    {
      id: 3,
      supplier_code: 'SUP002',
      supplier_name: 'Office Supplies Co',
      invoice_number: 'OS-001234',
      invoice_date: '2023-11-20',
      due_date: '2023-12-20',
      original_amount: 2500,
      outstanding_amount: 2500,
      days_outstanding: 95,
      age_bracket: '90+',
      purchase_order: 'PO-2023-120',
      reference: 'Office furniture'
    },
    {
      id: 4,
      supplier_code: 'SUP003',
      supplier_name: 'Utilities Company',
      invoice_number: 'UTIL-202401',
      invoice_date: '2024-01-01',
      due_date: '2024-01-31',
      original_amount: 1200,
      outstanding_amount: 1200,
      days_outstanding: 25,
      age_bracket: '1-30',
      purchase_order: '',
      reference: 'Monthly utilities'
    }
  ];

  const { data: detailedAgeData = mockDetailedAgeData, isLoading } = useQuery({
    queryKey: ['ap-detailed-age', asOfDate, supplierGroup, ageBracket, minimumAmount, showZeroBalances],
    queryFn: () => Promise.resolve(mockDetailedAgeData),
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
      'Supplier Code', 'Supplier Name', 'Invoice Number', 'Invoice Date', 
      'Due Date', 'Original Amount', 'Outstanding Amount', 'Days Outstanding', 
      'Age Bracket', 'Purchase Order', 'Reference'
    ]);
    
    sortedData.forEach(item => {
      csvData.push([
        item.supplier_code,
        item.supplier_name,
        item.invoice_number,
        item.invoice_date,
        item.due_date,
        item.original_amount.toString(),
        item.outstanding_amount.toString(),
        item.days_outstanding.toString(),
        item.age_bracket,
        item.purchase_order,
        item.reference
      ]);
    });
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ap-detailed-age-analysis-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Filter and sort data
  const filteredData = detailedAgeData.filter(item => {
    if (ageBracket && item.age_bracket !== ageBracket) return false;
    if (minimumAmount && item.outstanding_amount < parseFloat(minimumAmount)) return false;
    if (!showZeroBalances && item.outstanding_amount === 0) return false;
    return true;
  });

  const sortedData = [...filteredData].sort((a, b) => {
    const aValue = a[sortBy as keyof APDetailedAgeData];
    const bValue = b[sortBy as keyof APDetailedAgeData];
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    const aStr = String(aValue).toLowerCase();
    const bStr = String(bValue).toLowerCase();
    return sortOrder === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
  });

  // Group by supplier
  const groupedBySupplier = sortedData.reduce((groups, item) => {
    const key = `${item.supplier_code}-${item.supplier_name}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
    return groups;
  }, {} as Record<string, APDetailedAgeData[]>);

  const getAgeBracketColor = (bracket: string) => {
    switch (bracket) {
      case 'Current': return 'bg-green-100 text-green-800';
      case '1-30': return 'bg-blue-100 text-blue-800';
      case '31-60': return 'bg-yellow-100 text-yellow-800';
      case '61-90': return 'bg-orange-100 text-orange-800';
      case '90+': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const totalOutstanding = sortedData.reduce((sum, item) => sum + item.outstanding_amount, 0);
  const ageBracketTotals = sortedData.reduce((totals, item) => {
    totals[item.age_bracket] = (totals[item.age_bracket] || 0) + item.outstanding_amount;
    return totals;
  }, {} as Record<string, number>);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">AP Detailed Age Analysis</h1>
        
        {/* Report Parameters */}
        <div className="bg-white shadow rounded-lg mb-6 print:shadow-none">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Report Parameters</h2>
          </div>
          <div className="p-6 print:hidden">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">As of Date</label>
                <input
                  type="date"
                  value={asOfDate}
                  onChange={(e) => setAsOfDate(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Group</label>
                <select
                  value={supplierGroup}
                  onChange={(e) => setSupplierGroup(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">All Groups</option>
                  <option value="preferred">Preferred</option>
                  <option value="standard">Standard</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age Bracket</label>
                <select
                  value={ageBracket}
                  onChange={(e) => setAgeBracket(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">All Brackets</option>
                  <option value="Current">Current</option>
                  <option value="1-30">1-30 Days</option>
                  <option value="31-60">31-60 Days</option>
                  <option value="61-90">61-90 Days</option>
                  <option value="90+">90+ Days</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Amount</label>
                <input
                  type="number"
                  value={minimumAmount}
                  onChange={(e) => setMinimumAmount(e.target.value)}
                  placeholder="0.00"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showZeroBalances"
                  checked={showZeroBalances}
                  onChange={(e) => setShowZeroBalances(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="showZeroBalances" className="ml-2 block text-sm text-gray-900">
                  Show zero balances
                </label>
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
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4 print:border">
            <div className="text-sm font-medium text-gray-600">Total Outstanding</div>
            <div className="text-xl font-bold text-gray-900">{formatCurrency(totalOutstanding)}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 print:border">
            <div className="text-sm font-medium text-green-600">Current</div>
            <div className="text-lg font-bold text-gray-900">{formatCurrency(ageBracketTotals['Current'] || 0)}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 print:border">
            <div className="text-sm font-medium text-blue-600">1-30 Days</div>
            <div className="text-lg font-bold text-gray-900">{formatCurrency(ageBracketTotals['1-30'] || 0)}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 print:border">
            <div className="text-sm font-medium text-yellow-600">31-60 Days</div>
            <div className="text-lg font-bold text-gray-900">{formatCurrency(ageBracketTotals['31-60'] || 0)}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 print:border">
            <div className="text-sm font-medium text-orange-600">61-90 Days</div>
            <div className="text-lg font-bold text-gray-900">{formatCurrency(ageBracketTotals['61-90'] || 0)}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 print:border">
            <div className="text-sm font-medium text-red-600">90+ Days</div>
            <div className="text-lg font-bold text-gray-900">{formatCurrency(ageBracketTotals['90+'] || 0)}</div>
          </div>
        </div>

        {/* Detailed Age Analysis Table */}
        <div ref={printRef} className="bg-white shadow rounded-lg print:shadow-none">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="text-center">
              <h2 className="text-xl font-medium text-gray-900">AP Detailed Age Analysis</h2>
              <p className="text-sm text-gray-500">
                As of {format(new Date(asOfDate), 'MMMM dd, yyyy')}
              </p>
            </div>
          </div>
          
          <div className="overflow-hidden">
            {Object.entries(groupedBySupplier).map(([supplierKey, invoices]) => {
              const supplierTotal = invoices.reduce((sum, inv) => sum + inv.outstanding_amount, 0);
              const firstInvoice = invoices[0];
              
              return (
                <div key={supplierKey} className="border-b border-gray-200 last:border-b-0">
                  <div 
                    className="px-6 py-4 bg-gray-50 cursor-pointer hover:bg-gray-100 print:bg-white print:cursor-default"
                    onClick={() => setExpandedSupplier(expandedSupplier === supplierKey ? null : supplierKey)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-gray-900 print:text-black">
                          {firstInvoice.supplier_name}
                        </div>
                        <div className="text-sm text-gray-500 print:text-black">
                          {firstInvoice.supplier_code} • {invoices.length} invoice(s)
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900 print:text-black">
                          {formatCurrency(supplierTotal)}
                        </div>
                        <div className="text-sm text-gray-500 print:hidden">
                          {expandedSupplier === supplierKey ? '▼ Collapse' : '▶ Expand'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {(expandedSupplier === supplierKey) && (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-300">
                        <thead className="bg-gray-50 print:bg-white">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black">
                              <button onClick={() => handleSort('invoice_number')} className="hover:text-gray-700">
                                Invoice
                              </button>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black">
                              <button onClick={() => handleSort('invoice_date')} className="hover:text-gray-700">
                                Invoice Date
                              </button>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black">
                              <button onClick={() => handleSort('due_date')} className="hover:text-gray-700">
                                Due Date
                              </button>
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black">
                              <button onClick={() => handleSort('outstanding_amount')} className="hover:text-gray-700">
                                Outstanding
                              </button>
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black">
                              <button onClick={() => handleSort('days_outstanding')} className="hover:text-gray-700">
                                Days
                              </button>
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black">
                              Age Bracket
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black">
                              Reference
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200 print:bg-white">
                          {invoices.map((invoice) => (
                            <tr key={invoice.id} className="hover:bg-gray-50 print:hover:bg-white">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 print:text-black">
                                {invoice.invoice_number}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 print:text-black">
                                {format(new Date(invoice.invoice_date), 'MMM dd, yyyy')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 print:text-black">
                                {format(new Date(invoice.due_date), 'MMM dd, yyyy')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right print:text-black">
                                {formatCurrency(invoice.outstanding_amount)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center print:text-black">
                                {invoice.days_outstanding}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAgeBracketColor(invoice.age_bracket)}`}>
                                  {invoice.age_bracket}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900 print:text-black">
                                {invoice.reference}
                                {invoice.purchase_order && (
                                  <div className="text-xs text-gray-500 print:text-black">PO: {invoice.purchase_order}</div>
                                )}
                              </td>
                            </tr>
                          ))}
                          <tr className="border-t-2 border-gray-300 font-bold bg-gray-50 print:bg-white">
                            <td colSpan={3} className="px-6 py-4 text-sm text-gray-900 print:text-black">
                              Supplier Total ({invoices.length} invoices)
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right print:text-black">
                              {formatCurrency(supplierTotal)}
                            </td>
                            <td colSpan={3}></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
