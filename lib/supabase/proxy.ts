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
