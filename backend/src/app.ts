import cors from "cors";
import express, { type Express } from "express";
import type { components } from "./generated/openapi.js";
import {
  MEETING_TYPE_NOT_FOUND_MESSAGE,
  MEETING_VALIDATION_MESSAGE,
  parseMeetingFields,
  parseMeetingStart,
  SLOT_CONFLICT_MESSAGE,
} from "./meeting-input.js";
import {
  MALFORMED_JSON_MESSAGE,
  parseCreateMeetingType,
  VALIDATION_MESSAGE,
} from "./meeting-type-input.js";
import { buildSlots, busyIntervalsFromMeetings } from "./slots.js";
import type { Meeting, MeetingTypeStore } from "./store.js";

const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:3000";

export interface AppDependencies {
  store: MeetingTypeStore;
  /** The current moment, injected so tests can pin it. */
  now: () => Date;
}

type MeetingType = components["schemas"]["MeetingType"];
type MeetingTypeListBody = components["schemas"]["MeetingTypeList"];
type MeetingTypeCreatedBody = components["schemas"]["MeetingTypeCreatedBody"];
type MeetingBody = components["schemas"]["Meeting"];
type MeetingCreatedBody = components["schemas"]["MeetingCreatedBody"];
type ErrorBodyEnvelope = components["schemas"]["ErrorBodyEnvelope"];
type ErrorField = components["schemas"]["ErrorField"];

function errorEnvelope(code: string, message: string): ErrorBodyEnvelope {
  return { error: { code, message } };
}

function validationEnvelope(fields: ErrorField[]): ErrorBodyEnvelope {
  return { error: { code: "validation_error", message: MEETING_VALIDATION_MESSAGE, fields } };
}

/** The wire shape of a meeting: a type summary, never a snapshot. */
function meetingBody(meeting: Meeting, meetingType: MeetingType): MeetingBody {
  return {
    id: meeting.id,
    start: meeting.start.toISOString(),
    guestName: meeting.guestName,
    guestEmail: meeting.guestEmail,
    meetingType: {
      id: meetingType.id,
      name: meetingType.name,
      durationMinutes: meetingType.durationMinutes,
    },
  };
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
export function createApp({ store, now }: AppDependencies): Express {
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

  app.get("/api/meeting-types/:id/slots", (req, res) => {
    const meetingType = store.findMeetingType(req.params.id);

    if (meetingType === undefined) {
      res.status(404).json(errorEnvelope("not_found", "Тип встречи не найден"));

      return;
    }

    const body = buildSlots({
      durationMinutes: meetingType.durationMinutes,
      busy: busyIntervalsFromMeetings(
        store.listMeetings(),
        (meetingTypeId) => store.findMeetingType(meetingTypeId)?.durationMinutes,
      ),
      now: now(),
    });

    res.status(200).json(body);
  });

  app.post("/api/meetings", (req, res) => {
    // Order is part of the contract: fields, then the type, then start rules,
    // then the overlap check inside the store.
    const parsed = parseMeetingFields(req.body);

    if (!parsed.ok) {
      res.status(400).json(validationEnvelope(parsed.fields));

      return;
    }

    const meetingType = store.findMeetingType(parsed.value.meetingTypeId);

    if (meetingType === undefined) {
      res.status(404).json(errorEnvelope("not_found", MEETING_TYPE_NOT_FOUND_MESSAGE));

      return;
    }

    const start = parseMeetingStart(parsed.value.start, meetingType.durationMinutes, now());

    if (!start.ok) {
      res.status(400).json(validationEnvelope([start.error]));

      return;
    }

    const added = store.addMeeting({
      meetingTypeId: parsed.value.meetingTypeId,
      start: start.value,
      guestName: parsed.value.guestName,
      guestEmail: parsed.value.guestEmail,
    });

    if (!added.ok) {
      if (added.reason === "meeting_type_not_found") {
        res.status(404).json(errorEnvelope("not_found", MEETING_TYPE_NOT_FOUND_MESSAGE));

        return;
      }

      // A conflict says nothing about the meeting that took the slot.
      res.status(409).json(errorEnvelope("slot_conflict", SLOT_CONFLICT_MESSAGE));

      return;
    }

    const body: MeetingCreatedBody = {
      meeting: meetingBody(added.meeting, meetingType),
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
