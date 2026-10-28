import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// Cookie palsu pengganti `cookies()` dari next/headers.
const jar = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      jar.has(name) ? { name, value: jar.get(name) } : undefined,
    set: (name: string, value: string) => jar.set(name, value),
    delete: (name: string) => jar.delete(name),
  }),
}));

const PASSWORD = "rahasia123";

async function loadAuth() {
  // getEnv() menyimpan env di cache modul, jadi modul dimuat ulang setelah env diubah.
  vi.resetModules();
  return import("@/lib/auth");
}

beforeAll(async () => {
  const { hashPassword } = await loadAuth();
  process.env.ADMIN_PASSWORD_HASH = await hashPassword(PASSWORD);
});

beforeEach(() => {
  jar.clear();
  process.env.SESSION_VERSION = "1";
});

describe("verifyCredentials", () => {
  it("menerima email dan password yang benar (email tidak peka huruf besar)", async () => {
    const { verifyCredentials } = await loadAuth();
    await expect(
      verifyCredentials(" Admin@SinarBerkah.com ", PASSWORD),
    ).resolves.toBe(true);
  });

  it("menolak password atau email yang salah", async () => {
    const { verifyCredentials } = await loadAuth();
    await expect(
      verifyCredentials("admin@sinarberkah.com", "salah"),
    ).resolves.toBe(false);
    await expect(
      verifyCredentials("lain@sinarberkah.com", PASSWORD),
    ).resolves.toBe(false);
  });
});

describe("sesi", () => {
  it("token yang dibuat dikenali kembali", async () => {
    const { createSessionToken, getSession, setSessionCookie } =
      await loadAuth();
    await setSessionCookie(await createSessionToken("admin@sinarberkah.com"));
    await expect(getSession()).resolves.toEqual({
      email: "admin@sinarberkah.com",
    });
  });

  it("tanpa cookie atau dengan token rusak, tidak ada sesi", async () => {
    const { getSession, SESSION_COOKIE } = await loadAuth();
    await expect(getSession()).resolves.toBeNull();
    jar.set(SESSION_COOKIE, "bukan.token.sah");
    await expect(getSession()).resolves.toBeNull();
  });

  it("mengganti SESSION_VERSION mencabut sesi lama", async () => {
    const first = await loadAuth();
    await first.setSessionCookie(
      await first.createSessionToken("admin@sinarberkah.com"),
    );

    process.env.SESSION_VERSION = "2";
    const second = await loadAuth();
    await expect(second.getSession()).resolves.toBeNull();
  });
});
