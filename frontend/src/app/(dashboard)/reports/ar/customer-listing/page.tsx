'use client';


import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarIcon, Download, Filter, Search, Users } from 'lucide-react';
import { Customer } from '@/types/ar';
import { customerService } from '@/services/arService';
import { usePermissions } from '@/hooks/usePermissions';
import { AR_REPORTS_VIEW } from '@/lib/permissions';
import { safeToFixed, formatCurrency } from '@/lib/numberUtils';

export default function CustomerListingPage() {
  const { hasPermission } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const { data: customers = [], isLoading, error } = useQuery({
    queryKey: ['customers'],
    queryFn: customerService.getAll,
    enabled: hasPermission(AR_REPORTS_VIEW),
  });

  const filteredCustomers = customers.filter((customer) => {
    const contactInfo = customer.contact_info || {};
    const contactPerson = contactInfo.contact_person || '';
    const phone = contactInfo.phone || '';
    const email = contactInfo.email || '';
    
    const matchesSearch = 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.customer_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = 
      activeFilter === 'all' ||
      (activeFilter === 'active' && customer.is_active) ||
      (activeFilter === 'inactive' && !customer.is_active);

    return matchesSearch && matchesFilter;
  });

  const exportToCSV = () => {
    if (filteredCustomers.length === 0) return;

    const headers = [
      'Customer Code',
      'Customer Name', 
      'Contact Person',
      'Phone',
      'Email',
      'Credit Limit',
      'Current Balance',
      'Payment Terms',
      'Status'
    ];

    const csvData = filteredCustomers.map(customer => {
      const contactInfo = customer.contact_info || {};
      return [
        customer.customer_code,
        customer.name,
        contactInfo.contact_person || '',
        contactInfo.phone || '',
        contactInfo.email || '',
        safeToFixed(customer.credit_limit),
        safeToFixed(customer.current_balance),
        customer.payment_terms || '',
        customer.is_active ? 'Active' : 'Inactive'
      ];
    });

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customer-listing-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!hasPermission(AR_REPORTS_VIEW)) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">You don&apos;t have permission to view AR reports.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">Error loading customer data. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customer Listing</h1>
          <p className="text-gray-600">
            Complete list of customers with contact details and balances
          </p>
        </div>
        <button
          onClick={exportToCSV}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 h-4 w-4" />
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent w-full"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-600" />
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value as 'all' | 'active' | 'inactive')}
            className="px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          >
            <option value="all">All Customers</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card p-4 rounded-lg border">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold">{customers.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-card p-4 rounded-lg border">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold">{customers.filter(c => c.is_active).length}</p>
            </div>
          </div>
        </div>
        <div className="bg-card p-4 rounded-lg border">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Inactive</p>
              <p className="text-2xl font-bold">{customers.filter(c => !c.is_active).length}</p>
            </div>
          </div>
        </div>
        <div className="bg-card p-4 rounded-lg border">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Filtered</p>
              <p className="text-2xl font-bold">{filteredCustomers.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Customer List */}
      <div className="bg-card rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-medium text-gray-600">Code</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Customer Name</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Contact Person</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Phone</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Email</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">Credit Limit</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">Current Balance</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Payment Terms</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-gray-600">
                    No customers found
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => {
                  const contactInfo = customer.contact_info || {};
                  return (
                    <tr key={customer.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium">{customer.customer_code}</td>
                      <td className="py-3 px-4">{customer.name}</td>
                      <td className="py-3 px-4">{contactInfo.contact_person || '-'}</td>
                      <td className="py-3 px-4">{contactInfo.phone || '-'}</td>
                      <td className="py-3 px-4">{contactInfo.email || '-'}</td>
                      <td className="py-3 px-4 text-right font-mono">
                        {formatCurrency(customer.credit_limit)}
                      </td>
                      <td className={`py-3 px-4 text-right font-mono ${
                        (customer.current_balance || 0) > 0 ? 'text-red-600' : 
                        (customer.current_balance || 0) < 0 ? 'text-green-600' : ''
                      }`}>
                        {formatCurrency(customer.current_balance)}
                      </td>
                      <td className="py-3 px-4">{customer.payment_terms || '-'}</td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            customer.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {customer.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
