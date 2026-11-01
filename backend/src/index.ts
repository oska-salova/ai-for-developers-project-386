import { createApp } from "./app.js";
import { createStore } from "./store.js";

const port = Number(process.env.PORT ?? 3001);
const store = createStore();
const app = createApp({ store, now: () => new Date() });

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
