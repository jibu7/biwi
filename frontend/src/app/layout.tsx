import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ChannelZap',
  description: 'Complete Multi-Channel Business Management Platform',
  manifest: '/manifest.json',
  icons: {
    icon: '/channelzap.com_logo_OG.svg',
    shortcut: '/channelzap.com_logo_OG.svg',
    apple: '/channelzap.com_logo_OG.svg',
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
