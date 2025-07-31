import React, { useState } from 'react';
import { Calculator } from 'lucide-react';
import { TaxCalculationMethod } from '@/types/gl';

interface TaxCalculatorProps {
  taxRate: number;
  calculationMethod: TaxCalculationMethod;
  onCalculate?: (result: any) => void;
}

export default function TaxCalculator({ 
  taxRate, 
  calculationMethod,
  onCalculate 
}: TaxCalculatorProps) {
  const [amount, setAmount] = useState<string>('');
  const [result, setResult] = useState<any>(null);

  const calculateTax = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    let netAmount: number;
    let taxAmount: number;
    let totalAmount: number;

    if (calculationMethod === TaxCalculationMethod.EXCLUSIVE) {
      netAmount = numAmount;
      taxAmount = Math.round((netAmount * taxRate / 100) * 100) / 100;
      totalAmount = netAmount + taxAmount;
    } else if (calculationMethod === TaxCalculationMethod.INCLUSIVE) {
      totalAmount = numAmount;
      netAmount = Math.round((totalAmount / (1 + taxRate / 100)) * 100) / 100;
      taxAmount = totalAmount - netAmount;
    } else {
      return;
    }

    const calcResult = {
      inputAmount: numAmount,
      netAmount,
      taxAmount,
      totalAmount
    };

    setResult(calcResult);
    onCalculate?.(calcResult);
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h4 className="text-sm font-medium text-gray-700 mb-3">Tax Calculator</h4>
      
      <div className="space-y-3">
        <div>
          <label className="block text-xs text-gray-600 mb-1">
            Amount ({calculationMethod === TaxCalculationMethod.INCLUSIVE ? 'Including' : 'Excluding'} Tax)
          </label>
          <div className="flex space-x-2">
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded"
              placeholder="0.00"
            />
            <button
              onClick={calculateTax}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              <Calculator className="h-4 w-4" />
            </button>
          </div>
        </div>

        {result && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Net Amount:</span>
              <span className="font-medium">{result.netAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tax ({taxRate}%):</span>
              <span className="font-medium">{result.taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-gray-700 font-medium">Total:</span>
              <span className="font-bold">{result.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}