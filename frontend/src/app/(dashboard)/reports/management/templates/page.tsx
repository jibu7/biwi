'use client';

import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import '@/styles/reports.css';

interface ReportTemplate {
  id: number;
  template_name: string;
  report_type: string;
  description: string;
  created_by: string;
  created_date: string;
  last_modified: string;
  is_active: boolean;
  usage_count: number;
  parameters: Record<string, any>;
}

export default function ReportTemplatesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [reportType, setReportType] = useState('');
  const [createdBy, setCreatedBy] = useState('');
  const [isActive, setIsActive] = useState<boolean | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // Mock data for demonstration
  const mockTemplates: ReportTemplate[] = [
    {
      id: 1,
      template_name: 'Monthly Financial Summary',
      report_type: 'Financial',
      description: 'Standard monthly financial report including P&L and Balance Sheet',
      created_by: 'John Smith',
      created_date: '2024-01-15',
      last_modified: '2024-01-20',
      is_active: true,
      usage_count: 25,
      parameters: {
        date_range: 'monthly',
        include_budget_comparison: true,
        currency: 'USD'
      }
    },
    {
      id: 2,
      template_name: 'AR Aging - Detailed',
      report_type: 'AR',
      description: 'Detailed accounts receivable aging with customer breakdown',
      created_by: 'Jane Doe',
      created_date: '2024-01-10',
      last_modified: '2024-01-25',
      is_active: true,
      usage_count: 18,
      parameters: {
        age_brackets: ['Current', '1-30', '31-60', '61-90', '90+'],
        include_credit_limits: true,
        group_by_customer: true
      }
    },
    {
      id: 3,
      template_name: 'Inventory Valuation - Year End',
      report_type: 'Inventory',
      description: 'Year-end inventory valuation report for audit purposes',
      created_by: 'Mike Johnson',
      created_date: '2023-12-01',
      last_modified: '2023-12-15',
      is_active: false,
      usage_count: 5,
      parameters: {
        valuation_method: 'FIFO',
        include_obsolete: false,
        audit_trail: true
      }
    },
    {
      id: 4,
      template_name: 'AP Payment Schedule',
      report_type: 'AP',
      description: 'Accounts payable payment schedule and cash flow forecast',
      created_by: 'Sarah Wilson',
      created_date: '2024-01-05',
      last_modified: '2024-01-22',
      is_active: true,
      usage_count: 12,
      parameters: {
        forecast_days: 90,
        include_discounts: true,
        payment_terms_analysis: true
      }
    }
  ];

  const { data: templates = mockTemplates, isLoading } = useQuery({
    queryKey: ['report-templates', searchTerm, reportType, createdBy, isActive],
    queryFn: () => Promise.resolve(mockTemplates),
  });

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
      'Template Name', 'Report Type', 'Description', 'Created By', 
      'Created Date', 'Last Modified', 'Status', 'Usage Count'
    ]);
    
    filteredTemplates.forEach(template => {
      csvData.push([
        template.template_name,
        template.report_type,
        template.description,
        template.created_by,
        template.created_date,
        template.last_modified,
        template.is_active ? 'Active' : 'Inactive',
        template.usage_count.toString()
      ]);
    });
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-templates-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    if (searchTerm && !template.template_name.toLowerCase().includes(searchTerm.toLowerCase()) 
        && !template.description.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (reportType && template.report_type !== reportType) return false;
    if (createdBy && !template.created_by.toLowerCase().includes(createdBy.toLowerCase())) return false;
    if (isActive !== null && template.is_active !== isActive) return false;
    return true;
  });

  const reportTypes = ['Financial', 'AR', 'AP', 'GL', 'Inventory', 'OE'];

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
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Report Templates</h1>
        
        {/* Search and Filter */}
        <div className="bg-white shadow rounded-lg mb-6 print:shadow-none">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Search & Filter Templates</h2>
          </div>
          <div className="p-6 print:hidden">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Template name or description"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">All Types</option>
                  {reportTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Created By</label>
                <input
                  type="text"
                  value={createdBy}
                  onChange={(e) => setCreatedBy(e.target.value)}
                  placeholder="User name"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={isActive === null ? '' : isActive.toString()}
                  onChange={(e) => setIsActive(e.target.value === '' ? null : e.target.value === 'true')}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">All Status</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setReportType('');
                    setCreatedBy('');
                    setIsActive(null);
                  }}
                  className="w-full bg-gray-600 border border-transparent rounded-md shadow-sm py-2 px-4 text-base font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Clear Filters
                </button>
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
            <div className="text-sm font-medium text-gray-600">Total Templates</div>
            <div className="text-2xl font-bold text-gray-900">{filteredTemplates.length}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 print:border">
            <div className="text-sm font-medium text-gray-600">Active Templates</div>
            <div className="text-2xl font-bold text-green-600">
              {filteredTemplates.filter(t => t.is_active).length}
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 print:border">
            <div className="text-sm font-medium text-gray-600">Total Usage</div>
            <div className="text-2xl font-bold text-blue-600">
              {filteredTemplates.reduce((sum, t) => sum + t.usage_count, 0)}
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 print:border">
            <div className="text-sm font-medium text-gray-600">Report Types</div>
            <div className="text-2xl font-bold text-purple-600">
              {new Set(filteredTemplates.map(t => t.report_type)).size}
            </div>
          </div>
        </div>

        {/* Templates Table */}
        <div ref={printRef} className="bg-white shadow rounded-lg print:shadow-none">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="text-center">
              <h2 className="text-xl font-medium text-gray-900">Report Templates</h2>
              <p className="text-sm text-gray-500">
                Generated on {format(new Date(), 'MMMM dd, yyyy')}
              </p>
            </div>
          </div>
          
          <div className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50 print:bg-white">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black">
                      Template Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black">
                      Created By
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black">
                      Usage Count
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black">
                      Last Modified
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black">
                      Status
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black print:hidden">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 print:bg-white">
                  {filteredTemplates.map((template) => (
                    <tr key={template.id} className="hover:bg-gray-50 print:hover:bg-white">
                      <td className="px-6 py-4 whitespace-nowrap print:text-black">
                        <div className="text-sm font-medium text-gray-900 print:text-black">
                          {template.template_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 print:text-black">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {template.report_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 print:text-black">
                        {template.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 print:text-black">
                        {template.created_by}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 print:text-black">
                        <span className="font-semibold">{template.usage_count}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 print:text-black">
                        {format(new Date(template.last_modified), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          template.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {template.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium print:hidden">
                        <div className="flex space-x-2 justify-center">
                          <button className="text-indigo-600 hover:text-indigo-900 text-xs bg-indigo-50 px-2 py-1 rounded">
                            Edit
                          </button>
                          <button className="text-green-600 hover:text-green-900 text-xs bg-green-50 px-2 py-1 rounded">
                            Run
                          </button>
                          <button className="text-red-600 hover:text-red-900 text-xs bg-red-50 px-2 py-1 rounded">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredTemplates.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No templates found matching the selected criteria.</p>
                <button className="mt-4 bg-indigo-600 border border-transparent rounded-md shadow-sm py-2 px-4 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  Create New Template
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
