import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "@/db/schema";
import { getEnv } from "@/lib/env";

type Database = PostgresJsDatabase<typeof schema>;

interface DbCache {
  db?: Database;
}

// Dipakai ulang antar hot reload (dev) dan antar invokasi (serverless), supaya
// koneksi tidak menumpuk.
const cache = ((globalThis as { __sbDb?: DbCache }).__sbDb ??= {});

/** Mengembalikan koneksi database; dibuat saat pertama dipakai (bukan saat build). */
export function getDb(): Database {
  if (cache.db) return cache.db;

  const client = postgres(getEnv().DATABASE_URL, {
    max: process.env.NODE_ENV === "production" ? 1 : 5,
    idle_timeout: 20,
    connect_timeout: 10,
    // Wajib mati agar kompatibel dengan pooler (PgBouncer / Neon / Supabase).
    prepare: false,
  });

  cache.db = drizzle(client, { schema });
  return cache.db;
}
