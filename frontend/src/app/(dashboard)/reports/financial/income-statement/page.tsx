'use client';

import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import reportingService, { IncomeStatementData } from '@/services/reportingService';
import { format, subMonths } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { FileText, FileSpreadsheet, Printer } from 'lucide-react';
import '@/styles/reports.css';

export default function IncomeStatementPage() {
  const [startDate, setStartDate] = useState(format(subMonths(new Date(), 1), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [showComparative, setShowComparative] = useState(false);
  const [comparativeStartDate, setComparativeStartDate] = useState('');
  const [comparativeEndDate, setComparativeEndDate] = useState('');
  const [showDetails, setShowDetails] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  const { data: incomeStatement, isLoading, refetch } = useQuery({
    queryKey: ['income-statement', startDate, endDate, comparativeStartDate, comparativeEndDate],
    queryFn: () => reportingService.getIncomeStatement(
      startDate, 
      endDate, 
      showComparative ? comparativeStartDate : undefined, 
      showComparative ? comparativeEndDate : undefined
    ),
    enabled: !!startDate && !!endDate
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
    if (!incomeStatement) return;
    
    const csvData = [];
    csvData.push(['Account Code', 'Account Name', 'Amount', showComparative ? 'Comparative' : ''].filter(Boolean));
    
    // Revenue
    csvData.push(['REVENUE', '', '', '']);
    incomeStatement.revenue.forEach(line => {
      csvData.push([line.account_code, line.account_name, line.amount.toString(), '']);
    });
    csvData.push(['Total Revenue', '', incomeStatement.total_revenue.toString(), '']);
    
    // Expenses
    csvData.push(['EXPENSES', '', '', '']);
    incomeStatement.expenses.forEach(line => {
      csvData.push([line.account_code, line.account_name, line.amount.toString(), '']);
    });
    csvData.push(['Total Expenses', '', incomeStatement.total_expenses.toString(), '']);
    csvData.push(['Net Income', '', incomeStatement.net_income.toString(), '']);
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `income-statement-${startDate}-to-${endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDrillDown = (accountCode: string) => {
    const url = `/reports/gl/account-transactions?account_code=${accountCode}&start_date=${endDate}&end_date=${endDate}`;
    window.open(url, '_blank');
  };

  const handleExportPDF = () => {
    if (!incomeStatement) return;

    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(16);
    doc.text(incomeStatement.company_name, 105, 20, { align: 'center' });
    doc.text('Income Statement', 105, 30, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`For the Period ${format(new Date(incomeStatement.start_date), 'MMMM dd, yyyy')} to ${format(new Date(incomeStatement.end_date), 'MMMM dd, yyyy')}`, 105, 40, { align: 'center' });
    
    let yPosition = 60;
    
    // Revenue section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('REVENUE', 20, yPosition);
    yPosition += 10;
    
    const revenueData = incomeStatement.revenue.map(line => [
      line.account_code,
      line.account_name,
      formatCurrency(line.amount)
    ]);
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Account Code', 'Account Name', 'Amount']],
      body: revenueData,
      theme: 'plain',
      styles: { fontSize: 10 },
      columnStyles: { 2: { halign: 'right' } }
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 5;
    
    // Total Revenue
    doc.setFont('helvetica', 'bold');
    doc.text('Total Revenue:', 120, yPosition);
    doc.text(formatCurrency(incomeStatement.total_revenue), 180, yPosition, { align: 'right' });
    yPosition += 15;
    
    // Expenses section
    doc.text('EXPENSES', 20, yPosition);
    yPosition += 10;
    
    const expensesData = incomeStatement.expenses.map(line => [
      line.account_code,
      line.account_name,
      formatCurrency(line.amount)
    ]);
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Account Code', 'Account Name', 'Amount']],
      body: expensesData,
      theme: 'plain',
      styles: { fontSize: 10 },
      columnStyles: { 2: { halign: 'right' } }
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 5;
    
    // Total Expenses
    doc.text('Total Expenses:', 120, yPosition);
    doc.text(formatCurrency(incomeStatement.total_expenses), 180, yPosition, { align: 'right' });
    yPosition += 10;
    
    // Net Income
    doc.setFontSize(12);
    doc.text('Net Income:', 120, yPosition);
    doc.text(formatCurrency(incomeStatement.net_income), 180, yPosition, { align: 'right' });
    
    doc.save(`income-statement-${startDate}-to-${endDate}.pdf`);
  };

  const handleExportExcel = () => {
    if (!incomeStatement) return;

    const workbook = XLSX.utils.book_new();
    
    // Prepare data
    const data = [];
    
    // Header
    data.push([incomeStatement.company_name]);
    data.push(['Income Statement']);
    data.push([`For the Period ${format(new Date(incomeStatement.start_date), 'MMMM dd, yyyy')} to ${format(new Date(incomeStatement.end_date), 'MMMM dd, yyyy')}`]);
    data.push([]);
    
    // Revenue
    data.push(['REVENUE']);
    data.push(['Account Code', 'Account Name', 'Amount']);
    incomeStatement.revenue.forEach(line => {
      data.push([line.account_code, line.account_name, line.amount]);
    });
    data.push(['', 'Total Revenue', incomeStatement.total_revenue]);
    data.push([]);
    
    // Expenses
    data.push(['EXPENSES']);
    data.push(['Account Code', 'Account Name', 'Amount']);
    incomeStatement.expenses.forEach(line => {
      data.push([line.account_code, line.account_name, line.amount]);
    });
    data.push(['', 'Total Expenses', incomeStatement.total_expenses]);
    data.push([]);
    data.push(['', 'Net Income', incomeStatement.net_income]);
    
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    
    // Add some styling
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    
    // Set column widths
    worksheet['!cols'] = [
      { width: 15 }, // Account Code
      { width: 30 }, // Account Name
      { width: 15 }  // Amount
    ];
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Income Statement');
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `income-statement-${startDate}-to-${endDate}.xlsx`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const renderSection = (title: string, lines: any[], total: number) => (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-3 text-gray-800">{title}</h3>
      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Account Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Account Name
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              {showComparative && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Comparative
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {lines.map((line, index) => (
              <tr key={index} className={line.is_total ? 'font-bold bg-gray-50' : ''}>
                <td 
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                  style={{ paddingLeft: `${line.level * 20 + 24}px` }}
                >
                  {line.account_code}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {line.account_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  {formatCurrency(line.amount)}
                </td>
                {showComparative && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    -
                  </td>
                )}
              </tr>
            ))}
            <tr className="border-t-2 border-gray-300 font-bold bg-blue-50">
              <td colSpan={2} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                Total {title}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                {formatCurrency(total)}
              </td>
              {showComparative && (
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
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
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Income Statement</h1>
        
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Report Parameters</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleGenerateReport}
                  className="w-full bg-indigo-600 border border-transparent rounded-md shadow-sm py-2 px-4 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Generate Report
                </button>
              </div>
            </div>
            
            {/* Export buttons */}
            {incomeStatement && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Export Options</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handlePrint}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Export PDF
                  </button>
                  <button
                    onClick={handleExportExcel}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Export Excel
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Export CSV
                  </button>
                </div>
              </div>
            )}
            
            <div className="mt-4">
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="showComparative"
                  checked={showComparative}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setShowComparative(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mr-2"
                />
                <label htmlFor="showComparative" className="text-sm font-medium text-gray-700">
                  Show Comparative Period
                </label>
              </div>
              
              {showComparative && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Comparative Start Date
                    </label>
                    <input
                      type="date"
                      value={comparativeStartDate}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setComparativeStartDate(e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Comparative End Date
                    </label>
                    <input
                      type="date"
                      value={comparativeEndDate}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setComparativeEndDate(e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {incomeStatement && (
        <div ref={printRef} className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-medium text-gray-900 text-center">
              {incomeStatement.company_name}
              <br />
              Income Statement
              <br />
              For the Period {format(new Date(incomeStatement.start_date), 'MMMM dd, yyyy')} to {format(new Date(incomeStatement.end_date), 'MMMM dd, yyyy')}
            </h2>
          </div>
          <div className="p-6">
            {renderSection('REVENUE', incomeStatement.revenue, incomeStatement.total_revenue)}
            {renderSection('EXPENSES', incomeStatement.expenses, incomeStatement.total_expenses)}
            
            <div className="mt-6 p-4 bg-gray-100 rounded">
              <div className="flex justify-between items-center font-bold text-lg">
                <span>Net Income:</span>
                <span className={incomeStatement.net_income >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {formatCurrency(incomeStatement.net_income)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
