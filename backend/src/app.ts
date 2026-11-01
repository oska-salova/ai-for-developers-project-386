import cors from "cors";
import express, { type Express } from "express";
import type { components } from "./generated/openapi.js";
import {
  MALFORMED_JSON_MESSAGE,
  parseCreateMeetingType,
  VALIDATION_MESSAGE,
} from "./meeting-type-input.js";
import type { MeetingTypeStore } from "./store.js";

const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:3000";

export interface AppDependencies {
  store: MeetingTypeStore;
  /** The current moment, injected so tests can pin it. */
  now: () => Date;
}

type MeetingTypeListBody = components["schemas"]["MeetingTypeList"];
type MeetingTypeCreatedBody = components["schemas"]["MeetingTypeCreatedBody"];
type ErrorBodyEnvelope = components["schemas"]["ErrorBodyEnvelope"];

function errorEnvelope(code: string, message: string): ErrorBodyEnvelope {
  return { error: { code, message } };
}

function isMalformedJson(error: unknown): boolean {
  return (
    error instanceof SyntaxError &&
    "status" in error &&
    (error as { status?: unknown }).status === 400
  );
}

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

  app.post("/api/meeting-types", (req, res) => {
    const parsed = parseCreateMeetingType(req.body);

    if (!parsed.ok) {
      res.status(400).json({
        error: {
          code: "validation_error",
          message: VALIDATION_MESSAGE,
          fields: parsed.fields,
        },
      } satisfies ErrorBodyEnvelope);

      return;
    }

    const body: MeetingTypeCreatedBody = {
      meetingType: store.createMeetingType(parsed.value),
    };

    res.status(201).json(body);
  });

  app.use((_req, res) => {
    res.status(404).json(errorEnvelope("not_found", "Маршрут не найден"));
  });

  // express.json() rejects a broken body before any route runs; the answer
  // still has to use the shared error envelope.
  app.use(
    (error: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
      if (res.headersSent) {
        next(error);

        return;
      }

      if (isMalformedJson(error)) {
        res.status(400).json(errorEnvelope("validation_error", MALFORMED_JSON_MESSAGE));

        return;
      }

      next(error);
    },
  );

  return app;
}
