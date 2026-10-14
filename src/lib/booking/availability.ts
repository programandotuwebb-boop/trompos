import { DAY, MINUTE, localDate, midnight, timeLabel } from "./time";
export type Interval = { start: number; end: number };
export type Hours = {
  day_of_week: number;
  start_minute: number;
  end_minute: number;
};
export type Exception = {
  date_from: string;
  date_to: string;
  kind: "BLOCK" | "CLOSED" | "HOURS" | "EXTRA";
  start_minute: number | null;
  end_minute: number | null;
};
export function overlaps(a: Interval, b: Interval) {
  return a.start < b.end && a.end > b.start;
}
export function slotsForDay(input: {
  date: string;
  duration: number;
  hours: Hours[];
  exceptions: Exception[];
  busy: Interval[];
  now: number;
}) {
  const { date, duration, hours, exceptions, busy, now } = input;
  if (!Number.isInteger(duration) || duration <= 0) return [];
  const base = midnight(date),
    dow = new Date(base).getUTCDay();
  const exceptionsToday = exceptions.filter(
    (e) => e.date_from <= date && e.date_to >= date,
  );
  if (exceptionsToday.some((e) => e.kind === "CLOSED")) return [];
  const special = exceptionsToday.filter((e) => e.kind === "HOURS");
  const rawWindows = [
    ...(special.length ? special : hours.filter((h) => h.day_of_week === dow)),
    ...exceptionsToday.filter((e) => e.kind === "EXTRA"),
  ]
    .map((w) => ({ start_minute: w.start_minute!, end_minute: w.end_minute! }))
    .sort((a, b) => a.start_minute - b.start_minute);
  // Merge touching/overlapping availability so full-duration services may cross their boundary.
  const windows: { start_minute: number; end_minute: number }[] = [];
  for (const w of rawWindows) {
    const last = windows.at(-1);
    if (last && w.start_minute <= last.end_minute)
      last.end_minute = Math.max(last.end_minute, w.end_minute);
    else windows.push({ ...w });
  }
  const blocked = [
    ...busy,
    ...exceptionsToday
      .filter((e) => e.kind === "BLOCK")
      .map((e) => ({
        start: base + e.start_minute! * MINUTE,
        end: base + e.end_minute! * MINUTE,
      })),
  ];
  const slots = new Map<string, { iso: string; label: string }>();
  for (const window of windows) {
    for (
      let start = base + window.start_minute! * MINUTE;
      start + duration * MINUTE <= base + window.end_minute! * MINUTE;
      start += 15 * MINUTE
    ) {
      const end = start + duration * MINUTE;
      if (start <= now || blocked.some((b) => overlaps({ start, end }, b)))
        continue;
      const iso = new Date(start).toISOString();
      slots.set(iso, { iso, label: timeLabel(start) });
    }
  }
  return [...slots.values()].sort((a, b) => a.iso.localeCompare(b.iso));
}
export function datesInWeek(start: number) {
  return Array.from({ length: 7 }, (_, i) => localDate(start + i * DAY));
}
