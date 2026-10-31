"use client";

// ПРОТОТИП (#15) — три варианта мастера записи на существующем маршруте
// /booking, переключаются через ?variant=A|B|C. Состояния (загрузка, пусто,
// конфликт, ошибки полей, успех) — через ?state=…, чтобы их можно было
// показать владельцу проекта без прохода всего сценария.

import { useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SCENARIOS, type Scenario } from "./data";
import { PrototypeBar } from "./prototype-bar";
import { VariantA } from "./variant-a";
import { VariantB } from "./variant-b";
import { VariantC } from "./variant-c";

const VARIANTS = [
  { key: "A", name: "Карточка-визард", component: VariantA },
  { key: "B", name: "Одностраничная доска", component: VariantB },
  { key: "C", name: "Диалог", component: VariantC },
] as const;

export function BookingPrototype() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const variantKey = (searchParams.get("variant") ?? "A").toUpperCase();
  const variant = VARIANTS.find((item) => item.key === variantKey) ?? VARIANTS[0];
  const stateParam = searchParams.get("state") ?? "normal";
  const scenario = SCENARIOS.find((item) => item.value === stateParam)?.value ?? "normal";

  const go = useCallback(
    (nextVariant: string, nextScenario: Scenario) => {
      router.replace(`/booking?variant=${nextVariant}&state=${nextScenario}`, { scroll: false });
    },
    [router],
  );

  const index = VARIANTS.findIndex((item) => item.key === variant.key);
  const cycle = useCallback(
    (delta: number) => {
      const next = VARIANTS[(index + delta + VARIANTS.length) % VARIANTS.length];
      go(next.key, scenario);
    },
    [go, index, scenario],
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
      if (event.key === "ArrowLeft") cycle(-1);
      if (event.key === "ArrowRight") cycle(1);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [cycle]);

  const Variant = variant.component;

  return (
    <div className="flex flex-1 flex-col pb-24">
      <Variant key={scenario} scenario={scenario} />
      <PrototypeBar
        variantKey={variant.key}
        variantName={variant.name}
        scenario={scenario}
        onPrev={() => cycle(-1)}
        onNext={() => cycle(1)}
        onScenario={(next) => go(variant.key, next)}
      />
    </div>
  );
}
