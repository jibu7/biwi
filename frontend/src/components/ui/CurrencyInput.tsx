import React, { useState, useEffect } from 'react';
import { useFormatting } from '@/contexts/FormattingContext';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number | null;
  onChange: (value: number | null) => void;
  showCurrency?: boolean;
}

export function CurrencyInput({ 
  value, 
  onChange, 
  className,
  showCurrency = true,
  ...props 
}: CurrencyInputProps) {
  const { formatCurrency, formatNumber, parseCurrency, currencySymbol, currencyPosition } = useFormatting();
  const [displayValue, setDisplayValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      if (value === null || value === undefined) {
        setDisplayValue('');
      } else {
        setDisplayValue(showCurrency ? formatCurrency(value) : formatNumber(value));
      }
    }
  }, [value, isFocused, formatCurrency, formatNumber, showCurrency]);

  const handleFocus = () => {
    setIsFocused(true);
    if (value !== null && value !== undefined) {
      setDisplayValue(value.toString());
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    const parsed = parseCurrency(displayValue);
    onChange(isNaN(parsed) ? null : parsed);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayValue(e.target.value);
  };

  const inputClass = cn(
    className,
    showCurrency && currencyPosition === 'prefix' && 'pl-8',
    showCurrency && currencyPosition === 'suffix' && 'pr-8'
  );

  return (
    <div className="relative">
      {showCurrency && currencyPosition === 'prefix' && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {currencySymbol}
        </span>
      )}
      <Input
        {...props}
        type="text"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={inputClass}
      />
      {showCurrency && currencyPosition === 'suffix' && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {currencySymbol}
        </span>
      )}
    </div>
  );
}
