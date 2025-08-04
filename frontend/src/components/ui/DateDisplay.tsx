import { useFormatting } from '@/contexts/FormattingContext';

interface DateDisplayProps {
  date: Date | string | null | undefined;
  showTime?: boolean;
  className?: string;
}

export function DateDisplay({ date, showTime = false, className }: DateDisplayProps) {
  const { formatDate, formatDateTime } = useFormatting();
  
  if (!date) return <span className={className}>-</span>;
  
  const formatted = showTime ? formatDateTime(date) : formatDate(date);
  
  return <span className={className}>{formatted}</span>;
}
