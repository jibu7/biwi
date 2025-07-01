import PlatformAuthGuard from '@/components/guards/PlatformAuthGuard';

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PlatformAuthGuard>{children}</PlatformAuthGuard>;
}
