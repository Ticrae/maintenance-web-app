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

// When a staff member tries the guided troubleshooting first but still ends up
// submitting a request, we don't have a table to record the attempt, so a short
// summary is folded into the request description (same as title/location).
export type TroubleshootingSummary = {
  problem: string;
  guideTitle: string;
  stepsCompleted: number;
  outcome: "unresolved" | "stopped";
};

export async function submitStaffRequest(input: {
  title: string;
  homeId: string;
  location: string;
  category: string;
  description: string;
  priority: Priority;
  urgent: boolean;
  troubleshooting?: TroubleshootingSummary | null;
  assetId?: string | null;
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

  let assetId: string | null = null;
  if (input.assetId) {
    const { data: asset } = await admin
      .from("assets")
      .select("id")
      .eq("id", input.assetId)
      .eq("home_id", input.homeId)
      .maybeSingle();
    if (!asset) {
      throw new Error("Choose a valid item for this home.");
    }
    assetId = asset.id;
  }

  const locationLine = input.location.trim()
    ? `${input.location.trim()}: ${input.description}`
    : input.description;

  const lines = [input.title];

  if (input.troubleshooting) {
    const ts = input.troubleshooting;
    const outcomeText =
      ts.outcome === "stopped"
        ? "stopped early — needs a maintenance worker"
        : "did not resolve the issue";
    lines.push(
      `Troubleshooting "${ts.problem}": completed ${ts.stepsCompleted} step(s); ${outcomeText}.`
    );
  }

  lines.push(locationLine);

  // Left unassigned and Open — a maintenance worker claims it via
  // acceptRequest below, rather than one being auto-picked here.
  const { data, error } = await admin
    .from("requests")
    .insert({
      agency_id: profile.agency_id,
      home_id: input.homeId,
      asset_id: assetId,
      category: input.category,
      priority: input.urgent ? "Urgent" : input.priority,
      status: "Open" as const,
      assigned_to: null,
      description: lines.join("\n"),
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

export async function completeJob(
  requestId: string,
  details?: { resolutionNotes?: string; cost?: number }
) {
  const profile = await requireRole(["maintenance"]);

  const admin = createAdminClient();

  const { data, error } = await admin
    .from("requests")
    .update({
      status: "Completed" as const,
      completed_at: new Date().toISOString(),
      ...(details?.resolutionNotes?.trim() && { resolution_notes: details.resolutionNotes.trim() }),
      ...(details?.cost !== undefined && { cost: details.cost }),
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