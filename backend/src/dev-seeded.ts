import { createApp } from "./app.js";
import { createStore } from "./store.js";

// Development-only entry point: the production server starts empty. Run it
// with `pnpm dev:seeded` to have something to look at on the meeting types page.
const port = Number(process.env.PORT ?? 3001);
const store = createStore();

store.createMeetingType({ name: "Кофе с гостем", description: "", durationMinutes: 30 });

const app = createApp({ store, now: () => new Date() });

app.listen(port, () => {
  console.log(`Seeded server running on http://localhost:${port}`);
});
