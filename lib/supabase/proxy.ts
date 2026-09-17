import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isRole, roleDestinations } from "@/lib/auth";
import type { Role } from "@/lib/theme";

// Top-level route prefixes and the roles allowed to access them
const protectedRoutes: Record<string, Role[]> = {
  "/staff": ["staff"],
  "/maintenance": ["maintenance"],
  "/supervisor": ["agency_admin"],
  "/admin": ["super_admin"],
};

// Defense-in-depth session expiry, enforced on every request regardless of
// the Supabase project's own refresh-token lifetime. Idle sessions end after
// 30 minutes of no requests; every session ends outright after 12 hours.
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;
const ABSOLUTE_SESSION_TIMEOUT_MS = 12 * 60 * 60 * 1000;
export const SESSION_STARTED_COOKIE = "app-session-started";
export const LAST_ACTIVE_COOKIE = "app-last-active";
const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

// Finds the protected-route entry matching this path, if any (exact match or
// a sub-path of a protected prefix).
function destinationFor(pathname: string) {
  return Object.entries(protectedRoutes).find(([route]) =>
    pathname === route || pathname.startsWith(`${route}/`)
  );
}

// Carries over any Supabase auth cookies set on `source` onto a fresh
// redirect response, so refreshed session tokens aren't lost on redirect.
function copySessionCookies(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((cookie) => target.cookies.set(cookie));
  return target;
}

// Core middleware logic: refreshes the Supabase session, enforces the
// inactivity/absolute session timeouts, and redirects based on role-gated
// routes. Called from proxy.ts on every non-static request.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;
  const route = destinationFor(request.nextUrl.pathname);

  // Not logged in: only force a redirect if they're hitting a gated route;
  // public pages pass through untouched.
  if (!userId) {
    return route
      ? copySessionCookies(response, NextResponse.redirect(new URL("/login", request.url)))
      : response;
  }

  const now = Date.now();
  const sessionStarted = Number(request.cookies.get(SESSION_STARTED_COOKIE)?.value) || null;
  const lastActive = Number(request.cookies.get(LAST_ACTIVE_COOKIE)?.value) || null;

  // Sign out if the user has been idle too long, or the session is simply too old
  const expired =
    (lastActive !== null && now - lastActive > INACTIVITY_TIMEOUT_MS) ||
    (sessionStarted !== null && now - sessionStarted > ABSOLUTE_SESSION_TIMEOUT_MS);

  if (expired) {
    await supabase.auth.signOut();
    const signedOut = NextResponse.redirect(new URL("/login?expired=1", request.url));
    copySessionCookies(response, signedOut);
    signedOut.cookies.delete(SESSION_STARTED_COOKIE);
    signedOut.cookies.delete(LAST_ACTIVE_COOKIE);
    return signedOut;
  }

  // Session still valid: bump the last-active timestamp, and stamp the
  // session-started timestamp once, on its first request.
  response.cookies.set(LAST_ACTIVE_COOKIE, String(now), sessionCookieOptions);
  if (sessionStarted === null) {
    response.cookies.set(SESSION_STARTED_COOKIE, String(now), sessionCookieOptions);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  const role = isRole(profile?.role) ? profile.role : null;
  if (!role) {
    return copySessionCookies(response, NextResponse.redirect(new URL("/login", request.url)));
  }

  // Logged-in users hitting the login page get bounced to their home area
  if (request.nextUrl.pathname === "/login") {
    return copySessionCookies(response, NextResponse.redirect(new URL(roleDestinations[role], request.url)));
  }

  // Wrong role for this protected route: redirect to their own home area
  if (route && !route[1].includes(role)) {
    return copySessionCookies(response, NextResponse.redirect(new URL(roleDestinations[role], request.url)));
  }

  return response;
}
