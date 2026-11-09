import "server-only";

import { type NeonQueryFunction, neon } from "@neondatabase/serverless";

import { env } from "@/lib/env";

let cachedSql: NeonQueryFunction<false, false> | null = null;

export function getDb(): NeonQueryFunction<false, false> {
  if (!cachedSql) {
    const connectionString = env.DATABASE_URI;
    cachedSql = neon(connectionString);
  }
  return cachedSql;
}
