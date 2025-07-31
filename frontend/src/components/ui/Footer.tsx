'use client';

import React from 'react';
import Link from 'next/link';
import { Logo } from './Logo';
import { brandContent } from './BrandKit';
import { Heart, Shield, Zap } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    {
      title: 'Platform',
      links: [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Analytics', href: '/analytics' },
        { label: 'Reports', href: '/reports' },
        { label: 'Transactions', href: '/transactions' },
      ],
    },
    {
      title: 'Support',
      links: [
        { label: 'Help Center', href: '/help' },
        { label: 'Documentation', href: '/docs' },
        { label: 'Contact Support', href: '/support' },
        { label: 'System Status', href: '/status' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Terms of Service', href: '/terms' },
        { label: 'Cookie Policy', href: '/cookies' },
        { label: 'Data Processing', href: '/data-processing' },
      ],
    },
  ];

  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand section */}
          <div className="lg:col-span-2">
            <div className="mb-4">
              <Logo size="lg" textSize="xl" />
            </div>
            <p className="text-gray-600 text-sm mb-4 max-w-md">
              {brandContent.description}
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Shield className="h-4 w-4" />
                <span>Secure</span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="h-4 w-4" />
                <span>Fast</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="h-4 w-4" />
                <span>Reliable</span>
              </div>
            </div>
          </div>

          {/* Links sections */}
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom section */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>{brandContent.copyright}</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <a 
                href={`mailto:${brandContent.supportEmail}`}
                className="hover:text-gray-900 transition-colors"
              >
                {brandContent.supportEmail}
              </a>
              <span className="text-gray-300">|</span>
              <span>Made with ❤️ for business management</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Minimal footer for auth pages
export function MinimalFooter() {
  return (
    <footer className="mt-8 text-center">
      <div className="flex justify-center mb-4">
        <Logo size="sm" textSize="md" />
      </div>
      <p className="text-xs text-gray-500">
        {brandContent.copyright}
      </p>
    </footer>
  );
}

export default Footer;
