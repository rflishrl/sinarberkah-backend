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
const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 jam

/**
 * Biaya scrypt untuk hash baru. Nilainya ikut disimpan di string hash, jadi bisa
 * dinaikkan kapan saja tanpa merusak hash lama. Samakan dengan scripts/hash-password.mjs.
 */
const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1 };
const KEY_LENGTH = 64;

interface ScryptParams {
  N: number;
  r: number;
  p: number;
}

function scryptAsync(
  password: BinaryLike,
  salt: BinaryLike,
  keyLength: number,
  { N, r, p }: ScryptParams,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    // maxmem dinaikkan supaya N yang lebih besar tidak ditolak Node (bawaannya 32 MB).
    scrypt(
      password,
      salt,
      keyLength,
      { N, r, p, maxmem: 256 * N * r },
      (error, key) => (error ? reject(error) : resolve(key)),
    );
  });
}

/** Perbandingan string dalam waktu tetap (tidak membocorkan panjang atau isi). */
export function safeEqual(a: string, b: string): boolean {
  const hashA = createHash("sha256").update(a).digest();
  const hashB = createHash("sha256").update(b).digest();
  return timingSafeEqual(hashA, hashB);
}

/** Membuat hash `scrypt.<N>.<r>.<p>.<salt>.<hash>`. Dipakai pengujian; admin memakai script `hash-password`. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, KEY_LENGTH, SCRYPT_PARAMS);
  const { N, r, p } = SCRYPT_PARAMS;
  return `scrypt.${N}.${r}.${p}.${salt.toString("hex")}.${hash.toString("hex")}`;
}

interface ParsedHash {
  params: ScryptParams;
  salt: Buffer;
  hash: Buffer;
}

/**
 * Membaca dua format:
 * - baru: `scrypt.<N>.<r>.<p>.<salt>.<hash>`
 * - lama: `scrypt.<salt>.<hash>` (memakai parameter bawaan Node: N=16384, r=8, p=1)
 */
export function parsePasswordHash(stored: string): ParsedHash | null {
  const parts = stored.split(".");
  if (parts[0] !== "scrypt") return null;

  let params: ScryptParams = { N: 16384, r: 8, p: 1 };
  let saltHex: string | undefined;
  let hashHex: string | undefined;

  if (parts.length === 3) {
    [, saltHex, hashHex] = parts;
  } else if (parts.length === 6) {
    const [N, r, p] = parts.slice(1, 4).map(Number);
    params = { N: N ?? 0, r: r ?? 0, p: p ?? 0 };
    [saltHex, hashHex] = parts.slice(4);
  } else {
    return null;
  }

  const { N, r, p } = params;
  const validParams =
    Number.isInteger(N) &&
    N > 1 &&
    N <= 2 ** 20 &&
    (N & (N - 1)) === 0 && // N harus pangkat 2
    Number.isInteger(r) &&
    r > 0 &&
    Number.isInteger(p) &&
    p > 0;
  const salt = Buffer.from(saltHex ?? "", "hex");
  const hash = Buffer.from(hashHex ?? "", "hex");
  if (!validParams || salt.length === 0 || hash.length === 0) return null;

  return { params, salt, hash };
}

/** Memeriksa email dan password admin. Selalu menjalankan hash agar waktunya seragam. */
export async function verifyCredentials(
  email: string,
  password: string,
): Promise<boolean> {
  const env = getEnv();
  const stored = parsePasswordHash(env.ADMIN_PASSWORD_HASH);
  const actual = await scryptAsync(
    password,
    stored?.salt ?? Buffer.alloc(16),
    stored?.hash.length ?? KEY_LENGTH,
    stored?.params ?? SCRYPT_PARAMS,
  );

  const passwordOk = stored !== null && timingSafeEqual(actual, stored.hash);
  const emailOk = safeEqual(
    email.trim().toLowerCase(),
    env.ADMIN_EMAIL.toLowerCase(),
  );
  return passwordOk && emailOk;
}

/**
 * Token sesi berisi `ver` (SESSION_VERSION). Token dengan versi lain ditolak, jadi
 * mengganti SESSION_VERSION mencabut semua sesi tanpa perlu mengganti AUTH_SECRET.
 */
export async function createSessionToken(email: string): Promise<string> {
  const env = getEnv();
  const key = new TextEncoder().encode(env.AUTH_SECRET);
  return new SignJWT({ role: "admin", ver: env.SESSION_VERSION })
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
  const env = getEnv();
  const key = new TextEncoder().encode(env.AUTH_SECRET);
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
    return typeof payload.sub === "string" &&
      payload.role === "admin" &&
      payload.ver === env.SESSION_VERSION
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
