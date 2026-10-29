import { beforeEach, describe, expect, it, vi } from "vitest";

const execute = vi.fn();
vi.mock("@/lib/db", () => ({ getDb: () => ({ execute }) }));

const { GET } = await import("@/app/api/health/route");

beforeEach(() => {
  execute.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("GET /api/health", () => {
  it("200 jika database menjawab", async () => {
    execute.mockResolvedValue([{ "?column?": 1 }]);
    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      data: { status: "ok", database: "ok" },
    });
  });

  it("503 tanpa detail error jika database gagal", async () => {
    execute.mockRejectedValue(new Error("password authentication failed"));
    const response = await GET();
    expect(response.status).toBe(503);
    const body = JSON.stringify(await response.json());
    expect(body).not.toContain("password");
  });
});
