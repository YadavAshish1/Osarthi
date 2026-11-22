import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const stateRaw = searchParams.get("state");

  // Determine return URL from state or default to home '/'
  let returnTo = "/";
  if (stateRaw) {
    try {
      const parsed = JSON.parse(Buffer.from(stateRaw, "base64").toString("utf-8"));
      if (parsed.returnTo && typeof parsed.returnTo === "string" && parsed.returnTo.startsWith("/")) {
        returnTo = parsed.returnTo;
      }
    } catch {
      // Ignore base64 parsing error, fallback to '/'
    }
  }

  // Handle user cancelling consent or Google returning an error
  if (error || !code) {
    const errorType = error === "access_denied" ? "google_cancelled" : (error || "missing_code");
    const targetUrl = new URL(returnTo, request.url);
    targetUrl.searchParams.set("authError", errorType);
    return NextResponse.redirect(targetUrl);
  }

  // Redirect to the client page carrying the authorization code.
  // The browser itself exchanges this code with the backend via api.post('/auth/google/callback')
  // using withCredentials: true, so the Express backend sets HTTP-only cookies directly on its domain
  // in the browser (100% cookie-based, identical to email/password login, no localStorage used).
  const targetUrl = new URL(returnTo, request.url);
  targetUrl.searchParams.set("googleCode", code);
  return NextResponse.redirect(targetUrl);
}
