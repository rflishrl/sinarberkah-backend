import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

import { env } from "@/lib/env";
import type { AuthenticatedActor } from "./actor";

export const SESSION_COOKIE_NAME = "admin_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

interface SessionPayload {
  sub: string;
  email: string;
  role: AuthenticatedActor["role"];
  iat: number;
  exp: number;
}

function getSecretKey(): string {
  return env.SESSION_SECRET;
}

export function signSessionToken(actor: AuthenticatedActor): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    sub: actor.id,
    email: actor.email,
    role: actor.role,
    iat: now,
    exp: now + SESSION_MAX_AGE_SECONDS,
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", getSecretKey())
    .update(payloadB64)
    .digest("base64url");

  return `${payloadB64}.${signature}`;
}

export function verifySessionToken(token: string): AuthenticatedActor | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, signature] = parts;
  if (!payloadB64 || !signature) return null;

  const expectedSig = createHmac("sha256", getSecretKey())
    .update(payloadB64)
    .digest("base64url");

  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSig);

  if (sigBuffer.length !== expectedBuffer.length) return null;
  if (!timingSafeEqual(sigBuffer, expectedBuffer)) return null;

  try {
    const raw = Buffer.from(payloadB64, "base64url").toString("utf-8");
    const payload = JSON.parse(raw) as SessionPayload;
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) return null;
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

export async function getCurrentAdmin(): Promise<AuthenticatedActor | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function setAdminSessionCookie(actor: AuthenticatedActor): Promise<void> {
  const token = signSessionToken(actor);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearAdminSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export const setSessionCookie = setAdminSessionCookie;
export const clearSessionCookie = clearAdminSessionCookie;
