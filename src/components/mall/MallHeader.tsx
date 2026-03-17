/**
 * Mall Header Component
 * Global header with operator selector, date/time picker, toggle, and export dropdown
 */

'use client';

import React from 'react';
import { Calendar, Clock, Download, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface MallHeaderProps {
  selectedDate?: Date;
  selectedTime?: string;
  showPredicted?: boolean;
  onDateChange?: (date: Date) => void;
  onTimeChange?: (time: string) => void;
  onToggleChange?: (showPredicted: boolean) => void;
  className?: string;
}

export function MallHeader({
  selectedDate = new Date(),
  selectedTime = '14:00',
  showPredicted = false,
  onDateChange,
  onTimeChange,
  onToggleChange,
  className,
}: MallHeaderProps) {
  const handleExport = (type: 'pdf' | 'excel') => {
    console.log(`Exporting ${type}...`);
    // TODO: Implement export functionality
  };

  const handleAPIAccess = () => {
    console.log('Opening API docs...');
    // TODO: Open API documentation
  };

  return (
    <div className={cn('flex items-center justify-between border-b bg-card p-4', className)}>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Operator</span>
          <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-2">
            <span className="text-sm font-semibold">KOY Ideapark Oy</span>
          </div>
        </div>

        {/* Date Picker */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <input
            type="date"
            value={selectedDate.toISOString().split('T')[0]}
            onChange={(e) => onDateChange?.(new Date(e.target.value))}
            className="rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        {/* Time Picker */}
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <input
            type="time"
            value={selectedTime}
            onChange={(e) => onTimeChange?.(e.target.value)}
            className="rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        {/* Actual vs Predicted Toggle */}
        <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-2">
          <button
            onClick={() => onToggleChange?.(false)}
            className={cn(
              'px-2 py-1 text-sm font-medium transition-colors',
              !showPredicted && 'rounded bg-primary text-primary-foreground'
            )}
          >
            Actual
          </button>
          <button
            onClick={() => onToggleChange?.(true)}
            className={cn(
              'px-2 py-1 text-sm font-medium transition-colors',
              showPredicted && 'rounded bg-primary text-primary-foreground'
            )}
          >
            Predicted
          </button>
        </div>
      </div>

      {/* Export & API Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export & API
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Export Options</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => handleExport('pdf')}>
            <Download className="mr-2 h-4 w-4" />
            Export Portfolio PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport('excel')}>
            <Download className="mr-2 h-4 w-4" />
            Export to Excel
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>API Access</DropdownMenuLabel>
          <DropdownMenuItem onClick={handleAPIAccess}>
            <Database className="mr-2 h-4 w-4" />
            View API Documentation
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
