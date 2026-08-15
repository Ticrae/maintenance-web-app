import { createClient } from "@/lib/supabase/server";
import { getHomes } from "@/app/actions/homes";
import { NewRequestForm } from "./new-request-form";

const FALLBACK_CATEGORIES = [
  "Plumbing",
  "Electrical",
  "HVAC",
  "Appliance",
  "Structural",
  "Other",
];

export default async function NewRequestPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id, home_id")
    .eq("id", user!.id)
    .maybeSingle<{ agency_id: string | null; home_id: string | null }>();

  const { data: settings } = await supabase
    .from("app_settings")
    .select("categories")
    .eq("id", true)
    .maybeSingle<{ categories: string[] }>();

  const allHomes = await getHomes();
  const homes = allHomes
    .filter((h) => h.agency_id === profile?.agency_id)
    .map((h) => ({ id: h.id, name: h.name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <NewRequestForm
      categories={settings?.categories ?? FALLBACK_CATEGORIES}
      homes={homes}
      defaultHomeId={profile?.home_id ?? ""}
    />
  );
}
