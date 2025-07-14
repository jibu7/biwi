import PlatformAuthGuard from '@/components/guards/PlatformAuthGuard';
import { PlatformSidebar } from '@/components/platform/PlatformSidebar';
import { PlatformHeader } from '@/components/platform/PlatformHeader';

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PlatformAuthGuard>
      <div className="flex h-screen bg-gray-50">
        <PlatformSidebar />
        <div className="flex-1 flex flex-col">
          <PlatformHeader />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </PlatformAuthGuard>
  );
}
