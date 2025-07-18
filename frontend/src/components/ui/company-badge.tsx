// frontend/src/components/ui/company-badge.tsx
import { Company } from '@/types/auth';

interface CompanyBadgeProps {
  company: Company | null;
}

export function CompanyBadge({ company }: CompanyBadgeProps) {
  if (!company) return null;

  return (
    <div className="inline-flex items-center gap-2 mt-2">
      <span className="text-sm text-gray-600">Company:</span>
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        {company.name}
      </span>
    </div>
  );
}
