import { useEffect, useState } from "react";
import { TODAY_MONTH, TODAY_YEAR } from "@/lib/expense-config";

const STORAGE_KEY = "xpense-reporting-period";

export function useReportingPeriod() {
  const [year, setYearState] = useState(TODAY_YEAR);
  const [month, setMonthState] = useState(TODAY_MONTH);

  useEffect(() => {
    try {
      const saved = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) ?? "null") as { year?: number; month?: number } | null;
      if (saved?.year && saved.month && saved.month >= 1 && saved.month <= 12) {
        setYearState(saved.year);
        setMonthState(saved.month);
      }
    } catch {
      // Keep the current month if the saved value is unavailable.
    }
  }, []);

  function save(nextYear: number, nextMonth: number) {
    setYearState(nextYear);
    setMonthState(nextMonth);
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ year: nextYear, month: nextMonth }));
  }

  return {
    year,
    month,
    setYear: (nextYear: number) => save(nextYear, month),
    setMonth: (nextMonth: number) => save(year, nextMonth),
    setPeriod: save,
  };
}
