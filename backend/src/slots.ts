import type { components } from "./generated/openapi.js";
import { addDays, ownerDate, ownerTimeInstant, OWNER_TIMEZONE } from "./owner-time.js";
import type { Meeting } from "./store.js";

type SlotsEnvelope = components["schemas"]["SlotsEnvelope"];
type Slot = components["schemas"]["Slot"];
type SlotDay = components["schemas"]["SlotDay"];

const MINUTE_MS = 60 * 1000;

/** The booking window is today plus the following 13 owner days. */
const WINDOW_DAYS = 14;

/** Working hours are 09:00–18:00 every day, without weekends or lunches. */
const WORKDAY_START_MINUTES = 9 * 60;
const WORKDAY_END_MINUTES = 18 * 60;

/** Offered starts are every 15 minutes: 09:00, 09:15, …, 17:45. */
const SLOT_STEP_MINUTES = 15;

/** A half-open `[start, end)` interval that blocks overlapping slots. */
export interface BusyInterval {
  start: Date;
  end: Date;
}

export interface SlotEngineInput {
  /** The duration of the requested meeting type, in minutes. */
  durationMinutes: number;
  /** Existing meetings as half-open intervals; not filtered or validated. */
  busy: readonly BusyInterval[];
  /** The current moment, injected so tests can pin it. */
  now: Date;
}

function overlaps(busy: BusyInterval, startMs: number, endMs: number): boolean {
  return startMs < busy.end.getTime() && endMs > busy.start.getTime();
}

function slotsForDay(date: string, input: SlotEngineInput, nowMs: number): SlotDay {
  const workdayEndMs = ownerTimeInstant(date, WORKDAY_END_MINUTES).getTime();
  const slots: Slot[] = [];

  for (
    let minutes = WORKDAY_START_MINUTES;
    minutes < WORKDAY_END_MINUTES;
    minutes += SLOT_STEP_MINUTES
  ) {
    const start = ownerTimeInstant(date, minutes);
    const startMs = start.getTime();
    const endMs = startMs + input.durationMinutes * MINUTE_MS;
    const available =
      startMs > nowMs &&
      endMs <= workdayEndMs &&
      !input.busy.some((interval) => overlaps(interval, startMs, endMs));

    slots.push({ start: start.toISOString(), available });
  }

  return { date, slots };
}

/**
 * Builds the whole slots envelope for a meeting type. A pure function: the
 * same duration, busy intervals and moment always produce the same response.
 */
export function buildSlots(input: SlotEngineInput): SlotsEnvelope {
  const nowMs = input.now.getTime();
  const startDate = ownerDate(input.now);
  const days = Array.from({ length: WINDOW_DAYS }, (_unused, index) =>
    slotsForDay(addDays(startDate, index), input, nowMs),
  );

  return {
    window: { start: startDate, end: addDays(startDate, WINDOW_DAYS - 1) },
    timezone: OWNER_TIMEZONE,
    days,
  };
}

/**
 * Joins every meeting with the duration of its meeting type. Meetings whose
 * type is unknown are skipped: the contract cannot produce them.
 */
export function busyIntervalsFromMeetings(
  meetings: readonly Meeting[],
  durationOf: (meetingTypeId: string) => number | undefined,
): BusyInterval[] {
  const intervals: BusyInterval[] = [];

  for (const meeting of meetings) {
    const durationMinutes = durationOf(meeting.meetingTypeId);

    if (durationMinutes === undefined) {
      continue;
    }

    intervals.push({
      start: meeting.start,
      end: new Date(meeting.start.getTime() + durationMinutes * MINUTE_MS),
    });
  }

  return intervals;
}
