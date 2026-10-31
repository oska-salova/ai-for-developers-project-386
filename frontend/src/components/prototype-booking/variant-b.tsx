"use client";

// ПРОТОТИП (#15), вариант B — «Одностраничная доска»: без шагов. Слева тип
// встречи, в центре календарь на 14 дней, справа данные и подтверждение.
// Всё видно сразу, ответы можно менять в любом порядке.

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { CheckIcon, SpinnerIcon } from "./icons";
import {
  MEETING_TYPES,
  findDay,
  firstAvailableStart,
  formatDuration,
  formatLongDate,
  formatSlotRange,
  formatTime,
  getSchedule,
  type Scenario,
} from "./data";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Компонент монтируется заново на каждое состояние (`key` в хосте), поэтому
// предустановка сценария — это просто начальные значения useState.
function initialState(scenario: Scenario) {
  if (scenario === "normal") {
    return { typeId: MEETING_TYPES[0].id, start: null, name: "", email: "", done: false };
  }

  const type = MEETING_TYPES[1];
  const start =
    scenario === "loading" || scenario === "empty"
      ? null
      : firstAvailableStart(getSchedule(type.durationMinutes, scenario));
  if (scenario === "validation") {
    return { typeId: type.id, start, name: "", email: "olga@", done: false };
  }
  return {
    typeId: type.id,
    start,
    name: "Ольга Салова",
    email: "olga@example.com",
    done: scenario === "success",
  };
}

