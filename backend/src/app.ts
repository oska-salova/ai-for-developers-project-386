import cors from "cors";
import express from "express";

const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:3000";

export const app = express();

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
