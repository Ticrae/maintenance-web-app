"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, buttonClasses } from "@/components/ui/button";
import { TextField, TextArea, Select } from "@/components/ui/inputs";
import { GuideStatusBadge } from "@/components/ui/badges";
import {
  createAssetType,
  updateAssetType,
  deleteAssetType,
  createGuide,
  deleteGuide,
  getGuideDetail,
  type GuideListRow,
  type GuideDetail,
} from "@/app/actions/troubleshooting";
import { useDictionary } from "@/lib/i18n/language-provider";
import { GuideDetailPanel } from "./guide-detail";

export type AssetType = {
  id: string;
  name: string;
  description: string | null;
};
export type AgencyOption = { id: string; name: string };
export type GuideListItem = GuideListRow & { stepCount: number };

export function TroubleshootingManager({
  assetTypes: initialAssetTypes,
  agencies,
  guides: initialGuides,
}: {
  assetTypes: AssetType[];
  agencies: AgencyOption[];
  guides: GuideListItem[];
}) {
  const dict = useDictionary();
  const t = dict.admin.troubleshooting;

  const [assetTypes, setAssetTypes] = useState(initialAssetTypes);
  const [guides, setGuides] = useState(initialGuides);
  const [assetTypeFilter, setAssetTypeFilter] = useState<string | "all">("all");
  const [search, setSearch] = useState("");
  const [selectedGuideId, setSelectedGuideId] = useState<string | null>(null);
  const [guideDetail, setGuideDetail] = useState<GuideDetail | null>(null);

  const [assetTypeDrawer, setAssetTypeDrawer] = useState<
    AssetType | "new" | null
  >(null);
  const [newGuideOpen, setNewGuideOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredGuides = useMemo(() => {
    const q = search.trim().toLowerCase();
    return guides.filter((g) => {
      if (assetTypeFilter !== "all" && g.asset_type_id !== assetTypeFilter)
        return false;
      if (
        q &&
        !g.title.toLowerCase().includes(q) &&
        !g.problem.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [guides, assetTypeFilter, search]);

  useEffect(() => {
    if (!selectedGuideId) return;
    let cancelled = false;
    getGuideDetail(selectedGuideId).then((detail) => {
      if (!cancelled) setGuideDetail(detail);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedGuideId]);

  const activeGuideDetail =
    selectedGuideId && guideDetail?.id === selectedGuideId ? guideDetail : null;
  const detailLoading = !!selectedGuideId && !activeGuideDetail;

  function refreshGuideDetail() {
    if (!selectedGuideId) return;
    getGuideDetail(selectedGuideId).then(setGuideDetail);
  }

  async function handleDeleteGuide(id: string) {
    setError(null);
    try {
      await deleteGuide(id);
      setGuides((gs) => gs.filter((g) => g.id !== id));
      if (selectedGuideId === id) setSelectedGuideId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.deleteGuideError);
    }
  }

  return (
    <div className="relative flex flex-1 flex-col gap-6 overflow-auto bg-canvas p-4 lg:flex-row lg:p-7">
      <div className="flex w-full flex-none flex-col gap-6 lg:w-[300px]">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[15px] font-semibold text-ink">
              {t.assetTypesHeading}
            </span>
            <Button variant="outline" onClick={() => setAssetTypeDrawer("new")}>
              {t.addAssetType}
            </Button>
          </div>
          {assetTypes.length === 0 ? (
            <p className="px-1 text-[12px] text-subtle">{t.noAssetTypesYet}</p>
          ) : (
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setAssetTypeFilter("all")}
                className={`rounded-md px-3 py-[8px] text-left text-[13px] ${
                  assetTypeFilter === "all"
                    ? "bg-graphite font-medium text-white"
                    : "text-muted hover:bg-hover"
                }`}
              >
                {dict.common.all} · {guides.length}
              </button>
              {assetTypes.map((a) => (
                <div key={a.id} className="group flex items-center gap-1">
                  <button
                    onClick={() => setAssetTypeFilter(a.id)}
                    className={`flex-1 rounded-md px-3 py-[8px] text-left text-[13px] ${
                      assetTypeFilter === a.id
                        ? "bg-graphite font-medium text-white"
                        : "text-muted hover:bg-hover"
                    }`}
                  >
                    {a.name} ·{" "}
                    {guides.filter((g) => g.asset_type_id === a.id).length}
                  </button>
                  <button
                    onClick={() => setAssetTypeDrawer(a)}
                    className="hidden text-xs text-meta hover:text-ink group-hover:inline"
                    aria-label={dict.common.edit}
                  >
                    {dict.common.edit}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-[15px] font-semibold text-ink">
            {t.guidesHeading}
          </span>
          <div className="flex flex-wrap gap-[10px]">
            <TextField
              placeholder={t.searchGuidesPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-[220px]"
            />
            <Button
              onClick={() => setNewGuideOpen(true)}
              disabled={assetTypes.length === 0}
            >
              {t.newGuide}
            </Button>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
          <div className="flex w-full flex-none flex-col gap-1 overflow-auto lg:w-[280px]">
            {filteredGuides.length === 0 && (
              <p className="px-1 text-[12px] text-subtle">
                {guides.length === 0 ? t.noGuidesYet : t.noGuidesMatch}
              </p>
            )}
            {filteredGuides.map((g) => (
              <button
                key={g.id}
                onClick={() => setSelectedGuideId(g.id)}
                className={`flex flex-col gap-1 rounded-md px-3 py-[10px] text-left ${
                  selectedGuideId === g.id ? "bg-hover" : "hover:bg-hover"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[13.5px] font-medium text-ink">
                    {g.title}
                  </span>
                  <GuideStatusBadge status={g.status} />
                </div>
                <span className="truncate font-mono text-[11px] text-eyebrow">
                  {g.asset_types?.name ?? "—"} · {t.stepsCount(g.stepCount)}
                </span>
              </button>
            ))}
          </div>

          <div className="min-w-0 flex-1 rounded-lg border border-black/[.09] bg-surface">
            {!selectedGuideId ? (
              <div className="flex h-full items-center justify-center p-8 text-center text-sm text-meta">
                {t.selectGuidePrompt}
              </div>
            ) : detailLoading || !activeGuideDetail ? (
              <div className="p-8 text-center text-sm text-meta">…</div>
            ) : (
              <GuideDetailPanel
                guide={activeGuideDetail}
                assetTypes={assetTypes}
                agencies={agencies}
                onChanged={(updated) => {
                  refreshGuideDetail();
                  setGuides((gs) =>
                    gs.map((g) =>
                      g.id === updated.id ? { ...g, ...updated } : g,
                    ),
                  );
                }}
                onDeleteGuide={() => handleDeleteGuide(activeGuideDetail.id)}
                onRefresh={refreshGuideDetail}
              />
            )}
          </div>
        </div>
      </div>

      {assetTypeDrawer && (
        <AssetTypeDrawer
          value={assetTypeDrawer === "new" ? null : assetTypeDrawer}
          onClose={() => setAssetTypeDrawer(null)}
          onCreated={(created) =>
            setAssetTypes((list) =>
              [...list, created].sort((a, b) => a.name.localeCompare(b.name)),
            )
          }
          onUpdated={(updated) =>
            setAssetTypes((list) =>
              list.map((a) => (a.id === updated.id ? updated : a)),
            )
          }
          onDeleted={(id) => {
            setAssetTypes((list) => list.filter((a) => a.id !== id));
            if (assetTypeFilter === id) setAssetTypeFilter("all");
          }}
        />
      )}

      {newGuideOpen && (
        <NewGuideDrawer
          assetTypes={assetTypes}
          agencies={agencies}
          defaultAssetTypeId={assetTypeFilter === "all" ? "" : assetTypeFilter}
          onClose={() => setNewGuideOpen(false)}
          onCreated={(created) => {
            setGuides((gs) => [{ ...created, stepCount: 0 }, ...gs]);
            setSelectedGuideId(created.id);
            setNewGuideOpen(false);
          }}
        />
      )}
    </div>
  );
}

function AssetTypeDrawer({
  value,
  onClose,
  onCreated,
  onUpdated,
  onDeleted,
}: {
  value: AssetType | null;
  onClose: () => void;
  onCreated: (a: AssetType) => void;
  onUpdated: (a: AssetType) => void;
  onDeleted: (id: string) => void;
}) {
  const dict = useDictionary();
  const t = dict.admin.troubleshooting;
  const [name, setName] = useState(value?.name ?? "");
  const [description, setDescription] = useState(value?.description ?? "");
  const [pending, setPending] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setPending(true);
    setError(null);
    try {
      if (value) {
        await updateAssetType(value.id, {
          name: name.trim(),
          description: description.trim(),
        });
        onUpdated({
          id: value.id,
          name: name.trim(),
          description: description.trim() || null,
        });
      } else {
        const created = await createAssetType({
          name: name.trim(),
          description: description.trim(),
        });
        onCreated(created);
      }
      onClose();
    } catch (e2) {
      setError(
        e2 instanceof Error
          ? e2.message
          : value
            ? t.updateAssetTypeError
            : t.createAssetTypeError,
      );
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    if (!value) return;
    setPending(true);
    setError(null);
    try {
      await deleteAssetType(value.id);
      onDeleted(value.id);
      onClose();
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : t.deleteAssetTypeError);
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-10 bg-black/20" onClick={onClose} />
      <div className="fixed right-0 top-0 z-20 flex h-full w-full flex-col gap-5 bg-surface p-4 shadow-[-12px_0_28px_rgba(0,0,0,.09)] sm:w-[380px] sm:p-6">
        <div className="flex items-center justify-between">
          <span className="text-base font-semibold text-ink">
            {value ? t.editAssetTypeTitle : t.addAssetTypeTitle}
          </span>
          <button
            onClick={onClose}
            className="text-lg text-meta hover:text-muted"
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4">
          <div className="flex flex-col gap-[7px]">
            <label className="text-[13px] font-medium text-body">
              {t.assetTypeName}
            </label>
            <TextField
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.assetTypeNamePlaceholder}
              required
            />
          </div>
          <div className="flex flex-col gap-[7px]">
            <label className="text-[13px] font-medium text-body">
              {t.assetTypeDescription}
            </label>
            <TextArea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-20"
            />
          </div>
          {error && (
            <p className="text-sm text-red-700" role="alert">
              {error}
            </p>
          )}
          <div className="mt-auto flex items-center gap-2">
            {value &&
              (confirmDelete ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={pending}
                    className="text-xs font-medium text-urgent hover:underline"
                  >
                    {dict.common.confirm}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="text-xs text-meta hover:underline"
                  >
                    {dict.common.cancel}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="text-xs font-medium text-urgent hover:underline"
                >
                  {dict.common.delete}
                </button>
              ))}
            <div className=" flex  gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                {dict.common.cancel}
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? dict.common.saving : dict.common.save}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}

function NewGuideDrawer({
  assetTypes,
  agencies,
  defaultAssetTypeId,
  onClose,
  onCreated,
}: {
  assetTypes: AssetType[];
  agencies: AgencyOption[];
  defaultAssetTypeId: string;
  onClose: () => void;
  onCreated: (guide: GuideListRow) => void;
}) {
  const dict = useDictionary();
  const t = dict.admin.troubleshooting;
  const [assetTypeId, setAssetTypeId] = useState(defaultAssetTypeId);
  const [agencyId, setAgencyId] = useState("");
  const [problem, setProblem] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!assetTypeId || !agencyId || !problem.trim() || !title.trim()) return;
    setPending(true);
    setError(null);
    try {
      const created = await createGuide({
        agency_id: agencyId,
        asset_type_id: assetTypeId,
        problem: problem.trim(),
        title: title.trim(),
        description: description.trim(),
      });
      onCreated(created);
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : t.createGuideError);
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-10 bg-black/20" onClick={onClose} />
      <div className="fixed right-0 top-0 z-20 flex h-full w-full flex-col gap-5 bg-surface p-4 shadow-[-12px_0_28px_rgba(0,0,0,.09)] sm:w-[420px] sm:p-6">
        <div className="flex items-center justify-between">
          <span className="text-base font-semibold text-ink">
            {t.newGuideTitle}
          </span>
          <button
            onClick={onClose}
            className="text-lg text-meta hover:text-muted"
          >
            ×
          </button>
        </div>
        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col gap-4 overflow-auto"
        >
          <div className="flex gap-[14px]">
            <div className="flex flex-1 flex-col gap-[7px]">
              <label className="text-[13px] font-medium text-body">
                {t.assetTypeField}
              </label>
              <Select
                value={assetTypeId}
                onChange={(e) => setAssetTypeId(e.target.value)}
                required
              >
                <option value="">{t.selectAssetType}</option>
                {assetTypes.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-1 flex-col gap-[7px]">
              <label className="text-[13px] font-medium text-body">
                {t.agencyField}
              </label>
              <Select
                value={agencyId}
                onChange={(e) => setAgencyId(e.target.value)}
                required
              >
                <option value="">{t.selectAgency}</option>
                {agencies.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="flex flex-col gap-[7px]">
            <label className="text-[13px] font-medium text-body">
              {t.problemField}
            </label>
            <TextField
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder={t.problemPlaceholder}
              required
            />
          </div>
          <div className="flex flex-col gap-[7px]">
            <label className="text-[13px] font-medium text-body">
              {t.guideTitleField}
            </label>
            <TextField
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.guideTitlePlaceholder}
              required
            />
          </div>
          <div className="flex flex-col gap-[7px]">
            <label className="text-[13px] font-medium text-body">
              {t.descriptionOptional}
            </label>
            <TextArea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-20"
            />
          </div>
          {error && (
            <p className="text-sm text-red-700" role="alert">
              {error}
            </p>
          )}
          <div className="mt-auto flex gap-[10px]">
            <button
              type="button"
              onClick={onClose}
              className={buttonClasses("outline", "flex-1")}
            >
              {dict.common.cancel}
            </button>
            <button
              type="submit"
              disabled={pending}
              className={buttonClasses("primary", "flex-1")}
            >
              {pending ? dict.common.saving : t.createGuide}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
