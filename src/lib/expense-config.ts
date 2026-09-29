export type SlotKey = "none" | "morning" | "afternoon" | "evening";

export const SLOT_LABELS: Record<SlotKey, string> = { none: "Amount", morning: "Morning", afternoon: "Afternoon", evening: "Evening" };

export type CategoryDef = {
  key: string;
  label: string;
  slots: SlotKey[];
  tint: string;
  kind: "spend" | "transfer" | "invest";
};

export const CATEGORIES: CategoryDef[] = [
  { key: "rent", label: "Rent", slots: ["none"], tint: "bg-category-1/15 text-category-1", kind: "spend" },
  {
    key: "food",
    label: "Food",
    slots: ["morning", "afternoon", "evening"],
    tint: "bg-category-2/15 text-category-2",
    kind: "spend",
  },
  {
    key: "other",
    label: "Other (tea etc.)",
    slots: ["morning", "afternoon", "evening"],
    tint: "bg-category-3/15 text-category-3",
    kind: "spend",
  },
  {
    key: "travelling",
    label: "Travelling",
    slots: ["none"],
    tint: "bg-category-5/15 text-category-5",
    kind: "spend",
  },
  {
    key: "home",
    label: "Given to home",
    slots: ["none"],
    tint: "bg-category-6/15 text-category-6",
    kind: "transfer",
  },
  {
    key: "stocks",
    label: "Investment in stocks",
    slots: ["none"],
    tint: "bg-category-7/15 text-category-7",
    kind: "invest",
  },
  {
    key: "others",
    label: "Others",
    slots: ["none"],
    tint: "bg-category-8/15 text-category-8",
    kind: "spend",
  },
];

export const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.key, c]));

export type FieldDef = { category: string; slot: SlotKey; label: string };

export function fieldsOf(cats: CategoryDef[]): FieldDef[] {
  return cats.flatMap((c) =>
    c.slots.map((slot) => ({ category: c.key, slot, label: slot === "none" ? c.label : `${c.label} - ${SLOT_LABELS[slot]}` })),
  );
}

export const FIELDS: FieldDef[] = fieldsOf(CATEGORIES);

export function tintFor(index: number) {
  const n = (index % 8) + 1;
  return `bg-category-${n}/15 text-category-${n}`;
}

export type MonthDef = { year: number; month: number; startDay: number; label: string };

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** The real current date, read from the device clock. */
export function today() {
  const d = new Date();
  return {
    iso: ymd(d),
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    day: d.getDate(),
  };
}

const NOW = today();

export const TODAY_ISO = NOW.iso;
export const TODAY_YEAR = NOW.year;
export const TODAY_MONTH = NOW.month;
export const TODAY_DAY = NOW.day;

/** Every month is shown in full, from the 1st to the last day. */
export function makeMonth(year: number, month: number): MonthDef {
  return { year, month, startDay: 1, label: `${MONTH_NAMES[month - 1]} ${year}` };
}

export function monthsOfYear(year: number): MonthDef[] {
  return Array.from({ length: 12 }, (_, i) => makeMonth(year, i + 1));
}

/** Months from the sheet start (Sep 2026) up to the given year/month, inclusive. */
export const MONTHS: MonthDef[] = [9, 10, 11, 12].map((m) => makeMonth(TODAY_YEAR, m));

export function lastDayOfMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

export function monthDays(def: MonthDef): Date[] {
  const last = lastDayOfMonth(def.year, def.month);
  const days: Date[] = [];
  for (let d = def.startDay; d <= last; d++) days.push(new Date(def.year, def.month - 1, d));
  return days;
}

export function ymd(d: Date) {
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function isHoliday(d: Date) {
  const day = d.getDay();
  return day === 0 || day === 6;
}

export const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function inr(n: number) {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

export function monthRange(def: MonthDef) {
  return {
    from: ymd(new Date(def.year, def.month - 1, def.startDay)),
    to: ymd(new Date(def.year, def.month - 1, lastDayOfMonth(def.year, def.month))),
  };
}

export function findMonth(year: number, month: number) {
  return makeMonth(year, month);
}

