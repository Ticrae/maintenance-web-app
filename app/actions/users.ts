"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/supabase/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { isRole } from "@/lib/auth";

export type UserFormState = { error?: string } | undefined;

function readProfileFields(formData: FormData) {
  const role = formData.get("role");
  if (!isRole(role)) return { error: "Choose a valid role." } as const;

  return {
    ok: true as const,
    fields: {
      first_name: String(formData.get("first_name") ?? "").trim() || null,
      last_name: String(formData.get("last_name") ?? "").trim() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
      role,
      agency_id: String(formData.get("agency_id") ?? "").trim() || null,
      home_id: String(formData.get("home_id") ?? "").trim() || null,
    },
  };
}

export async function inviteUser(_: UserFormState, formData: FormData): Promise<UserFormState> {
  await requireSuperAdmin();

  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Enter an email address." };

  const parsed = readProfileFields(formData);
  if (!parsed.ok) return { error: parsed.error };

  const admin = createAdminClient();
  const { data, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email);
  if (inviteError || !data.user) {
    return { error: inviteError?.message ?? "Could not invite this user." };
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: data.user.id,
    ...parsed.fields,
  });
  if (profileError) {
    await admin.auth.admin.deleteUser(data.user.id);
    return { error: profileError.message };
  }

  revalidatePath("/admin/users");
  return {};
}

export async function updateUser(
  userId: string,
  _: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  await requireSuperAdmin();

  const parsed = readProfileFields(formData);
  if (!parsed.ok) return { error: parsed.error };

  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update(parsed.fields).eq("id", userId);
  if (error) return { error: error.message };

  revalidatePath("/admin/users");
  return {};
}

export async function updateUserRole(userId: string, role: string) {
  await requireSuperAdmin();
  if (!isRole(role)) throw new Error("Invalid role");

  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({ role }).eq("id", userId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/users");
}

export async function deleteUser(userId: string) {
  const currentUser = await requireSuperAdmin();
  if (userId === currentUser.id) throw new Error("You can't delete your own account.");

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/users");
}
