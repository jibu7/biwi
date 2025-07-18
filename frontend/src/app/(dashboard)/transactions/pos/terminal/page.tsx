'use client';


import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { posService } from '@/services/posService';
import { inventoryService } from '@/services/inventoryService';
import { customerService } from '@/services/arService';
import { POSTerminal } from '@/components/modules/pos/POSTerminal';
import { SessionSelector } from '@/components/modules/pos/SessionSelector';
import { useAuthStore } from '@/store/authStore';
import { POSSession, POSTransactionCreate, Till } from '@/types/pos';

export default function POSTerminalPage() {
  const { user } = useAuthStore();
  const [activeSession, setActiveSession] = useState<POSSession | null>(null);
  const [selectedTill, setSelectedTill] = useState<Till | null>(null);

  const { data: tills } = useQuery({
    queryKey: ['pos-tills'],
    queryFn: () => posService.getTills(),
  });

  const { data: session, refetch: refetchSession } = useQuery({
    queryKey: ['pos-active-session', selectedTill?.id],
    queryFn: () => selectedTill ? posService.getActiveSession(selectedTill.id) : Promise.resolve(null),
    enabled: !!selectedTill,
  });

  const processSaleMutation = useMutation({
    mutationFn: (data: POSTransactionCreate) => 
      activeSession ? posService.processSale(activeSession.id, data) : Promise.reject('No active session'),
    onSuccess: () => {
      // Clear cart, show success, print receipt
    },
  });

  if (!activeSession) {
    return (
      <SessionSelector
        tills={tills?.data || []}
        onSessionOpen={(session: POSSession) => setActiveSession(session)}
      />
    );
  }

  return (
    <POSTerminal
      session={activeSession}
      onSale={processSaleMutation.mutate}
      onReturn={(data: POSTransactionCreate) => 
        activeSession ? posService.processReturn(activeSession.id, data) : Promise.reject('No active session')
      }
    />
  );
}
