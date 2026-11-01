import SwaggerParser from "@apidevtools/swagger-parser";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import { createStore } from "./store.js";

// The contract is the source of truth: these tests check that the real server
// answers with codes and bodies the committed OpenAPI document declares.
const openapiPath = fileURLToPath(new URL("../../contract/openapi/openapi.json", import.meta.url));

interface ResponseObject {
  description?: string;
  content?: Record<string, { schema?: unknown }>;
}

interface OperationObject {
  responses?: Record<string, ResponseObject>;
}

interface DocumentObject {
  paths?: Record<string, Record<string, OperationObject | undefined> | undefined>;
  components?: unknown;
}

interface ValidatorArgs {
  responses: Record<string, ResponseObject>;
  components?: unknown;
}

interface ValidatorModule {
  default: new (args: ValidatorArgs) => {
    validateResponse: (status: number, body: unknown) => unknown;
  };
}

// openapi-response-validator is CommonJS: its class is `exports.default`, and
// Node's ESM interop hands the whole exports object to a default import.
const require = createRequire(import.meta.url);
const OpenAPIResponseValidator = (require("openapi-response-validator") as ValidatorModule).default;

let documentPromise: Promise<DocumentObject> | undefined;

function loadDocument(): Promise<DocumentObject> {
  documentPromise ??= SwaggerParser.dereference(openapiPath) as unknown as Promise<DocumentObject>;

  return documentPromise;
}

async function validateResponse(
  path: string,
  method: "get" | "post",
  status: number,
  body: unknown,
): Promise<void> {
  const document = await loadDocument();
  const operation = document.paths?.[path]?.[method];

  if (operation?.responses === undefined) {
    throw new Error(`The contract does not describe ${method.toUpperCase()} ${path}`);
  }

  const validator = new OpenAPIResponseValidator({
    responses: operation.responses as ValidatorArgs["responses"],
    components: document.components as ValidatorArgs["components"],
  });
  const error: unknown = validator.validateResponse(status, body);

  if (error !== undefined) {
    throw new Error(JSON.stringify(error));
  }
}

function makeApp() {
  const store = createStore();
  store.createMeetingType({
    name: "Кофе с гостем",
    description: "Короткий разговор о задаче",
    durationMinutes: 30,
  });

  return createApp({ store, now: () => new Date("2026-11-01T09:00:00.000Z") });
}

describe("contract compliance", () => {
  it("validates the 200 body of GET /api/meeting-types", async () => {
    const response = await request(makeApp()).get("/api/meeting-types");

    expect(response.status).toBe(200);
    await validateResponse("/api/meeting-types", "get", response.status, response.body);
  });

  it("validates the 404 body of an unknown route", async () => {
    const response = await request(makeApp()).get("/api/unknown");

    expect(response.status).toBe(404);
    await validateResponse("/api/meeting-types", "get", response.status, response.body);
  });

  it("rejects an extra field, so sealed schemas are enforced", async () => {
    const body = {
      meetingTypes: [
        { id: "id", name: "Кофе с гостем", description: "", durationMinutes: 30, extra: true },
      ],
    };

    await expect(validateResponse("/api/meeting-types", "get", 200, body)).rejects.toThrow();
  });

  it("rejects a body that is missing a required field", async () => {
    const body = { meetingTypes: [{ name: "Кофе с гостем" }] };

    await expect(validateResponse("/api/meeting-types", "get", 200, body)).rejects.toThrow();
  });
});
