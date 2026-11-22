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

  try {
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      "http://localhost:5000";

    // Reconstruct the exact redirect_uri that was registered and sent to Google
    const protocol = request.headers.get("x-forwarded-proto") || (request.url.startsWith("https") ? "https" : "http");
    const host = request.headers.get("host") || request.nextUrl.host;
    const redirectUri = `${protocol}://${host}/api/auth/callback/google`;

    const backendRes = await fetch(`${backendUrl}/api/auth/google/callback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-auth-portal": "student",
      },
      body: JSON.stringify({ code, redirectUri }),
    });

    if (!backendRes.ok) {
      const errJson = await backendRes.json().catch(() => ({}));
      const msg = encodeURIComponent(errJson.message || "Google authentication failed");
      const targetUrl = new URL(returnTo, request.url);
      targetUrl.searchParams.set("authError", msg);
      return NextResponse.redirect(targetUrl);
    }

    const data = await backendRes.json();
    const targetUrl = new URL(returnTo, request.url);
    targetUrl.searchParams.set("authSuccess", "google");

    const response = NextResponse.redirect(targetUrl);

    // Forward Set-Cookie headers from Express backend to browser response
    const setCookieHeaders = backendRes.headers.getSetCookie?.() || [];
    if (setCookieHeaders.length > 0) {
      setCookieHeaders.forEach((cookieStr) => {
        response.headers.append("Set-Cookie", cookieStr);
      });
    } else {
      const singleCookie = backendRes.headers.get("set-cookie");
      if (singleCookie) {
        response.headers.set("Set-Cookie", singleCookie);
      }
    }

    return response;
  } catch (err: any) {
    console.error("[Google OAuth Callback Route Error]", err);
    const targetUrl = new URL(returnTo, request.url);
    targetUrl.searchParams.set("authError", "server_error");
    return NextResponse.redirect(targetUrl);
  }
}
