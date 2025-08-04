import React from 'react';
import { Input } from './input';

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  className?: string;
}

export default function DatePicker({ value, onChange, className }: DatePickerProps) {
  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    onChange(newDate);
  };

  return (
    <Input
      type="date"
      value={formatDateForInput(value)}
      onChange={handleChange}
      className={className}
    />
  );
}
