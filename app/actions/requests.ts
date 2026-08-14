"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/supabase/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export type RequestStatus =
  | "Open"
  | "Assigned"
  | "In Progress"
  | "Waiting for Parts"
  | "Completed"
  | "Cancelled";

export async function updateRequestStatus(requestId: string, status: RequestStatus) {
  await requireSuperAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("requests").update({ status }).eq("id", requestId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/requests");
}

export async function assignRequest(requestId: string, userId: string | null) {
  await requireSuperAdmin();
  const admin = createAdminClient();
  const update = userId
    ? { assigned_to: userId, status: "Assigned" as const }
    : { assigned_to: null };
  const { error } = await admin.from("requests").update(update).eq("id", requestId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/requests");
}
