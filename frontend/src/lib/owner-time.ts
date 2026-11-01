// The owner lives in Moscow, and Moscow has been on a fixed +03:00 offset since
// 2014. Every formatter names the zone explicitly, so the browser's own zone
// never leaks into the page.
const OWNER_TIME_ZONE = "Europe/Moscow";

const MINUTE_MS = 60 * 1000;

const dayKeyFormatter = new Intl.DateTimeFormat("ru-RU", {
  timeZone: OWNER_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const dayFormatter = new Intl.DateTimeFormat("ru-RU", {
  timeZone: OWNER_TIME_ZONE,
  day: "numeric",
  month: "long",
});

const weekdayFormatter = new Intl.DateTimeFormat("ru-RU", {
  timeZone: OWNER_TIME_ZONE,
  weekday: "long",
});

const timeFormatter = new Intl.DateTimeFormat("ru-RU", {
  timeZone: OWNER_TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** The owner's calendar day of an instant, YYYY-MM-DD. */
export function ownerDayKey(instant: string): string {
  const parts = dayKeyFormatter.formatToParts(new Date(instant));
  const value = (type: "year" | "month" | "day") =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${value("year")}-${value("month")}-${value("day")}`;
}

/** The owner's day as "1 ноября, воскресенье": no year, no "today"/"tomorrow". */
export function formatOwnerDay(instant: string): string {
  const date = new Date(instant);

  return `${dayFormatter.format(date)}, ${weekdayFormatter.format(date)}`;
}

/** The time of an instant as HH:mm in the owner's zone. */
export function formatOwnerTime(instant: string): string {
  return timeFormatter.format(new Date(instant));
}

/** The end of a meeting: its start plus the duration of its type. */
export function meetingEnd(start: string, durationMinutes: number): Date {
  return new Date(new Date(start).getTime() + durationMinutes * MINUTE_MS);
}
