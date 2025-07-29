"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { glService } from "@/services/glService";

const transactionTypeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  default_debit_account_id: z.number().optional().nullable(),
  default_credit_account_id: z.number().optional().nullable(),
  default_tax_control_account_id: z.number().optional().nullable(),  // NEW
  is_active: z.boolean().default(true),
});

type TransactionTypeFormData = z.infer<typeof transactionTypeSchema>;

export default function NewTransactionTypePage() {
  const router = useRouter();
  
  const { register, handleSubmit, formState: { errors } } = useForm<TransactionTypeFormData>({
    resolver: zodResolver(transactionTypeSchema),
    defaultValues: {
      is_active: true,
    },
  });

  // Fetch accounts for dropdowns
  const { data: accounts } = useQuery({
    queryKey: ["gl-accounts"],
    queryFn: () => glService.getAccounts(),
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
      
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Transaction Type Details</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                {...register("name")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                {...register("description")}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default Debit Account
              </label>
              <select
                {...register("default_debit_account_id", { valueAsNumber: true })}
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
                {...register("default_credit_account_id", { valueAsNumber: true })}
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

            {/* NEW: Tax Control Account Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default Tax Control Account
              </label>
              <select
                {...register("default_tax_control_account_id", { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select Account</option>
                {accounts?.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.account_code} - {account.account_name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                VAT/TVA control account for tax transactions
              </p>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                {...register("is_active")}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
              <label className="ml-2 text-sm font-medium text-gray-700">
                Active
              </label>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
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