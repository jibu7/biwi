"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { posService } from '@/services/posService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/toast';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { 
  DollarSign, 
  Clock, 
  User, 
  Calculator,
  FileText,
  CheckCircle,
  XCircle
} from 'lucide-react';

export default function TillManagement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTill, setSelectedTill] = useState<any>(null);
  const [openingBalance, setOpeningBalance] = useState('0');
  const [closingBalance, setClosingBalance] = useState('0');
  const [showReconciliation, setShowReconciliation] = useState(false);
  const [reconciliationData, setReconciliationData] = useState<any>({});
  
  // Queries
  const { data: tills = [] } = useQuery({
    queryKey: ['pos', 'tills'],
    queryFn: async () => {
      const response = await posService.getTills();
      return response.data;
    },
  });
  
  const { data: currentSession } = useQuery({
    queryKey: ['pos', 'current-session', selectedTill?.id],
    queryFn: async () => {
      if (!selectedTill) return null;
      const response = await posService.getCurrentSession(selectedTill.id);
      return response.data;
    },
    enabled: !!selectedTill,
  });
  
  const { data: sessionHistory = [] } = useQuery({
    queryKey: ['pos', 'sessions', selectedTill?.id],
    queryFn: async () => {
      if (!selectedTill) return [];
      const response = await posService.getSessionHistory(selectedTill.id);
      return response.data;
    },
    enabled: !!selectedTill,
  });
  
  // Mutations
  const openSessionMutation = useMutation({
    mutationFn: (data: any) => posService.openSession(data),
    onSuccess: () => {
      toast.success('Till session opened successfully');
      queryClient.invalidateQueries({ queryKey: ['pos', 'current-session'] });
      queryClient.invalidateQueries({ queryKey: ['pos', 'sessions'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to open session');
    }
  });
  
  const closeSessionMutation = useMutation({
    mutationFn: (data: any) => posService.closeSession(data.sessionId, data.closeData),
    onSuccess: () => {
      toast.success('Till session closed successfully');
      queryClient.invalidateQueries({ queryKey: ['pos', 'current-session'] });
      queryClient.invalidateQueries({ queryKey: ['pos', 'sessions'] });
      setShowReconciliation(true);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to close session');
    }
  });
  
  const reconcileSessionMutation = useMutation({
    mutationFn: (data: any) => posService.reconcileSession(data.sessionId, data.reconciliationData),
    onSuccess: () => {
      toast.success('Session reconciled successfully');
      queryClient.invalidateQueries({ queryKey: ['pos', 'sessions'] });
      setShowReconciliation(false);
      setReconciliationData({});
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to reconcile session');
    }
  });
  
  const handleOpenSession = () => {
    if (!selectedTill) {
      toast.error('Please select a till');
      return;
    }
    
    openSessionMutation.mutate({
      till_id: selectedTill.id,
      opening_cash_amount: parseFloat(openingBalance)
    });
  };
  
  const handleCloseSession = () => {
    if (!currentSession) return;
    
    closeSessionMutation.mutate({
      sessionId: currentSession.id,
      closeData: {
        closing_cash_amount: parseFloat(closingBalance),
        notes: ''
      }
    });
  };
  
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Till Management</h1>
      
      {/* Till Selection */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Select Till</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tills.map((till: any) => (
            <button
              key={till.id}
              onClick={() => setSelectedTill(till)}
              className={`p-4 border rounded-lg transition-colors ${
                selectedTill?.id === till.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="font-semibold">{till.name}</div>
              <div className="text-sm text-gray-500">{till.till_code}</div>
              <div className="text-sm text-gray-500">{till.warehouse_name}</div>
            </button>
          ))}
        </div>
      </div>
      
      {selectedTill && (
        <>
          {/* Current Session Status */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Current Session</h2>
            
            {currentSession ? (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-gray-50 p-4 rounded">
                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">Opened</span>
                    </div>
                    <div className="font-semibold">
                      {formatDateTime(currentSession.opened_at)}
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded">
                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                      <User className="h-4 w-4" />
                      <span className="text-sm">Cashier</span>
                    </div>
                    <div className="font-semibold">{user?.fullName}</div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded">
                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                      <DollarSign className="h-4 w-4" />
                      <span className="text-sm">Opening Balance</span>
                    </div>
                    <div className="font-semibold">
                      {formatCurrency(currentSession.opening_cash_amount)}
                    </div>
                  </div>
                </div>
                
                {/* Session Summary */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Session Summary</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Total Sales</div>
                      <div className="text-lg font-semibold">
                        {formatCurrency(0)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Cash Sales</div>
                      <div className="text-lg font-semibold">
                        {formatCurrency(0)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Card Sales</div>
                      <div className="text-lg font-semibold">
                        {formatCurrency(0)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Expected Cash</div>
                      <div className="text-lg font-semibold text-green-600">
                        {formatCurrency(currentSession.opening_cash_amount)}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Close Session */}
                <div className="border-t pt-4 mt-4">
                  <h3 className="font-semibold mb-3">Close Session</h3>
                  <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-1">
                        Actual Cash Count
                      </label>
                      <input
                        type="number"
                        value={closingBalance}
                        onChange={(e) => setClosingBalance(e.target.value)}
                        className="w-full p-2 border rounded"
                        step="0.01"
                      />
                    </div>
                    <button
                      onClick={handleCloseSession}
                      className="px-6 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Close Session
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-gray-500 mb-4">No open session for this till</p>
                
                {/* Open Session */}
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">
                      Opening Balance
                    </label>
                    <input
                      type="number"
                      value={openingBalance}
                      onChange={(e) => setOpeningBalance(e.target.value)}
                      className="w-full p-2 border rounded"
                      step="0.01"
                    />
                  </div>
                  <button
                    onClick={handleOpenSession}
                    className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Open Session
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Session History */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Session History</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Date</th>
                    <th className="px-4 py-2 text-left">Cashier</th>
                    <th className="px-4 py-2 text-right">Opening</th>
                    <th className="px-4 py-2 text-right">Expected</th>
                    <th className="px-4 py-2 text-right">Actual</th>
                    <th className="px-4 py-2 text-right">Variance</th>
                    <th className="px-4 py-2 text-center">Status</th>
                    <th className="px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sessionHistory.map((session: any) => (
                    <tr key={session.id} className="border-b">
                      <td className="px-4 py-2">
                        {formatDateTime(session.opened_at)}
                      </td>
                      <td className="px-4 py-2">{session.cashier_name}</td>
                      <td className="px-4 py-2 text-right">
                        {formatCurrency(session.opening_cash_amount)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {formatCurrency(session.expected_cash_amount || 0)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {formatCurrency(session.closing_cash_amount || 0)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <span className={
                          (session.cash_variance || 0) > 0 
                            ? 'text-green-600' 
                            : (session.cash_variance || 0) < 0 
                            ? 'text-red-600' 
                            : ''
                        }>
                          {formatCurrency(session.cash_variance || 0)}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-center">
                        {session.status === 'closed' ? (
                          <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                        ) : session.status === 'open' ? (
                          <Clock className="h-5 w-5 text-yellow-500 mx-auto" />
                        ) : (
                          <XCircle className="h-5 w-5 text-gray-400 mx-auto" />
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {session.status === 'closed' && (
                          <button
                            onClick={() => {
                              setShowReconciliation(true);
                              // Load session data for reconciliation
                            }}
                            className="text-blue-500 hover:underline text-sm"
                          >
                            View Details
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
      
      {/* Reconciliation Modal */}
      {showReconciliation && (
        <ReconciliationModal
          session={currentSession}
          onClose={() => setShowReconciliation(false)}
          onConfirm={(data) => {
            if (currentSession) {
              reconcileSessionMutation.mutate({
                sessionId: currentSession.id,
                reconciliationData: data
              });
            }
          }}
        />
      )}
    </div>
  );
}

// Reconciliation Modal Component
function ReconciliationModal({ 
  session, 
  onClose, 
  onConfirm 
}: { 
  session: any; 
  onClose: () => void; 
  onConfirm: (data: any) => void;
}) {
  const [reconciliationDetails, setReconciliationDetails] = useState([
    { paymentMethod: 'Cash', countedAmount: '0', notes: '' },
    { paymentMethod: 'Card', countedAmount: '0', notes: '' },
    { paymentMethod: 'EFT', countedAmount: '0', notes: '' }
  ]);
  
  const updateDetail = (index: number, field: string, value: string) => {
    const updated = [...reconciliationDetails];
    updated[index] = { ...updated[index], [field]: value };
    setReconciliationDetails(updated);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Session Reconciliation</h2>
        
        <div className="mb-6">
          <h3 className="font-semibold mb-3">Count Cash and Payments</h3>
          <div className="space-y-4">
            {reconciliationDetails.map((detail, index) => (
              <div key={detail.paymentMethod} className="bg-gray-50 p-4 rounded">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {detail.paymentMethod}
                    </label>
                    <div className="text-sm text-gray-600">
                      Expected: {formatCurrency(0)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Counted Amount
                    </label>
                    <input
                      type="number"
                      value={detail.countedAmount}
                      onChange={(e) => updateDetail(index, 'countedAmount', e.target.value)}
                      className="w-full p-2 border rounded"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Notes
                    </label>
                    <input
                      type="text"
                      value={detail.notes}
                      onChange={(e) => updateDetail(index, 'notes', e.target.value)}
                      className="w-full p-2 border rounded"
                      placeholder="Optional notes"
                    />
                  </div>
                </div>
                <div className="mt-2">
                  <span className="text-sm">
                    Variance: {
                      formatCurrency(
                        parseFloat(detail.countedAmount || '0') - 0
                      )
                    }
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm({ reconciliationDetails })}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Complete Reconciliation
          </button>
        </div>
      </div>
    </div>
  );
}
