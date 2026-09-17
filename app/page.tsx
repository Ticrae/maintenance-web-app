import { redirect } from "next/navigation";

// Bare "/" has nothing of its own to show — the middleware (lib/supabase/
// proxy.ts) sends logged-in users to their role's home area before this
// even runs, so this only fires for signed-out visitors.
export default function RootPage() {
  redirect("/login");
}
