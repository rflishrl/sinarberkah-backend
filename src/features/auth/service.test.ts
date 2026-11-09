import { beforeEach, describe, expect, it, vi } from "vitest";

const findUserByEmail = vi.fn();
const setSessionCookie = vi.fn();
const clearSessionCookie = vi.fn();

vi.mock("@/features/auth/repository", () => ({
  findUserByEmail: (...args: unknown[]) => findUserByEmail(...args),
}));

vi.mock("@/lib/auth/session", () => ({
  setSessionCookie: (...args: unknown[]) => setSessionCookie(...args),
  clearSessionCookie: (...args: unknown[]) => clearSessionCookie(...args),
}));

import { hashPassword } from "@/lib/auth/password";

const { login, logout } = await import("@/features/auth/service");

const adminPassword = "secret-password";
const validToken = "sample-turnstile-token";
const admin = {
  id: "a1",
  email: "admin@sinarberkah.com",
  password_hash: hashPassword(adminPassword),
  role: "admin",
};

const user = {
  id: "u1",
  email: "user@sinarberkah.com",
  password_hash: hashPassword(adminPassword),
  role: "user",
};

beforeEach(() => {
  findUserByEmail.mockReset();
  setSessionCookie.mockReset();
  clearSessionCookie.mockReset();
});

describe("login: validation", () => {
  it("rejects invalid email format", async () => {
    await expect(
      login({
        email: "not-an-email",
        password: "x",
        turnstileToken: validToken,
      }),
    ).rejects.toMatchObject({
      name: "ZodError",
    });
    expect(findUserByEmail).not.toHaveBeenCalled();
  });

  it("rejects empty password", async () => {
    await expect(
      login({
        email: "admin@sinarberkah.com",
        password: "",
        turnstileToken: validToken,
      }),
    ).rejects.toMatchObject({
      name: "ZodError",
    });
  });

  it("rejects missing turnstileToken", async () => {
    await expect(
      login({
        email: "admin@sinarberkah.com",
        password: adminPassword,
        turnstileToken: "",
      }),
    ).rejects.toMatchObject({
      name: "ZodError",
    });
  });

  it("normalizes email whitespace and casing", async () => {
    findUserByEmail.mockResolvedValue(admin);
    await login({
      email: "  Admin@SinarBerkah.COM ",
      password: adminPassword,
      turnstileToken: validToken,
    });
    expect(findUserByEmail).toHaveBeenCalledWith("admin@sinarberkah.com");
  });
});

describe("login: authorization", () => {
  it("succeeds with valid admin credentials and sets session cookie", async () => {
    findUserByEmail.mockResolvedValue(admin);
    await expect(
      login({
        email: admin.email,
        password: adminPassword,
        turnstileToken: validToken,
      }),
    ).resolves.toEqual({
      email: admin.email,
    });
    expect(setSessionCookie).toHaveBeenCalledWith({
      id: admin.id,
      email: admin.email,
      role: "admin",
    });
  });

  it("rejects invalid password with UNAUTHENTICATED error", async () => {
    findUserByEmail.mockResolvedValue(admin);
    await expect(
      login({
        email: admin.email,
        password: "wrong-password",
        turnstileToken: validToken,
      }),
    ).rejects.toMatchObject({
      code: "UNAUTHENTICATED",
      message: "Email atau password salah.",
    });
    expect(setSessionCookie).not.toHaveBeenCalled();
  });

  it("rejects non-admin role with FORBIDDEN error", async () => {
    findUserByEmail.mockResolvedValue(user);
    await expect(
      login({
        email: user.email,
        password: adminPassword,
        turnstileToken: validToken,
      }),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "Akun ini tidak punya akses admin.",
    });
    expect(setSessionCookie).not.toHaveBeenCalled();
  });
});

describe("logout", () => {
  it("clears session cookie and returns loggedOut", async () => {
    clearSessionCookie.mockResolvedValue(undefined);
    await expect(logout()).resolves.toEqual({ loggedOut: true });
    expect(clearSessionCookie).toHaveBeenCalled();
  });
});
