import { CalendarClock, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MONTH_NAMES } from "@/lib/expense-config";

export function PeriodSelector({ year, month, years, onYearChange, onMonthChange, compact = false }: {
  year: number;
  month: number;
  years: number[];
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Select value={String(month)} onValueChange={(value) => onMonthChange(Number(value))}>
          <SelectTrigger className="w-32" aria-label="Reporting month"><SelectValue /></SelectTrigger>
          <SelectContent>{MONTH_NAMES.map((name, index) => <SelectItem key={name} value={String(index + 1)}>{name}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={String(year)} onValueChange={(value) => onYearChange(Number(value))}>
          <SelectTrigger className="w-24" aria-label="Reporting year"><SelectValue /></SelectTrigger>
          <SelectContent>{years.map((option) => <SelectItem key={option} value={String(option)}>{option}</SelectItem>)}</SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <section className="rounded-lg border bg-card p-3 sm:p-4" aria-label="Choose reporting period">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold"><CalendarClock className="size-4 text-primary" />{MONTH_NAMES[month - 1]} {year}</div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" onClick={() => onYearChange(year - 1)} aria-label="Previous year"><ChevronLeft className="size-4" /></Button>
          <span className="min-w-14 text-center font-bold">{year}</span>
          <Button variant="outline" size="icon" onClick={() => onYearChange(year + 1)} aria-label="Next year"><ChevronRight className="size-4" /></Button>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-1.5 sm:grid-cols-6 sm:gap-2">
        {MONTH_NAMES.map((name, index) => <Button key={name} variant={month === index + 1 ? "default" : "outline"} size="sm" onClick={() => onMonthChange(index + 1)}>{name.slice(0, 3)}</Button>)}
      </div>
    </section>
  );
}
