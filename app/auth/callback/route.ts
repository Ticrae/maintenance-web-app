import { NextResponse, type NextRequest } from "next/server";
import { isRole, roleDestinations } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data: profile } = user
        ? await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .maybeSingle()
        : { data: null };

      const role = isRole(profile?.role) ? profile.role : null;
      if (role) {
        return NextResponse.redirect(new URL(roleDestinations[role], origin));
      }

      await supabase.auth.signOut();
      return NextResponse.redirect(new URL("/login?error=no_access", origin));
    }
  }

  return NextResponse.redirect(new URL("/login?error=oauth", origin));
}
