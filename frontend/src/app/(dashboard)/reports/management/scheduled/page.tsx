'use client';

import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import '@/styles/reports.css';

interface ScheduledReport {
  id: number;
  schedule_name: string;
  report_template: string;
  schedule_type: 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Annual';
  frequency: string;
  next_run_date: string;
  last_run_date: string;
  status: 'Active' | 'Paused' | 'Failed' | 'Completed';
  created_by: string;
  recipients: string[];
  delivery_format: 'PDF' | 'CSV' | 'Excel' | 'Email';
  delivery_method: 'Email' | 'SharePoint' | 'FTP' | 'Database';
  success_count: number;
  failure_count: number;
}

export default function ScheduledReportsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [scheduleType, setScheduleType] = useState('');
  const [status, setStatus] = useState('');
  const [deliveryFormat, setDeliveryFormat] = useState('');
  const printRef = useRef<HTMLDivElement>(null);

  // Mock data for demonstration
  const mockScheduledReports: ScheduledReport[] = [
    {
      id: 1,
      schedule_name: 'Monthly Financial Package',
      report_template: 'Monthly Financial Summary',
      schedule_type: 'Monthly',
      frequency: 'Last day of month at 9:00 AM',
      next_run_date: '2024-02-29',
      last_run_date: '2024-01-31',
      status: 'Active',
      created_by: 'John Smith',
      recipients: ['cfo@company.com', 'accounting@company.com'],
      delivery_format: 'PDF',
      delivery_method: 'Email',
      success_count: 24,
      failure_count: 1
    },
    {
      id: 2,
      schedule_name: 'Weekly AR Aging',
      report_template: 'AR Aging - Detailed',
      schedule_type: 'Weekly',
      frequency: 'Every Friday at 8:00 AM',
      next_run_date: '2024-02-02',
      last_run_date: '2024-01-26',
      status: 'Active',
      created_by: 'Jane Doe',
      recipients: ['ar.manager@company.com', 'collections@company.com'],
      delivery_format: 'Excel',
      delivery_method: 'Email',
      success_count: 48,
      failure_count: 2
    },
    {
      id: 3,
      schedule_name: 'Daily Cash Position',
      report_template: 'Cash Flow Statement',
      schedule_type: 'Daily',
      frequency: 'Every weekday at 7:30 AM',
      next_run_date: '2024-01-30',
      last_run_date: '2024-01-29',
      status: 'Active',
      created_by: 'Mike Johnson',
      recipients: ['treasury@company.com'],
      delivery_format: 'PDF',
      delivery_method: 'Email',
      success_count: 156,
      failure_count: 3
    },
    {
      id: 4,
      schedule_name: 'Quarterly Board Report',
      report_template: 'Board Financial Package',
      schedule_type: 'Quarterly',
      frequency: 'First day of quarter at 6:00 AM',
      next_run_date: '2024-04-01',
      last_run_date: '2024-01-01',
      status: 'Paused',
      created_by: 'Sarah Wilson',
      recipients: ['board@company.com', 'ceo@company.com'],
      delivery_format: 'PDF',
      delivery_method: 'SharePoint',
      success_count: 8,
      failure_count: 0
    },
    {
      id: 5,
      schedule_name: 'Inventory Valuation Report',
      report_template: 'Inventory Valuation - Year End',
      schedule_type: 'Monthly',
      frequency: 'First Monday of month at 10:00 AM',
      next_run_date: '2024-02-05',
      last_run_date: '2024-01-01',
      status: 'Failed',
      created_by: 'David Brown',
      recipients: ['operations@company.com'],
      delivery_format: 'CSV',
      delivery_method: 'FTP',
      success_count: 11,
      failure_count: 4
    }
  ];

  const { data: scheduledReports = mockScheduledReports, isLoading } = useQuery({
    queryKey: ['scheduled-reports', searchTerm, scheduleType, status, deliveryFormat],
    queryFn: () => Promise.resolve(mockScheduledReports),
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
      'Schedule Name', 'Report Template', 'Schedule Type', 'Frequency', 
      'Next Run', 'Last Run', 'Status', 'Created By', 'Recipients', 
      'Format', 'Delivery Method', 'Success Count', 'Failure Count'
    ]);
    
    filteredReports.forEach(report => {
      csvData.push([
        report.schedule_name,
        report.report_template,
        report.schedule_type,
        report.frequency,
        report.next_run_date,
        report.last_run_date,
        report.status,
        report.created_by,
        report.recipients.join(';'),
        report.delivery_format,
        report.delivery_method,
        report.success_count.toString(),
        report.failure_count.toString()
      ]);
    });
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scheduled-reports-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Filter reports
  const filteredReports = scheduledReports.filter(report => {
    if (searchTerm && !report.schedule_name.toLowerCase().includes(searchTerm.toLowerCase()) 
        && !report.report_template.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (scheduleType && report.schedule_type !== scheduleType) return false;
    if (status && report.status !== status) return false;
    if (deliveryFormat && report.delivery_format !== deliveryFormat) return false;
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Paused': return 'bg-yellow-100 text-yellow-800';
      case 'Failed': return 'bg-red-100 text-red-800';
      case 'Completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSuccessRate = (success: number, failure: number) => {
    const total = success + failure;
    if (total === 0) return 100;
    return Math.round((success / total) * 100);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const totalSchedules = filteredReports.length;
  const activeSchedules = filteredReports.filter(r => r.status === 'Active').length;
  const totalSuccess = filteredReports.reduce((sum, r) => sum + r.success_count, 0);
  const totalFailure = filteredReports.reduce((sum, r) => sum + r.failure_count, 0);
  const overallSuccessRate = getSuccessRate(totalSuccess, totalFailure);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Scheduled Reports</h1>
        
        {/* Search and Filter */}
        <div className="bg-white shadow rounded-lg mb-6 print:shadow-none">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Search & Filter Schedules</h2>
          </div>
          <div className="p-6 print:hidden">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Schedule or template name"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Type</label>
                <select
                  value={scheduleType}
                  onChange={(e) => setScheduleType(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">All Types</option>
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Annual">Annual</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Paused">Paused</option>
                  <option value="Failed">Failed</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
                <select
                  value={deliveryFormat}
                  onChange={(e) => setDeliveryFormat(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">All Formats</option>
                  <option value="PDF">PDF</option>
                  <option value="CSV">CSV</option>
                  <option value="Excel">Excel</option>
                  <option value="Email">Email</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setScheduleType('');
                    setStatus('');
                    setDeliveryFormat('');
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4 print:border">
            <div className="text-sm font-medium text-gray-600">Total Schedules</div>
            <div className="text-2xl font-bold text-gray-900">{totalSchedules}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 print:border">
            <div className="text-sm font-medium text-gray-600">Active Schedules</div>
            <div className="text-2xl font-bold text-green-600">{activeSchedules}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 print:border">
            <div className="text-sm font-medium text-gray-600">Total Executions</div>
            <div className="text-2xl font-bold text-blue-600">{totalSuccess + totalFailure}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 print:border">
            <div className="text-sm font-medium text-gray-600">Success Rate</div>
            <div className={`text-2xl font-bold ${overallSuccessRate >= 95 ? 'text-green-600' : overallSuccessRate >= 85 ? 'text-yellow-600' : 'text-red-600'}`}>
              {overallSuccessRate}%
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 print:border">
            <div className="text-sm font-medium text-gray-600">Failed Runs</div>
            <div className="text-2xl font-bold text-red-600">{totalFailure}</div>
          </div>
        </div>

        {/* Scheduled Reports Table */}
        <div ref={printRef} className="bg-white shadow rounded-lg print:shadow-none">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="text-center">
              <h2 className="text-xl font-medium text-gray-900">Scheduled Reports</h2>
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
                      Schedule Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black">
                      Template
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black">
                      Frequency
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black">
                      Next Run
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black">
                      Last Run
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black">
                      Status
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black">
                      Success Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black">
                      Delivery
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black print:hidden">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 print:bg-white">
                  {filteredReports.map((report) => {
                    const successRate = getSuccessRate(report.success_count, report.failure_count);
                    return (
                      <tr key={report.id} className="hover:bg-gray-50 print:hover:bg-white">
                        <td className="px-6 py-4 whitespace-nowrap print:text-black">
                          <div>
                            <div className="text-sm font-medium text-gray-900 print:text-black">
                              {report.schedule_name}
                            </div>
                            <div className="text-sm text-gray-500 print:text-black">
                              by {report.created_by}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 print:text-black">
                          {report.report_template}
                        </td>
                        <td className="px-6 py-4 text-center print:text-black">
                          <div>
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                              {report.schedule_type}
                            </span>
                            <div className="text-xs text-gray-500 mt-1 print:text-black">
                              {report.frequency}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 print:text-black">
                          {format(new Date(report.next_run_date), 'MMM dd, yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 print:text-black">
                          {format(new Date(report.last_run_date), 'MMM dd, yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(report.status)}`}>
                            {report.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center print:text-black">
                          <div>
                            <div className={`text-sm font-semibold ${
                              successRate >= 95 ? 'text-green-600' : 
                              successRate >= 85 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {successRate}%
                            </div>
                            <div className="text-xs text-gray-500 print:text-black">
                              {report.success_count}✓ {report.failure_count}✗
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 print:text-black">
                          <div>
                            <div className="font-medium">{report.delivery_format}</div>
                            <div className="text-xs text-gray-500 print:text-black">
                              via {report.delivery_method}
                            </div>
                            <div className="text-xs text-gray-500 print:text-black">
                              {report.recipients.length} recipient(s)
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium print:hidden">
                          <div className="flex space-x-1 justify-center">
                            <button className="text-indigo-600 hover:text-indigo-900 text-xs bg-indigo-50 px-2 py-1 rounded">
                              Edit
                            </button>
                            <button className="text-green-600 hover:text-green-900 text-xs bg-green-50 px-2 py-1 rounded">
                              Run
                            </button>
                            <button className={`text-xs px-2 py-1 rounded ${
                              report.status === 'Active' 
                                ? 'text-yellow-600 hover:text-yellow-900 bg-yellow-50' 
                                : 'text-green-600 hover:text-green-900 bg-green-50'
                            }`}>
                              {report.status === 'Active' ? 'Pause' : 'Resume'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredReports.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No scheduled reports found matching the selected criteria.</p>
                <button className="mt-4 bg-indigo-600 border border-transparent rounded-md shadow-sm py-2 px-4 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  Create New Schedule
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
