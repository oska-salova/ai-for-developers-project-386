"use client";

// ПРОТОТИП (#15), вариант D — «A + B»: каркас визарда из A (линейные шаги,
// карточка, подвал), а выбор времени — полоса 14 дней и сетка слотов из B.

import { useState } from "react";
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

const STEPS = ["Тип встречи", "Дата и время", "Ваши данные", "Проверка"];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Компонент монтируется заново на каждое состояние (`key` в хосте), поэтому
// предустановка сценария — это просто начальные значения useState.
function initialState(scenario: Scenario) {
  if (scenario === "normal") {
    return { step: 0, typeId: null, start: null, name: "", email: "", done: false };
  }

  const type = MEETING_TYPES[1];
  if (scenario === "loading" || scenario === "empty") {
    return {
      step: 1,
      typeId: type.id as string | null,
      start: null,
      name: "",
      email: "",
      done: false,
    };
  }

  const start = firstAvailableStart(getSchedule(type.durationMinutes, scenario));
  if (scenario === "validation") {
    return {
      step: 2,
      typeId: type.id as string | null,
      start,
      name: "",
      email: "olga@",
      done: false,
    };
  }
  return {
    step: 3,
    typeId: type.id as string | null,
    start,
    name: "Ольга Салова",
    email: "olga@example.com",
    done: scenario === "success",
  };
}

