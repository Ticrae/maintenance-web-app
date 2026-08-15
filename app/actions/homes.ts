"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/lib/supabase/require-admin";

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
