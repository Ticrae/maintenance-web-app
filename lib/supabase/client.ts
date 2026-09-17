import { createBrowserClient } from "@supabase/ssr";

// Supabase client for use in the browser (Client Components), backed by the
// public URL/anon key so it's safe to expose to the client bundle.
export function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}