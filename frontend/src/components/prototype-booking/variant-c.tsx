"use client";

// ПРОТОТИП (#15), вариант C — «Диалог»: мастер как переписка с ассистентом.
// Вопрос — ответ, выборы живут прямо в репликах, история остаётся на экране.

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { CheckIcon, SpinnerIcon, TypingDots } from "./icons";
import {
  MEETING_TYPES,
  findDay,
  firstAvailableStart,
  formatDuration,
  formatLongDate,
  formatShortDate,
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
    return {
      typeId: null,
      start: null,
      name: "",
      email: "",
      detailsConfirmed: false,
      done: false,
    };
  }

  const type = MEETING_TYPES[1];
  const start =
    scenario === "loading" || scenario === "empty"
      ? null
      : firstAvailableStart(getSchedule(type.durationMinutes, scenario));
  if (scenario === "validation") {
    return {
      typeId: type.id as string | null,
      start,
      name: "",
      email: "olga@",
      detailsConfirmed: false,
      done: false,
    };
  }
  return {
    typeId: type.id as string | null,
    start,
    name: "Ольга Салова",
    email: "olga@example.com",
    detailsConfirmed: scenario === "conflict" || scenario === "success",
    done: scenario === "success",
  };
}

export function VariantC({ scenario }: { scenario: Scenario }) {
  const initial = initialState(scenario);
  const [typeId, setTypeId] = useState<string | null>(initial.typeId);
  const [date, setDate] = useState<string | null>(null);
  const [start, setStart] = useState<string | null>(initial.start);
  const [name, setName] = useState(initial.name);
  const [email, setEmail] = useState(initial.email);
  const [attempted, setAttempted] = useState(false);
  const [detailsConfirmed, setDetailsConfirmed] = useState(initial.detailsConfirmed);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(initial.done);

  const meetingType = MEETING_TYPES.find((item) => item.id === typeId) ?? null;
  const duration = meetingType?.durationMinutes ?? 30;
  const days = getSchedule(duration, scenario);
  const firstDayWithSlots = days.find((day) => day.slots.some((slot) => slot.available));
  const activeDay = days.find((day) => day.date === date) ?? firstDayWithSlots ?? days[0];
  const selectedDay = start ? findDay(days, start) : null;
  const selectedSlot = start
    ? (days.flatMap((day) => day.slots).find((slot) => slot.start === start) ?? null)
    : null;
  const hasAnySlot = Boolean(firstDayWithSlots);

  const nameError = name.trim().length === 0 ? "Укажите имя" : null;
  const emailError = EMAIL_PATTERN.test(email) ? null : "Похоже, в почте ошибка";
  const showErrors = attempted || scenario === "validation";

  function reset() {
    setTypeId(null);
    setStart(null);
    setDate(null);
    setName("");
    setEmail("");
    setAttempted(false);
    setDetailsConfirmed(false);
    setDone(false);
  }

  function confirmDetails() {
    setAttempted(true);
    if (nameError || emailError) return;
    setDetailsConfirmed(true);
  }

  function submit() {
    if (scenario === "conflict") return;
    if (scenario === "loading") {
      setSubmitting(true);
      return;
    }
    setDone(true);
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 py-8 sm:px-6">
      <header className="flex flex-col gap-1 border-b pb-4">
        <h1 className="text-xl font-semibold tracking-tight">Запись на встречу</h1>
        <p className="text-sm text-muted-foreground">
          Ответьте на пару вопросов — запись оформится сама
        </p>
      </header>

      <div className="flex flex-col gap-3 pt-5">
        <Assistant>Здравствуйте! Помогу записаться на звонок. Какой формат подойдёт?</Assistant>

        {!meetingType ? (
          <Assistant wide>
            <div className="flex flex-col gap-2">
              {MEETING_TYPES.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => {
                    setTypeId(type.id);
                    setStart(null);
                  }}
                  className="flex items-start justify-between gap-3 rounded-xl border bg-background p-3 text-left transition-colors hover:border-foreground/40 hover:bg-muted"
                >
                  <span className="flex flex-col gap-0.5">
                    <span className="font-medium">{type.name}</span>
                    <span className="text-xs text-muted-foreground">{type.description}</span>
                  </span>
                  <span className="shrink-0 text-xs whitespace-nowrap text-muted-foreground">
                    {formatDuration(type.durationMinutes)}
                  </span>
                </button>
              ))}
            </div>
          </Assistant>
        ) : (
          <User>{meetingType.name}</User>
        )}

        {meetingType && !done ? (
          <>
            {!start ? (
              <Assistant wide>
                {scenario === "loading" ? (
                  <div className="flex flex-col gap-3">
                    <p className="flex items-center gap-2 text-muted-foreground">
                      Загружаю свободное время
                      <TypingDots />
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {[0, 1, 2, 3, 4, 5, 6, 7].map((cell) => (
                        <div key={cell} className="h-8 animate-pulse rounded-lg bg-background" />
                      ))}
                    </div>
                  </div>
                ) : !hasAnySlot ? (
                  <div className="flex flex-col gap-2">
                    <p className="font-medium">На ближайшие две недели всё занято</p>
                    <p className="text-muted-foreground">
                      Короткие встречи вписать проще — попробуйте «Знакомство».
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="self-start"
                      onClick={() => setTypeId(MEETING_TYPES[0].id)}
                    >
                      Выбрать «Знакомство»
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <p>Когда удобно? Вот свободное время на две недели.</p>
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
                                : "border-border bg-background hover:bg-muted",
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
                              {count === 0 ? "—" : count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {activeDay ? formatLongDate(activeDay.date) : ""} · время московское
                    </p>
                    {!activeDay?.slots.some((slot) => slot.available) ? (
                      <p className="text-muted-foreground">На этот день всё занято.</p>
                    ) : (
                      <div className="grid grid-cols-4 gap-2">
                        {activeDay.slots.map((slot) => (
                          <button
                            key={slot.start}
                            type="button"
                            disabled={!slot.available}
                            onClick={() => setStart(slot.start)}
                            className={cn(
                              "rounded-lg border bg-background px-2 py-1.5 text-sm transition-colors",
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
                )}
              </Assistant>
            ) : (
              <User>
                {selectedDay ? formatShortDate(selectedDay.date) : ""}
                {selectedSlot ? `, ${formatSlotRange(selectedSlot.start, selectedSlot.end)}` : ""}
              </User>
            )}

            {start && !done ? (
              !detailsConfirmed ? (
                <Assistant wide>
                  <div className="flex flex-col gap-3">
                    <p>Отлично! Как вас зовут и куда прислать подтверждение?</p>
                    <div className="flex flex-col gap-2">
                      <label className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">Имя</span>
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
                        <span className="text-xs text-muted-foreground">Почта</span>
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
                    <Button size="sm" className="self-end" onClick={confirmDetails}>
                      Далее
                    </Button>
                  </div>
                </Assistant>
              ) : (
                <>
                  <Assistant wide>
                    <div className="flex flex-col gap-3">
                      <p>Проверьте запись — всё верно?</p>
                      <dl className="flex flex-col divide-y rounded-xl border bg-background text-sm">
                        {[
                          {
                            label: "Встреча",
                            value: `${meetingType.name}, ${formatDuration(meetingType.durationMinutes)}`,
                          },
                          {
                            label: "Когда",
                            value: `${selectedDay ? formatLongDate(selectedDay.date) : "—"}${
                              selectedSlot
                                ? `, ${formatSlotRange(selectedSlot.start, selectedSlot.end)}`
                                : ""
                            }`,
                          },
                          { label: "Гость", value: `${name}, ${email}` },
                        ].map((row) => (
                          <div
                            key={row.label}
                            className="flex items-baseline justify-between gap-3 px-3 py-2"
                          >
                            <dt className="text-muted-foreground">{row.label}</dt>
                            <dd className="text-right font-medium">{row.value}</dd>
                          </div>
                        ))}
                      </dl>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDetailsConfirmed(false)}
                        >
                          Изменить
                        </Button>
                        <Button
                          size="sm"
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
                      </div>
                    </div>
                  </Assistant>

                  {scenario === "conflict" ? (
                    <div
                      role="alert"
                      className="flex max-w-[92%] flex-col gap-1 rounded-2xl rounded-tl-sm border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive"
                    >
                      <p className="font-medium">Время только что заняли</p>
                      <p className="text-xs">
                        Пока вы заполняли данные, слот забрали. Выберите другое время — список
                        обновился.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-1 self-start"
                        onClick={() => {
                          setStart(null);
                          setDetailsConfirmed(false);
                        }}
                      >
                        Выбрать другое время
                      </Button>
                    </div>
                  ) : null}
                </>
              )
            ) : null}
          </>
        ) : null}

        {done ? (
          <>
            {scenario !== "success" ? <User>Подтверждаю</User> : null}
            <Assistant wide>
              <div className="flex flex-col gap-3">
                <p className="flex items-center gap-2 font-medium">
                  <span className="grid size-7 place-items-center rounded-full bg-primary text-primary-foreground">
                    <CheckIcon className="size-4" />
                  </span>
                  Готово, запись создана
                </p>
                <p className="text-muted-foreground">
                  {meetingType?.name}, {selectedDay ? formatLongDate(selectedDay.date) : "—"} ·{" "}
                  {selectedSlot ? formatSlotRange(selectedSlot.start, selectedSlot.end) : "—"}
                </p>
                <p className="text-muted-foreground">
                  Письмо с подтверждением ушло на {email || "почту"}.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={reset}>
                    Записаться ещё
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/">На главную</Link>
                  </Button>
                </div>
              </div>
            </Assistant>
          </>
        ) : null}
      </div>
    </main>
  );
}

function Assistant({ children, wide }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className={cn("flex items-start gap-2", wide ? "max-w-full" : "max-w-[92%]")}>
      <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
        К
      </span>
      <div className="min-w-0 flex-1 rounded-2xl rounded-tl-sm bg-muted px-4 py-3 text-sm">
        {children}
      </div>
    </div>
  );
}

function User({ children }: { children: ReactNode }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
        {children}
      </div>
    </div>
  );
}
