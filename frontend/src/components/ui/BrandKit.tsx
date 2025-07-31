'use client';

import React from 'react';
import { Logo } from './Logo';

// Brand colors based on ChannelZap design
export const brandColors = {
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  secondary: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',
    600: '#9333ea',
    700: '#7c3aed',
    800: '#6b21a8',
    900: '#581c87',
  },
} as const;

// Logo presets for different use cases
export const LogoPresets = {
  // Navigation sidebars
  Sidebar: () => <Logo size="lg" textSize="2xl" />,
  
  // Headers
  Header: () => <Logo size="md" textSize="lg" />,
  
  // Authentication pages
  Auth: () => <Logo size="xl" textSize="3xl" />,
  
  // Platform/Admin areas
  Platform: () => <Logo size="lg" variant="light" textSize="2xl" />,
  
  // Mobile/compact
  Mobile: () => <Logo size="sm" showText={false} />,
  
  // Footer
  Footer: () => <Logo size="md" textSize="md" />,
  
  // Email templates
  Email: () => <Logo size="lg" textSize="xl" />,
  
  // Favicon/Icon only
  Icon: () => <Logo size="xs" showText={false} />,
};

// Brand text/content
export const brandContent = {
  name: 'ChannelZap',
  tagline: 'Complete Multi-Channel Business Management Platform',
  description: 'Streamline your business operations across all channels with our comprehensive management platform.',
  platformName: 'ChannelZap Platform',
  platformDescription: 'Platform Administration & Management',
  supportEmail: 'support@channelzap.com',
  adminEmail: 'admin@channelzap.com',
  website: 'https://channelzap.com',
  copyright: `© ${new Date().getFullYear()} ChannelZap. All rights reserved.`,
};

// SEO meta tags
export const seoDefaults = {
  title: 'ChannelZap - Complete Multi-Channel Business Management',
  description: brandContent.description,
  keywords: 'business management, multi-channel, ERP, inventory, accounting, CRM',
  ogImage: '/channelzap.com_logo_OG.svg',
  twitterCard: 'summary_large_image',
};

export default {
  brandColors,
  LogoPresets,
  brandContent,
  seoDefaults,
};
