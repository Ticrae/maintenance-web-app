"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isRole, roleDestinations } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SESSION_STARTED_COOKIE, LAST_ACTIVE_COOKIE } from "@/lib/supabase/proxy";

// Shape returned by the login form action for useFormState/useActionState —
// `undefined` means "no error yet" (initial state / success before redirect)
export type LoginState = { error?: string } | undefined;

// Signs the user out and clears the custom session-timeout cookies (see
// lib/supabase/proxy.ts) so a fresh sign-in starts a clean inactivity/absolute timer.
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const cookieStore = await cookies();
  cookieStore.delete(SESSION_STARTED_COOKIE);
  cookieStore.delete(LAST_ACTIVE_COOKIE);

  redirect("/login");
}

// Login form action: authenticates, looks up the user's role, and redirects
// to that role's home area. Returns an error object (rather than throwing)
// so the login form can display it inline.
export async function signIn(_: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "Enter your email and password." };

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) return { error: "Your email or password is incorrect." };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "We could not verify your sign-in. Please try again." };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const role = isRole(profile?.role) ? profile.role : null;

  if (profileError) {
    await supabase.auth.signOut();
    return { error: "We could not look up your account role. Please try again or contact an administrator." };
  }

  if (!role) {
    await supabase.auth.signOut();
    return { error: "Your account is not assigned a valid role. Contact an administrator." };
  }

  redirect(roleDestinations[role]);
}
