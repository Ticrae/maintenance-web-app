"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/lib/supabase/require-admin";

// Creates a home, optionally attached to an agency at creation time
export async function createHome(input: {
    name: string;
    address: string;
    agency_id?: string;
}) {
    await requireSuperAdmin();
    const admin = createAdminClient();

    const { data, error } = await admin
        .from("homes")
        .insert({
            name: input.name,
            address: input.address,
            ...(input.agency_id && { agency_id: input.agency_id }),
        })
        .select()
        .single();

    if (error) {
        console.error("Failed to create home:", error);
        throw new Error(error.message);
    }

    revalidatePath("/admin/homes");
    return data;
}

// Creates a new agency
export async function createAgency(input: {
    name: string;
}) {
    await requireSuperAdmin();
    const admin = createAdminClient();

    const { data, error } = await admin
        .from("agencies")
        .insert({
            name: input.name,
        })
        .select()
        .single();

    if (error) {
        console.error("Failed to create agency:", error);
        throw new Error(error.message);
    }

    revalidatePath("/admin/homes");
    return data;
}

// Lists every home platform-wide, newest first. Returns [] on failure rather
// than throwing, since this feeds read-only dropdowns/lists.
export async function getHomes() {
    const admin = createAdminClient();

    const { data: homes, error } = await admin
        .from("homes")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Failed to fetch homes:", error);
        return [];
    }

    return homes || [];
}

// Lists every agency, newest first. Returns [] on failure rather than
// throwing, since this feeds read-only dropdowns/lists.
export async function getAgencies() {
    const admin = createAdminClient();

    const { data: agencies, error } = await admin
        .from("agencies")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Failed to fetch agencies:", error);
        return [];
    }

    return agencies || [];
}
