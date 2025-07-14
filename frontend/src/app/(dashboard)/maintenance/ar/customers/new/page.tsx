'use client';
import { ArrowLeft, Save, User, Building2, CreditCard, AlertCircle, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { CustomerCreate } from '@/types/ar';
import { GLAccount } from '@/types/gl';
import { customerService, salesRepService } from '@/services/arService';
import { glService } from '@/services/glService';
import { commonService } from '@/services/commonService';
import { usePermissions } from '@/hooks/usePermissions';
import { AR_SETUP_MANAGE } from '@/lib/permissions';
export default function NewCustomerPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  
  const [formData, setFormData] = useState<CustomerCreate>({
    customer_code: '',
    name: '',
    address: {
      street: '',
      city: '',
      state: '',
      zip: '',
      country: 'United States'
    },
    contact_info: {
      email: '',
      phone: '',
      fax: '',
      contact_person: ''
    },
    payment_terms: 'Net 30',
    credit_limit: 0,
    sales_representative_id: undefined,
    default_ar_gl_account_id: undefined,
    default_currency_id: undefined,
    is_active: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-generate customer code based on customer name
  const generateCustomerCode = (name: string): string => {
    if (!name.trim()) return '';
    
    // Take first 3 characters of each word, uppercase, max 8 characters
    const words = name.trim().split(/\s+/);
    let code = '';
    
    for (const word of words) {
      if (code.length >= 6) break;
      const cleanWord = word.replace(/[^a-zA-Z0-9]/g, '');
      if (cleanWord.length > 0) {
        code += cleanWord.substring(0, 3).toUpperCase();
      }
    }
    
    // Add random suffix if needed to make it unique
    if (code.length < 4) {
      code += Math.random().toString(36).substring(2, 6).toUpperCase();
    }
    
    return code.substring(0, 8);
  };

  // Fetch sales representatives
  const { data: salesReps = [] } = useQuery({
    queryKey: ['salesRepresentatives'],
    queryFn: salesRepService.getAll,
  });

  // Fetch GL accounts (AR type accounts)
  const { data: glAccounts = [] } = useQuery<GLAccount[]>({
    queryKey: ['glAccounts'],
    queryFn: () => glService.getGLAccounts(),
  });

  // Fetch currencies
  const { data: currencies = [] } = useQuery({
    queryKey: ['currencies'],
    queryFn: () => commonService.getCurrencies(),
  });

  const createMutation = useMutation({
    mutationFn: customerService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      router.push('/maintenance/ar/customers');
    },
    onError: (error: any) => {
      console.error('Customer creation error:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to create customer';
      if (typeof errorMessage === 'string') {
        setErrors({ general: errorMessage });
      } else if (typeof errorMessage === 'object') {
        setErrors(errorMessage);
      } else {
        setErrors({ general: 'An unexpected error occurred' });
      }
    },
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.customer_code.trim()) {
      newErrors.customer_code = 'Customer code is required';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Customer name is required';
    }

    if (formData.credit_limit && formData.credit_limit < 0) {
      newErrors.credit_limit = 'Credit limit cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Clear previous errors
      setErrors({});
      
      // Log the form data for debugging
      console.log('Submitting customer data:', formData);
      
      try {
        await createMutation.mutateAsync(formData);
      } catch (error) {
        console.error('Form submission error:', error);
      }
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Auto-generate customer code when name changes
    if (field === 'name' && typeof value === 'string' && !formData.customer_code) {
      const generatedCode = generateCustomerCode(value);
      setFormData(prev => ({
        ...prev,
        customer_code: generatedCode
      }));
    }
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleAddressChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value
      }
    }));
  };

  const handleContactChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      contact_info: {
        ...prev.contact_info,
        [field]: value
      }
    }));
  };

  if (!hasPermission(AR_SETUP_MANAGE)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="max-w-md w-full bg-white shadow-lg rounded-xl p-8 text-center">
          <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600">You don't have permission to create customers.</p>
        </div>
      </div>
    );
  }

  // Filter AR type accounts
  const arAccounts = glAccounts.filter((account: GLAccount) => 
    account.account_type === 'Asset' && 
    (account.account_name.toLowerCase().includes('receivable') || 
     account.account_name.toLowerCase().includes('a/r') ||
     account.account_name.toLowerCase().includes('ar'))
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/maintenance/ar/customers"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Customers
          </Link>
          
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">New Customer</h1>
              <p className="text-gray-600">Add a new customer to your database</p>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {errors.general && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <p className="text-red-600 font-medium">{errors.general}</p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {createMutation.isSuccess && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <p className="text-green-600 font-medium">Customer created successfully!</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white shadow-xl rounded-xl border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
              <div className="flex items-center">
                <Building2 className="h-5 w-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Code *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.customer_code}
                      onChange={(e) => handleInputChange('customer_code', e.target.value)}
                      className={`flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                        errors.customer_code ? 'border-red-300 bg-red-50' : 'border-gray-300 focus:border-blue-500'
                      }`}
                      placeholder="Enter unique customer code"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const generatedCode = generateCustomerCode(formData.name);
                        if (generatedCode) {
                          handleInputChange('customer_code', generatedCode);
                        }
                      }}
                      disabled={!formData.name}
                      className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                      title="Generate code from customer name"
                    >
                      Generate
                    </button>
                  </div>
                  {errors.customer_code && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.customer_code}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                      errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300 focus:border-blue-500'
                    }`}
                    placeholder="Enter customer business name"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Terms
                  </label>
                  <select
                    value={formData.payment_terms || ''}
                    onChange={(e) => handleInputChange('payment_terms', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                  >
                    <option value="">Select payment terms</option>
                    <option value="COD">Cash on Delivery</option>
                    <option value="Net 15">Net 15</option>
                    <option value="Net 30">Net 30</option>
                    <option value="Net 45">Net 45</option>
                    <option value="Net 60">Net 60</option>
                    <option value="2/10 Net 30">2/10 Net 30</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Credit Limit
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-gray-500">$</span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.credit_limit || ''}
                      onChange={(e) => handleInputChange('credit_limit', parseFloat(e.target.value) || 0)}
                      className={`w-full pl-8 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                        errors.credit_limit ? 'border-red-300 bg-red-50' : 'border-gray-300 focus:border-blue-500'
                      }`}
                      placeholder="0.00"
                    />
                  </div>
                  {errors.credit_limit && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.credit_limit}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sales Representative
                  </label>
                  <select
                    value={formData.sales_representative_id || ''}
                    onChange={(e) => handleInputChange('sales_representative_id', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                  >
                    <option value="">Select sales representative</option>
                    {salesReps.map((salesRep) => (
                      <option key={salesRep.id} value={salesRep.id}>
                        {salesRep.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default AR GL Account
                  </label>
                  <select
                    value={formData.default_ar_gl_account_id || ''}
                    onChange={(e) => handleInputChange('default_ar_gl_account_id', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                  >
                    <option value="">Select GL account</option>
                    {arAccounts.map((account: GLAccount) => (
                      <option key={account.id} value={account.id}>
                        {account.account_code} - {account.account_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Currency
                  </label>
                  <select
                    value={formData.default_currency_id || ''}
                    onChange={(e) => handleInputChange('default_currency_id', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                  >
                    <option value="">Use System Default</option>
                    {currencies
                      .filter(currency => currency.is_active)
                      .map((currency) => (
                        <option key={currency.id} value={currency.id}>
                          {currency.code} - {currency.name}
                          {currency.is_base_currency ? ' (Base Currency)' : ''}
                        </option>
                      ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Default currency for transactions with this customer
                  </p>
                </div>
              </div>

              <div className="flex items-center bg-gray-50 rounded-lg p-4">
                <input
                  id="is_active"
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => handleInputChange('is_active', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-3 block text-sm font-medium text-gray-900">
                  Active Customer
                </label>
                <span className="ml-2 text-xs text-gray-500">(Inactive customers won't appear in dropdowns)</span>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="bg-white shadow-xl rounded-xl border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
              <div className="flex items-center">
                <Building2 className="h-5 w-5 text-green-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Address Information</h3>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Street Address
                  </label>
                  <input
                    type="text"
                    value={formData.address?.street || ''}
                    onChange={(e) => handleAddressChange('street', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter street address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.address?.city || ''}
                    onChange={(e) => handleAddressChange('city', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter city"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State/Province
                  </label>
                  <input
                    type="text"
                    value={formData.address?.state || ''}
                    onChange={(e) => handleAddressChange('state', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter state or province"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ZIP/Postal Code
                  </label>
                  <input
                    type="text"
                    value={formData.address?.zip || ''}
                    onChange={(e) => handleAddressChange('zip', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter ZIP or postal code"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  <input
                    type="text"
                    value={formData.address?.country || ''}
                    onChange={(e) => handleAddressChange('country', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter country"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white shadow-xl rounded-xl border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
              <div className="flex items-center">
                <User className="h-5 w-5 text-purple-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={formData.contact_info?.contact_person || ''}
                    onChange={(e) => handleContactChange('contact_person', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter contact person name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.contact_info?.email || ''}
                    onChange={(e) => handleContactChange('email', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter email address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.contact_info?.phone || ''}
                    onChange={(e) => handleContactChange('phone', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fax Number
                  </label>
                  <input
                    type="tel"
                    value={formData.contact_info?.fax || ''}
                    onChange={(e) => handleContactChange('fax', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter fax number"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-between items-center pt-6">
            <button
              type="button"
              onClick={() => console.log('Form Data:', formData)}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Debug Form Data
            </button>
            
            <div className="flex space-x-4">
              <Link
                href="/maintenance/ar/customers"
                className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {createMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Customer...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create Customer
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
