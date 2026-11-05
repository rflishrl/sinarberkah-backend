import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // `server-only` sengaja melempar error di luar React Server Components.
      // Di pengujian (Node biasa) diganti modul kosong.
      "server-only": fileURLToPath(
        new URL("./test/empty-module.ts", import.meta.url),
      ),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Fake env values for tests only, so getServerEnv() never reads .env.local.
    env: {
      DATABASE_URI: "postgresql://postgres:password@localhost:5432/testdb",
      SESSION_SECRET: "test-session-secret-key-at-least-32-characters-long",
      CRON_SECRET: "cron-secret-untuk-pengujian",
    },
  },
});
