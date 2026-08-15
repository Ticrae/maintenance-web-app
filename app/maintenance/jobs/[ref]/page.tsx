import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  JobDetail,
  type JobDetailData,
  type CommentItem,
  type PhotoItem,
} from "./job-detail";

export default async function JobDetailPage(
  props: PageProps<"/maintenance/jobs/[ref]">,
) {
  const { ref } = await props.params;
  const admin = createAdminClient();

  const { data: request } = await admin
    .from("requests")
    .select(
      "id, category, priority, status, description, created_at, updated_at, reported_by, homes(name, address)",
    )
    .eq("id", ref)
    .maybeSingle<{
      id: string;
      category: string;
      priority: JobDetailData["priority"];
      status: string;
      description: string;
      created_at: string;
      updated_at: string;
      reported_by: string;
      homes: { name: string; address: string | null } | null;
    }>();

  if (!request) notFound();

  const { data: reporter } = await admin
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", request.reported_by)
    .maybeSingle<{ first_name: string | null; last_name: string | null }>();

  type CommentWithProfile = {
    id: string;
    message: string;
    created_at: string;
    user_id: string;
    request_id: string;
    profiles: {
      id: string;
      first_name: string | null;
      last_name: string | null;
    } | null;
  };

  const { data: comments } = await admin
    .from("request_comments")
    .select(
      "id, message, created_at, user_id, request_id, profiles (id,first_name,last_name)",
    )
    .eq("request_id", ref)
    .order("created_at", { ascending: true })
    .returns<CommentWithProfile[]>();

  const { data: photos } = await admin
    .from("request_photos")
    .select("id, url, created_at")
    .eq("request_id", ref)
    .order("created_at", { ascending: false })
    .returns<PhotoItem[]>();

  const job: JobDetailData = {
    id: request.id,
    category: request.category,
    priority: request.priority,
    status: request.status,
    description: request.description,
    created_at: request.created_at,
    updated_at: request.updated_at,
    homeName: request.homes?.name ?? "—",
    homeAddress: request.homes?.address ?? null,
    reporterName:
      [reporter?.first_name, reporter?.last_name].filter(Boolean).join(" ") ||
      "Unknown",
  };

  const activity: CommentItem[] = (comments ?? []).map((c) => ({
    id: c.id,
    message: c.message,
    created_at: c.created_at,
    authorName:
      [c.profiles?.first_name, c.profiles?.last_name]
        .filter(Boolean)
        .join(" ") || "Unknown",
  }));

  return <JobDetail job={job} activity={activity} photos={photos ?? []} />;
}
