import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Web unit + component tests. The core/agent/ai suites run under node:test.
    include: ["src/**/*.test.{ts,tsx}"],
    environment: "jsdom",
    globals: true,
    setupFiles: ["src/test-setup.ts"],
  },
});
