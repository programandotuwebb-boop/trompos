export const ZONE = "America/Argentina/Buenos_Aires";
export const DAY = 86400000;
export const MINUTE = 60000;
export function localDate(value: Date | number = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}
// Buenos Aires has used UTC-03 year-round since 2009. All stored instants are UTC.
export function midnight(date: string) {
  return new Date(`${date}T00:00:00-03:00`).getTime();
}
export function weekStart(offset: number, now = Date.now()) {
  const start = midnight(localDate(now));
  const dow = new Date(start).getUTCDay();
  return start + ((dow === 0 ? -6 : 1 - dow) + offset * 7) * DAY;
}
export function dayLabel(value: Date | number) {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: ZONE,
    weekday: "long",
    day: "numeric",
    month: "numeric",
  }).format(value);
}
export function timeLabel(value: Date | number) {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(value);
}
