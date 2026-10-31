"use client";

// ПРОТОТИП (#15) — плавающая панель. В прод не попадает, но на всякий случай
// скрыта: панель не часть дизайна, её нельзя принять за интерфейс.

import { SCENARIOS, type Scenario } from "./data";

type Props = {
  variantKey: string;
  variantName: string;
  scenario: Scenario;
  onPrev: () => void;
  onNext: () => void;
  onScenario: (scenario: Scenario) => void;
};

export function PrototypeBar({
  variantKey,
  variantName,
  scenario,
  onPrev,
  onNext,
  onScenario,
}: Props) {
  if (process.env.NODE_ENV === "production") return null;

  return (
    <div className="fixed inset-x-0 bottom-3 z-50 flex justify-center px-3">
      <div
        data-prototype-bar
        title="Прототип: панель не входит в дизайн, стрелки ← → переключают вариант"
        className="flex max-w-full flex-wrap items-center justify-center gap-1.5 rounded-full bg-neutral-900 px-2 py-2 text-xs text-white shadow-xl ring-1 ring-white/20"
      >
        <button
          type="button"
          onClick={onPrev}
          aria-label="Предыдущий вариант"
          className="grid size-7 place-items-center rounded-full text-sm hover:bg-white/15"
        >
          ←
        </button>
        <span className="px-1 font-medium whitespace-nowrap">
          {variantKey} · {variantName}
        </span>
        <button
          type="button"
          onClick={onNext}
          aria-label="Следующий вариант"
          className="grid size-7 place-items-center rounded-full text-sm hover:bg-white/15"
        >
          →
        </button>
        <span className="mx-1 h-5 w-px bg-white/20" />
        <label className="flex items-center gap-1.5 whitespace-nowrap">
          <span className="text-white/60">состояние</span>
          <select
            value={scenario}
            onChange={(event) => onScenario(event.target.value as Scenario)}
            className="rounded-full bg-white/10 px-2 py-1 text-white outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            {SCENARIOS.map((item) => (
              <option key={item.value} value={item.value} className="text-neutral-900">
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
