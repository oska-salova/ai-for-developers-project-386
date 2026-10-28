import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "./app.js";

describe("GET /health", () => {
  it("reports the service as healthy", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });

  it("allows the frontend origin", async () => {
    const response = await request(app).get("/health").set("Origin", "http://localhost:3000");

    expect(response.headers["access-control-allow-origin"]).toBe("http://localhost:3000");
  });

  it("does not allow an unknown origin", async () => {
    const response = await request(app).get("/health").set("Origin", "http://example.invalid");

    expect(response.headers["access-control-allow-origin"]).toBeUndefined();
  });
});
