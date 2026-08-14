"use client";

import { useState } from "react";
import { Button, buttonClasses } from "@/components/ui/button";
import { Avatar } from "@/components/ui/misc";
import { TextField, TextArea } from "@/components/ui/inputs";
import { RoleChip } from "@/components/ui/badges";
import { tableWrapClass, tableHeadRowClass, tableRowClass } from "@/components/ui/table";
import { useAppData } from "@/lib/app-data-context";
import type { Role } from "@/lib/theme";

const ROLES: (Role | "All")[] = ["All", "staff", "maintenance", "agency_admin", "super_admin"];
const PEOPLE_GRID_COLS = "grid-cols-[36px_minmax(180px,1fr)_130px_200px_180px_100px]";

export default function HomesAndStaffPage() {
  const { homes, people, addHome } = useAppData();
  const [selectedHome, setSelectedHome] = useState(homes[0]?.id);
  const [roleFilter, setRoleFilter] = useState<Role | "All">("All");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [beds, setBeds] = useState("");
  const [prefix, setPrefix] = useState("");

  const filteredPeople =
    roleFilter === "All" ? people : people.filter((p) => p.role === roleFilter);

  function handleCreateHome(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !prefix.trim()) return;
    addHome({
      id: prefix.toLowerCase(),
      name: name.trim(),
      beds: parseInt(beds, 10) || 0,
      prefix: prefix.toUpperCase(),
      open: 0,
    });
    setDrawerOpen(false);
    setName("");
    setAddress("");
    setBeds("");
    setPrefix("");
  }

  return (
    <div className="relative flex flex-1 flex-col gap-6 overflow-auto bg-canvas p-4 lg:flex-row lg:p-7">
      <div className="flex w-full flex-none flex-col gap-3 lg:w-[330px]">
        <div className="flex items-center justify-between">
          <span className="text-[15px] font-semibold text-ink">Homes</span>
          <Button variant="outline" onClick={() => setDrawerOpen(true)}>
            Add home
          </Button>
        </div>
        <div className="flex flex-col gap-1">
          {homes.map((h) => (
            <button
              key={h.id}
              onClick={() => setSelectedHome(h.id)}
              className={`flex items-center justify-between rounded-md px-3 py-[10px] text-left ${
                selectedHome === h.id ? "bg-selected" : "hover:bg-hover"
              }`}
            >
              <div className="flex flex-col">
                <span className="text-[13.5px] font-medium text-ink">{h.name}</span>
                <span className="font-mono text-[11.5px] text-eyebrow">
                  {h.beds} beds · prefix {h.prefix}
                </span>
              </div>
              <span className="font-mono text-xs text-meta">{h.open} open</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-[15px] font-semibold text-ink">People</span>
          <div className="flex flex-wrap gap-[10px]">
            <Button variant="outline">Add staff</Button>
            <Button>Add maintenance worker</Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {ROLES.map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`rounded-full px-3 py-[6px] text-xs ${
                roleFilter === r
                  ? "bg-graphite text-white"
                  : "border border-black/[.14] text-muted"
              }`}
            >
              {r} ·{" "}
              {r === "All" ? people.length : people.filter((p) => p.role === r).length}
            </button>
          ))}
        </div>

        <div className={tableWrapClass}>
          <div
            className={`${tableHeadRowClass} ${PEOPLE_GRID_COLS}`}
          >
            <span />
            <span>Name</span>
            <span>Role</span>
            <span>Homes</span>
            <span>Skills · notes</span>
            <span>Status</span>
          </div>
          {filteredPeople.map((p) => (
            <div
              key={p.id}
              className={`${tableRowClass} ${PEOPLE_GRID_COLS}`}
            >
              <Avatar initials={p.name.split(" ").map((n) => n[0]).join("")} size={26} />
              <div className="flex flex-col gap-[2px] pr-3">
                <span className="truncate text-[13.5px] font-medium text-ink">
                  {p.name}
                </span>
                <span className="truncate font-mono text-[11px] text-eyebrow">
                  {p.email}
                </span>
              </div>
              <RoleChip role={p.role} />
              <span className="truncate pr-3 text-[13px] text-subtle">{p.homes}</span>
              <span className="truncate pr-3 text-[13px] text-subtle">{p.skills}</span>
              <span
                className={`text-[13px] ${
                  p.status === "Invited" ? "text-eyebrow" : "text-ink"
                }`}
              >
                {p.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {drawerOpen && (
        <>
          <div
            className="fixed inset-0 z-10 bg-black/20"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="fixed right-0 top-0 z-20 flex h-full w-full flex-col gap-5 bg-surface p-4 shadow-[-12px_0_28px_rgba(0,0,0,.09)] sm:w-[380px] sm:p-6">
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-ink">Add home</span>
              <button
                onClick={() => setDrawerOpen(false)}
                className="text-lg text-meta hover:text-muted"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateHome} className="flex flex-1 flex-col gap-4">
              <div className="flex flex-col gap-[7px]">
                <label className="text-[13px] font-medium text-body">Home name</label>
                <TextField
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Harefield Court"
                  required
                />
              </div>
              <div className="flex flex-col gap-[7px]">
                <label className="text-[13px] font-medium text-body">Address</label>
                <TextArea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="h-16"
                />
              </div>
              <div className="flex gap-[14px]">
                <div className="flex flex-1 flex-col gap-[7px]">
                  <label className="text-[13px] font-medium text-body">Beds</label>
                  <TextField
                    value={beds}
                    onChange={(e) => setBeds(e.target.value)}
                    placeholder="32"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-[7px]">
                  <label className="text-[13px] font-medium text-body">Ref prefix</label>
                  <TextField
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value)}
                    placeholder="HC"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-[7px]">
                <label className="text-[13px] font-medium text-body">
                  Maintenance coverage
                </label>
                <div className="flex flex-wrap gap-2">
                  <span className="flex items-center gap-1 rounded-full bg-chip px-3 py-[6px] text-xs text-body">
                    M. Okoro ×
                  </span>
                  <span className="rounded-full border border-dashed border-black/[.2] px-3 py-[6px] text-xs text-muted">
                    + add worker
                  </span>
                </div>
              </div>
              <div className="mt-auto flex gap-[10px]">
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className={buttonClasses("outline", "flex-1")}
                >
                  Cancel
                </button>
                <button type="submit" className={buttonClasses("primary", "flex-1")}>
                  Create home
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
