import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isRole, roleDestinations } from "@/lib/auth";
import type { Role } from "@/lib/theme";

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

function destinationFor(pathname: string) {
  return Object.entries(protectedRoutes).find(([route]) =>
    pathname === route || pathname.startsWith(`${route}/`)
  );
}

function copySessionCookies(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((cookie) => target.cookies.set(cookie));
  return target;
}

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

  if (!userId) {
    return route
      ? copySessionCookies(response, NextResponse.redirect(new URL("/login", request.url)))
      : response;
  }

  const now = Date.now();
  const sessionStarted = Number(request.cookies.get(SESSION_STARTED_COOKIE)?.value) || null;
  const lastActive = Number(request.cookies.get(LAST_ACTIVE_COOKIE)?.value) || null;

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

  if (request.nextUrl.pathname === "/login") {
    return copySessionCookies(response, NextResponse.redirect(new URL(roleDestinations[role], request.url)));
  }

  if (route && !route[1].includes(role)) {
    return copySessionCookies(response, NextResponse.redirect(new URL(roleDestinations[role], request.url)));
  }

  return response;
}
