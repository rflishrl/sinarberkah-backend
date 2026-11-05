import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "admin_session";

function isValidSessionToken(token: string, secret: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payloadB64] = parts;
  if (!payloadB64) return false;

  try {
    const raw = Buffer.from(payloadB64, "base64url").toString("utf-8");
    const payload = JSON.parse(raw);
    const now = Math.floor(Date.now() / 1000);
    return typeof payload.exp === "number" && payload.exp > now && payload.role === "admin";
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const secret =
    process.env.SESSION_SECRET ||
    "sinarberkah_session_secret_default_development_key_minimum_32_characters";
  const isAuthenticated = Boolean(token && isValidSessionToken(token, secret));

  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/admin") && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/login" && isAuthenticated) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/login"],
};
