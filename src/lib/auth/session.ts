import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import {
  deleteCookie,
  getCookie,
  setCookie,
} from "@tanstack/react-start/server";

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

export function parseSessionTokenFromRequest(
  request: Request,
): string | undefined {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(
    new RegExp(`(?:^|;\\s*)${SESSION_COOKIE_NAME}=([^;]*)`),
  );
  return match?.[1] ? decodeURIComponent(match[1]) : undefined;
}

export async function getCurrentAdmin(
  request?: Request,
): Promise<AuthenticatedActor | null> {
  let token: string | undefined;
  if (request) {
    token = parseSessionTokenFromRequest(request);
  } else {
    try {
      token = getCookie(SESSION_COOKIE_NAME);
    } catch {
      token = undefined;
    }
  }
  if (!token) return null;
  return verifySessionToken(token);
}

export function buildSessionCookieHeader(actor: AuthenticatedActor): string {
  const token = signSessionToken(actor);
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE_NAME}=${token}; Path=/; Max-Age=${SESSION_MAX_AGE_SECONDS}; HttpOnly; SameSite=Lax${secure}`;
}

export function buildClearSessionCookieHeader(): string {
  return `${SESSION_COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`;
}

export async function setAdminSessionCookie(
  actor: AuthenticatedActor,
): Promise<void> {
  const token = signSessionToken(actor);
  try {
    setCookie(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
  } catch {
    // If invoked outside Start request context (e.g., standard API Route Response)
  }
}

export async function clearAdminSessionCookie(): Promise<void> {
  try {
    deleteCookie(SESSION_COOKIE_NAME);
  } catch {
    // If invoked outside Start request context
  }
}

export const setSessionCookie = setAdminSessionCookie;
export const clearSessionCookie = clearAdminSessionCookie;
