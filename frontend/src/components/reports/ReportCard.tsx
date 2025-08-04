'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

interface ReportCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  href?: string;
  disabled?: boolean;
  buttonText?: string;
  onClick?: () => void;
}

export function ReportCard({
  title,
  description,
  icon: Icon,
  color,
  disabled = false,
  buttonText = 'View Report',
  onClick
}: ReportCardProps) {
  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold mb-2">{title}</h3>
          <p className="text-sm text-gray-600 mb-4">{description}</p>
          <Button
            onClick={onClick}
            disabled={disabled}
            className="w-full"
            variant={disabled ? 'secondary' : 'default'}
          >
            {disabled ? 'Coming Soon' : buttonText}
          </Button>
        </div>
      </div>
    </Card>
  );
}
