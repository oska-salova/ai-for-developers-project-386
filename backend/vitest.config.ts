import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      // Not unit-tested: generated types drift-check in `contract:check`, and
      // the entry points bind a port that the e2e run exercises.
      exclude: ["src/**/*.test.ts", "src/generated/**", "src/index.ts", "src/dev-seeded.ts"],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 60,
        statements: 60,
      },
    },
  },
});
