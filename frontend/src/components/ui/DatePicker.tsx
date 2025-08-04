import { useState } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFormatting } from '@/contexts/FormattingContext';

interface DatePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function DatePicker({
  value,
  onChange,
  placeholder,
  className,
  disabled
}: DatePickerProps) {
  const { formatDate, parseDate, dateFormat } = useFormatting();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    const parsedDate = parseDate(value);
    if (parsedDate) {
      onChange(parsedDate);
    }
  };

  const handleInputBlur = () => {
    if (value) {
      setInputValue(formatDate(value));
    } else {
      setInputValue('');
    }
  };

  // For now, use a simple input until we can implement a full calendar
  return (
    <div className="relative">
      <Input
        type="text"
        value={value ? formatDate(value) : inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        placeholder={placeholder || `Enter date (${dateFormat})`}
        className={cn('pl-10', className)}
        disabled={disabled}
      />
      <CalendarIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}
