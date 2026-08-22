import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getHomes } from "@/app/actions/homes";
import { getServerDictionary, getServerLocale } from "@/lib/i18n/server";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { NotificationsList, type NotifItem } from "./notifications-list";

function dayLabel(date: Date, dict: Dictionary, locale: string) {
  const today = new Date();
  const yesterday = new Date(today.getTime() - 86400_000);
  if (date.toDateString() === today.toDateString()) return dict.staff.notifications.today;
  if (date.toDateString() === yesterday.toDateString()) return dict.staff.notifications.yesterday;
  return date.toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", {
    month: "short",
    day: "numeric",
  });
}

function firstLine(text: string) {
  return text.split("\n")[0];
}

export default async function NotificationsPage() {
  const dict = await getServerDictionary();
  const locale = await getServerLocale();
  const t = dict.staff.notifications;
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
    const author = [c.profiles?.first_name, c.profiles?.last_name].filter(Boolean).join(" ") || t.someone;
    items.push({
      id: `comment-${c.id}`,
      tag: request.priority === "Urgent" ? "urgent" : "comment",
      title: t.newComment(firstLine(request.description)),
      body: c.message,
      meta: `${author} · ${dayLabel(new Date(c.created_at), dict, locale)}`,
      timestamp: c.created_at,
      day: dayLabel(new Date(c.created_at), dict, locale),
    });
  }

  for (const r of rows) {
    if (r.status === "Open") continue;
    const statusLabel =
      dict.common.status[r.status as keyof typeof dict.common.status] ?? r.status;
    items.push({
      id: `status-${r.id}`,
      tag: r.priority === "Urgent" ? "urgent" : "status",
      title: t.statusChanged(firstLine(r.description), statusLabel),
      body: "",
      meta: dayLabel(new Date(r.updated_at), dict, locale),
      timestamp: r.updated_at,
      day: dayLabel(new Date(r.updated_at), dict, locale),
    });
  }

  items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return <NotificationsList items={items} homeName={home?.name ?? t.yourHomeFallback} />;
}
