import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Analytics - Vinea ERP',
  description: 'Business intelligence and analytics dashboard',
};

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
