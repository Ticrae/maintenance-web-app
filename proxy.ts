import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Next.js middleware entry point: refreshes the Supabase auth session cookie
// on every matched request so server components always see a valid session.
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

// Run on every route except static assets/images/favicon, which don't need
// session refreshing.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
