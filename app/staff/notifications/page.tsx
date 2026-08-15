import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getHomes } from "@/app/actions/homes";
import { NotificationsList, type NotifItem } from "./notifications-list";

function dayLabel(date: Date) {
  const today = new Date();
  const yesterday = new Date(today.getTime() - 86400_000);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function firstLine(text: string) {
  return text.split("\n")[0];
}

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("home_id")
    .eq("id", user!.id)
    .maybeSingle<{ home_id: string | null }>();

  const homeId = profile?.home_id ?? null;
  const homes = await getHomes();
  const home = homes.find((h) => h.id === homeId);

  const admin = createAdminClient();

  const { data: requests } = homeId
    ? await admin
        .from("requests")
        .select("id, description, priority, status, created_at, updated_at")
        .eq("home_id", homeId)
        .order("updated_at", { ascending: false })
        .limit(50)
    : { data: [] };

  const rows = requests ?? [];
  const ids = rows.map((r) => r.id);

  const { data: comments } = ids.length
    ? await admin
        .from("request_comments")
        .select("id, request_id, message, created_at, profiles(first_name, last_name)")
        .in("request_id", ids)
        .order("created_at", { ascending: false })
        .limit(50)
        .returns<
          {
            id: string;
            request_id: string;
            message: string;
            created_at: string;
            profiles: { first_name: string | null; last_name: string | null } | null;
          }[]
        >()
    : { data: [] };

  const requestById = Object.fromEntries(rows.map((r) => [r.id, r]));

  const items: NotifItem[] = [];

  for (const c of comments ?? []) {
    const request = requestById[c.request_id];
    if (!request) continue;
    const author = [c.profiles?.first_name, c.profiles?.last_name].filter(Boolean).join(" ") || "Someone";
    items.push({
      id: `comment-${c.id}`,
      tag: request.priority === "Urgent" ? "urgent" : "comment",
      title: `New comment on "${firstLine(request.description)}"`,
      body: c.message,
      meta: `${author} · ${dayLabel(new Date(c.created_at))}`,
      timestamp: c.created_at,
      day: dayLabel(new Date(c.created_at)),
    });
  }

  for (const r of rows) {
    if (r.status === "Open") continue;
    items.push({
      id: `status-${r.id}`,
      tag: r.priority === "Urgent" ? "urgent" : "status",
      title: `"${firstLine(r.description)}" is now ${r.status}`,
      body: "",
      meta: dayLabel(new Date(r.updated_at)),
      timestamp: r.updated_at,
      day: dayLabel(new Date(r.updated_at)),
    });
  }

  items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return <NotificationsList items={items} homeName={home?.name ?? "your home"} />;
}
