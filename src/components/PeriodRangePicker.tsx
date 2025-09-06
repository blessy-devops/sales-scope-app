import * as React from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, X } from "lucide-react";
import { DateRange as RDPDateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface DateRange {
  from: Date;
  to: Date;
}

interface PeriodRangePickerProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  className?: string;
}

export function PeriodRangePicker({ dateRange, onDateRangeChange, className }: PeriodRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [tempRange, setTempRange] = React.useState<RDPDateRange | undefined>({
    from: dateRange.from,
    to: dateRange.to
  });

  const formatDateRange = (range: DateRange) => {
    const fromFormatted = format(range.from, "dd/MM/yyyy", { locale: ptBR });
    const toFormatted = format(range.to, "dd/MM/yyyy", { locale: ptBR });
    
    if (format(range.from, "yyyy-MM-dd") === format(range.to, "yyyy-MM-dd")) {
      return format(range.from, "dd/MM/yyyy", { locale: ptBR });
    }
    
    return `${fromFormatted} - ${toFormatted}`;
  };

  const handleDateRangeSelect = (range: RDPDateRange | undefined) => {
    setTempRange(range);
  };

  const handleApply = () => {
    if (tempRange?.from && tempRange?.to) {
      onDateRangeChange({
        from: tempRange.from,
        to: tempRange.to
      });
      setOpen(false);
    }
  };

  const handleClear = () => {
    const today = new Date();
    const range = {
      from: startOfMonth(today),
      to: endOfMonth(today)
    };
    setTempRange(range);
    onDateRangeChange(range);
  };

  const isRangeComplete = tempRange?.from && tempRange?.to;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-[280px] justify-start text-left font-normal",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatDateRange(dateRange)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Selecionar Período</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-auto p-1"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <Calendar
            mode="range"
            selected={tempRange}
            onSelect={handleDateRangeSelect}
            numberOfMonths={2}
            locale={ptBR}
            disabled={(date) => date > new Date()}
            initialFocus
            className="p-3 pointer-events-auto"
          />
          
          {tempRange?.from && (
            <div className="text-xs text-muted-foreground px-3">
              {tempRange.to ? (
                <span>
                  Período: {format(tempRange.from, "dd/MM/yyyy", { locale: ptBR })} - {format(tempRange.to, "dd/MM/yyyy", { locale: ptBR })}
                </span>
              ) : (
                <span>
                  Início: {format(tempRange.from, "dd/MM/yyyy", { locale: ptBR })}
                  <br />
                  Selecione a data final
                </span>
              )}
            </div>
          )}
          
          <div className="flex gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleApply}
              disabled={!isRangeComplete}
              className="flex-1"
            >
              Aplicar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}