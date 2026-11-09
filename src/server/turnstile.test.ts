import { beforeEach, describe, expect, it, vi } from "vitest";

import { verifyTurnstile } from "./turnstile";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("TURNSTILE_SECRET_KEY", "1x0000000000000000000000000000000AA");
  vi.stubEnv("TURNSTILE_ALLOWED_HOSTNAMES", "localhost,127.0.0.1,example.com");
  fetchMock.mockReset();
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("verifyTurnstile: fail-closed input checks", () => {
  it("rejects undefined or null token", async () => {
    const res = await verifyTurnstile(undefined, "login");
    expect(res.success).toBe(false);
    expect(res.reason).toBe("empty_token");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects empty or whitespace-only token", async () => {
    const res = await verifyTurnstile("   ", "login");
    expect(res.success).toBe(false);
    expect(res.reason).toBe("empty_token");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects when TURNSTILE_SECRET_KEY is missing", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "");
    const res = await verifyTurnstile("token123", "login");
    expect(res.success).toBe(false);
    expect(res.reason).toBe("missing_secret_key");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects when TURNSTILE_ALLOWED_HOSTNAMES is missing", async () => {
    vi.stubEnv("TURNSTILE_ALLOWED_HOSTNAMES", "");
    const res = await verifyTurnstile("token123", "login");
    expect(res.success).toBe(false);
    expect(res.reason).toBe("missing_allowed_hostnames");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("verifyTurnstile: Cloudflare siteverify validation", () => {
  it("succeeds when token, action, and hostname match", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          action: "login",
          hostname: "localhost",
          challenge_ts: "2026-11-10T00:00:00Z",
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    const res = await verifyTurnstile("valid-token", "login", "1.2.3.4");
    expect(res.success).toBe(true);
    expect(res.action).toBe("login");
    expect(res.hostname).toBe("localhost");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    );
    expect(init.method).toBe("POST");
    expect(init.body?.toString()).toContain("remoteip=1.2.3.4");
    expect(init.body?.toString()).toContain("response=valid-token");
  });

  it("rejects invalid token from Cloudflare response", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          success: false,
          "error-codes": ["invalid-input-response"],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    const res = await verifyTurnstile("invalid-token", "login");
    expect(res.success).toBe(false);
    expect(res.reason).toBe("verification_rejected");
    expect(res.errorCodes).toEqual(["invalid-input-response"]);
  });

  it("rejects action mismatch", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          action: "register",
          hostname: "localhost",
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    const res = await verifyTurnstile("token-from-register", "login");
    expect(res.success).toBe(false);
    expect(res.reason).toBe("action_mismatch");
  });

  it("rejects hostname mismatch", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          action: "login",
          hostname: "attacker.com",
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    const res = await verifyTurnstile("token-from-attacker-domain", "login");
    expect(res.success).toBe(false);
    expect(res.reason).toBe("hostname_mismatch");
  });

  it("rejects when token is already spent", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          success: false,
          "error-codes": ["already-spent"],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    const res = await verifyTurnstile("reused-token", "login");
    expect(res.success).toBe(false);
    expect(res.reason).toBe("verification_rejected");
    expect(res.errorCodes).toContain("already-spent");
  });

  it("rejects on network error or timeout (fail-closed)", async () => {
    fetchMock.mockRejectedValue(new Error("Timeout waiting for siteverify"));

    const res = await verifyTurnstile("any-token", "login");
    expect(res.success).toBe(false);
    expect(res.reason).toBe("timeout_or_network_error");
  });

  it("rejects on HTTP error status from Cloudflare (fail-closed)", async () => {
    fetchMock.mockResolvedValue(
      new Response("Internal Server Error", { status: 500 }),
    );

    const res = await verifyTurnstile("any-token", "login");
    expect(res.success).toBe(false);
    expect(res.reason).toBe("http_error");
  });
});
