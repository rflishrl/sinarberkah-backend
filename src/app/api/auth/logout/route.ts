import { clearSessionCookie } from "@/lib/auth";
import { assertSameOrigin, ok, route } from "@/lib/http";

export const POST = route(async (request: Request) => {
  // Mencegah situs lain mengeluarkan admin tanpa sepengetahuannya.
  assertSameOrigin(request);
  await clearSessionCookie();
  return ok({ loggedOut: true });
});
