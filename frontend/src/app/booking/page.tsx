import { Suspense } from "react";
import { BookingPrototype } from "@/components/prototype-booking/booking-prototype";

// ПРОТОТИП (#15): три варианта мастера записи, ?variant=A|B|C.
// Живёт на ветке prototype/booking-wizard; после выбора варианта код
// переписывается в настоящий маршрут, а прототип остаётся в истории ветки.
export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <main className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
          Загружаем прототип…
        </main>
      }
    >
      <BookingPrototype />
    </Suspense>
  );
}
