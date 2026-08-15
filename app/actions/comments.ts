"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function addRequestComment(requestId: string, message: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const trimmed = message.trim();
  if (!trimmed) throw new Error("Write a comment first.");

  const admin = createAdminClient();
  const { error } = await admin
    .from("request_comments")
    .insert({ request_id: requestId, user_id: user.id, message: trimmed });

  if (error) throw new Error(error.message);

  revalidatePath(`/maintenance/jobs/${requestId}`);
  revalidatePath(`/staff/requests/${requestId}`);
  revalidatePath("/staff/notifications");
}
