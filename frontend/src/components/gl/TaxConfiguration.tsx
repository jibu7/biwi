import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { TaxCalculationMethod } from '@/types/gl';
import { AlertCircle } from 'lucide-react';

interface TaxConfigurationProps {
  form: UseFormReturn<any>;
  accounts: any[];
  taxTypes?: any[];
}

export default function TaxConfiguration({ 
  form, 
  accounts, 
  taxTypes 
}: TaxConfigurationProps) {
  const { register, watch, formState: { errors } } = form;
  const isTaxApplicable = watch('is_tax_applicable');
  const taxRate = watch('tax_rate');
  const taxControlAccountId = watch('default_tax_control_account_id');
  const calculationMethod = watch('tax_calculation_method');

  // Validation for tax configuration
  React.useEffect(() => {
    if (isTaxApplicable) {
      const errors = [];
      
      if (!taxControlAccountId) {
        errors.push('Tax control account is required');
      }
      
      if (!taxRate || taxRate <= 0) {
        errors.push('Valid tax rate is required');
      }
      
      if (!calculationMethod || calculationMethod === TaxCalculationMethod.NONE) {
        errors.push('Tax calculation method is required');
      }
      
      // You can display these errors or handle them as needed
    }
  }, [isTaxApplicable, taxRate, taxControlAccountId, calculationMethod]);

  return (
    <div className="space-y-4 border-t pt-4">
      <h3 className="text-lg font-medium">Tax Configuration</h3>
      
      {/* Tax Applicable Checkbox */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="is_tax_applicable"
          {...register('is_tax_applicable')}
          className="h-4 w-4 text-blue-600 border-gray-300 rounded"
        />
        <label 
          htmlFor="is_tax_applicable" 
          className="text-sm font-medium text-gray-700"
        >
          Tax Applicable
        </label>
      </div>

      {isTaxApplicable && (
        <div className="space-y-4 ml-6">
          {/* Tax Rate */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tax Rate (%) *
            </label>
            <input
              type="number"
              step="0.01"
              {...register('tax_rate', {
                required: isTaxApplicable ? 'Tax rate is required' : false,
                min: { value: 0, message: 'Tax rate must be non-negative' },
                max: { value: 100, message: 'Tax rate cannot exceed 100%' }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="e.g., 18.00"
            />
            {errors.tax_rate && (
              <p className="mt-1 text-sm text-red-600">{errors.tax_rate.message}</p>
            )}
          </div>

          {/* Tax Calculation Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tax Calculation Method *
            </label>
            <select
              {...register('tax_calculation_method', {
                required: isTaxApplicable ? 'Calculation method is required' : false
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value={TaxCalculationMethod.NONE}>Select Method</option>
              <option value={TaxCalculationMethod.EXCLUSIVE}>
                Exclusive (Tax added to amount)
              </option>
              <option value={TaxCalculationMethod.INCLUSIVE}>
                Inclusive (Tax included in amount)
              </option>
            </select>
            {errors.tax_calculation_method && (
              <p className="mt-1 text-sm text-red-600">
                {errors.tax_calculation_method.message}
              </p>
            )}
          </div>

          {/* Tax Control Account */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tax Control Account (VAT/TVA) *
            </label>
            <select
              {...register('default_tax_control_account_id', {
                required: isTaxApplicable ? 'Tax control account is required' : false,
                valueAsNumber: true
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Select Account</option>
              {accounts?.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.account_code} - {account.account_name}
                </option>
              ))}
            </select>
            {errors.default_tax_control_account_id && (
              <p className="mt-1 text-sm text-red-600">
                {errors.default_tax_control_account_id.message}
              </p>
            )}
          </div>

          {/* Tax Type Link (if available) */}
          {taxTypes && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tax Type
              </label>
              <select
                {...register('tax_type_id', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select Tax Type</option>
                {taxTypes.map((taxType) => (
                  <option key={taxType.id} value={taxType.id}>
                    {taxType.name} ({taxType.rate_percentage}%)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Tax Configuration Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-blue-400 mr-2" />
              <div className="text-sm text-blue-700">
                <p className="font-medium">Tax Configuration Info:</p>
                <ul className="mt-1 list-disc list-inside">
                  <li>
                    <strong>Exclusive:</strong> Tax is calculated on top of the entered amount
                  </li>
                  <li>
                    <strong>Inclusive:</strong> Tax is already included in the entered amount
                  </li>
                  <li>
                    The tax control account will track VAT/TVA liabilities
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}