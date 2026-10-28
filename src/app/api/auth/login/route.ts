import {
  createSessionToken,
  setSessionCookie,
  verifyCredentials,
} from "@/lib/auth";
import { getClientIp, HttpError, ok, readJson, route } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { loginInput } from "@/lib/validation";

const MAX_ATTEMPTS = 8;
const WINDOW_MS = 10 * 60 * 1000;

export const POST = route(async (request: Request) => {
  const limit = rateLimit(
    `login:${getClientIp(request)}`,
    MAX_ATTEMPTS,
    WINDOW_MS,
  );
  if (!limit.allowed) {
    throw new HttpError(
      429,
      `Terlalu banyak percobaan. Coba lagi dalam ${Math.ceil(limit.retryAfterSeconds / 60)} menit.`,
    );
  }

  const { email, password } = loginInput.parse(await readJson(request));
  const valid = await verifyCredentials(email, password);
  if (!valid) throw new HttpError(401, "Email atau password salah.");

  await setSessionCookie(await createSessionToken(email.trim().toLowerCase()));
  return ok({ email });
});
