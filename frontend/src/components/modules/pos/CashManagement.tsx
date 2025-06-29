import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { posService } from '@/services/posService';
import { POSSession, POSCashMovementCreate } from '@/types/pos';
import { PlusCircle, MinusCircle, DollarSign, Receipt } from 'lucide-react';

interface CashManagementProps {
  session: POSSession;
  onClose?: () => void;
}

export function CashManagement({ session, onClose }: CashManagementProps) {
  const [movementType, setMovementType] = useState<'cash_in' | 'cash_out'>('cash_in');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [reference, setReference] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const queryClient = useQueryClient();

  const cashMovementMutation = useMutation({
    mutationFn: (data: POSCashMovementCreate) => 
      posService.recordCashMovement(session.id, data),
    onSuccess: () => {
      // Reset form
      setAmount('');
      setReason('');
      setReference('');
      setIsSubmitting(false);
      
      // Refresh any relevant queries
      queryClient.invalidateQueries({ queryKey: ['pos-session', session.id] });
      
      // Show success message
      alert('Cash movement recorded successfully');
    },
    onError: (error) => {
      setIsSubmitting(false);
      console.error('Error recording cash movement:', error);
      alert('Failed to record cash movement');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !reason) {
      alert('Please fill in amount and reason');
      return;
    }

    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setIsSubmitting(true);
    
    const movementData: POSCashMovementCreate = {
      movement_type: movementType,
      amount: amountValue,
      reason: reason.trim(),
      reference: reference.trim() || undefined
    };

    cashMovementMutation.mutate(movementData);
  };

  const quickReasons = {
    cash_in: [
      'Opening float',
      'Customer payment',
      'Cash deposit',
      'Petty cash replenishment',
      'Change fund'
    ],
    cash_out: [
      'Customer change',
      'Petty cash expense',
      'Cash withdrawal',
      'Bank deposit',
      'Refund'
    ]
  };

  return (
    <Card className="w-full max-w-md mx-auto p-6">
      <div className="flex items-center gap-2 mb-6">
        <DollarSign className="h-6 w-6" />
        <h2 className="text-xl font-bold">Cash Management</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Movement Type Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Movement Type</label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={movementType === 'cash_in' ? 'default' : 'outline'}
              onClick={() => setMovementType('cash_in')}
              className="flex items-center gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              Cash In
            </Button>
            <Button
              type="button"
              variant={movementType === 'cash_out' ? 'default' : 'outline'}
              onClick={() => setMovementType('cash_out')}
              className="flex items-center gap-2"
            >
              <MinusCircle className="h-4 w-4" />
              Cash Out
            </Button>
          </div>
        </div>

        {/* Amount */}
        <div className="space-y-2">
          <label htmlFor="amount" className="text-sm font-medium">
            Amount ($)
          </label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            required
          />
        </div>

        {/* Reason */}
        <div className="space-y-2">
          <label htmlFor="reason" className="text-sm font-medium">
            Reason
          </label>
          <Input
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter reason for cash movement"
            required
          />
          
          {/* Quick Reason Buttons */}
          <div className="flex flex-wrap gap-1 mt-2">
            {quickReasons[movementType].map((quickReason) => (
              <Button
                key={quickReason}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setReason(quickReason)}
                className="text-xs h-7"
              >
                {quickReason}
              </Button>
            ))}
          </div>
        </div>

        {/* Reference (Optional) */}
        <div className="space-y-2">
          <label htmlFor="reference" className="text-sm font-medium">
            Reference (Optional)
          </label>
          <Input
            id="reference"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Receipt number, invoice, etc."
          />
        </div>

        {/* Session Info */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-sm space-y-1">
            <div><strong>Till:</strong> {session.till_name}</div>
            <div><strong>Session:</strong> #{session.id}</div>
            <div><strong>Cashier:</strong> {session.cashier_name}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {onClose && (
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            className="flex-1"
            disabled={isSubmitting || !amount || !reason}
          >
            {isSubmitting ? 'Recording...' : `Record ${movementType === 'cash_in' ? 'Cash In' : 'Cash Out'}`}
          </Button>
        </div>
      </form>
    </Card>
  );
}
