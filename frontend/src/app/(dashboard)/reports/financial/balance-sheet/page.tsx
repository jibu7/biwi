'use client';


import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import reportingService, { BalanceSheetData } from '@/services/reportingService';
import { format } from 'date-fns';
import '@/styles/reports.css';

export default function BalanceSheetPage() {
  const [asOfDate, setAsOfDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [comparativeDate, setComparativeDate] = useState('');
  const [showComparative, setShowComparative] = useState(false);
  const [showDetails, setShowDetails] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  const { data: balanceSheet, isLoading, refetch } = useQuery({
    queryKey: ['balance-sheet', asOfDate, comparativeDate],
    queryFn: () => reportingService.getBalanceSheet(asOfDate, comparativeDate || undefined),
    enabled: !!asOfDate
  });

  const handleGenerateReport = () => {
    refetch();
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
    if (!balanceSheet) return;
    
    const csvData = [];
    csvData.push(['Account Code', 'Account Name', 'Amount', showComparative ? 'Comparative' : ''].filter(Boolean));
    
    // Assets
    csvData.push(['ASSETS', '', '', '']);
    balanceSheet.assets.forEach(line => {
      csvData.push([line.account_code, line.account_name, line.amount.toString(), '']);
    });
    csvData.push(['Total Assets', '', balanceSheet.total_assets.toString(), '']);
    
    // Liabilities
    csvData.push(['LIABILITIES', '', '', '']);
    balanceSheet.liabilities.forEach(line => {
      csvData.push([line.account_code, line.account_name, line.amount.toString(), '']);
    });
    csvData.push(['Total Liabilities', '', balanceSheet.total_liabilities.toString(), '']);
    
    // Equity
    csvData.push(['EQUITY', '', '', '']);
    balanceSheet.equity.forEach(line => {
      csvData.push([line.account_code, line.account_name, line.amount.toString(), '']);
    });
    csvData.push(['Total Equity', '', balanceSheet.total_equity.toString(), '']);
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `balance-sheet-${asOfDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDrillDown = (accountCode: string) => {
    // Navigate to account transactions detail
    // For balance sheet, show transactions from beginning of year to as_of_date
    const startOfYear = new Date(new Date(asOfDate).getFullYear(), 0, 1).toISOString().split('T')[0];
    const url = `/reports/gl/account-transactions?account_code=${accountCode}&start_date=${startOfYear}&end_date=${asOfDate}`;
    window.open(url, '_blank');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const renderSection = (title: string, lines: any[], total: number) => (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-3 text-gray-800 print:text-black">{title}</h3>
      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg print:shadow-none">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50 print:bg-white">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black print:border-b">
                Account Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black print:border-b">
                Account Name
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black print:border-b">
                Amount
              </th>
              {showComparative && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black print:border-b">
                  Comparative
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {lines.map((line, index) => (
              <tr 
                key={index} 
                className={`${line.is_total ? 'font-bold bg-gray-50' : ''} hover:bg-gray-50 print:hover:bg-white cursor-pointer`}
                onClick={() => !line.is_total && handleDrillDown(line.account_code)}
                title={!line.is_total ? "Click to view account transactions" : ""}
              >
                <td 
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 print:text-black print:border-b"
                  style={{ paddingLeft: `${line.level * 20 + 24}px` }}
                >
                  {line.account_code}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 print:text-black print:border-b">
                  {line.account_name}
                  {!line.is_total && (
                    <span className="ml-2 text-xs text-blue-500 print:hidden">
                      ↗
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right print:text-black print:border-b">
                  {formatCurrency(Number(line.amount))}
                </td>
                {showComparative && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right print:text-black print:border-b">
                    -
                  </td>
                )}
              </tr>
            ))}
            <tr className="border-t-2 border-gray-300 font-bold bg-blue-50 print:bg-white print:border-black">
              <td colSpan={2} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 print:text-black print:border-b">
                Total {title}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right print:text-black print:border-b">
                {formatCurrency(total)}
              </td>
              {showComparative && (
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right print:text-black print:border-b">
                  -
                </td>
              )}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 print:p-0">
      <div className="mb-6 print:hidden">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Balance Sheet</h1>
          
          {/* Action Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              {showDetails ? 'Hide Details' : 'Show Details'}
            </button>
            <button
              onClick={handleExportCSV}
              disabled={!balanceSheet}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Export CSV
            </button>
            <button
              onClick={handlePrint}
              disabled={!balanceSheet}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Print/PDF
            </button>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Report Parameters</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  As of Date
                </label>
                <input
                  type="date"
                  value={asOfDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAsOfDate(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showComparative"
                  checked={showComparative}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setShowComparative(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mr-2"
                />
                <label htmlFor="showComparative" className="text-sm font-medium text-gray-700">
                  Show Comparative
                </label>
              </div>
              {showComparative && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Comparative Date
                  </label>
                  <input
                    type="date"
                    value={comparativeDate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setComparativeDate(e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              )}
              <div className="flex items-end">
                <button
                  onClick={handleGenerateReport}
                  className="w-full bg-indigo-600 border border-transparent rounded-md shadow-sm py-2 px-4 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Generate Report
                </button>
              </div>
            </div>
            
            {/* Advanced Options */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Display Options</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="showDetails"
                    checked={showDetails}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setShowDetails(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mr-2"
                  />
                  <label htmlFor="showDetails" className="text-sm text-gray-700">
                    Show Account Details
                  </label>
                </div>
                <div className="text-sm text-gray-500">
                  <span className="font-medium">Tip:</span> Click on any account to view detailed transactions
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print/Export optimized report */}
      <div ref={printRef}>
        {balanceSheet && (
          <div className="bg-white shadow rounded-lg print:shadow-none">
            <div className="px-6 py-4 border-b border-gray-200 print:border-black">
              <h2 className="text-xl font-medium text-gray-900 text-center print:text-black">
                {balanceSheet.company_name}
                <br />
                Balance Sheet
                <br />
                As of {format(new Date(balanceSheet.as_of_date), 'MMMM dd, yyyy')}
                {showComparative && comparativeDate && (
                  <>
                    <br />
                    <span className="text-sm">Comparative as of {format(new Date(comparativeDate), 'MMMM dd, yyyy')}</span>
                  </>
                )}
              </h2>
            </div>
            <div className="p-6 print:p-4">
              {showDetails && (
                <>
                  {renderSection('ASSETS', balanceSheet.assets, Number(balanceSheet.total_assets))}
                  {renderSection('LIABILITIES', balanceSheet.liabilities, Number(balanceSheet.total_liabilities))}
                  {renderSection('EQUITY', balanceSheet.equity, Number(balanceSheet.total_equity))}
                </>
              )}
              
              {/* Summary Section for condensed view */}
              {!showDetails && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-blue-50 p-4 rounded-lg print:bg-white print:border">
                      <h3 className="text-lg font-semibold text-blue-800 print:text-black">ASSETS</h3>
                      <p className="text-2xl font-bold text-blue-600 print:text-black">
                        {formatCurrency(Number(balanceSheet.total_assets))}
                      </p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg print:bg-white print:border">
                      <h3 className="text-lg font-semibold text-red-800 print:text-black">LIABILITIES</h3>
                      <p className="text-2xl font-bold text-red-600 print:text-black">
                        {formatCurrency(Number(balanceSheet.total_liabilities))}
                      </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg print:bg-white print:border">
                      <h3 className="text-lg font-semibold text-green-800 print:text-black">EQUITY</h3>
                      <p className="text-2xl font-bold text-green-600 print:text-black">
                        {formatCurrency(Number(balanceSheet.total_equity))}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="mt-6 p-4 bg-gray-100 rounded print:bg-white print:border print:border-black">
                <div className="flex justify-between items-center font-bold text-lg print:text-black">
                  <span>Total Liabilities and Equity:</span>
                  <span>{formatCurrency(Number(balanceSheet.total_liabilities) + Number(balanceSheet.total_equity))}</span>
                </div>
                <div className="text-sm text-gray-600 mt-2 print:text-black">
                  Balance Check: Assets = Liabilities + Equity
                  <br />
                  {formatCurrency(Number(balanceSheet.total_assets))} = {formatCurrency(Number(balanceSheet.total_liabilities) + Number(balanceSheet.total_equity))}
                  {Number(balanceSheet.total_assets) === (Number(balanceSheet.total_liabilities) + Number(balanceSheet.total_equity)) ? 
                    ' ✓ Balanced' : ' ⚠ Not Balanced'}
                </div>
              </div>
              
              {/* Print Footer */}
              <div className="hidden print:block mt-6 pt-4 border-t border-gray-300 text-xs text-gray-500">
                <div className="flex justify-between">
                  <span>Generated on: {format(new Date(), 'MMMM dd, yyyy HH:mm')}</span>
                  <span>Page 1 of 1</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
