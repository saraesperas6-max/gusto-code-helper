import React, { useState } from 'react';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface DateFilterProps {
  onFilterChange: (filters: { month: number | null; date: Date | null }) => void;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DateFilter: React.FC<DateFilterProps> = ({ onFilterChange }) => {
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const handleMonthChange = (value: string) => {
    const month = value === 'all' ? null : parseInt(value);
    setSelectedMonth(month);
    setSelectedDate(null);
    onFilterChange({ month, date: null });
  };

  const handleDateChange = (date: Date | undefined) => {
    const d = date || null;
    setSelectedDate(d);
    setSelectedMonth(null);
    onFilterChange({ month: null, date: d });
  };

  const clearFilters = () => {
    setSelectedMonth(null);
    setSelectedDate(null);
    onFilterChange({ month: null, date: null });
  };

  const hasActiveFilter = selectedMonth !== null || selectedDate !== null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Select
        value={selectedMonth !== null ? selectedMonth.toString() : 'all'}
        onValueChange={handleMonthChange}
      >
        <SelectTrigger className="w-[150px] h-9 text-sm">
          <SelectValue placeholder="Filter by month" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Months</SelectItem>
          {MONTHS.map((name, i) => (
            <SelectItem key={i} value={i.toString()}>{name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'h-9 text-sm justify-start',
              !selectedDate && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDate ? format(selectedDate, 'MMM dd, yyyy') : 'Pick a date'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate || undefined}
            onSelect={handleDateChange}
            initialFocus
            className={cn('p-3 pointer-events-auto')}
          />
        </PopoverContent>
      </Popover>

      {hasActiveFilter && (
        <Button variant="ghost" size="sm" className="h-9 text-sm" onClick={clearFilters}>
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
};

export default DateFilter;
