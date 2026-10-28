import { defineConfig } from "drizzle-kit";

// drizzle-kit tidak membaca .env.local otomatis, jadi dimuat di sini (Node 20.12+).
for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(file);
  } catch {
    // file tidak ada: abaikan
  }
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    // Untuk migrasi, alamat tanpa pooler (Neon: DATABASE_URL_UNPOOLED) paling aman.
    url:
      process.env.DATABASE_URL_UNPOOLED ??
      process.env.DATABASE_URL ??
      process.env.POSTGRES_URL ??
      "",
  },
});
