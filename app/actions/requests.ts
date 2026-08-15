"use server";

import { revalidatePath } from "next/cache";
import {
  requireRole,
  requireSuperAdmin,
} from "@/lib/supabase/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Priority } from "@/lib/theme";

export type RequestStatus =
  | "Open"
  | "Assigned"
  | "In Progress"
  | "Waiting for Parts"
  | "Completed"
  | "Cancelled";

const ACTIVE_ASSIGNED_STATUSES: RequestStatus[] = ["Assigned", "In Progress", "Waiting for Parts"];

// Picks the maintenance worker in the agency with the fewest active jobs
// right now, so new requests spread out across the team instead of piling
// on whoever gets assigned first.
async function pickMaintenanceAssignee(
  admin: ReturnType<typeof createAdminClient>,
  agencyId: string
): Promise<string | null> {
  const { data: workers } = await admin
    .from("profiles")
    .select("id")
    .eq("agency_id", agencyId)
    .eq("role", "maintenance");

  if (!workers || workers.length === 0) return null;
  if (workers.length === 1) return workers[0].id;

  const workerIds = workers.map((w) => w.id);
  const { data: activeJobs } = await admin
    .from("requests")
    .select("assigned_to")
    .in("assigned_to", workerIds)
    .in("status", ACTIVE_ASSIGNED_STATUSES);

  const load: Record<string, number> = Object.fromEntries(workerIds.map((id) => [id, 0]));
  for (const job of activeJobs ?? []) {
    if (job.assigned_to) load[job.assigned_to] = (load[job.assigned_to] ?? 0) + 1;
  }

  return workerIds.reduce((best, id) => (load[id] < load[best] ? id : best), workerIds[0]);
}

// --- Admin: manage any request -------------------------------------------

export async function updateRequestStatus(
  requestId: string,
  status: RequestStatus
) {
  await requireSuperAdmin();

  const admin = createAdminClient();

  const { error } = await admin
    .from("requests")
    .update({ status })
    .eq("id", requestId);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/requests");
  revalidatePath("/admin/reports");
}

export async function assignRequest(
  requestId: string,
  userId: string | null
) {
  const profile = await requireRole(["super_admin", "agency_admin"]);

  const admin = createAdminClient();

  // agency_admin (supervisor) can only assign requests within their own
  // agency, and only to maintenance workers in that same agency.
  if (profile.role === "agency_admin") {
    const { data: request } = await admin
      .from("requests")
      .select("agency_id")
      .eq("id", requestId)
      .maybeSingle();
    if (!request || request.agency_id !== profile.agency_id) {
      throw new Error("This request isn't in your agency.");
    }

    if (userId) {
      const { data: assignee } = await admin
        .from("profiles")
        .select("agency_id, role")
        .eq("id", userId)
        .maybeSingle();
      if (!assignee || assignee.agency_id !== profile.agency_id || assignee.role !== "maintenance") {
        throw new Error("Choose a maintenance worker in your agency.");
      }
    }
  }

  const update = userId
    ? {
      assigned_to: userId,
      status: "Assigned" as const,
    }
    : {
      assigned_to: null,
    };

  const { error } = await admin
    .from("requests")
    .update(update)
    .eq("id", requestId);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/requests");
  revalidatePath("/admin/reports");
  revalidatePath("/supervisor");
  revalidatePath("/supervisor/requests");
  revalidatePath("/maintenance");
  revalidatePath("/maintenance/jobs");
}

// --- Staff: submit a new request -------------------------------------------

export async function submitStaffRequest(input: {
  title: string;
  homeId: string;
  location: string;
  category: string;
  description: string;
  priority: Priority;
  urgent: boolean;
}) {
  const profile = await requireRole(["staff"]);

  if (!profile.agency_id) {
    throw new Error("Your account isn't linked to an agency yet.");
  }

  const admin = createAdminClient();

  const { data: home } = await admin
    .from("homes")
    .select("id")
    .eq("id", input.homeId)
    .eq("agency_id", profile.agency_id)
    .maybeSingle();

  if (!home) {
    throw new Error("Choose a valid home.");
  }

  const description = input.location.trim()
    ? `${input.location.trim()}: ${input.description}`
    : input.description;

  const assigneeId = await pickMaintenanceAssignee(admin, profile.agency_id);

  const { data, error } = await admin
    .from("requests")
    .insert({
      agency_id: profile.agency_id,
      home_id: input.homeId,
      category: input.category,
      priority: input.urgent ? "Urgent" : input.priority,
      status: assigneeId ? "Assigned" : "Open",
      assigned_to: assigneeId,
      description: `${input.title}\n${description}`,
      reported_by: profile.id,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/staff");
  revalidatePath("/maintenance");
  revalidatePath("/maintenance/jobs");

  return {
    id: data.id as string,
  };
}

// --- Maintenance: accept, progress, complete a job --------------------------

export async function acceptRequest(requestId: string) {
  const profile = await requireRole(["maintenance"]);

  const admin = createAdminClient();

  const { data, error } = await admin
    .from("requests")
    .update({
      assigned_to: profile.id,
      status: "Assigned" as const,
    })
    .eq("id", requestId)
    .is("assigned_to", null)
    .select("id");

  if (error) throw new Error(error.message);

  if (!data || data.length === 0) {
    throw new Error("This job was already taken.");
  }

  revalidatePath("/maintenance");
  revalidatePath("/maintenance/jobs");
}

export async function updateJobStage(
  requestId: string,
  status: RequestStatus
) {
  const profile = await requireRole(["maintenance"]);

  const admin = createAdminClient();

  const { data, error } = await admin
    .from("requests")
    .update({ status })
    .eq("id", requestId)
    .eq("assigned_to", profile.id)
    .select("id");

  if (error) throw new Error(error.message);

  if (!data || data.length === 0) {
    throw new Error("This job isn't assigned to you.");
  }

  revalidatePath("/maintenance/jobs");
  revalidatePath(`/maintenance/jobs/${requestId}`);
}

export async function completeJob(requestId: string) {
  const profile = await requireRole(["maintenance"]);

  const admin = createAdminClient();

  const { data, error } = await admin
    .from("requests")
    .update({
      status: "Completed" as const,
    })
    .eq("id", requestId)
    .eq("assigned_to", profile.id)
    .select("id");

  if (error) throw new Error(error.message);

  if (!data || data.length === 0) {
    throw new Error("This job isn't assigned to you.");
  }

  revalidatePath("/maintenance/jobs");
  revalidatePath("/maintenance/completed");
  revalidatePath(`/maintenance/jobs/${requestId}`);
}