export function VariantB({ scenario }: { scenario: Scenario }) {
  const initial = initialState(scenario);
  const [typeId, setTypeId] = useState(initial.typeId);
  const [date, setDate] = useState<string | null>(null);
  const [start, setStart] = useState<string | null>(initial.start);
  const [name, setName] = useState(initial.name);
  const [email, setEmail] = useState(initial.email);
  const [attempted, setAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(initial.done);

  const meetingType = MEETING_TYPES.find((item) => item.id === typeId) ?? MEETING_TYPES[0];
  const days = getSchedule(meetingType.durationMinutes, scenario);
  const firstDayWithSlots = days.find((day) => day.slots.some((slot) => slot.available));
  const activeDay = days.find((day) => day.date === date) ?? firstDayWithSlots ?? days[0];
  const selectedDay = start ? findDay(days, start) : null;
  const selectedSlot = start
    ? (days.flatMap((day) => day.slots).find((slot) => slot.start === start) ?? null)
    : null;
  const hasAnySlot = Boolean(firstDayWithSlots);

  const nameError = name.trim().length === 0 ? "Укажите имя" : null;
  const emailError = EMAIL_PATTERN.test(email) ? null : "Проверьте адрес";
  const showErrors = attempted || scenario === "validation";
  const ready = Boolean(start) && !nameError && !emailError;
  const activeDaySlots = activeDay?.slots ?? [];
  const activeDayAvailable = activeDaySlots.some((slot) => slot.available);

  function selectType(id: string) {
    setTypeId(id);
    setStart(null);
    setDate(null);
  }

  function submit() {
    setAttempted(true);
    if (!ready) return;
    if (scenario === "conflict") return;
    if (scenario === "loading") {
      setSubmitting(true);
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-8 sm:px-6">
        <section className="flex flex-col items-center gap-5 rounded-2xl bg-card p-6 text-center text-sm ring-1 ring-foreground/10 sm:p-10">
          <span className="grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <CheckIcon className="size-7" />
          </span>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">Запись создана</h1>
            <p className="text-muted-foreground">
              {meetingType.name}, {formatDuration(meetingType.durationMinutes)} ·{" "}
              {selectedDay ? formatLongDate(selectedDay.date) : "—"} ·{" "}
              {selectedSlot ? formatSlotRange(selectedSlot.start, selectedSlot.end) : "—"}
            </p>
          </div>
          <p className="max-w-md text-muted-foreground">
            Письмо с деталями и ссылкой на встречу ушло на {email || "почту"}. Если планы изменятся,
            просто ответьте на него.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              onClick={() => {
                setDone(false);
                setStart(null);
                setName("");
                setEmail("");
              }}
            >
              Записаться ещё
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">На главную</Link>
            </Button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-4 py-8 sm:px-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">Запись на встречу</h1>
        <p className="text-sm text-muted-foreground">
          Всё на одном экране: тип, время и контакты. Можно менять в любом порядке.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[16rem_minmax(0,1fr)_19rem] lg:items-start">
        <Section step="01" title="Тип встречи" className="lg:sticky lg:top-6">
          <div className="flex flex-col gap-2">
            {MEETING_TYPES.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => selectType(type.id)}
                className={cn(
                  "flex flex-col gap-1 rounded-xl border p-3 text-left transition-colors",
                  type.id === typeId
                    ? "border-foreground/60 bg-muted/40 ring-1 ring-foreground/20"
                    : "border-border hover:bg-muted/50",
                )}
              >
                <span className="flex items-baseline justify-between gap-2">
                  <span className="font-medium">{type.name}</span>
                  <span className="text-xs whitespace-nowrap text-muted-foreground">
                    {formatDuration(type.durationMinutes)}
                  </span>
                </span>
                <span className="text-xs text-muted-foreground">{type.description}</span>
              </button>
            ))}
          </div>
        </Section>

        <Section step="02" title="Дата и время" hint="14 дней, время московское">
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {days.map((day) => {
              const count = day.slots.filter((slot) => slot.available).length;
              const isActive = day.date === activeDay?.date;
              return (
                <button
                  key={day.date}
                  type="button"
                  onClick={() => setDate(day.date)}
                  className={cn(
                    "flex min-w-14 shrink-0 flex-col items-center gap-0.5 rounded-xl border px-2 py-2 text-xs transition-colors",
                    isActive
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:bg-muted",
                    count === 0 && !isActive && "text-muted-foreground",
                  )}
                >
                  <span>{day.weekdayShort}</span>
                  <span className="text-base font-medium">{day.dayNumber}</span>
                  <span
                    className={cn(
                      isActive ? "text-primary-foreground/70" : "text-muted-foreground",
                    )}
                  >
                    {count === 0 ? "—" : `${count} св.`}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-2 flex flex-col gap-3">
            <p className="text-sm">
              <span className="font-medium">
                {activeDay ? formatLongDate(activeDay.date) : "Дата"}
              </span>
              {activeDay?.relative ? (
                <span className="text-muted-foreground"> · {activeDay.relative}</span>
              ) : null}
            </p>
            {scenario === "loading" ? (
              <SlotsSkeleton />
            ) : !hasAnySlot ? (
              <div className="flex flex-col items-start gap-2 rounded-xl border border-dashed p-4">
                <p className="font-medium">Свободных слотов нет</p>
                <p className="text-sm text-muted-foreground">
                  На ближайшие две недели всё занято. Попробуйте короткий формат или напишите
                  напрямую.
                </p>
                <Button variant="outline" size="sm" onClick={() => setTypeId(MEETING_TYPES[0].id)}>
                  Попробовать «Знакомство»
                </Button>
              </div>
            ) : !activeDayAvailable ? (
              <p className="text-sm text-muted-foreground">
                На этот день всё занято. Выберите другой день в полосе выше.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-6">
                {activeDaySlots.map((slot) => (
                  <button
                    key={slot.start}
                    type="button"
                    disabled={!slot.available}
                    onClick={() => setStart(slot.start)}
                    className={cn(
                      "rounded-lg border px-2 py-1.5 text-sm transition-colors",
                      !slot.available &&
                        "cursor-not-allowed border-dashed text-muted-foreground/50 line-through",
                      slot.available &&
                        start === slot.start &&
                        "border-primary bg-primary text-primary-foreground",
                      slot.available &&
                        start !== slot.start &&
                        "border-border hover:border-foreground/40 hover:bg-muted",
                    )}
                  >
                    {formatTime(slot.start)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </Section>

        <Section step="03" title="Ваши данные" className="lg:sticky lg:top-6">
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium">Имя</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Как к вам обращаться"
                aria-invalid={showErrors && Boolean(nameError)}
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive"
              />
              {showErrors && nameError ? (
                <span className="text-xs text-destructive">{nameError}</span>
              ) : null}
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium">Почта</span>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.com"
                inputMode="email"
                aria-invalid={showErrors && Boolean(emailError)}
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive"
              />
              {showErrors && emailError ? (
                <span className="text-xs text-destructive">{emailError}</span>
              ) : null}
            </label>
          </div>

          <div className="mt-1 flex flex-col gap-1 rounded-xl bg-muted/50 p-3 text-xs">
            <p className="flex justify-between gap-2">
              <span className="text-muted-foreground">Встреча</span>
              <span className="text-right font-medium">
                {meetingType.name}, {formatDuration(meetingType.durationMinutes)}
              </span>
            </p>
            <p className="flex justify-between gap-2">
              <span className="text-muted-foreground">Когда</span>
              <span className="text-right font-medium">
                {selectedDay && selectedSlot
                  ? `${formatLongDate(selectedDay.date)}, ${formatSlotRange(selectedSlot.start, selectedSlot.end)}`
                  : "не выбрано"}
              </span>
            </p>
          </div>

          {scenario === "conflict" ? (
            <div
              role="alert"
              className="flex flex-col gap-1 rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-destructive"
            >
              <p className="text-sm font-medium">Время уже заняли</p>
              <p className="text-xs">
                Пока вы заполняли данные, слот забрали. Выберите другое время.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-1 self-start"
                onClick={() => setStart(null)}
              >
                Выбрать другое
              </Button>
            </div>
          ) : null}

          {showErrors && !start ? (
            <p className="text-xs text-destructive">Выберите время в календаре</p>
          ) : null}

          <Button
            className="w-full"
            onClick={submit}
            disabled={submitting || scenario === "conflict"}
          >
            {submitting ? (
              <>
                <SpinnerIcon />
                Записываем…
              </>
            ) : (
              "Подтвердить запись"
            )}
          </Button>
          <p className="text-xs text-muted-foreground">
            Нажимая кнопку, вы соглашаетесь получить письмо с деталями встречи.
          </p>
        </Section>
      </div>
    </main>
  );
}

function Section({
  step,
  title,
  hint,
  className,
  children,
}: {
  step: string;
  title: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "flex flex-col gap-3 rounded-2xl bg-card p-4 text-sm ring-1 ring-foreground/10 sm:p-5",
        className,
      )}
    >
      <div className="flex items-start gap-2">
        <span className="grid size-6 shrink-0 place-items-center rounded-md bg-muted text-xs font-medium text-muted-foreground">
          {step}
        </span>
        <div className="flex flex-col">
          <h2 className="font-medium">{title}</h2>
          {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

function SlotsSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-6">
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((cell) => (
        <div key={cell} className="h-8 animate-pulse rounded-lg bg-muted" />
      ))}
    </div>
  );
}
