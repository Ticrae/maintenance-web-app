import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { RequestDetail, type RequestDetailData, type CommentItem, type PhotoItem } from "./request-detail";

export default async function StaffRequestDetailPage(props: PageProps<"/staff/requests/[id]">) {
  const { id } = await props.params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("home_id")
    .eq("id", user!.id)
    .maybeSingle<{ home_id: string | null }>();

  const admin = createAdminClient();

  const { data: request } = await admin
    .from("requests")
    .select(
      "id, category, priority, status, description, created_at, updated_at, home_id, reported_by, assigned_to, homes(name)"
    )
    .eq("id", id)
    .maybeSingle<{
      id: string;
      category: string;
      priority: RequestDetailData["priority"];
      status: string;
      description: string;
      created_at: string;
      updated_at: string;
      home_id: string;
      reported_by: string;
      assigned_to: string | null;
      homes: { name: string } | null;
    }>();

  if (!request || !profile?.home_id || request.home_id !== profile.home_id) notFound();

  const { data: reporter } = await admin
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", request.reported_by)
    .maybeSingle<{ first_name: string | null; last_name: string | null }>();

  const { data: assignee } = request.assigned_to
    ? await admin
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", request.assigned_to)
        .maybeSingle<{ first_name: string | null; last_name: string | null }>()
    : { data: null };

  const { data: comments } = await admin
    .from("request_comments")
    .select("id, message, created_at, profiles(first_name, last_name)")
    .eq("request_id", id)
    .order("created_at", { ascending: true })
    .returns<
      {
        id: string;
        message: string;
        created_at: string;
        profiles: { first_name: string | null; last_name: string | null } | null;
      }[]
    >();

  const { data: photos } = await admin
    .from("request_photos")
    .select("id, url, created_at")
    .eq("request_id", id)
    .order("created_at", { ascending: false })
    .returns<PhotoItem[]>();

  const detail: RequestDetailData = {
    id: request.id,
    category: request.category,
    priority: request.priority,
    status: request.status,
    description: request.description,
    created_at: request.created_at,
    updated_at: request.updated_at,
    homeName: request.homes?.name ?? "—",
    reporterName: [reporter?.first_name, reporter?.last_name].filter(Boolean).join(" ") || "Unknown",
    assigneeName: assignee
      ? [assignee.first_name, assignee.last_name].filter(Boolean).join(" ") || "Unnamed"
      : null,
  };

  const activity: CommentItem[] = (comments ?? []).map((c) => ({
    id: c.id,
    message: c.message,
    created_at: c.created_at,
    authorName: [c.profiles?.first_name, c.profiles?.last_name].filter(Boolean).join(" ") || "Unknown",
  }));

  return <RequestDetail request={detail} activity={activity} photos={photos ?? []} />;
}
