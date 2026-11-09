import { beforeEach, describe, expect, it, vi } from "vitest";

import { readBody, sameOriginRequest } from "../../../../../test/api";

const getCurrentAdmin = vi.fn();
const fetchMock = vi.fn();

vi.mock("@/lib/auth/session", () => ({
  getCurrentAdmin: (...args: unknown[]) => getCurrentAdmin(...args),
}));

const { POST } = await import("@/routes/api/admin/revalidate/test");

const ADMIN = {
  id: "a1",
  email: "admin@sinarberkah.com",
  role: "admin" as const,
};
const call = (headers?: Record<string, string>) =>
  POST(
    sameOriginRequest("/api/admin/revalidate/test", {
      method: "POST",
      headers,
    }),
  );

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("FRONTEND_URL", "https://plato.example.com");
  vi.stubEnv("REVALIDATE_SECRET", "rahasia-uji-123");
  getCurrentAdmin.mockReset().mockResolvedValue(ADMIN);
  fetchMock.mockReset();
});

describe("POST /api/admin/revalidate/test", () => {
  it("401 tanpa login, plato tidak dipanggil", async () => {
    getCurrentAdmin.mockResolvedValue(null);
    expect((await call()).status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("403 dari situs lain", async () => {
    expect((await call({ origin: "https://jahat.example" })).status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("200 untuk admin, dengan hasil uji di dalam data", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ revalidated: ["products"] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const response = await call();
    expect(response.status).toBe(200);
    const body = await readBody(response);
    expect(body).toMatchObject({
      success: true,
      data: {
        state: "ok",
        message: expect.stringContaining("Berhasil"),
      },
    });
  });
});
