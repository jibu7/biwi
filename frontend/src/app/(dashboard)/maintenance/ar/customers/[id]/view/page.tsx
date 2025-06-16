'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Building2,
  Mail, 
  Phone, 
  MapPin,
  User,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
  CreditCard,
  FileText,
  AlertCircle
} from 'lucide-react';
import { Customer } from '@/types/ar';
import { customerService } from '@/services/arService';
import { usePermissions } from '@/hooks/usePermissions';
import { AR_SETUP_MANAGE } from '@/lib/permissions';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ViewCustomerPage({ params }: PageProps) {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);

  useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  const customerId = resolvedParams ? parseInt(resolvedParams.id) : 0;

  const { data: customer, isLoading, error } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => customerService.getById(customerId),
    enabled: customerId > 0,
  });

  const canManageCustomers = hasPermission(AR_SETUP_MANAGE);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleDelete = async () => {
    if (!customer) return;
    
    if (confirm(`Are you sure you want to delete customer "${customer.name}"? This action cannot be undone.`)) {
      try {
        await customerService.delete(customer.id);
        router.push('/maintenance/ar/customers');
      } catch (error: any) {
        const errorMessage = error.response?.data?.detail || 'Failed to delete customer';
        alert(errorMessage);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading customer details...</p>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white shadow-xl rounded-xl p-8">
            <div className="text-center py-12">
              <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Customer Not Found</h3>
              <p className="text-gray-600 mb-6">The customer you're looking for doesn't exist or you don't have permission to view it.</p>
              <Link
                href="/maintenance/ar/customers"
                className="inline-flex items-center px-6 py-3 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Customers
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/maintenance/ar/customers"
                className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Customers
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{customer.name}</h1>
                <p className="text-gray-600 mt-1">Customer Details - Code: {customer.customer_code}</p>
              </div>
            </div>
            
            {canManageCustomers && (
              <div className="flex items-center space-x-3">
                <Link
                  href={`/maintenance/ar/customers/${customer.id}`}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Customer
                </Link>
                <button
                  onClick={handleDelete}
                  className="inline-flex items-center px-4 py-2 border border-red-300 rounded-lg shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Customer
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Information */}
          <div className="lg:col-span-2 space-y-8">
            {/* Basic Information */}
            <div className="bg-white shadow-xl rounded-xl p-6 border border-gray-100">
              <div className="flex items-center mb-6">
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
                  <p className="text-gray-600">Customer details and identification</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name</label>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-gray-900 font-medium">{customer.name}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Customer Code</label>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-gray-900 font-medium">{customer.customer_code}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Terms</label>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-gray-900">{customer.payment_terms || 'Not specified'}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center">
                      {customer.is_active ? (
                        <>
                          <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                          <span className="text-green-600 font-medium">Active</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-5 w-5 text-red-600 mr-2" />
                          <span className="text-red-600 font-medium">Inactive</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white shadow-xl rounded-xl p-6 border border-gray-100">
              <div className="flex items-center mb-6">
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <User className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Contact Information</h2>
                  <p className="text-gray-600">Communication details and address</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    {customer.contact_info?.email ? (
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 text-gray-400 mr-2" />
                        <a 
                          href={`mailto:${customer.contact_info.email}`}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          {customer.contact_info.email}
                        </a>
                      </div>
                    ) : (
                      <p className="text-gray-500">Not provided</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    {customer.contact_info?.phone ? (
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 text-gray-400 mr-2" />
                        <a 
                          href={`tel:${customer.contact_info.phone}`}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          {customer.contact_info.phone}
                        </a>
                      </div>
                    ) : (
                      <p className="text-gray-500">Not provided</p>
                    )}
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Person</label>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-gray-900">{customer.contact_info?.contact_person || 'Not specified'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Address Information */}
            {customer.address && (
              <div className="bg-white shadow-xl rounded-xl p-6 border border-gray-100">
                <div className="flex items-center mb-6">
                  <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                    <MapPin className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Address Information</h2>
                    <p className="text-gray-600">Physical location details</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <p className="text-gray-900">{customer.address.street || 'Not provided'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <p className="text-gray-900">{customer.address.city || 'Not provided'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">State/Province</label>
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <p className="text-gray-900">{customer.address.state || 'Not provided'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code</label>
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <p className="text-gray-900">{customer.address.postal_code || 'Not provided'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <p className="text-gray-900">{customer.address.country || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Financial Information */}
          <div className="space-y-8">
            {/* Financial Summary */}
            <div className="bg-white shadow-xl rounded-xl p-6 border border-gray-100">
              <div className="flex items-center mb-6">
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Financial Summary</h2>
                  <p className="text-gray-600 text-sm">Account balance and limits</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Current Balance</span>
                    <DollarSign className="h-4 w-4 text-gray-400" />
                  </div>
                  <p className={`text-2xl font-bold ${
                    customer.current_balance > 0 
                      ? 'text-red-600' 
                      : customer.current_balance < 0 
                        ? 'text-green-600' 
                        : 'text-gray-900'
                  }`}>
                    {formatCurrency(customer.current_balance || 0)}
                  </p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Credit Limit</span>
                    <CreditCard className="h-4 w-4 text-gray-400" />
                  </div>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(customer.credit_limit || 0)}
                  </p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Available Credit</span>
                    <CheckCircle className="h-4 w-4 text-gray-400" />
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency((customer.credit_limit || 0) - (customer.current_balance || 0))}
                  </p>
                </div>
              </div>
            </div>

            {/* Sales Representative */}
            <div className="bg-white shadow-xl rounded-xl p-6 border border-gray-100">
              <div className="flex items-center mb-6">
                <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center mr-4">
                  <User className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Sales Representative</h2>
                  <p className="text-gray-600 text-sm">Assigned account manager</p>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-gray-900 font-medium">
                  {customer.sales_representative_name || 'Not assigned'}
                </p>
              </div>
            </div>

            {/* Account Information */}
            <div className="bg-white shadow-xl rounded-xl p-6 border border-gray-100">
              <div className="flex items-center mb-6">
                <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                  <FileText className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Account Details</h2>
                  <p className="text-gray-600 text-sm">Account settings and dates</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Default AR Account</label>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-gray-900">
                      {customer.default_ar_gl_account_name || 'Not specified'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
