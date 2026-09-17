import { createClient } from "@supabase/supabase-js";

// Privileged Supabase client using the service-role key — bypasses RLS, so
// this must only ever be constructed/used in server-side code (never sent to
// the browser). Session persistence/refresh is disabled since it's a
// short-lived, per-request client rather than a logged-in user session.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
