import "@/lib/server-only";

import { log } from "@/lib/log";

export interface TurnstileVerificationResponse {
  success: boolean;
  "error-codes"?: string[];
  challenge_ts?: string;
  hostname?: string;
  action?: string;
  cdata?: string;
}

export interface TurnstileVerifyResult {
  success: boolean;
  reason?: string;
  hostname?: string;
  action?: string;
  errorCodes?: string[];
}

const CLOUDFLARE_SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const TIMEOUT_MS = 5000;

function getAllowedHostnames(): Set<string> {
  const raw = process.env.TURNSTILE_ALLOWED_HOSTNAMES ?? "";
  return new Set(
    raw
      .split(",")
      .map((h) => h.trim().toLowerCase())
      .filter(Boolean),
  );
}

/**
 * Validates a Cloudflare Turnstile token against the siteverify API.
 * Fail-closed: returns success=false if token is empty, secret is missing,
 * network times out, action does not match, or hostname is not allowed.
 */
export async function verifyTurnstile(
  token: unknown,
  expectedAction: string,
  clientIp?: string,
): Promise<TurnstileVerifyResult> {
  if (typeof token !== "string" || !token.trim()) {
    return { success: false, reason: "empty_token" };
  }

  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) {
    log(
      "error",
      "TURNSTILE_SECRET_KEY belum dikonfigurasi di lingkungan server.",
    );
    return { success: false, reason: "missing_secret_key" };
  }

  const allowedHostnames = getAllowedHostnames();
  if (allowedHostnames.size === 0) {
    log(
      "error",
      "TURNSTILE_ALLOWED_HOSTNAMES belum dikonfigurasi di lingkungan server.",
    );
    return { success: false, reason: "missing_allowed_hostnames" };
  }

  const form = new URLSearchParams();
  form.append("secret", secretKey);
  form.append("response", token.trim());
  if (clientIp && clientIp !== "unknown") {
    form.append("remoteip", clientIp);
  }

  try {
    const res = await fetch(CLOUDFLARE_SITEVERIFY_URL, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!res.ok) {
      log("warn", "Cloudflare Turnstile siteverify HTTP error", {
        status: res.status,
      });
      return { success: false, reason: "http_error" };
    }

    const data = (await res.json()) as TurnstileVerificationResponse;

    if (!data.success) {
      log("warn", "Cloudflare Turnstile verification rejected", {
        errorCodes: data["error-codes"],
      });
      return {
        success: false,
        reason: "verification_rejected",
        errorCodes: data["error-codes"],
      };
    }

    // Action check
    if (expectedAction && data.action && data.action !== expectedAction) {
      log("warn", "Cloudflare Turnstile action mismatch", {
        expected: expectedAction,
        received: data.action,
      });
      return { success: false, reason: "action_mismatch" };
    }

    // Hostname check
    if (data.hostname && !allowedHostnames.has(data.hostname.toLowerCase())) {
      log("warn", "Cloudflare Turnstile hostname mismatch", {
        hostname: data.hostname,
        allowed: Array.from(allowedHostnames),
      });
      return { success: false, reason: "hostname_mismatch" };
    }

    return {
      success: true,
      hostname: data.hostname,
      action: data.action,
    };
  } catch (error) {
    log(
      "error",
      "Cloudflare Turnstile siteverify request failed or timed out",
      {
        error,
      },
    );
    return { success: false, reason: "timeout_or_network_error" };
  }
}
