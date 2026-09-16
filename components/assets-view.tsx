"use client";

import { useState } from "react";
import Link from "next/link";
import { createAsset, updateAsset, retireAsset, type AssetRow, type AssetInput } from "@/app/actions/assets";
import { Button } from "@/components/ui/button";
import { TextField, Select } from "@/components/ui/inputs";
import { AssetStatusBadge } from "@/components/ui/badges";
import { tableWrapClass, tableHeadRowClass, tableRowClass } from "@/components/ui/table";
import { useDictionary } from "@/lib/i18n/language-provider";

const GRID_COLS = "grid-cols-[minmax(180px,1fr)_140px_160px_110px_140px]";

type FormState = {
  name: string;
  home_id: string;
  asset_type_id: string;
  manufacturer: string;
  model: string;
  serial_number: string;
  location: string;
  purchase_price: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  home_id: "",
  asset_type_id: "",
  manufacturer: "",
  model: "",
  serial_number: "",
  location: "",
  purchase_price: "",
};

export function AssetsView({
  assets,
  homes,
  assetTypes,
  basePath,
  namespace,
}: {
  assets: AssetRow[];
  homes: { id: string; name: string }[];
  assetTypes: { id: string; name: string }[];
  basePath: string;
  namespace: "admin" | "supervisor";
}) {
  const dict = useDictionary();
  const t = namespace === "admin" ? dict.admin.assets : dict.supervisor.assets;

  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const filtered = assets.filter((a) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      a.name.toLowerCase().includes(q) ||
      (a.homes?.name ?? "").toLowerCase().includes(q) ||
      (a.asset_types?.name ?? "").toLowerCase().includes(q)
    );
  });

  function openCreate() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, home_id: homes[0]?.id ?? "", asset_type_id: assetTypes[0]?.id ?? "" });
    setError(null);
    setDrawerOpen(true);
  }

  function openEdit(asset: AssetRow) {
    setEditingId(asset.id);
    setForm({
      name: asset.name,
      home_id: asset.home_id,
      asset_type_id: asset.asset_type_id,
      manufacturer: asset.manufacturer ?? "",
      model: asset.model ?? "",
      serial_number: asset.serial_number ?? "",
      location: asset.location ?? "",
      purchase_price: asset.purchase_price !== null ? String(asset.purchase_price) : "",
    });
    setError(null);
    setDrawerOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.home_id || !form.asset_type_id) return;

    setError(null);
    setPending(true);

    const parsedPrice = Number(form.purchase_price);
    const input: AssetInput = {
      home_id: form.home_id,
      asset_type_id: form.asset_type_id,
      name: form.name.trim(),
      manufacturer: form.manufacturer.trim(),
      model: form.model.trim(),
      serial_number: form.serial_number.trim(),
      location: form.location.trim(),
      purchase_price: form.purchase_price.trim() && !Number.isNaN(parsedPrice) ? parsedPrice : undefined,
    };

    try {
      if (editingId) {
        await updateAsset(editingId, input);
      } else {
        await createAsset(input);
      }
      setDrawerOpen(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : editingId ? t.updateAssetError : t.createAssetError
      );
    } finally {
      setPending(false);
    }
  }

  async function handleRetire(asset: AssetRow) {
    if (!window.confirm(t.retireConfirm)) return;
    try {
      await retireAsset(asset.id);
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
          <Button onClick={openCreate}>{t.addAsset}</Button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 bg-canvas p-4 sm:p-7">
        <div className={tableWrapClass}>
          <div className={`${tableHeadRowClass} ${GRID_COLS}`}>
            <span>{t.assetName}</span>
            <span>{t.assetType}</span>
            <span>{t.home}</span>
            <span>{t.status}</span>
            <span>{dict.common.table.actions}</span>
          </div>
          {filtered.map((a) => (
            <div key={a.id} className={`${tableRowClass} ${GRID_COLS}`}>
              <Link
                href={`${basePath}/${a.id}`}
                className="truncate pr-3 text-[13.5px] font-medium text-link"
              >
                {a.name}
              </Link>
              <span className="truncate pr-3 text-[13px] text-subtle">{a.asset_types?.name ?? "—"}</span>
              <span className="truncate pr-3 text-[13px] text-subtle">{a.homes?.name ?? "—"}</span>
              <AssetStatusBadge status={a.status} />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(a)}
                  className="text-[12.5px] text-link hover:underline"
                >
                  {dict.common.edit}
                </button>
                {a.status !== "retired" && (
                  <button
                    type="button"
                    onClick={() => handleRetire(a)}
                    className="text-[12.5px] text-meta hover:text-urgent hover:underline"
                  >
                    {t.retire}
                  </button>
                )}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-meta">
              {assets.length === 0 ? t.noAssetsYet : t.noMatch}
            </div>
          )}
        </div>
      </div>

      {drawerOpen && (
        <>
          <div className="fixed inset-0 z-10 bg-black/20" onClick={() => setDrawerOpen(false)} />
          <div className="fixed right-0 top-0 z-20 flex h-full w-full flex-col gap-5 bg-surface p-4 shadow-[-12px_0_28px_rgba(0,0,0,.09)] sm:w-[380px] sm:p-6">
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-ink">
                {editingId ? t.editAssetTitle : t.addAssetTitle}
              </span>
              <button onClick={() => setDrawerOpen(false)} className="text-lg text-meta hover:text-muted">
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 overflow-auto">
              <div className="flex flex-col gap-[7px]">
                <label className="text-[13px] font-medium text-body">{t.assetName}</label>
                <TextField
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder={t.assetNamePlaceholder}
                  required
                />
              </div>
              <div className="flex flex-col gap-[7px]">
                <label className="text-[13px] font-medium text-body">{t.assetType}</label>
                <Select
                  value={form.asset_type_id}
                  onChange={(e) => setForm((f) => ({ ...f, asset_type_id: e.target.value }))}
                  required
                >
                  {assetTypes.map((at) => (
                    <option key={at.id} value={at.id}>
                      {at.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex flex-col gap-[7px]">
                <label className="text-[13px] font-medium text-body">{t.home}</label>
                <Select
                  value={form.home_id}
                  onChange={(e) => setForm((f) => ({ ...f, home_id: e.target.value }))}
                  required
                >
                  {homes.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex flex-col gap-[7px]">
                <label className="text-[13px] font-medium text-body">{t.manufacturer}</label>
                <TextField
                  value={form.manufacturer}
                  onChange={(e) => setForm((f) => ({ ...f, manufacturer: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-[7px]">
                <label className="text-[13px] font-medium text-body">{t.model}</label>
                <TextField
                  value={form.model}
                  onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-[7px]">
                <label className="text-[13px] font-medium text-body">{t.serialNumber}</label>
                <TextField
                  value={form.serial_number}
                  onChange={(e) => setForm((f) => ({ ...f, serial_number: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-[7px]">
                <label className="text-[13px] font-medium text-body">{t.location}</label>
                <TextField
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-[7px]">
                <label className="text-[13px] font-medium text-body">{t.purchasePrice}</label>
                <TextField
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.purchase_price}
                  onChange={(e) => setForm((f) => ({ ...f, purchase_price: e.target.value }))}
                />
              </div>
              {error && (
                <p className="text-sm text-red-700" role="alert">
                  {error}
                </p>
              )}
              <div className="mt-auto flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setDrawerOpen(false)}
                >
                  {dict.common.cancel}
                </Button>
                <Button type="submit" className="flex-1" disabled={pending}>
                  {pending ? t.creating : editingId ? t.saveChanges : t.createAsset}
                </Button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
