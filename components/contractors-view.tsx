"use client";

import { useState } from "react";
import {
  createContractor,
  updateContractor,
  retireContractor,
  type ContractorRow,
  type ContractorInput,
} from "@/app/actions/contractors";
import { Button } from "@/components/ui/button";
import { TextField, Select } from "@/components/ui/inputs";
import { tableWrapClass, tableHeadRowClass, tableRowClass } from "@/components/ui/table";
import { useDictionary } from "@/lib/i18n/language-provider";

const GRID_COLS = "grid-cols-[minmax(180px,1fr)_140px_180px_140px_110px]";

type FormState = {
  name: string;
  trade: string;
  contact_name: string;
  phone: string;
  email: string;
  agency_id: string;
};

export function ContractorsView({
  contractors,
  agencies,
  namespace,
}: {
  contractors: ContractorRow[];
  agencies: { id: string; name: string }[];
  namespace: "admin" | "supervisor";
}) {
  const dict = useDictionary();
  const t = namespace === "admin" ? dict.admin.contractors : dict.supervisor.contractors;

  const emptyForm: FormState = {
    name: "",
    trade: "",
    contact_name: "",
    phone: "",
    email: "",
    agency_id: agencies[0]?.id ?? "",
  };

  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const filtered = contractors.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return c.name.toLowerCase().includes(q) || (c.trade ?? "").toLowerCase().includes(q);
  });

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
    setDrawerOpen(true);
  }

  function openEdit(c: ContractorRow) {
    setEditingId(c.id);
    setForm({
      name: c.name,
      trade: c.trade ?? "",
      contact_name: c.contact_name ?? "",
      phone: c.phone ?? "",
      email: c.email ?? "",
      agency_id: c.agency_id,
    });
    setError(null);
    setDrawerOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.agency_id) return;
    setError(null);
    setPending(true);

    const input: ContractorInput = {
      agency_id: form.agency_id,
      name: form.name.trim(),
      trade: form.trade.trim(),
      contact_name: form.contact_name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
    };

    try {
      if (editingId) {
        await updateContractor(editingId, input);
      } else {
        await createContractor(input);
      }
      setDrawerOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : editingId ? t.updateError : t.createError);
    } finally {
      setPending(false);
    }
  }

  async function handleRetire(c: ContractorRow) {
    if (!window.confirm(t.retireConfirm)) return;
    try {
      await retireContractor(c.id);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : t.retireError);
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <div className="flex min-h-[62px] flex-none flex-col items-stretch justify-center gap-3 border-b border-black/[.08] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <div className="flex flex-col gap-[2px]">
          <span className="text-[17px] font-semibold tracking-[-.01em] text-ink">{t.title}</span>
          <span className="text-xs text-meta">{t.subtitle}</span>
        </div>
        <div className="flex flex-wrap items-center gap-[10px]">
          <TextField
            placeholder={t.searchPlaceholder}
            className="w-full sm:w-[260px]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button onClick={openCreate}>{t.addContractor}</Button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 bg-canvas p-4 sm:p-7">
        <div className={tableWrapClass}>
          <div className={`${tableHeadRowClass} ${GRID_COLS}`}>
            <span>{t.name}</span>
            <span>{t.trade}</span>
            <span>{t.contact}</span>
            <span>{t.phone}</span>
            <span>{dict.common.table.actions}</span>
          </div>
          {filtered.map((c) => (
            <div key={c.id} className={`${tableRowClass} ${GRID_COLS}`}>
              <span className="truncate pr-3 text-[13.5px] font-medium text-ink">
                {c.name}
                {c.status === "inactive" && <span className="ml-2 font-mono text-[10.5px] text-faint">{t.inactive}</span>}
              </span>
              <span className="truncate pr-3 text-[13px] text-subtle">
                {c.trade ?? "—"}
                {agencies.length > 1 && c.agencies?.name && (
                  <span className="ml-1 font-mono text-[10.5px] text-eyebrow">· {c.agencies.name}</span>
                )}
              </span>
              <span className="truncate pr-3 text-[13px] text-subtle">{c.contact_name ?? c.email ?? "—"}</span>
              <span className="truncate pr-3 font-mono text-[12px] text-subtle">{c.phone ?? "—"}</span>
              <div className="flex gap-2">
                <button type="button" onClick={() => openEdit(c)} className="text-[12.5px] text-link hover:underline">
                  {dict.common.edit}
                </button>
                {c.status !== "inactive" && (
                  <button type="button" onClick={() => handleRetire(c)} className="text-[12.5px] text-meta hover:text-urgent hover:underline">
                    {t.retire}
                  </button>
                )}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-meta">{contractors.length === 0 ? t.noContractorsYet : t.noMatch}</div>
          )}
        </div>
      </div>

      {drawerOpen && (
        <>
          <div className="fixed inset-0 z-10 bg-black/20" onClick={() => setDrawerOpen(false)} />
          <div className="fixed right-0 top-0 z-20 flex h-full w-full flex-col gap-5 bg-surface p-4 shadow-[-12px_0_28px_rgba(0,0,0,.09)] sm:w-[380px] sm:p-6">
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-ink">{editingId ? t.editContractorTitle : t.addContractorTitle}</span>
              <button onClick={() => setDrawerOpen(false)} className="text-lg text-meta hover:text-muted">
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 overflow-auto">
              <div className="flex flex-col gap-[7px]">
                <label className="text-[13px] font-medium text-body">{t.name}</label>
                <TextField value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder={t.namePlaceholder} required />
              </div>
              <div className="flex flex-col gap-[7px]">
                <label className="text-[13px] font-medium text-body">{t.trade}</label>
                <TextField value={form.trade} onChange={(e) => setForm((f) => ({ ...f, trade: e.target.value }))} placeholder={t.tradePlaceholder} />
              </div>
              {agencies.length > 1 && (
                <div className="flex flex-col gap-[7px]">
                  <label className="text-[13px] font-medium text-body">{dict.common.table.agency}</label>
                  <Select value={form.agency_id} onChange={(e) => setForm((f) => ({ ...f, agency_id: e.target.value }))} required>
                    {agencies.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </Select>
                </div>
              )}
              <div className="flex flex-col gap-[7px]">
                <label className="text-[13px] font-medium text-body">{t.contact}</label>
                <TextField value={form.contact_name} onChange={(e) => setForm((f) => ({ ...f, contact_name: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-[7px]">
                <label className="text-[13px] font-medium text-body">{t.phone}</label>
                <TextField value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-[7px]">
                <label className="text-[13px] font-medium text-body">{t.email}</label>
                <TextField type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
              {error && (
                <p className="text-sm text-red-700" role="alert">
                  {error}
                </p>
              )}
              <div className="mt-auto flex gap-2 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setDrawerOpen(false)}>
                  {dict.common.cancel}
                </Button>
                <Button type="submit" className="flex-1" disabled={pending}>
                  {pending ? t.creating : editingId ? t.saveChanges : t.createContractor}
                </Button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
