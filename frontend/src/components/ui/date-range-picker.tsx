import { Input } from './input';
import { Button } from './button';
import { Card } from './card';
import { Calendar } from 'lucide-react';

interface DateRange {
  start: Date;
  end: Date;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    onChange({
      start: newDate,
      end: value.end
    });
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    onChange({
      start: value.start,
      end: newDate
    });
  };

  const setToday = () => {
    const today = new Date();
    onChange({
      start: today,
      end: today
    });
  };

  const setThisWeek = () => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay());
    onChange({
      start,
      end: today
    });
  };

  const setThisMonth = () => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    onChange({
      start,
      end: today
    });
  };

  const setLastMonth = () => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const end = new Date(today.getFullYear(), today.getMonth(), 0);
    onChange({
      start,
      end
    });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="h-5 w-5 text-gray-500" />
        <h3 className="font-medium">Date Range</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="start-date" className="block text-sm font-medium mb-1">
            Start Date
          </label>
          <Input
            id="start-date"
            type="date"
            value={formatDateForInput(value.start)}
            onChange={handleStartDateChange}
          />
        </div>
        
        <div>
          <label htmlFor="end-date" className="block text-sm font-medium mb-1">
            End Date
          </label>
          <Input
            id="end-date"
            type="date"
            value={formatDateForInput(value.end)}
            onChange={handleEndDateChange}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={setToday}
        >
          Today
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={setThisWeek}
        >
          This Week
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={setThisMonth}
        >
          This Month
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={setLastMonth}
        >
          Last Month
        </Button>
      </div>
    </div>
  );
}
