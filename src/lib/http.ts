import { NextResponse } from "next/server";
import { z } from "zod";

import { getSession } from "@/lib/auth";
import { ConfigError, getAllowedOrigins } from "@/lib/env";

/** Error yang aman ditampilkan ke pemanggil API. */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function ok<T>(data: T, init?: ResponseInit & { meta?: unknown }) {
  const { meta, ...responseInit } = init ?? {};
  return NextResponse.json(meta ? { data, meta } : { data }, responseInit);
}

export function fail(status: number, message: string, details?: unknown) {
  return NextResponse.json(
    { error: { message, ...(details ? { details } : {}) } },
    { status },
  );
}

function toErrorResponse(error: unknown): Response {
  if (error instanceof HttpError) {
    return fail(error.status, error.message, error.details);
  }
  if (error instanceof z.ZodError) {
    return fail(422, "Data yang dikirim tidak valid.", z.flattenError(error));
  }
  if (error instanceof ConfigError) {
    console.error("[config]", error.message);
    return fail(500, "Server belum dikonfigurasi dengan benar.");
  }

  console.error("[api]", error);
  return fail(500, "Terjadi kesalahan pada server.");
}

/** Membungkus handler agar semua error menjadi respons JSON yang rapi. */
export function route<Args extends unknown[]>(
  handler: (...args: Args) => Promise<Response>,
) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (error) {
      return toErrorResponse(error);
    }
  };
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/** Menolak permintaan ubah-data yang berasal dari situs lain (perlindungan CSRF). */
function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  let originHost: string | null = null;
  try {
    originHost = origin ? new URL(origin).host : null;
  } catch {
    originHost = null;
  }
  if (!originHost || originHost !== host) {
    throw new HttpError(403, "Asal permintaan tidak diizinkan.");
  }
}

/** Memastikan pemanggil sudah login sebagai admin. Untuk metode ubah-data juga cek asal. */
export async function requireAdmin(request: Request) {
  const session = await getSession();
  if (!session) throw new HttpError(401, "Anda harus login sebagai admin.");
  if (!SAFE_METHODS.has(request.method)) assertSameOrigin(request);
  return session;
}

/** Membaca body JSON; melempar 400 jika bukan JSON yang valid. */
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new HttpError(400, "Body harus berupa JSON yang valid.");
  }
}

/** Menambahkan header CORS untuk origin frontend yang diizinkan, plus cache singkat. */
export function publicGet(request: Request, response: Response): Response {
  const origin = request.headers.get("origin");
  if (origin && getAllowedOrigins().includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.append("Vary", "Origin");
  }
  response.headers.set(
    "Cache-Control",
    "public, s-maxage=30, stale-while-revalidate=300",
  );
  return response;
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  );
}
