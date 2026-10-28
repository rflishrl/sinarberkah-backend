import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Nilai env palsu khusus pengujian, supaya getEnv() tidak membaca .env.local.
    env: {
      DATABASE_URL: "postgres://test:test@localhost:5432/test",
      AUTH_SECRET: "test-secret-yang-panjangnya-lebih-dari-32-karakter",
      ADMIN_EMAIL: "admin@sinarberkah.com",
      // Hash asli dibuat di auth.test.ts lewat hashPassword(); ini hanya pengisi.
      ADMIN_PASSWORD_HASH: "scrypt.placeholder",
      SESSION_VERSION: "1",
      CRON_SECRET: "cron-secret-untuk-pengujian",
    },
  },
});
