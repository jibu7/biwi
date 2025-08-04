'use client';

import { ReactNode } from 'react';

interface ReportPageLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function ReportPageLayout({ title, description, children }: ReportPageLayoutProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-gray-600">{description}</p>
      </div>
      {children}
    </div>
  );
}
