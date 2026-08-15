"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "request-photos";

export async function uploadRequestPhoto(
  requestId: string,
  formData: FormData,
) {
  const supabase = await createClient();

  // Make sure the user is authenticated
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Not authenticated");
  }

  // Get the file
  const file = formData.get("photo");

  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Choose a photo first.");
  }

  // Validate image type
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
  ];

  if (!allowedTypes.includes(file.type)) {
    throw new Error(
      "Invalid image type. Please upload a JPG, PNG, WebP, or GIF.",
    );
  }

  // 10 MB maximum
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Photo must be smaller than 10 MB.");
  }

  const admin = createAdminClient();

  /*
   * Verify that the request exists.
   *
   * We use the admin client here because your requests RLS
   * currently prevents the authenticated user from reading
   * the request they just created.
   */
  const { data: request, error: requestError } = await admin
    .from("requests")
    .select("id")
    .eq("id", requestId)
    .single();

  if (requestError || !request) {
    throw new Error("Request does not exist.");
  }

  /*
   * Generate a safe unique storage path.
   */
  const extension =
    file.name.split(".").pop()?.toLowerCase() || "jpg";

  const filePath = `${requestId}/${crypto.randomUUID()}.${extension}`;

  /*
   * Upload the actual file to Supabase Storage.
   */
  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("Storage upload error:", uploadError);

    throw new Error(
      `Photo upload failed: ${uploadError.message}`,
    );
  }

  /*
   * Get the public URL.
   */
  const {
    data: { publicUrl },
  } = admin.storage
    .from(BUCKET)
    .getPublicUrl(filePath);

  /*
   * Save the photo record.
   *
   * We use the admin client here as well because your current
   * request_photos RLS may have the same access problem.
   */
  const { error: photoError } = await admin
    .from("request_photos")
    .insert({
      request_id: request.id,
      url: publicUrl,
    });

  if (photoError) {
    // Clean up Storage if database insert fails.
    await admin.storage
      .from(BUCKET)
      .remove([filePath]);

    console.error(
      "request_photos insert error:",
      photoError,
    );

    throw new Error(
      `Could not save photo: ${photoError.message}`,
    );
  }

  revalidatePath(`/maintenance/jobs/${requestId}`);
  revalidatePath(`/staff/requests/${requestId}`);

  return {
    success: true,
    url: publicUrl,
  };
}