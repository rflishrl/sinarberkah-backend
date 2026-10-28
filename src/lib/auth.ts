import { jwtVerify, SignJWT } from "jose";
import {
  createHash,
  randomBytes,
  scrypt,
  timingSafeEqual,
  type BinaryLike,
} from "node:crypto";
import { cookies } from "next/headers";

import { getEnv } from "@/lib/env";

export const SESSION_COOKIE = "sb_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 hari

function scryptAsync(
  password: BinaryLike,
  salt: BinaryLike,
  keyLength: number,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keyLength, (error, key) =>
      error ? reject(error) : resolve(key),
    );
  });
}

/** Perbandingan string dalam waktu tetap (tidak membocorkan panjang atau isi). */
function safeEqual(a: string, b: string): boolean {
  const hashA = createHash("sha256").update(a).digest();
  const hashB = createHash("sha256").update(b).digest();
  return timingSafeEqual(hashA, hashB);
}

/** Membuat hash `scrypt.<salt>.<hash>`. Dipakai script `hash-password` dan pengujian. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, 64);
  return `scrypt.${salt.toString("hex")}.${hash.toString("hex")}`;
}

/** Memeriksa email dan password admin. Selalu menjalankan hash agar waktunya seragam. */
export async function verifyCredentials(
  email: string,
  password: string,
): Promise<boolean> {
  const env = getEnv();
  const [, saltHex = "", hashHex = ""] = env.ADMIN_PASSWORD_HASH.split(".");
  const expected = Buffer.from(hashHex, "hex");
  const actual = await scryptAsync(
    password,
    Buffer.from(saltHex, "hex"),
    expected.length || 64,
  );

  const passwordOk = expected.length > 0 && timingSafeEqual(actual, expected);
  const emailOk = safeEqual(
    email.trim().toLowerCase(),
    env.ADMIN_EMAIL.toLowerCase(),
  );
  return passwordOk && emailOk;
}

export async function createSessionToken(email: string): Promise<string> {
  const key = new TextEncoder().encode(getEnv().AUTH_SECRET);
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(email)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(key);
}

export interface Session {
  email: string;
}

/** Mengembalikan sesi admin yang sah, atau `null` jika belum login / sesi tidak valid. */
export async function getSession(): Promise<Session | null> {
  const key = new TextEncoder().encode(getEnv().AUTH_SECRET);
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
    return typeof payload.sub === "string" && payload.role === "admin"
      ? { email: payload.sub }
      : null;
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}