export function VariantD({ scenario }: { scenario: Scenario }) {
  const initial = initialState(scenario);
  const [step, setStep] = useState(initial.step);
  const [typeId, setTypeId] = useState<string | null>(initial.typeId);
  const [date, setDate] = useState<string | null>(null);
  const [start, setStart] = useState<string | null>(initial.start);
  const [name, setName] = useState(initial.name);
  const [email, setEmail] = useState(initial.email);
  const [attempted, setAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(initial.done);

  const meetingType = MEETING_TYPES.find((item) => item.id === typeId) ?? null;
  const duration = meetingType?.durationMinutes ?? 30;
  const days = getSchedule(duration, scenario);
  const firstDayWithSlots = days.find((day) => day.slots.some((slot) => slot.available));
  const activeDay = days.find((day) => day.date === date) ?? firstDayWithSlots ?? days[0];
  const activeDaySlots = activeDay?.slots ?? [];
  const activeDayAvailable = activeDaySlots.some((slot) => slot.available);
  const selectedDay = start ? findDay(days, start) : null;
  const selectedSlot = start
    ? (days.flatMap((day) => day.slots).find((slot) => slot.start === start) ?? null)
    : null;
  const hasAnySlot = days.some((day) => day.slots.some((slot) => slot.available));

  const nameError = name.trim().length === 0 ? "Укажите, как к вам обращаться" : null;
  const emailError = EMAIL_PATTERN.test(email) ? null : "Похоже, в почте ошибка";
  const showErrors = attempted || scenario === "validation";

  function reset() {
    setDone(false);
    setStep(0);
    setTypeId(null);
    setStart(null);
    setName("");
    setEmail("");
  }

  function goNext() {
    if (step === 2) {
      setAttempted(true);
      if (nameError || emailError) return;
    }
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  }

  function submit() {
    if (scenario === "conflict") return;
    if (scenario === "loading") {
      setSubmitting(true);
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <main className="flex flex-1 justify-center px-4 py-8 sm:px-6">
        <section className="flex w-full max-w-xl flex-col items-center gap-4 self-start rounded-2xl bg-card p-6 text-center text-sm ring-1 ring-foreground/10 sm:p-8">
          <span className="grid size-12 place-items-center rounded-full bg-primary text-primary-foreground">
            <CheckIcon className="size-6" />
          </span>
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-semibold tracking-tight">Вы записаны</h1>
            <p className="text-muted-foreground">Подтверждение отправили на {email || "почту"}</p>
          </div>
          <Summary
            type={meetingType}
            dayLabel={selectedDay ? formatLongDate(selectedDay.date) : "—"}
            timeLabel={selectedSlot ? formatSlotRange(selectedSlot.start, selectedSlot.end) : "—"}
            name={name}
            email={email}
          />
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
            <Button onClick={reset}>Записаться ещё</Button>
            <Button variant="outline" asChild>
              <Link href="/">На главную</Link>
            </Button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="flex flex-1 justify-center px-4 py-8 sm:px-6">
      <section className="flex w-full max-w-2xl flex-col self-start overflow-hidden rounded-2xl bg-card text-sm ring-1 ring-foreground/10">
        <header className="flex flex-col gap-4 border-b px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-semibold tracking-tight">Запись на встречу</h1>
            <p className="text-muted-foreground">Четыре шага, две минуты</p>
          </div>
          <ol className="flex items-center gap-2">
            {STEPS.map((title, itemIndex) => (
              <li key={title} className="flex flex-1 items-center gap-2">
                <span
                  className={cn(
                    "grid size-6 shrink-0 place-items-center rounded-full text-xs font-medium",
                    itemIndex === step && "bg-primary text-primary-foreground",
                    itemIndex < step && "bg-primary/10 text-primary",
                    itemIndex > step && "bg-muted text-muted-foreground",
                  )}
                >
                  {itemIndex < step ? <CheckIcon className="size-3.5" /> : itemIndex + 1}
                </span>
                <span
                  className={cn(
                    "hidden text-xs whitespace-nowrap sm:block",
                    itemIndex === step ? "font-medium" : "text-muted-foreground",
                  )}
                >
                  {title}
                </span>
                {itemIndex < STEPS.length - 1 ? <span className="h-px flex-1 bg-border" /> : null}
              </li>
            ))}
          </ol>
        </header>

        <div className="flex-1 px-5 py-6 sm:px-6">
          {step === 0 ? (
            <div className="flex flex-col gap-3">
              {MEETING_TYPES.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => {
                    setTypeId(type.id);
                    setStart(null);
                    setDate(null);
                  }}
                  className={cn(
                    "flex items-start justify-between gap-3 rounded-xl border p-4 text-left transition-colors",
                    typeId === type.id
                      ? "border-foreground/60 bg-muted/40 ring-1 ring-foreground/20"
                      : "border-border hover:bg-muted/50",
                  )}
                >
                  <span className="flex flex-col gap-1">
                    <span className="font-medium">{type.name}</span>
                    <span className="text-muted-foreground">{type.description}</span>
                  </span>
                  <span className="mt-0.5 shrink-0 rounded-full bg-muted px-2 py-1 text-xs whitespace-nowrap">
                    {formatDuration(type.durationMinutes)}
                  </span>
                </button>
              ))}
            </div>
          ) : null}

          {step === 1 ? (
            <div className="flex flex-col gap-4">
              {!meetingType ? (
                <p className="text-muted-foreground">Сначала выберите тип встречи.</p>
              ) : scenario === "loading" ? (
                <SlotsSkeleton />
              ) : !hasAnySlot ? (
                <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-10 text-center">
                  <p className="font-medium">В ближайшие 14 дней нет свободных слотов</p>
                  <p className="text-muted-foreground">
                    Попробуйте выбрать тип встречи покороче — короткие встречи легче вписать.
                  </p>
                  <Button variant="outline" onClick={() => setStep(0)}>
                    Выбрать другой тип
                  </Button>
                </div>
              ) : (
                <>
                  <p className="text-muted-foreground">
                    14 дней вперёд, время московское. Под датой — число свободных слотов.
                  </p>
                  <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                    {days.map((day) => {
                      const count = day.slots.filter((slot) => slot.available).length;
                      const isActive = day.date === activeDay?.date;
                      return (
                        <button
                          key={day.date}
                          type="button"
                          title={count === 0 ? "Нет свободных слотов" : `Свободно слотов: ${count}`}
                          onClick={() => setDate(day.date)}
                          className={cn(
                            "flex flex-col items-center gap-0.5 rounded-xl border px-1 py-1.5 transition-colors",
                            isActive
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border hover:bg-muted",
                            count === 0 && !isActive && "text-muted-foreground",
                          )}
                        >
                          <span className="text-[11px]">{day.weekdayShort}</span>
                          <span className="text-base leading-none font-medium">
                            {day.dayNumber}
                          </span>
                          <span
                            className={cn(
                              "text-[10px]",
                              isActive ? "text-primary-foreground/70" : "text-muted-foreground",
                            )}
                          >
                            {count === 0 ? "—" : count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex flex-col gap-3">
                    <p className="text-sm">
                      <span className="font-medium">
                        {activeDay ? formatLongDate(activeDay.date) : "Дата"}
                      </span>
                      {activeDay?.relative ? (
                        <span className="text-muted-foreground"> · {activeDay.relative}</span>
                      ) : null}
                    </p>
                    {!activeDayAvailable ? (
                      <p className="text-muted-foreground">
                        На этот день всё занято. Выберите другой день в полосе выше.
                      </p>
                    ) : (
                      <div className="grid max-h-96 grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-4">
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
                </>
              )}
            </div>
          ) : null}

          {step === 2 ? (
            <div className="flex flex-col gap-5">
              <p className="text-muted-foreground">
                Пришлём подтверждение и ссылку на встречу на почту.
              </p>
              <label className="flex flex-col gap-1.5">
                <span className="font-medium">Имя</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Как к вам обращаться"
                  aria-invalid={showErrors && Boolean(nameError)}
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive"
                />
                {showErrors && nameError ? (
                  <span className="text-xs text-destructive">{nameError}</span>
                ) : null}
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="font-medium">Почта</span>
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@example.com"
                  inputMode="email"
                  aria-invalid={showErrors && Boolean(emailError)}
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive"
                />
                {showErrors && emailError ? (
                  <span className="text-xs text-destructive">{emailError}</span>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    Только для подтверждения, без рассылок
                  </span>
                )}
              </label>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="flex flex-col gap-5">
              <Summary
                type={meetingType}
                dayLabel={selectedDay ? formatLongDate(selectedDay.date) : "—"}
                timeLabel={
                  selectedSlot ? formatSlotRange(selectedSlot.start, selectedSlot.end) : "—"
                }
                name={name}
                email={email}
              />
              {scenario === "conflict" ? (
                <div
                  role="alert"
                  className="flex flex-col gap-2 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-destructive"
                >
                  <p className="font-medium">Это время только что заняли</p>
                  <p className="text-xs">
                    Пока вы заполняли данные, слот забрал другой гость. Выберите другое время —
                    список уже обновлён.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="self-start"
                    onClick={() => {
                      setStart(null);
                      setStep(1);
                    }}
                  >
                    Выбрать другое время
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Нажимая «Подтвердить запись», вы соглашаетесь получить письмо с деталями встречи.
                </p>
              )}
            </div>
          ) : null}
        </div>

        <footer className="flex items-center justify-between gap-3 border-t bg-muted/40 px-5 py-4 sm:px-6">
          <Button
            variant="ghost"
            onClick={() => setStep((current) => Math.max(0, current - 1))}
            disabled={step === 0 || submitting}
          >
            Назад
          </Button>
          {step < 3 ? (
            <Button
              onClick={goNext}
              disabled={submitting || (step === 0 && !meetingType) || (step === 1 && !start)}
            >
              Далее
            </Button>
          ) : (
            <Button onClick={submit} disabled={submitting || scenario === "conflict"}>
              {submitting ? (
                <>
                  <SpinnerIcon />
                  Записываем…
                </>
              ) : (
                "Подтвердить запись"
              )}
            </Button>
          )}
        </footer>
      </section>
    </main>
  );
}

function Summary({
  type,
  dayLabel,
  timeLabel,
  name,
  email,
}: {
  type: { name: string; durationMinutes: number } | null;
  dayLabel: string;
  timeLabel: string;
  name: string;
  email: string;
}) {
  const rows = [
    {
      label: "Встреча",
      value: type ? `${type.name}, ${formatDuration(type.durationMinutes)}` : "—",
    },
    { label: "Дата", value: dayLabel },
    { label: "Время", value: timeLabel },
    { label: "Гость", value: `${name || "—"}${email ? `, ${email}` : ""}` },
  ];

  return (
    <dl className="flex w-full flex-col divide-y rounded-xl border text-left">
      {rows.map((row) => (
        <div key={row.label} className="flex items-baseline justify-between gap-4 px-4 py-3">
          <dt className="text-muted-foreground">{row.label}</dt>
          <dd className="text-right font-medium">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function SlotsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="h-4 w-64 animate-pulse rounded bg-muted" />
      {[0, 1, 2].map((row) => (
        <div key={row} className="grid gap-2 sm:grid-cols-[7.5rem_1fr]">
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          <div className="grid grid-cols-4 gap-2">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((cell) => (
              <div key={cell} className="h-8 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
