import { createAdminClient } from "@/lib/supabase/admin";
import { HomesView, type HomeRow, type AgencyRow, type PersonRow } from "./homes-view";

export const dynamic = "force-dynamic";

const OPEN_STATUSES = ["Open", "Assigned", "In Progress", "Waiting for Parts"];

export default async function HomesAndStaffPage() {
  const admin = createAdminClient();

  const [{ data: homes }, { data: agencies }, { data: profiles }, { data: authList }, { data: openRequests }] =
    await Promise.all([
      admin.from("homes").select("id, name, address, agency_id").order("name"),
      admin.from("agencies").select("id, name").order("name"),
      admin
        .from("profiles")
        .select("id, first_name, last_name, role, agency_id, home_id"),
      admin.auth.admin.listUsers({ perPage: 1000 }),
      admin.from("requests").select("home_id").in("status", OPEN_STATUSES),
    ]);

  const emailMap = Object.fromEntries((authList?.users ?? []).map((u) => [u.id, u.email ?? "—"]));
  const agencyMap = Object.fromEntries((agencies ?? []).map((a) => [a.id, a.name]));
  const homeMap = Object.fromEntries((homes ?? []).map((h) => [h.id, h.name]));

  const openCounts: Record<string, number> = {};
  for (const r of openRequests ?? []) {
    openCounts[r.home_id] = (openCounts[r.home_id] ?? 0) + 1;
  }

  const homeRows: HomeRow[] = (homes ?? []).map((h) => ({
    id: h.id,
    name: h.name,
    address: h.address,
    agencyName: h.agency_id ? agencyMap[h.agency_id] ?? "—" : "—",
    open: openCounts[h.id] ?? 0,
  }));

  const people: PersonRow[] = (profiles ?? []).map((p) => ({
    id: p.id,
    name: [p.first_name, p.last_name].filter(Boolean).join(" ") || "Unnamed",
    email: emailMap[p.id] ?? "—",
    role: p.role,
    homeName: p.home_id ? homeMap[p.home_id] ?? "—" : "—",
    agencyName: p.agency_id ? agencyMap[p.agency_id] ?? "—" : "—",
  }));

  return (
    <HomesView
      homes={homeRows}
      agencies={(agencies ?? []) as AgencyRow[]}
      people={people}
    />
  );
}
