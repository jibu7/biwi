'use client';

import { PlatformProtectedRoute } from '@/components/layout/PlatformProtectedRoute';
import { PlatformSidebar } from '@/components/layout/PlatformSidebar';
import { PlatformHeader } from '@/components/layout/PlatformHeader';

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PlatformProtectedRoute>
      <div className="flex h-screen bg-gray-100">
        <PlatformSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <PlatformHeader />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </PlatformProtectedRoute>
  );
}
