import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Vinea ERP',
  description: 'Modern Enterprise Resource Planning System',
  icons: {
    icon: '/channelzap-logo-011.png',
    shortcut: '/channelzap-logo-011.png',
    apple: '/channelzap-logo-011.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
