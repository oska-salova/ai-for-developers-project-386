import cors from "cors";
import express, { type Express } from "express";
import type { components } from "./generated/openapi.js";
import type { MeetingTypeStore } from "./store.js";

const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:3000";

export interface AppDependencies {
  store: MeetingTypeStore;
  /** The current moment, injected so tests can pin it. */
  now: () => Date;
}

type MeetingTypeListBody = components["schemas"]["MeetingTypeList"];
type ErrorBodyEnvelope = components["schemas"]["ErrorBodyEnvelope"];

/**
 * Builds the HTTP app around its dependencies. Tests get a fresh store and a
 * fixed clock per test; the server entry point passes the real ones.
 */
export function createApp({ store }: AppDependencies): Express {
  const app = express();

  app.use(
    cors({
      origin: (origin, callback) => {
        callback(null, origin === undefined || origin === corsOrigin);
      },
    }),
  );
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/meeting-types", (_req, res) => {
    const body: MeetingTypeListBody = { meetingTypes: store.listMeetingTypes() };

    res.status(200).json(body);
  });

  app.use((_req, res) => {
    const body: ErrorBodyEnvelope = {
      error: { code: "not_found", message: "Маршрут не найден" },
    };

    res.status(404).json(body);
  });

  return app;
}
