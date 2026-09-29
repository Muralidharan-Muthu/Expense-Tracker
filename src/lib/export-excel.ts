import * as XLSX from "xlsx";
import {
  CATEGORIES,
  fieldsOf,
  type CategoryDef,
  WEEKDAY_NAMES,
  type MonthDef,
  isHoliday,
  monthDays,
  ymd,
} from "./expense-config";
import { buildDayMap, dayTotal, type ExpenseRow, type MonthRow } from "./expense-data";

export function exportMonthsToExcel(
  defs: MonthDef[],
  monthRows: MonthRow[],
  expenses: ExpenseRow[],
  fileName: string,
  cats: CategoryDef[] = CATEGORIES,
) {
  const FIELDS = fieldsOf(cats);
  const dayMap = buildDayMap(expenses);
  const wb = XLSX.utils.book_new();

  for (const def of defs) {
    const received =
      monthRows.find((m) => m.year === def.year && m.month === def.month)?.total_received ?? 0;
    const header = ["Date", "Day", "Holiday", ...FIELDS.map((f) => f.label), "Day total", "Balance"];
    const aoa: (string | number)[][] = [[`${def.label} — Total received`, received], [], header];

    let balance = received;
    let spent = 0;
    for (const d of monthDays(def)) {
      const key = ymd(d);
      const day = dayMap.get(key);
      const total = dayTotal(day);
      spent += total;
      balance -= total;
      aoa.push([
        key,
        WEEKDAY_NAMES[d.getDay()]!,
        isHoliday(d) ? "Holiday" : "",
        ...FIELDS.map((f) => day?.get(`${f.category}|${f.slot}`) ?? 0),
        total,
        balance,
      ]);
    }

    aoa.push([]);
    aoa.push(["Total received", received]);
    aoa.push(["Total spent", spent]);
    aoa.push(["In hand balance", received - spent]);

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws["!cols"] = header.map((h) => ({ wch: Math.max(12, String(h).length + 2) }));
    XLSX.utils.book_append_sheet(wb, ws, def.label.replace(` ${def.year}`, ` ${def.year}`.slice(-3)));
  }

  XLSX.writeFile(wb, fileName);
}
