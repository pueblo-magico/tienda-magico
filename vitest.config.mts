import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    include: ["tests/vitest/**/*.test.{mjs,ts,tsx}"],
    setupFiles: ["./tests/vitest/setup.ts"],
    coverage: {
      provider: "v8",
      exclude: ["scripts/**", "tests/**"],
      reporter: ["text", "html", "lcov", "json-summary"],
      reportsDirectory: "coverage/vitest",
    },
    outputFile: {
      html: ".vitest/index.html",
      json: ".vitest/results.json",
    },
  },
});
