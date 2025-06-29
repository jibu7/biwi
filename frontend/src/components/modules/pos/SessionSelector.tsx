import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { posService } from '@/services/posService';
import { Till, POSSession, POSSessionCreate } from '@/types/pos';
import { DollarSign, Clock, User, MapPin, AlertCircle } from 'lucide-react';

interface SessionSelectorProps {
  tills: Till[];
  onSessionOpen: (session: POSSession) => void;
}

export function SessionSelector({ tills, onSessionOpen }: SessionSelectorProps) {
  const [selectedTill, setSelectedTill] = useState<Till | null>(null);
  const [openingCash, setOpeningCash] = useState('0.00');
  const [notes, setNotes] = useState('');
  const [isOpening, setIsOpening] = useState(false);

  const queryClient = useQueryClient();

  // Check for existing active sessions
  const { data: activeSession } = useQuery({
    queryKey: ['pos-active-session', selectedTill?.id],
    queryFn: () => selectedTill ? posService.getActiveSession(selectedTill.id) : Promise.resolve(null),
    enabled: !!selectedTill,
  });

  const openSessionMutation = useMutation({
    mutationFn: (data: POSSessionCreate) => posService.openSession(data),
    onSuccess: (response) => {
      setIsOpening(false);
      setOpeningCash('0.00');
      setNotes('');
      setSelectedTill(null);
      
      // Invalidate session queries
      queryClient.invalidateQueries({ queryKey: ['pos-active-session'] });
      
      // Call the callback with the new session
      onSessionOpen(response.data);
    },
    onError: (error) => {
      setIsOpening(false);
      console.error('Error opening session:', error);
      alert('Failed to open session. Please try again.');
    }
  });

  const handleTillSelection = (till: Till) => {
    setSelectedTill(till);
    setOpeningCash('0.00');
    setNotes('');
  };

  const handleOpenSession = () => {
    if (!selectedTill) return;

    const cashAmount = parseFloat(openingCash);
    if (isNaN(cashAmount) || cashAmount < 0) {
      alert('Please enter a valid opening cash amount');
      return;
    }

    setIsOpening(true);

    const sessionData: POSSessionCreate = {
      till_id: selectedTill.id,
      opening_cash_amount: cashAmount,
      notes: notes.trim() || undefined
    };

    openSessionMutation.mutate(sessionData);
  };

  const handleUseExistingSession = () => {
    if (activeSession?.data) {
      onSessionOpen(activeSession.data);
    }
  };

  if (!tills || tills.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">No Tills Available</h2>
          <p className="text-gray-600 mb-4">
            Please configure tills in the maintenance section before using the POS terminal.
          </p>
          <Button variant="outline">
            Go to Till Setup
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Session Management</h1>

      {!selectedTill ? (
        /* Till Selection */
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Select a Till</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tills.map((till) => (
              <Card 
                key={till.id} 
                className="p-4 hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-blue-300"
                onClick={() => handleTillSelection(till)}
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-gray-500" />
                    <h3 className="font-semibold">{till.name}</h3>
                  </div>
                  
                  <div className="space-y-1 text-sm text-gray-600">
                    <div>Code: {till.till_code}</div>
                    <div>Warehouse: {till.warehouse_name}</div>
                    <div>Cash Account: {till.gl_cash_account_name}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      till.is_active ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span className={`text-xs ${
                      till.is_active ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {till.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        /* Session Opening */
        <div className="max-w-md mx-auto">
          <Card className="p-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold">Open Session</h2>
              <div className="text-sm text-gray-600 mt-1">
                Till: {selectedTill.name} ({selectedTill.till_code})
              </div>
            </div>

            {/* Check for existing active session */}
            {activeSession?.data ? (
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-800">Active Session Found</span>
                  </div>
                  <div className="text-sm text-blue-700 space-y-1">
                    <div>Session #{activeSession.data.id}</div>
                    <div>Opened: {new Date(activeSession.data.opened_at).toLocaleString()}</div>
                    <div>Opening Cash: ${activeSession.data.opening_cash_amount.toFixed(2)}</div>
                    <div>Cashier: {activeSession.data.cashier_name}</div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setSelectedTill(null)} className="flex-1">
                    Back
                  </Button>
                  <Button onClick={handleUseExistingSession} className="flex-1">
                    Use This Session
                  </Button>
                </div>
              </div>
            ) : (
              /* New Session Form */
              <div className="space-y-4">
                <div>
                  <label htmlFor="opening-cash" className="block text-sm font-medium mb-2">
                    Opening Cash Amount ($)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="opening-cash"
                      type="number"
                      step="0.01"
                      min="0"
                      value={openingCash}
                      onChange={(e) => setOpeningCash(e.target.value)}
                      className="pl-10"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="notes" className="block text-sm font-medium mb-2">
                    Notes (Optional)
                  </label>
                  <Input
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Session notes..."
                  />
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>Current User: Cashier</span> {/* Would come from auth */}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>Time: {new Date().toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedTill(null)}
                    disabled={isOpening}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={handleOpenSession}
                    disabled={isOpening}
                    className="flex-1"
                  >
                    {isOpening ? 'Opening...' : 'Open Session'}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
