import { sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { fail, ok, route } from "@/lib/http";

const DB_TIMEOUT_MS = 3_000;

// Selalu dijalankan saat diminta, jangan disimpan di cache.
export const dynamic = "force-dynamic";

/** Memastikan server hidup dan database bisa dijangkau. Gagal = 503 tanpa detail error. */
export const GET = route(async () => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error("database timeout")),
      DB_TIMEOUT_MS,
    );
  });

  try {
    await Promise.race([getDb().execute(sql`select 1`), timeout]);
  } catch (error) {
    console.error("[health]", error);
    const response = fail(503, "Database tidak dapat dijangkau.");
    response.headers.set("Cache-Control", "no-store");
    return response;
  } finally {
    clearTimeout(timer);
  }

  const response = ok({ status: "ok", database: "ok" });
  response.headers.set("Cache-Control", "no-store");
  return response;
});
