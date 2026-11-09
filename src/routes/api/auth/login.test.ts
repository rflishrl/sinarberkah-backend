import { beforeEach, describe, expect, it, vi } from "vitest";

import { readBody, sameOriginRequest } from "../../../../test/api";

const {
  mockLogin,
  mockVerifyTurnstile,
  mockConsumeRateLimit,
  mockResetRateLimit,
} = vi.hoisted(() => ({
  mockLogin: vi.fn(),
  mockVerifyTurnstile: vi.fn(),
  mockConsumeRateLimit: vi.fn(),
  mockResetRateLimit: vi.fn(),
}));

vi.mock("@/features/auth/service", () => ({
  login: mockLogin,
}));

vi.mock("@/server/turnstile", () => ({
  verifyTurnstile: mockVerifyTurnstile,
}));

vi.mock("@/lib/api/rate-limit", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/rate-limit")>()),
  consumeRateLimit: mockConsumeRateLimit,
  resetRateLimit: mockResetRateLimit,
}));

const { POST } = await import("@/routes/api/auth/login");
const { AppError } = await import("@/lib/api/errors");

const admin = {
  email: "admin@sinarberkah.com",
};

const loginRequest = (json: unknown, headers?: Record<string, string>) =>
  sameOriginRequest("/api/auth/login", {
    method: "POST",
    json,
    headers: { "x-real-ip": "1.2.3.4", ...headers },
  });

beforeEach(() => {
  mockLogin.mockReset();
  mockVerifyTurnstile
    .mockReset()
    .mockResolvedValue({ success: true, action: "login" });
  mockConsumeRateLimit.mockReset().mockResolvedValue(undefined);
  mockResetRateLimit.mockReset().mockResolvedValue(undefined);
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("POST /api/auth/login", () => {
  it("returns 200 for valid admin login and valid Turnstile verification", async () => {
    mockLogin.mockResolvedValue({ email: admin.email });
    const response = await POST(
      loginRequest({
        email: admin.email,
        password: "secret-password",
        turnstileToken: "valid-turnstile-token",
      }),
    );
    expect(response.status).toBe(200);
    expect(await readBody(response)).toEqual({
      success: true,
      data: { email: admin.email },
    });
    expect(mockVerifyTurnstile).toHaveBeenCalledWith(
      "valid-turnstile-token",
      "login",
      "1.2.3.4",
    );
    expect(mockResetRateLimit).toHaveBeenCalledWith(
      expect.anything(),
      "1.2.3.4",
    );
  });

  it("returns 422 if turnstileToken is missing in request", async () => {
    const response = await POST(
      loginRequest({
        email: admin.email,
        password: "secret-password",
      }),
    );
    expect(response.status).toBe(422);
    expect(mockVerifyTurnstile).not.toHaveBeenCalled();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("returns 422 with generic 'Verifikasi gagal.' if Turnstile validation fails", async () => {
    mockVerifyTurnstile.mockResolvedValue({
      success: false,
      reason: "verification_rejected",
    });
    const response = await POST(
      loginRequest({
        email: admin.email,
        password: "secret-password",
        turnstileToken: "bad-token",
      }),
    );
    expect(response.status).toBe(422);
    expect(await readBody(response)).toEqual({
      success: false,
      error: "Verifikasi gagal.",
    });
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("returns 401 on wrong password without resetting rate limit", async () => {
    mockLogin.mockRejectedValue(
      new AppError("UNAUTHENTICATED", "Email atau password salah."),
    );
    const response = await POST(
      loginRequest({
        email: admin.email,
        password: "wrong",
        turnstileToken: "valid-turnstile-token",
      }),
    );
    expect(response.status).toBe(401);
    expect(mockResetRateLimit).not.toHaveBeenCalled();
  });

  it("returns 429 when rate limit is exceeded", async () => {
    mockConsumeRateLimit.mockRejectedValue(
      new AppError(
        "RATE_LIMITED",
        "Terlalu banyak percobaan. Coba beberapa saat lagi.",
        { retryAfterSeconds: 600 },
      ),
    );
    const response = await POST(
      loginRequest({
        email: admin.email,
        password: "wrong",
        turnstileToken: "valid-turnstile-token",
      }),
    );
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("600");
  });

  it("blocks cross-origin request", async () => {
    const response = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: {
          origin: "https://evil.example.com",
          host: "localhost",
        },
      }),
    );
    expect(response.status).toBe(403);
  });
});
