'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { EnhancedSidebar } from '@/components/layout/EnhancedSidebar';
import { Header } from '@/components/layout/Header';
import { NavigationProvider } from '@/contexts/NavigationContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ProtectedRoute>
      <NavigationProvider>
        <div className="flex h-screen bg-gray-100 overflow-hidden">
          <EnhancedSidebar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header onMenuButtonClick={() => setSidebarOpen(true)} />
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
              <div className="container mx-auto px-6 py-8 max-w-full">{children}</div>
            </main>
          </div>
        </div>
      </NavigationProvider>
    </ProtectedRoute>
  );
}
