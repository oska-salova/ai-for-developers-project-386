// ПРОТОТИП (#15) — заглушки данных для мастера записи.
// Контракт и данные решаются в тикете «Модель данных и контракт API» (#10),
// поэтому здесь нет ни запросов, ни api.ts: только форма ответа слотов.

export type Scenario = "normal" | "loading" | "empty" | "conflict" | "validation" | "success";

export const SCENARIOS: { value: Scenario; label: string }[] = [
  { value: "normal", label: "Обычный сценарий" },
  { value: "loading", label: "Загрузка слотов" },
  { value: "empty", label: "Нет свободных слотов" },
  { value: "conflict", label: "Конфликт 409" },
  { value: "validation", label: "Ошибки полей" },
  { value: "success", label: "Успех" },
];

export type MeetingType = {
  id: string;
  name: string;
  durationMinutes: number;
  description: string;
};

type Slot = {
  start: string;
  end: string;
  available: boolean;
};

export type Day = {
  date: string;
  relative: string | null;
  weekdayShort: string;
  dayNumber: string;
  monthShort: string;
  slots: Slot[];
};

export const MEETING_TYPES: MeetingType[] = [
  {
    id: "intro",
    name: "Знакомство",
    durationMinutes: 15,
    description: "Коротко познакомимся и поймём, чем я могу помочь",
  },
  {
    id: "consultation",
    name: "Консультация",
    durationMinutes: 30,
    description: "Разберём ваш вопрос и наметим следующие шаги",
  },
  {
    id: "project",
    name: "Разбор проекта",
    durationMinutes: 60,
    description: "Посмотрим проект, код и план работ — с экраном и примерами",
  },
];

const BASE_DATE = Date.UTC(2026, 9, 31); // 31 октября 2026 — «сегодня» в прототипе
const DAY_COUNT = 14;
const STEP_MINUTES = 15;
const WORK_START = 9 * 60;
const LAST_START = 17 * 60 + 45;
const WORK_END = 18 * 60;
const NOW_MINUTES = 12 * 60; // «сейчас» в первый день

const START_MINUTES = Array.from(
  { length: (LAST_START - WORK_START) / STEP_MINUTES + 1 },
  (_, index) => WORK_START + index * STEP_MINUTES,
);

// Занятые интервалы по индексу дня; индекса 1 занят целиком — так видно
// и «занятые» ячейки, и пустой день.
const BUSY: Record<number, [number, number][]> = {
  0: [
    [9 * 60, 9 * 60 + 45],
    [11 * 60, 12 * 60],
  ],
  1: [[0, 24 * 60]],
  2: [
    [10 * 60, 11 * 60],
    [14 * 60, 15 * 60 + 30],
  ],
  3: [
    [9 * 60, 9 * 60 + 30],
    [16 * 60, 17 * 60],
  ],
  4: [[12 * 60, 13 * 60]],
  5: [],
  6: [
    [9 * 60, 10 * 60],
    [10 * 60 + 30, 11 * 60 + 15],
  ],
  7: [[15 * 60, 16 * 60]],
  8: [[9 * 60, 11 * 60]],
  9: [],
  10: [
    [13 * 60, 13 * 60 + 45],
    [16 * 60, 17 * 60],
  ],
  11: [[9 * 60, 9 * 60 + 30]],
  12: [
    [11 * 60, 12 * 60],
    [14 * 60, 16 * 60],
  ],
  13: [],
};

const WEEKDAYS_SHORT = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];
const WEEKDAYS_FULL = [
  "воскресенье",
  "понедельник",
  "вторник",
  "среда",
  "четверг",
  "пятница",
  "суббота",
];
const MONTHS_GENITIVE = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
];
const MONTHS_SHORT = [
  "янв.",
  "фев.",
  "мар.",
  "апр.",
  "мая",
  "июн.",
  "июл.",
  "авг.",
  "сен.",
  "окт.",
  "ноя.",
  "дек.",
];

type ParsedDate = { year: number; month: number; day: number; weekday: number };

function parseDate(date: string): ParsedDate {
  const [year, month, day] = date.split("-").map(Number);
  return {
    year,
    month,
    day,
    weekday: new Date(Date.UTC(year, month - 1, day)).getUTCDay(),
  };
}

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

function toIso(date: string, minutes: number): string {
  const { year, month, day } = parseDate(date);
  // Москва — фиксированный +03:00, поэтому UTC = местное время − 3 часа.
  return new Date(Date.UTC(year, month - 1, day, 0, minutes - 180)).toISOString();
}

function days(): { date: string; index: number }[] {
  return Array.from({ length: DAY_COUNT }, (_, index) => ({
    index,
    date: new Date(BASE_DATE + index * 86_400_000).toISOString().slice(0, 10),
  }));
}

export function getSchedule(durationMinutes: number, scenario: Scenario = "normal"): Day[] {
  return days().map(({ date, index }) => {
    const parsed = parseDate(date);
    const busy = BUSY[index] ?? [];
    return {
      date,
      relative: index === 0 ? "Сегодня" : index === 1 ? "Завтра" : null,
      weekdayShort: WEEKDAYS_SHORT[parsed.weekday],
      dayNumber: parsed.day.toString(),
      monthShort: MONTHS_SHORT[parsed.month - 1],
      slots: START_MINUTES.map((startMinutes) => {
        const endMinutes = startMinutes + durationMinutes;
        const fitsHours = endMinutes <= WORK_END;
        const inFuture = !(index === 0 && startMinutes <= NOW_MINUTES);
        const overlaps = busy.some(([from, to]) => startMinutes < to && endMinutes > from);
        return {
          start: toIso(date, startMinutes),
          end: toIso(date, endMinutes),
          available: scenario !== "empty" && fitsHours && inFuture && !overlaps,
        };
      }),
    };
  });
}

export function firstAvailableStart(schedule: Day[]): string | null {
  for (const day of schedule) {
    const slot = day.slots.find((item) => item.available);
    if (slot) return slot.start;
  }
  return null;
}

export function findDay(schedule: Day[], start: string): Day | null {
  return schedule.find((day) => day.slots.some((slot) => slot.start === start)) ?? null;
}

export function formatTime(iso: string): string {
  const date = new Date(new Date(iso).getTime() + 3 * 3_600_000);
  return `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
}

export function formatSlotRange(start: string, end: string): string {
  return `${formatTime(start)}–${formatTime(end)}`;
}

export function formatLongDate(date: string): string {
  const parsed = parseDate(date);
  return `${parsed.day} ${MONTHS_GENITIVE[parsed.month - 1]}, ${WEEKDAYS_FULL[parsed.weekday]}`;
}

export function formatShortDate(date: string): string {
  const parsed = parseDate(date);
  return `${parsed.day} ${MONTHS_GENITIVE[parsed.month - 1]}`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} мин`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} ч` : `${hours} ч ${rest} мин`;
}
