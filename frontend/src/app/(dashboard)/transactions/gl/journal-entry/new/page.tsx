"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { glService } from "@/services/glService";
import { Plus, Trash2, Calculator } from "lucide-react";
import { TaxCalculationMethod } from "@/types/gl";

const journalEntrySchema = z.object({
  entry_date: z.string().min(1, "Date is required"),
  reference: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  transaction_type_id: z.number().optional().nullable(),
  auto_calculate_tax: z.boolean().default(true),
  lines: z.array(z.object({
    gl_account_id: z.number().min(1, "Account is required"),
    description: z.string().optional(),
    debit_amount: z.number().min(0),
    credit_amount: z.number().min(0),
    is_tax_line: z.boolean().default(false),
    tax_base_amount: z.number().optional(),
  })).min(2, "At least 2 lines are required"),
});

type JournalEntryFormData = z.infer<typeof journalEntrySchema>;

export default function NewJournalEntryPage() {
  const router = useRouter();
  const [selectedTransactionType, setSelectedTransactionType] = useState<any>(null);
  const [taxPreview, setTaxPreview] = useState<any>(null);

  const form = useForm<JournalEntryFormData>({
    resolver: zodResolver(journalEntrySchema),
    defaultValues: {
      entry_date: new Date().toISOString().split('T')[0],
      auto_calculate_tax: true,
      lines: [
        { gl_account_id: 0, description: "", debit_amount: 0, credit_amount: 0, is_tax_line: false },
        { gl_account_id: 0, description: "", debit_amount: 0, credit_amount: 0, is_tax_line: false },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lines",
  });

  const watchLines = form.watch("lines");
  const watchTransactionTypeId = form.watch("transaction_type_id");
  const watchAutoCalculateTax = form.watch("auto_calculate_tax");

  // Fetch data
  const { data: accounts } = useQuery({
    queryKey: ["gl-accounts"],
    queryFn: () => glService.getAccounts(),
  });

  const { data: transactionTypes } = useQuery({
    queryKey: ["gl-transaction-types"],
    queryFn: () => glService.getTransactionTypes(),
  });

  // Load selected transaction type details
  useEffect(() => {
    if (watchTransactionTypeId && transactionTypes) {
      const txType = transactionTypes.find(t => t.id === watchTransactionTypeId);
      setSelectedTransactionType(txType);
    } else {
      setSelectedTransactionType(null);
    }
  }, [watchTransactionTypeId, transactionTypes]);

  // Calculate tax preview
  useEffect(() => {
    if (selectedTransactionType?.is_tax_applicable && watchAutoCalculateTax) {
      const nonTaxLines = watchLines.filter(line => !line.is_tax_line);
      const totalAmount = nonTaxLines.reduce((sum, line) => {
        return sum + (line.debit_amount || 0) + (line.credit_amount || 0);
      }, 0);

      if (totalAmount > 0) {
        // Calculate tax based on transaction type settings
        let taxAmount = 0;
        if (selectedTransactionType.tax_calculation_method === TaxCalculationMethod.EXCLUSIVE) {
          taxAmount = (totalAmount * selectedTransactionType.tax_rate) / 100;
        } else if (selectedTransactionType.tax_calculation_method === TaxCalculationMethod.INCLUSIVE) {
          const netAmount = totalAmount / (1 + selectedTransactionType.tax_rate / 100);
          taxAmount = totalAmount - netAmount;
        }

        setTaxPreview({
          taxAmount: Math.round(taxAmount * 100) / 100,
          taxRate: selectedTransactionType.tax_rate,
          method: selectedTransactionType.tax_calculation_method,
        });
      } else {
        setTaxPreview(null);
      }
    } else {
      setTaxPreview(null);
    }
  }, [selectedTransactionType, watchLines, watchAutoCalculateTax]);

  // Calculate totals
  const totals = watchLines.reduce(
    (acc, line) => ({
      debit: acc.debit + (line.debit_amount || 0),
      credit: acc.credit + (line.credit_amount || 0),
    }),
    { debit: 0, credit: 0 }
  );

  const isBalanced = Math.abs(totals.debit - totals.credit) < 0.01;

  const createMutation = useMutation({
    mutationFn: (data: JournalEntryFormData) => {
      if (selectedTransactionType?.is_tax_applicable && data.auto_calculate_tax) {
        return glService.createJournalEntryWithTax(data);
      }
      return glService.createJournalEntry(data);
    },
    onSuccess: () => {
      router.push("/transactions/gl/journal-entries");
    },
  });

  const onSubmit = (data: JournalEntryFormData) => {
    if (!isBalanced && (!taxPreview || !data.auto_calculate_tax)) {
      alert("Journal entry must balance!");
      return;
    }
    createMutation.mutate(data);
  };

  const addLine = () => {
    append({ 
      gl_account_id: 0, 
      description: "", 
      debit_amount: 0, 
      credit_amount: 0, 
      is_tax_line: false 
    });
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">New Journal Entry</h1>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Header Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Journal Entry Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date *
              </label>
              <input
                type="date"
                {...form.register("entry_date")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reference
              </label>
              <input
                type="text"
                {...form.register("reference")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transaction Type
              </label>
              <select
                {...form.register("transaction_type_id", { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select Type (Optional)</option>
                {transactionTypes?.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name} {type.is_tax_applicable && `(Tax: ${type.tax_rate}%)`}
                  </option>
                ))}
              </select>
            </div>

            {selectedTransactionType?.is_tax_applicable && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="auto_calculate_tax"
                  {...form.register("auto_calculate_tax")}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label 
                  htmlFor="auto_calculate_tax" 
                  className="ml-2 text-sm font-medium text-gray-700"
                >
                  Auto-calculate Tax
                </label>
              </div>
            )}
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <input
              type="text"
              {...form.register("description")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>

        {/* Tax Preview */}
        {taxPreview && watchAutoCalculateTax && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-blue-900">Tax Preview</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Tax will be automatically calculated at {taxPreview.taxRate}% 
                  ({taxPreview.method === TaxCalculationMethod.INCLUSIVE ? 'Inclusive' : 'Exclusive'})
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-blue-700">Estimated Tax Amount</p>
                <p className="text-lg font-semibold text-blue-900">
                  {taxPreview.taxAmount.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Journal Lines */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Journal Lines</h2>
            <button
              type="button"
              onClick={addLine}
              className="flex items-center px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Line
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Account
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Description
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Debit
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Credit
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {fields.map((field, index) => (
                  <tr key={field.id}>
                    <td className="px-4 py-3">
                      <select
                        {...form.register(`lines.${index}.gl_account_id` as const, { 
                          valueAsNumber: true 
                        })}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                      >
                        <option value={0}>Select Account</option>
                        {accounts?.map((account) => (
                          <option key={account.id} value={account.id}>
                            {account.account_code} - {account.account_name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        {...form.register(`lines.${index}.description` as const)}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="0.01"
                        {...form.register(`lines.${index}.debit_amount` as const, { 
                          valueAsNumber: true,
                          onChange: (e) => {
                            if (parseFloat(e.target.value) > 0) {
                              form.setValue(`lines.${index}.credit_amount`, 0);
                            }
                          }
                        })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-right"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="0.01"
                        {...form.register(`lines.${index}.credit_amount` as const, { 
                          valueAsNumber: true,
                          onChange: (e) => {
                            if (parseFloat(e.target.value) > 0) {
                              form.setValue(`lines.${index}.debit_amount`, 0);
                            }
                          }
                        })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-right"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      {fields.length > 2 && (
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={2} className="px-4 py-3 text-right font-medium">
                    Totals:
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {totals.debit.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {totals.credit.toFixed(2)}
                  </td>
                  <td></td>
                </tr>
                <tr>
                  <td colSpan={5} className="px-4 py-3 text-center">
                    {isBalanced ? (
                      <span className="text-green-600 font-medium">
                        ✓ Entry is balanced
                      </span>
                    ) : (
                      <span className="text-red-600 font-medium">
                        ✗ Entry is not balanced (Difference: {Math.abs(totals.debit - totals.credit).toFixed(2)})
                        {taxPreview && watchAutoCalculateTax && (
                          <span className="text-blue-600 ml-2">
                            (Tax of {taxPreview.taxAmount.toFixed(2)} will be added automatically)
                          </span>
                        )}
                      </span>
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={createMutation.isPending || (!isBalanced && !taxPreview)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            Post Journal Entry
          </button>
          <button
            type="button"
            onClick={() => router.push("/transactions/gl/journal-entries")}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}