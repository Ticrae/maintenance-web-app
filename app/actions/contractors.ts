"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/supabase/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export type ContractorStatus = "active" | "inactive";
export type AssignmentStatus = "awaiting" | "scheduled" | "completed" | "cancelled";
export type InvoiceStatus = "pending" | "received" | "paid";

const MANAGER_ROLES = ["super_admin", "agency_admin"] as const;

export type ContractorRow = {
  id: string;
  agency_id: string;
  name: string;
  trade: string | null;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  status: ContractorStatus;
  created_at: string;
  agencies: { name: string } | null;
};

function contractorPaths() {
  revalidatePath("/admin/contractors");
  revalidatePath("/supervisor/contractors");
}

// --- Directory -------------------------------------------------------------

export async function getContractors(agencyId?: string) {
  const admin = createAdminClient();
  let query = admin.from("contractors").select("*, agencies(name)").order("name");
  if (agencyId) query = query.eq("agency_id", agencyId);

  const { data, error } = await query.returns<ContractorRow[]>();
  if (error) {
    console.error("Failed to fetch contractors:", error);
    return [];
  }
  return data ?? [];
}

export type ContractorInput = {
  agency_id: string;
  name: string;
  trade?: string;
  contact_name?: string;
  phone?: string;
  email?: string;
  notes?: string;
};

export async function createContractor(input: ContractorInput) {
  const profile = await requireRole([...MANAGER_ROLES]);
  if (profile.role === "agency_admin" && input.agency_id !== profile.agency_id) {
    throw new Error("Choose your own agency.");
  }
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("contractors")
    .insert({
      agency_id: input.agency_id,
      name: input.name,
      trade: input.trade || null,
      contact_name: input.contact_name || null,
      phone: input.phone || null,
      email: input.email || null,
      notes: input.notes || null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  contractorPaths();
  return data;
}

export async function updateContractor(id: string, input: ContractorInput) {
  const profile = await requireRole([...MANAGER_ROLES]);
  const admin = createAdminClient();

  if (profile.role === "agency_admin") {
    const { data: existing } = await admin.from("contractors").select("agency_id").eq("id", id).maybeSingle();
    if (!existing || existing.agency_id !== profile.agency_id) {
      throw new Error("This contractor isn't in your agency.");
    }
  }

  const { error } = await admin
    .from("contractors")
    .update({
      name: input.name,
      trade: input.trade || null,
      contact_name: input.contact_name || null,
      phone: input.phone || null,
      email: input.email || null,
      notes: input.notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  contractorPaths();
}

export async function retireContractor(id: string) {
  const profile = await requireRole([...MANAGER_ROLES]);
  const admin = createAdminClient();

  if (profile.role === "agency_admin") {
    const { data: existing } = await admin.from("contractors").select("agency_id").eq("id", id).maybeSingle();
    if (!existing || existing.agency_id !== profile.agency_id) {
      throw new Error("This contractor isn't in your agency.");
    }
  }

  const { error } = await admin
    .from("contractors")
    .update({ status: "inactive", updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);

  contractorPaths();
}

// --- Assignments -------------------------------------------------------------

export type AssignmentRow = {
  id: string;
  request_id: string;
  contractor_id: string;
  status: AssignmentStatus;
  sent_at: string;
  appointment_at: string | null;
  quote_amount: number | null;
  invoice_status: InvoiceStatus;
  notes: string | null;
  created_at: string;
  contractors: { name: string; trade: string | null } | null;
};

export async function getAssignmentsForRequest(requestId: string) {
  const profile = await requireRole([...MANAGER_ROLES]);
  const admin = createAdminClient();

  if (profile.role === "agency_admin") {
    const { data: request } = await admin.from("requests").select("agency_id").eq("id", requestId).maybeSingle();
    if (!request || request.agency_id !== profile.agency_id) return [];
  }

  const { data, error } = await admin
    .from("request_contractor_assignments")
    .select("*, contractors(name, trade)")
    .eq("request_id", requestId)
    .order("created_at", { ascending: false })
    .returns<AssignmentRow[]>();

  if (error) {
    console.error("Failed to fetch contractor assignments:", error);
    return [];
  }
  return data ?? [];
}

export type AssignmentInput = {
  appointment_at?: string;
  quote_amount?: number;
  notes?: string;
};

export async function assignContractor(requestId: string, contractorId: string, input: AssignmentInput) {
  const profile = await requireRole([...MANAGER_ROLES]);
  const admin = createAdminClient();

  const { data: request } = await admin.from("requests").select("agency_id").eq("id", requestId).maybeSingle();
  if (!request || (profile.role === "agency_admin" && request.agency_id !== profile.agency_id)) {
    throw new Error("This request isn't in your agency.");
  }

  const { data: contractor } = await admin
    .from("contractors")
    .select("id")
    .eq("id", contractorId)
    .eq("agency_id", request.agency_id)
    .maybeSingle();
  if (!contractor) throw new Error("Choose a valid contractor.");

  const { error } = await admin.from("request_contractor_assignments").insert({
    request_id: requestId,
    contractor_id: contractorId,
    appointment_at: input.appointment_at || null,
    quote_amount: input.quote_amount ?? null,
    notes: input.notes || null,
    created_by: profile.id,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/admin/requests");
  revalidatePath("/supervisor/requests");
}

export async function updateAssignment(
  id: string,
  input: {
    status?: AssignmentStatus;
    appointment_at?: string;
    quote_amount?: number;
    invoice_status?: InvoiceStatus;
    notes?: string;
  }
) {
  const profile = await requireRole([...MANAGER_ROLES]);
  const admin = createAdminClient();

  if (profile.role === "agency_admin") {
    const { data: assignment } = await admin
      .from("request_contractor_assignments")
      .select("requests(agency_id)")
      .eq("id", id)
      .maybeSingle<{ requests: { agency_id: string } | null }>();
    if (!assignment || assignment.requests?.agency_id !== profile.agency_id) {
      throw new Error("This assignment isn't in your agency.");
    }
  }

  const { error } = await admin
    .from("request_contractor_assignments")
    .update({
      ...(input.status && { status: input.status }),
      ...(input.appointment_at !== undefined && { appointment_at: input.appointment_at || null }),
      ...(input.quote_amount !== undefined && { quote_amount: input.quote_amount }),
      ...(input.invoice_status && { invoice_status: input.invoice_status }),
      ...(input.notes !== undefined && { notes: input.notes || null }),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/requests");
  revalidatePath("/supervisor/requests");
}
