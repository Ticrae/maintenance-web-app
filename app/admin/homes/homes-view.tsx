"use client";

import { useState } from "react";
import Link from "next/link";
import { createHome, createAgency } from "@/app/actions/homes";
import { Button, buttonClasses } from "@/components/ui/button";
import { Avatar } from "@/components/ui/misc";
import { TextField, TextArea, Select } from "@/components/ui/inputs";
import { RoleChip } from "@/components/ui/badges";
import { tableWrapClass, tableHeadRowClass, tableRowClass } from "@/components/ui/table";
import type { Role } from "@/lib/theme";
import { useDictionary } from "@/lib/i18n/language-provider";

export type HomeRow = { id: string; name: string; address: string | null; agencyName: string; open: number };
export type AgencyRow = { id: string; name: string };
export type PersonRow = { id: string; name: string; email: string; role: Role; homeName: string; agencyName: string };

const ROLES: (Role | "All")[] = ["All", "staff", "maintenance", "agency_admin", "super_admin"];
const PEOPLE_GRID_COLS = "grid-cols-[36px_minmax(180px,1fr)_150px_170px_170px]";

export function HomesView({ homes, agencies, people }: { homes: HomeRow[]; agencies: AgencyRow[]; people: PersonRow[] }) {
  const dict = useDictionary();
  const t = dict.admin.homes;
  const [roleFilter, setRoleFilter] = useState<Role | "All">("All");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [agencyDrawerOpen, setAgencyDrawerOpen] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [selectedAgencyId, setSelectedAgencyId] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const filteredPeople = roleFilter === "All" ? people : people.filter((p) => p.role === roleFilter);

  async function handleCreateHome(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);
    setPending(true);
    try {
      await createHome({ name: name.trim(), address: address.trim(), agency_id: selectedAgencyId || undefined });
      setDrawerOpen(false);
      setName("");
      setAddress("");
      setSelectedAgencyId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t.createHomeError);
    } finally {
      setPending(false);
    }
  }

  async function handleCreateAgency(e: React.FormEvent) {
    e.preventDefault();
    if (!agencyName.trim()) return;
    setError(null);
    setPending(true);
    try {
      await createAgency({ name: agencyName.trim() });
      setAgencyDrawerOpen(false);
      setAgencyName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t.createAgencyError);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="relative flex flex-1 flex-col gap-6 overflow-auto bg-canvas p-4 lg:flex-row lg:p-7">
      <div className="flex w-full flex-none flex-col gap-6 lg:w-[330px]">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[15px] font-semibold text-ink">{t.agencies}</span>
            <Button variant="outline" onClick={() => setAgencyDrawerOpen(true)}>
              {t.addAgency}
            </Button>
          </div>
          {agencies.length === 0 ? (
            <div className="flex flex-col gap-1 rounded-lg border border-black/[.09] bg-surface p-3">
              <p className="text-[12px] text-subtle">{t.noAgenciesYet}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {agencies.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-md px-3 py-[10px] text-left hover:bg-hover">
                  <span className="text-[13.5px] font-medium text-ink">{a.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[15px] font-semibold text-ink">{t.homesHeading}</span>
            <Button variant="outline" onClick={() => setDrawerOpen(true)}>
              {t.addHome}
            </Button>
          </div>
          <div className="flex flex-col gap-1">
            {homes.map((h) => (
              <div key={h.id} className="flex items-center justify-between rounded-md px-3 py-[10px]">
                <div className="flex flex-col">
                  <span className="text-[13.5px] font-medium text-ink">{h.name}</span>
                  <span className="font-mono text-[11.5px] text-eyebrow">{h.agencyName}</span>
                </div>
                <span className="font-mono text-xs text-meta">{t.openCount(h.open)}</span>
              </div>
            ))}
            {homes.length === 0 && <p className="px-3 text-[12px] text-subtle">{t.noHomesYet}</p>}
          </div>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-[15px] font-semibold text-ink">{t.people}</span>
          <div className="flex flex-wrap gap-[10px]">
            <Link href="/admin/users" className={buttonClasses("outline")}>
              {t.manageUsers}
            </Link>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {ROLES.map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`rounded-full px-3 py-[6px] text-xs ${
                roleFilter === r ? "bg-graphite text-white" : "border border-black/[.14] text-muted"
              }`}
            >
              {r === "All" ? dict.common.all : dict.common.role[r]} ·{" "}
              {r === "All" ? people.length : people.filter((p) => p.role === r).length}
            </button>
          ))}
        </div>

        <div className={tableWrapClass}>
          <div className={`${tableHeadRowClass} ${PEOPLE_GRID_COLS}`}>
            <span />
            <span>{dict.common.table.name}</span>
            <span>{dict.common.table.role}</span>
            <span>{dict.common.table.agency}</span>
            <span>{t.home}</span>
          </div>
          {filteredPeople.map((p) => (
            <div key={p.id} className={`${tableRowClass} ${PEOPLE_GRID_COLS}`}>
              <Avatar initials={p.name.split(" ").map((n) => n[0]).join("").slice(0, 2)} size={26} />
              <div className="flex flex-col gap-[2px] pr-3">
                <span className="truncate text-[13.5px] font-medium text-ink">{p.name}</span>
                <span className="truncate font-mono text-[11px] text-eyebrow">{p.email}</span>
              </div>
              <RoleChip role={p.role} />
              <span className="truncate pr-3 text-[13px] text-subtle">{p.agencyName}</span>
              <span className="truncate pr-3 text-[13px] text-subtle">{p.homeName}</span>
            </div>
          ))}
          {filteredPeople.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-meta">{t.noPeopleMatch}</div>
          )}
        </div>
      </div>

      {drawerOpen && (
        <>
          <div className="fixed inset-0 z-10 bg-black/20" onClick={() => setDrawerOpen(false)} />
          <div className="fixed right-0 top-0 z-20 flex h-full w-full flex-col gap-5 bg-surface p-4 shadow-[-12px_0_28px_rgba(0,0,0,.09)] sm:w-[380px] sm:p-6">
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-ink">{t.addHomeTitle}</span>
              <button onClick={() => setDrawerOpen(false)} className="text-lg text-meta hover:text-muted">
                ×
              </button>
            </div>
            <form onSubmit={handleCreateHome} className="flex flex-1 flex-col gap-4">
              <div className="flex flex-col gap-[7px]">
                <label className="text-[13px] font-medium text-body">{t.homeName}</label>
                <TextField value={name} onChange={(e) => setName(e.target.value)} placeholder="Harefield Court" required />
              </div>
              <div className="flex flex-col gap-[7px]">
                <label className="text-[13px] font-medium text-body">{t.address}</label>
                <TextArea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main Street, City" className="h-20" />
              </div>
              <div className="flex flex-col gap-[7px]">
                <label className="text-[13px] font-medium text-body">{t.agency}</label>
                <Select value={selectedAgencyId} onChange={(e) => setSelectedAgencyId(e.target.value)}>
                  <option value="">{t.selectAgencyOptional}</option>
                  {agencies.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </Select>
              </div>
              {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
              <div className="ml-auto flex gap-2">
                <Button type="button" variant="outline" onClick={() => setDrawerOpen(false)}>
                  {dict.common.cancel}
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending ? t.creating : t.createHome}
                </Button>
              </div>
            </form>
          </div>
        </>
      )}

      {agencyDrawerOpen && (
        <>
          <div className="fixed inset-0 z-10 bg-black/20" onClick={() => setAgencyDrawerOpen(false)} />
          <div className="fixed right-0 top-0 z-20 flex h-full w-full flex-col gap-5 bg-surface p-4 shadow-[-12px_0_28px_rgba(0,0,0,.09)] sm:w-[380px] sm:p-6">
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-ink">{t.addAgencyTitle}</span>
              <button onClick={() => setAgencyDrawerOpen(false)} className="text-lg text-meta hover:text-muted">
                ×
              </button>
            </div>
            <form onSubmit={handleCreateAgency} className="flex flex-1 flex-col gap-4">
              <div className="flex flex-col gap-[7px]">
                <label className="text-[13px] font-medium text-body">{t.agencyName}</label>
                <TextField value={agencyName} onChange={(e) => setAgencyName(e.target.value)} placeholder="My Care Agency" required />
              </div>
              {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
              <div className="ml-auto flex gap-2">
                <Button type="button" variant="outline" onClick={() => setAgencyDrawerOpen(false)}>
                  {dict.common.cancel}
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending ? t.creating : t.createAgency}
                </Button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
