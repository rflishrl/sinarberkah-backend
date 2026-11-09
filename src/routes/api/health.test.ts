import { beforeEach, describe, expect, it, vi } from "vitest";

import { readBody, sameOriginRequest } from "../../../test/api";

const pingDatabase = vi.fn();

vi.mock("@/features/health/repository", () => ({
  pingDatabase: (...args: unknown[]) => pingDatabase(...args),
}));
vi.mock("@/lib/api/rate-limit", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/rate-limit")>()),
  consumeRateLimit: async () => undefined,
}));

const { GET } = await import("@/routes/api/health");
const { checkHealth } = await import("@/features/health/service");

beforeEach(() => {
  pingDatabase.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("checkHealth (service)", () => {
  it("ok jika database menjawab", async () => {
    pingDatabase.mockResolvedValue(undefined);
    await expect(checkHealth()).resolves.toEqual({
      status: "ok",
      database: "ok",
    });
  });

  it("melempar UNAVAILABLE jika database gagal", async () => {
    pingDatabase.mockRejectedValue(new Error("timeout"));
    await expect(checkHealth()).rejects.toMatchObject({
      code: "UNAVAILABLE",
    });
  });
});

describe("GET /api/health", () => {
  it("200 dan tidak di-cache jika database menjawab", async () => {
    pingDatabase.mockResolvedValue(undefined);
    const response = await GET(sameOriginRequest("/api/health"));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(await readBody(response)).toEqual({
      success: true,
      data: { status: "ok", database: "ok" },
    });
  });

  it("503 jika database gagal", async () => {
    pingDatabase.mockRejectedValue(new Error("down"));
    const response = await GET(sameOriginRequest("/api/health"));
    expect(response.status).toBe(503);
    expect(await readBody(response)).toEqual({
      success: false,
      error: "Database tidak dapat dijangkau.",
    });
  });
});
