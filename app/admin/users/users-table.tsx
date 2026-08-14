"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Button, buttonClasses } from "@/components/ui/button";
import { Avatar } from "@/components/ui/misc";
import { TextField, Select } from "@/components/ui/inputs";
import { RoleChip } from "@/components/ui/badges";
import { tableWrapClass, tableHeadRowClass, tableRowClass } from "@/components/ui/table";
import { ROLE_LABEL, type Role } from "@/lib/theme";
import { formatDate } from "@/lib/date";
import { inviteUser, updateUser, updateUserRole, deleteUser, type UserFormState } from "@/app/actions/users";

export type UserRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  role: Role;
  agency_id: string | null;
  home_id: string | null;
  created_at: string;
  email: string;
};

export type AgencyOption = { id: string; name: string };
export type HomeOption = { id: string; name: string; agency_id: string };

const ROLES: Role[] = ["staff", "maintenance", "agency_admin", "super_admin"];
const GRID_COLS = "grid-cols-[36px_minmax(180px,1fr)_190px_150px_140px_140px_100px_130px]";

function displayName(u: { first_name: string | null; last_name: string | null }) {
  return [u.first_name, u.last_name].filter(Boolean).join(" ") || "Unnamed";
}

export function UsersTable({
  users,
  agencies,
  homes,
  currentUserId,
}: {
  users: UserRow[];
  agencies: AgencyOption[];
  homes: HomeOption[];
  currentUserId: string | null;
}) {
  const [search, setSearch] = useState("");
  const [inviting, setInviting] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) => displayName(u).toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }, [users, search]);

  async function handleRoleChange(userId: string, role: string) {
    setRowError(null);
    setPendingId(userId);
    try {
      await updateUserRole(userId, role);
    } catch (e) {
      setRowError(e instanceof Error ? e.message : "Could not update role.");
    } finally {
      setPendingId(null);
    }
  }

  async function handleDelete(userId: string) {
    setRowError(null);
    setPendingId(userId);
    try {
      await deleteUser(userId);
      setConfirmDeleteId(null);
    } catch (e) {
      setRowError(e instanceof Error ? e.message : "Could not delete user.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <PageHeader
        title="Users"
        subtitle="Everyone with access, across all agencies"
        actions={
          <>
            <TextField
              placeholder="Search name or email…"
              className="w-full sm:w-[240px]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button onClick={() => setInviting(true)}>Invite user</Button>
          </>
        }
      />
      <div className="flex flex-1 flex-col gap-3 bg-canvas p-4 sm:p-7">
        {rowError && (
          <p className="text-sm text-red-700" role="alert">
            {rowError}
          </p>
        )}
        <div className={tableWrapClass}>
          <div className={`${tableHeadRowClass} ${GRID_COLS}`}>
            <span />
            <span>Name</span>
            <span>Email</span>
            <span>Role</span>
            <span>Agency</span>
            <span>Home</span>
            <span>Created</span>
            <span>Actions</span>
          </div>
          {filtered.map((u) => {
            const agency = agencies.find((a) => a.id === u.agency_id);
            const home = homes.find((h) => h.id === u.home_id);
            const isSelf = u.id === currentUserId;
            return (
              <div key={u.id} className={`${tableRowClass} ${GRID_COLS}`}>
                <Avatar
                  initials={displayName(u).split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  size={26}
                />
                <span className="truncate pr-3 text-[13.5px] font-medium text-ink">
                  {displayName(u)}
                  {isSelf && <span className="ml-2 font-mono text-[10.5px] text-eyebrow">you</span>}
                </span>
                <span className="truncate pr-3 font-mono text-[11.5px] text-eyebrow">{u.email}</span>
                <div className="flex flex-col gap-1">
                  <RoleChip role={u.role} />
                  <Select
                    value={u.role}
                    disabled={pendingId === u.id}
                    className="h-7 text-[11px]"
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABEL[r]}
                      </option>
                    ))}
                  </Select>
                </div>
                <span className="truncate pr-3 text-[13px] text-subtle">{agency?.name ?? "—"}</span>
                <span className="truncate pr-3 text-[13px] text-subtle">{home?.name ?? "—"}</span>
                <span className="font-mono text-[11px] text-eyebrow">
                  {formatDate(u.created_at)}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditing(u)}
                    className="text-xs font-medium text-link hover:underline"
                  >
                    Edit
                  </button>
                  {confirmDeleteId === u.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(u.id)}
                        disabled={pendingId === u.id}
                        className="text-xs font-medium text-urgent hover:underline"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-xs text-meta hover:underline"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(u.id)}
                      disabled={isSelf}
                      className="text-xs font-medium text-urgent hover:underline disabled:cursor-not-allowed disabled:text-eyebrow disabled:no-underline"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-meta">No users match.</div>
          )}
        </div>
      </div>

      {inviting && (
        <UserDrawer
          mode="invite"
          agencies={agencies}
          homes={homes}
          onClose={() => setInviting(false)}
        />
      )}
      {editing && (
        <UserDrawer
          mode="edit"
          user={editing}
          agencies={agencies}
          homes={homes}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function UserDrawer({
  mode,
  user,
  agencies,
  homes,
  onClose,
}: {
  mode: "invite" | "edit";
  user?: UserRow;
  agencies: AgencyOption[];
  homes: HomeOption[];
  onClose: () => void;
}) {
  const boundAction =
    mode === "edit" && user ? updateUser.bind(null, user.id) : inviteUser;
  const [state, formAction, isPending] = useActionState<UserFormState, FormData>(
    boundAction,
    undefined
  );
  const [agencyId, setAgencyId] = useState(user?.agency_id ?? "");
  const eligibleHomes = homes.filter((h) => h.agency_id === agencyId);

  useEffect(() => {
    if (state && !state.error) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <>
      <div className="fixed inset-0 z-10 bg-black/20" onClick={onClose} />
      <div className="fixed right-0 top-0 z-20 flex h-full w-full flex-col gap-5 bg-surface p-4 shadow-[-12px_0_28px_rgba(0,0,0,.09)] sm:w-[380px] sm:p-6">
        <div className="flex items-center justify-between">
          <span className="text-base font-semibold text-ink">
            {mode === "invite" ? "Invite user" : "Edit user"}
          </span>
          <button onClick={onClose} className="text-lg text-meta hover:text-muted">
            ×
          </button>
        </div>
        <form action={formAction} className="flex flex-1 flex-col gap-4 overflow-auto">
          {mode === "invite" && (
            <div className="flex flex-col gap-[7px]">
              <label className="text-[13px] font-medium text-body">Email</label>
              <TextField type="email" name="email" required placeholder="name@organisation.com" />
            </div>
          )}
          <div className="flex gap-[14px]">
            <div className="flex flex-1 flex-col gap-[7px]">
              <label className="text-[13px] font-medium text-body">First name</label>
              <TextField name="first_name" defaultValue={user?.first_name ?? ""} />
            </div>
            <div className="flex flex-1 flex-col gap-[7px]">
              <label className="text-[13px] font-medium text-body">Last name</label>
              <TextField name="last_name" defaultValue={user?.last_name ?? ""} />
            </div>
          </div>
          <div className="flex flex-col gap-[7px]">
            <label className="text-[13px] font-medium text-body">Phone</label>
            <TextField name="phone" defaultValue={user?.phone ?? ""} />
          </div>
          <div className="flex flex-col gap-[7px]">
            <label className="text-[13px] font-medium text-body">Role</label>
            <Select name="role" defaultValue={user?.role ?? "staff"}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-[7px]">
            <label className="text-[13px] font-medium text-body">Agency</label>
            <Select
              name="agency_id"
              value={agencyId}
              onChange={(e) => setAgencyId(e.target.value)}
            >
              <option value="">No agency</option>
              {agencies.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-[7px]">
            <label className="text-[13px] font-medium text-body">Home</label>
            <Select name="home_id" defaultValue={user?.home_id ?? ""}>
              <option value="">No home</option>
              {eligibleHomes.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </Select>
          </div>

          {state?.error && (
            <p className="text-sm text-red-700" role="alert">
              {state.error}
            </p>
          )}

          <div className="mt-auto flex gap-[10px]">
            <button type="button" onClick={onClose} className={buttonClasses("outline", "flex-1")}>
              Cancel
            </button>
            <button type="submit" disabled={isPending} className={buttonClasses("primary", "flex-1")}>
              {isPending ? "Saving…" : mode === "invite" ? "Send invite" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
