import { test } from "node:test";
import assert from "node:assert/strict";
import {
  slotsForDay,
  overlaps,
  type Hours,
  type Exception,
} from "../src/lib/booking/availability";
import { midnight, localDate, weekStart, DAY } from "../src/lib/booking/time";
const date = "2030-01-08"; // Tuesday
const hours: Hours[] = [
  { day_of_week: 2, start_minute: 600, end_minute: 810 },
  { day_of_week: 2, start_minute: 870, end_minute: 1140 },
];
const at = (time: string) => Date.parse(`${date}T${time}:00-03:00`);
const slots = (options: Partial<Parameters<typeof slotsForDay>[0]> = {}) =>
  slotsForDay({
    date,
    duration: 45,
    hours,
    exceptions: [],
    busy: [],
    now: 0,
    ...options,
  });
test("uses full duration, excludes breaks and end-of-day overflow", () => {
  const labels = slots().map((s) => s.label);
  assert(labels.includes("12:45"));
  assert(!labels.includes("13:00"));
  assert(!labels.includes("14:15"));
  assert(labels.includes("14:30"));
  assert(labels.includes("18:15"));
  assert(!labels.includes("18:30"));
  assert(!slots({ duration: 60 }).some((s) => s.label === "18:15"));
});
test("overlap includes booked intervals, boundaries are half-open", () => {
  const labels = slots({
    busy: [{ start: at("10:30"), end: at("11:15") }],
  }).map((s) => s.label);
  for (const s of ["10:00", "10:15", "10:30", "10:45", "11:00"])
    assert(!labels.includes(s));
  assert(labels.includes("11:15"));
  assert(!overlaps({ start: 1, end: 2 }, { start: 2, end: 3 }));
  assert(overlaps({ start: 1, end: 3 }, { start: 2, end: 4 }));
});
test("different professionals have different schedules and days", () => {
  const mateo = [
    { day_of_week: 1, start_minute: 540, end_minute: 780 },
    { day_of_week: 1, start_minute: 840, end_minute: 1080 },
  ];
  assert.equal(slots({ hours: mateo }).length, 0);
  assert(
    slots({ date: "2030-01-07", hours: mateo }).some(
      (s) => s.label === "09:00",
    ),
  );
});
test("vacation, partial blocks and special hours", () => {
  const base = {
    date_from: date,
    date_to: date,
    start_minute: 660,
    end_minute: 720,
  };
  assert.equal(slots({ exceptions: [{ ...base, kind: "CLOSED" }] }).length, 0);
  assert(
    !slots({ exceptions: [{ ...base, kind: "BLOCK" }] }).some(
      (s) => s.label === "10:30",
    ),
  );
  const special: Exception = {
    ...base,
    kind: "HOURS",
    start_minute: 480,
    end_minute: 600,
  };
  assert.equal(slots({ exceptions: [special] })[0].label, "08:00");
  assert(!slots({ exceptions: [special] }).some((s) => s.label === "10:00"));
});
test("Buenos Aires date and week at UTC boundary, past slots, duration validation", () => {
  assert.equal(localDate(Date.parse("2030-01-08T01:00:00Z")), "2030-01-07");
  assert.equal(
    new Date(midnight(date)).toISOString(),
    "2030-01-08T03:00:00.000Z",
  );
  assert.equal(
    localDate(weekStart(0, Date.parse("2030-01-13T15:00:00Z"))),
    "2030-01-07",
  );
  assert.equal(weekStart(1, at("10:00")) - weekStart(0, at("10:00")), 7 * DAY);
  assert(
    !slots({ now: at("11:00") }).some((s) => Date.parse(s.iso) <= at("11:00")),
  );
  assert.equal(slots({ duration: 0 }).length, 0);
});

test("extra hours extend weekly hours, merge boundaries and respect blocks and day overrides", () => {
  const extra: Exception = {
    date_from: date,
    date_to: date,
    kind: "EXTRA",
    start_minute: 1140,
    end_minute: 1260,
  };
  assert(slots({ exceptions: [extra] }).some((s) => s.label === "18:45"));
  assert(slots({ exceptions: [extra] }).some((s) => s.label === "20:15"));
  assert(!slots().some((s) => s.label === "18:45"));
  const block: Exception = {
    ...extra,
    kind: "BLOCK",
    start_minute: 1170,
    end_minute: 1200,
  };
  assert(
    !slots({ exceptions: [extra, block] }).some((s) => s.label === "19:00"),
  );
  assert.equal(
    slots({ exceptions: [extra, { ...extra, kind: "CLOSED" }] }).length,
    0,
  );
  const replacement: Exception = {
    ...extra,
    kind: "HOURS",
    start_minute: 480,
    end_minute: 600,
  };
  const labels = slots({ exceptions: [replacement, extra] }).map(
    (s) => s.label,
  );
  assert(labels.includes("08:00"));
  assert(labels.includes("19:00"));
  assert(!labels.includes("10:00"));
  assert(
    slots({ date: "2030-01-15", exceptions: [replacement] }).some(
      (s) => s.label === "10:00",
    ),
  );
});
test("weekly recurrence rolls over the Buenos Aires Sunday/Monday boundary", () => {
  const sunday = Date.parse("2030-01-14T02:59:00Z"),
    monday = sunday + 60000;
  assert.equal(weekStart(0, monday) - weekStart(0, sunday), 7 * DAY);
  assert.equal(weekStart(8, sunday), weekStart(7, monday));
  assert.deepEqual(
    slots({ date: "2030-01-15" }).map((s) => s.label),
    slots().map((s) => s.label),
  );
});
