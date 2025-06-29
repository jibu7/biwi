import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { X, CreditCard, Banknote, Check } from 'lucide-react';

interface PaymentDialogProps {
  total: number;
  onPayment: (paymentMethod: string, cashTendered?: number) => void;
  onClose: () => void;
}

export function PaymentDialog({ total, onPayment, onClose }: PaymentDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'check'>('cash');
  const [cashTendered, setCashTendered] = useState<string>(total.toFixed(2));
  const [paymentReference, setPaymentReference] = useState('');

  const cashAmount = parseFloat(cashTendered) || 0;
  const change = Math.max(0, cashAmount - total);

  const handlePayment = () => {
    if (paymentMethod === 'cash') {
      if (cashAmount < total) {
        alert('Cash tendered must be at least the total amount');
        return;
      }
      onPayment('cash', cashAmount);
    } else {
      onPayment(paymentMethod, undefined);
    }
  };

  const quickCashAmounts = [
    total,
    Math.ceil(total / 5) * 5, // Round up to nearest $5
    Math.ceil(total / 10) * 10, // Round up to nearest $10
    Math.ceil(total / 20) * 20, // Round up to nearest $20
  ].filter((amount, index, arr) => arr.indexOf(amount) === index); // Remove duplicates

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md p-6 m-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Process Payment</h2>
          <Button variant="outline" size="sm" onClick={onClose} className="p-1 h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-6">
          {/* Total Amount */}
          <div className="text-center">
            <div className="text-sm text-gray-600">Total Amount</div>
            <div className="text-3xl font-bold">${total.toFixed(2)}</div>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-3">
            <div className="text-sm font-medium">Payment Method</div>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('cash')}
                className="flex flex-col items-center p-4 h-auto"
              >
                <Banknote className="h-6 w-6 mb-1" />
                <span className="text-xs">Cash</span>
              </Button>
              <Button
                variant={paymentMethod === 'card' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('card')}
                className="flex flex-col items-center p-4 h-auto"
              >
                <CreditCard className="h-6 w-6 mb-1" />
                <span className="text-xs">Card</span>
              </Button>
              <Button
                variant={paymentMethod === 'check' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('check')}
                className="flex flex-col items-center p-4 h-auto"
              >
                <Check className="h-6 w-6 mb-1" />
                <span className="text-xs">Check</span>
              </Button>
            </div>
          </div>

          {/* Cash Payment Details */}
          {paymentMethod === 'cash' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Cash Tendered</label>
                <Input
                  type="number"
                  value={cashTendered}
                  onChange={(e) => setCashTendered(e.target.value)}
                  step="0.01"
                  min={total}
                  className="mt-1"
                />
              </div>

              {/* Quick Cash Buttons */}
              <div className="grid grid-cols-2 gap-2">
                {quickCashAmounts.map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => setCashTendered(amount.toFixed(2))}
                  >
                    ${amount.toFixed(2)}
                  </Button>
                ))}
              </div>

              {/* Change */}
              {change > 0 && (
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-600">Change Due</div>
                  <div className="text-xl font-bold text-green-600">
                    ${change.toFixed(2)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Card/Check Reference */}
          {(paymentMethod === 'card' || paymentMethod === 'check') && (
            <div>
              <label className="text-sm font-medium">
                {paymentMethod === 'card' ? 'Transaction Reference' : 'Check Number'}
              </label>
              <Input
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder={paymentMethod === 'card' ? 'Enter card reference...' : 'Enter check number...'}
                className="mt-1"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handlePayment}
              className="flex-1"
              disabled={paymentMethod === 'cash' && cashAmount < total}
            >
              Complete Payment
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
