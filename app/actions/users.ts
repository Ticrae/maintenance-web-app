"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/supabase/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { isRole } from "@/lib/auth";

// Lets the invite email link back to whichever origin actually sent the
// invite (localhost while developing, the deployed domain in production)
// instead of a fixed Site URL baked into the Supabase project settings.
async function currentOrigin() {
  const headersList = await headers();
  const host = headersList.get("x-forwarded-host") ?? headersList.get("host");
  // Deterministic rather than trusting x-forwarded-proto, which can be set
  // by something in front of the request (e.g. local port forwarding) even
  // when the app itself is plain http on localhost.
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  return `${protocol}://${host}`;
}

export type UserFormState = { error?: string } | undefined;

// Parses the shared invite/edit form fields, validating the role
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

// Invites a new user by email and fills in their profile fields. Rolls back
// the created auth user if writing the profile fails, so a failed invite
// doesn't leave a half-created account behind.
export async function inviteUser(_: UserFormState, formData: FormData): Promise<UserFormState> {
  await requireSuperAdmin();

  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Enter an email address." };

  const parsed = readProfileFields(formData);
  if (!parsed.ok) return { error: parsed.error };

  const admin = createAdminClient();
  const { data, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: await currentOrigin(),
  });
  if (inviteError || !data.user) {
    return { error: inviteError?.message ?? "Could not invite this user." };
  }

  // A database trigger on auth.users already inserts a bare profiles row when
  // the invite creates the auth user, so upsert onto that row instead of
  // inserting a second one (which collides on profiles_pkey).
  const { error: profileError } = await admin
    .from("profiles")
    .upsert({ id: data.user.id, ...parsed.fields }, { onConflict: "id" });
  if (profileError) {
    await admin.auth.admin.deleteUser(data.user.id);
    return { error: profileError.message };
  }

  revalidatePath("/admin/users");
  return {};
}

// Updates an existing user's profile fields
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

// Quick role-only change, used by the inline role dropdown in the users table
export async function updateUserRole(userId: string, role: string) {
  await requireSuperAdmin();
  if (!isRole(role)) throw new Error("Invalid role");

  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({ role }).eq("id", userId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/users");
}

// Permanently deletes a user's auth account; guards against a super admin
// accidentally locking themselves out by deleting their own account.
export async function deleteUser(userId: string) {
  const currentUser = await requireSuperAdmin();
  if (userId === currentUser.id) throw new Error("You can't delete your own account.");

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/users");
}
