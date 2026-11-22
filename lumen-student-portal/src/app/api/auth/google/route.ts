import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const returnTo = searchParams.get("returnTo") || "/";
  const mode = searchParams.get("mode") || "login";

  // Read server-side GOOGLE_CLIENT_ID (with fallback to NEXT_PUBLIC_GOOGLE_CLIENT_ID if present)
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  if (!clientId) {
    console.error("[Google OAuth] GOOGLE_CLIENT_ID is not configured in server environment variables.");
    const errorUrl = new URL(returnTo.startsWith("/") ? returnTo : "/", request.url);
    errorUrl.searchParams.set("authError", "server_error");
    return NextResponse.redirect(errorUrl);
  }

  const protocol =
    request.headers.get("x-forwarded-proto") ||
    (request.url.startsWith("https") ? "https" : "http");
  const host = request.headers.get("host") || request.nextUrl.host;
  const redirectUri = `${protocol}://${host}/api/auth/callback/google`;

  const state = Buffer.from(JSON.stringify({ returnTo, mode })).toString("base64");

  const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleAuthUrl.searchParams.set("client_id", clientId);
  googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
  googleAuthUrl.searchParams.set("response_type", "code");
  googleAuthUrl.searchParams.set("scope", "openid email profile");
  googleAuthUrl.searchParams.set("access_type", "offline");
  googleAuthUrl.searchParams.set("prompt", "select_account");
  googleAuthUrl.searchParams.set("state", state);

  return NextResponse.redirect(googleAuthUrl);
}
