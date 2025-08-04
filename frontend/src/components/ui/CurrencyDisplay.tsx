import { useFormatting } from '@/contexts/FormattingContext';
import { cn } from '@/lib/utils';

interface CurrencyDisplayProps {
  amount: number | null | undefined;
  className?: string;
  showCurrency?: boolean;
  colorCode?: boolean; // Red for negative, green for positive
}

export function CurrencyDisplay({ 
  amount, 
  className, 
  showCurrency = true,
  colorCode = false 
}: CurrencyDisplayProps) {
  const { formatCurrency, formatNumber, currencyCode } = useFormatting();
  
  if (amount === null || amount === undefined) {
    return <span className={className}>-</span>;
  }
  
  const formatted = showCurrency ? formatCurrency(amount) : formatNumber(amount);
  
  const colorClass = colorCode 
    ? amount < 0 
      ? 'text-red-600' 
      : amount > 0 
        ? 'text-green-600' 
        : ''
    : '';
  
  return (
    <span className={cn(className, colorClass)} title={`${currencyCode} ${amount}`}>
      {formatted}
    </span>
  );
}
