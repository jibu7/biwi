'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Save, Settings } from 'lucide-react';
import { ARDefaults, ARDefaultsUpdate } from '@/types/ar';
import { GLAccount } from '@/types/gl';
import { arDefaultsService } from '@/services/arService';
import { glService } from '@/services/glService';
import { usePermissions } from '@/hooks/usePermissions';
import { AR_SETUP_MANAGE } from '@/lib/permissions';

export default function ARDefaultsPage() {
  const { hasPermission } = usePermissions();
  const [formData, setFormData] = useState<ARDefaultsUpdate>({
    default_ar_control_gl_account_id: undefined,
    default_sales_gl_account_id: undefined,
    default_receipt_gl_account_id: undefined,
    default_sales_discount_gl_account_id: undefined,
    default_payment_terms: '',
    default_credit_limit: 0,
  });
  const { data: arDefaults, isLoading: defaultsLoading } = useQuery({
    queryKey: ['ar-defaults'],
    queryFn: arDefaultsService.get,
    enabled: hasPermission(AR_SETUP_MANAGE),
  });
  const { data: glAccounts = [] } = useQuery({
    queryKey: ['gl-accounts'],
    queryFn: () => glService.getGLAccounts(),
    enabled: hasPermission(AR_SETUP_MANAGE),
  });

  const updateMutation = useMutation({
    mutationFn: arDefaultsService.update,
    onSuccess: () => {
      alert('AR defaults updated successfully');
    },
    onError: (error: unknown) => {
      let errorMessage = 'Error updating AR defaults';
      if (typeof error === 'object' && error !== null && 'response' in error) {
        errorMessage = ((error as { response?: { data?: { detail?: string }, message?: string } }).response?.data?.detail) || (error as { message?: string }).message || errorMessage;
      }
      alert(errorMessage);
    },
  });

  useEffect(() => {
    if (arDefaults) {
      setFormData({
        default_ar_control_gl_account_id: arDefaults.default_ar_control_gl_account_id,
        default_sales_gl_account_id: arDefaults.default_sales_gl_account_id,
        default_receipt_gl_account_id: arDefaults.default_receipt_gl_account_id,
        default_sales_discount_gl_account_id: arDefaults.default_sales_discount_gl_account_id,
        default_payment_terms: arDefaults.default_payment_terms || '',
        default_credit_limit: arDefaults.default_credit_limit || 0,
      });
    }
  }, [arDefaults]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value || undefined
    }));
  };

  if (!hasPermission(AR_SETUP_MANAGE)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600">You don&apos;t have permission to manage AR defaults.</p>
        </div>
      </div>
    );
  }

  if (defaultsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const assetAccounts = (glAccounts as GLAccount[]).filter(account => account.account_type === 'Asset');
  const revenueAccounts = (glAccounts as GLAccount[]).filter(account => account.account_type === 'Income');
  const expenseAccounts = (glAccounts as GLAccount[]).filter(account => account.account_type === 'Expense');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AR Defaults</h1>
        <p className="text-gray-600">Configure default settings for Accounts Receivable</p>
      </div>

      {/* Form */}
      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Default AR Control GL Account */}
            <div>
              <label htmlFor="default_ar_control_gl_account_id" className="block text-sm font-medium text-gray-700">
                Default AR Control Account *
              </label>
              <select
                id="default_ar_control_gl_account_id"
                name="default_ar_control_gl_account_id"
                value={formData.default_ar_control_gl_account_id || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              >
                <option value="">Select AR Control Account</option>
                {assetAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.account_code} - {account.account_name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                The GL account that will be used to track accounts receivable
              </p>
            </div>

            {/* Default Sales GL Account */}
            <div>
              <label htmlFor="default_sales_gl_account_id" className="block text-sm font-medium text-gray-700">
                Default Sales Account *
              </label>
              <select
                id="default_sales_gl_account_id"
                name="default_sales_gl_account_id"
                value={formData.default_sales_gl_account_id || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              >
                <option value="">Select Sales Account</option>
                {revenueAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.account_code} - {account.account_name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                The default GL account for sales revenue
              </p>
            </div>

            {/* Default Receipt GL Account */}
            <div>
              <label htmlFor="default_receipt_gl_account_id" className="block text-sm font-medium text-gray-700">
                Default Receipt Account *
              </label>
              <select
                id="default_receipt_gl_account_id"
                name="default_receipt_gl_account_id"
                value={formData.default_receipt_gl_account_id || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              >
                <option value="">Select Receipt Account</option>
                {assetAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.account_code} - {account.account_name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                The default GL account for cash receipts
              </p>
            </div>

            {/* Default Sales Discount GL Account */}
            <div>
              <label htmlFor="default_sales_discount_gl_account_id" className="block text-sm font-medium text-gray-700">
                Default Sales Discount Account
              </label>
              <select
                id="default_sales_discount_gl_account_id"
                name="default_sales_discount_gl_account_id"
                value={formData.default_sales_discount_gl_account_id || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select Sales Discount Account</option>
                {revenueAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.account_code} - {account.account_name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                The default GL account for sales discounts
              </p>
            </div>

            {/* Default Payment Terms */}
            <div>
              <label htmlFor="default_payment_terms" className="block text-sm font-medium text-gray-700">
                Default Payment Terms
              </label>
              <input
                type="text"
                id="default_payment_terms"
                name="default_payment_terms"
                value={formData.default_payment_terms || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g., Net 30, COD, 2/10 Net 30"
              />
              <p className="mt-1 text-sm text-gray-500">
                Default payment terms for new customers
              </p>
            </div>

            {/* Default Credit Limit */}
            <div>
              <label htmlFor="default_credit_limit" className="block text-sm font-medium text-gray-700">
                Default Credit Limit
              </label>
              <input
                type="number"
                id="default_credit_limit"
                name="default_credit_limit"
                min="0"
                step="0.01"
                value={formData.default_credit_limit || 0}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="0.00"
              />
              <p className="mt-1 text-sm text-gray-500">
                Default credit limit for new customers
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
              {updateMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Defaults
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
