"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { glService } from "@/services/glService";
import TaxConfiguration from "@/components/gl/TaxConfiguration";
import TaxCalculator from "@/components/gl/TaxCalculator";
import { TaxCalculationMethod } from "@/types/gl";

const transactionTypeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  default_debit_account_id: z.number().optional().nullable(),
  default_credit_account_id: z.number().optional().nullable(),
  default_tax_control_account_id: z.number().optional().nullable(),
  is_tax_applicable: z.boolean().default(false),
  tax_rate: z.number().optional().nullable(),
  tax_calculation_method: z.nativeEnum(TaxCalculationMethod).default(TaxCalculationMethod.NONE),
  tax_type_id: z.number().optional().nullable(),
  is_active: z.boolean().default(true),
}).refine((data) => {
  // Custom validation for tax configuration
  if (data.is_tax_applicable) {
    if (!data.default_tax_control_account_id) {
      return false;
    }
    if (!data.tax_rate || data.tax_rate <= 0) {
      return false;
    }
    if (data.tax_calculation_method === TaxCalculationMethod.NONE) {
      return false;
    }
  }
  return true;
}, {
  message: "Complete tax configuration is required when tax is applicable",
  path: ["is_tax_applicable"],
});

type TransactionTypeFormData = z.infer<typeof transactionTypeSchema>;

export default function NewTransactionTypePage() {
  const router = useRouter();
  const [showTaxCalculator, setShowTaxCalculator] = useState(false);
  
  const form = useForm<TransactionTypeFormData>({
    resolver: zodResolver(transactionTypeSchema),
    defaultValues: {
      is_active: true,
      is_tax_applicable: false,
      tax_calculation_method: TaxCalculationMethod.NONE,
    },
  });

  const { watch } = form;
  const isTaxApplicable = watch("is_tax_applicable");
  const taxRate = watch("tax_rate");
  const calculationMethod = watch("tax_calculation_method");

  // Fetch accounts for dropdowns
  const { data: accounts } = useQuery({
    queryKey: ["gl-accounts"],
    queryFn: () => glService.getAccounts(),
  });

  // Fetch tax types if available (optional - you may need to implement this service method)
  const { data: taxTypes } = useQuery({
    queryKey: ["tax-types"],
    queryFn: () => glService.getTaxTypes?.() || Promise.resolve([]),
    enabled: isTaxApplicable,
  });

  const createMutation = useMutation({
    mutationFn: glService.createTransactionType,
    onSuccess: () => {
      router.push("/maintenance/gl/transaction-types");
    },
  });

  const onSubmit = (data: TransactionTypeFormData) => {
    createMutation.mutate(data);
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">New Transaction Type</h1>
      
      <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form - Left Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Transaction Type Details</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    {...form.register("name")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  {form.formState.errors.name && (
                    <p className="mt-1 text-sm text-red-600">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    {...form.register("description")}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Default Debit Account
                  </label>
                  <select
                    {...form.register("default_debit_account_id", { valueAsNumber: true })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select Account</option>
                    {accounts?.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.account_code} - {account.account_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Default Credit Account
                  </label>
                  <select
                    {...form.register("default_credit_account_id", { valueAsNumber: true })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select Account</option>
                    {accounts?.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.account_code} - {account.account_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    {...form.register("is_active")}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm font-medium text-gray-700">
                    Active
                  </label>
                </div>
              </div>

              {/* Tax Configuration Section */}
              <TaxConfiguration
                form={form}
                accounts={accounts || []}
                taxTypes={taxTypes}
              />
            </div>
          </div>

          {/* Right Column - Tax Calculator */}
          <div className="lg:col-span-1">
            {isTaxApplicable && taxRate && calculationMethod !== TaxCalculationMethod.NONE && (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Tax Preview</h3>
                <TaxCalculator
                  taxRate={taxRate}
                  calculationMethod={calculationMethod}
                />
              </div>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex gap-4 mt-6">
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            Create Transaction Type
          </button>
          <button
            type="button"
            onClick={() => router.push("/maintenance/gl/transaction-types")}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}