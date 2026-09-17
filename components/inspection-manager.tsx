"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { TextField, TextArea, Select } from "@/components/ui/inputs";
import {
  createTemplate,
  updateTemplateMeta,
  deleteTemplate,
  createItem,
  updateItem,
  deleteItem,
  moveItem,
  getTemplateDetail,
  type TemplateListRow,
  type TemplateDetail,
  type ItemRow,
  type TemplateStatus,
} from "@/app/actions/inspections";
import { useDictionary } from "@/lib/i18n/language-provider";

export type AgencyOption = { id: string; name: string };
export type TemplateListItem = TemplateListRow & { itemCount: number };
type Namespace = "admin" | "supervisor";

const STATUSES: TemplateStatus[] = ["draft", "published", "archived"];

// Picks the right role-scoped translation namespace, since admin and
// supervisor share this authoring UI but have separate dictionary entries.
function useInspectionsDict(namespace: Namespace) {
  const dict = useDictionary();
  return namespace === "admin" ? dict.admin.inspections : dict.supervisor.inspections;
}

// Checklist-authoring tool shared by admin and supervisor: a searchable
// template list on the left, and the selected template's editable detail
// (metadata + items) on the right.
export function InspectionManager({
  agencies,
  templates: initialTemplates,
  namespace,
}: {
  agencies: AgencyOption[];
  templates: TemplateListItem[];
  namespace: Namespace;
}) {
  const t = useInspectionsDict(namespace);

  const [templates, setTemplates] = useState(initialTemplates);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<TemplateDetail | null>(null);
  const [newTemplateOpen, setNewTemplateOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter((tpl) => tpl.name.toLowerCase().includes(q));
  }, [templates, search]);

  // Loads the selected template's full detail (items included) whenever the
  // selection changes; `cancelled` guards against a stale response landing
  // after the user has since picked a different template.
  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    getTemplateDetail(selectedId).then((d) => {
      if (!cancelled) setDetail(d);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  // Guard against rendering stale detail for a template that's no longer selected
  const activeDetail = selectedId && detail?.id === selectedId ? detail : null;
  const detailLoading = !!selectedId && !activeDetail;

  // Re-fetches the current template's detail after an edit (item add/edit/move/delete)
  function refreshDetail() {
    if (!selectedId) return;
    getTemplateDetail(selectedId).then(setDetail);
  }

  async function handleDelete(id: string) {
    setError(null);
    try {
      await deleteTemplate(id);
      setTemplates((ts) => ts.filter((tpl) => tpl.id !== id));
      if (selectedId === id) setSelectedId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.deleteTemplateError);
    }
  }

  return (
    <div className="relative flex flex-1 flex-col gap-6 overflow-auto bg-canvas p-4 lg:flex-row lg:p-7">
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-[15px] font-semibold text-ink">{t.templatesHeading}</span>
          <div className="flex flex-wrap gap-[10px]">
            <TextField
              placeholder={t.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-[220px]"
            />
            <Button onClick={() => setNewTemplateOpen(true)} disabled={agencies.length === 0}>
              {t.newTemplate}
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
            {filtered.length === 0 && (
              <p className="px-1 text-[12px] text-subtle">{templates.length === 0 ? t.noTemplatesYet : t.noTemplatesMatch}</p>
            )}
            {filtered.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => setSelectedId(tpl.id)}
                className={`flex flex-col gap-1 rounded-md px-3 py-[10px] text-left ${
                  selectedId === tpl.id ? "bg-hover" : "hover:bg-hover"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[13.5px] font-medium text-ink">{tpl.name}</span>
                  <span className="font-mono text-[10.5px] uppercase tracking-[.06em] text-eyebrow">
                    {t.status[tpl.status]}
                  </span>
                </div>
                <span className="truncate font-mono text-[11px] text-eyebrow">
                  {tpl.agencies?.name ?? "—"} · {t.itemsCount(tpl.itemCount)}
                </span>
              </button>
            ))}
          </div>

          <div className="min-w-0 flex-1 overflow-auto rounded-lg border border-black/[.09] bg-surface">
            {!selectedId ? (
              <div className="flex h-full items-center justify-center p-8 text-center text-sm text-meta">
                {t.selectTemplatePrompt}
              </div>
            ) : detailLoading || !activeDetail ? (
              <div className="p-8 text-center text-sm text-meta">…</div>
            ) : (
              <TemplateDetailPanel
                key={activeDetail.id}
                template={activeDetail}
                agencies={agencies}
                namespace={namespace}
                onChanged={(updated) => {
                  refreshDetail();
                  setTemplates((ts) => ts.map((tpl) => (tpl.id === updated.id ? { ...tpl, ...updated } : tpl)));
                }}
                onDelete={() => handleDelete(activeDetail.id)}
                onRefresh={refreshDetail}
              />
            )}
          </div>
        </div>
      </div>

      {newTemplateOpen && (
        <NewTemplateDrawer
          agencies={agencies}
          namespace={namespace}
          onClose={() => setNewTemplateOpen(false)}
          onCreated={(created) => {
            setTemplates((ts) => [{ ...created, itemCount: 0 }, ...ts]);
            setSelectedId(created.id);
            setNewTemplateOpen(false);
          }}
        />
      )}
    </div>
  );
}

// Right-hand panel: editable template metadata (name/agency/status/
// description) plus its items grouped by section, with an add-item form.
function TemplateDetailPanel({
  template,
  agencies,
  namespace,
  onChanged,
  onDelete,
  onRefresh,
}: {
  template: TemplateDetail;
  agencies: AgencyOption[];
  namespace: Namespace;
  onChanged: (updated: TemplateListRow) => void;
  onDelete: () => void;
  onRefresh: () => void;
}) {
  const dict = useDictionary();
  const t = useInspectionsDict(namespace);

  const [name, setName] = useState(template.name);
  const [description, setDescription] = useState(template.description ?? "");
  const [status, setStatus] = useState<TemplateStatus>(template.status);
  const [agencyId, setAgencyId] = useState(template.agency_id);
  const [pending, setPending] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [itemLabel, setItemLabel] = useState("");
  const [itemSection, setItemSection] = useState("");

  // Persists the template's editable metadata fields
  async function handleSaveMeta(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !agencyId) return;
    setPending(true);
    setError(null);
    try {
      await updateTemplateMeta(template.id, {
        name: name.trim(),
        description: description.trim(),
        status,
        agency_id: agencyId,
      });
      onChanged({ ...template, name: name.trim(), description: description.trim() || null, status, agency_id: agencyId });
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : t.updateTemplateError);
    } finally {
      setPending(false);
    }
  }

  // Appends a new checklist item to this template
  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!itemLabel.trim()) return;
    setError(null);
    try {
      await createItem({ template_id: template.id, section: itemSection.trim(), label: itemLabel.trim() });
      setItemLabel("");
      onRefresh();
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : t.createItemError);
    }
  }

  // Group items by section, preserving each item's sort order and putting
  // section-less items first.
  const sections = useMemo(() => {
    const groups = new Map<string, ItemRow[]>();
    for (const item of template.items) {
      const key = item.section ?? "";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item);
    }
    return Array.from(groups.entries());
  }, [template.items]);

  return (
    <div className="flex flex-col gap-6 p-5">
      <form onSubmit={handleSaveMeta} className="flex flex-col gap-4">
        <div className="flex gap-[14px]">
          <div className="flex flex-1 flex-col gap-[7px]">
            <label className="text-[13px] font-medium text-body">{t.templateName}</label>
            <TextField value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          {agencies.length > 1 && (
            <div className="flex flex-1 flex-col gap-[7px]">
              <label className="text-[13px] font-medium text-body">{t.agencyField}</label>
              <Select value={agencyId} onChange={(e) => setAgencyId(e.target.value)} required>
                {agencies.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
            </div>
          )}
          <div className="flex w-40 flex-none flex-col gap-[7px]">
            <label className="text-[13px] font-medium text-body">{t.statusField}</label>
            <Select value={status} onChange={(e) => setStatus(e.target.value as TemplateStatus)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t.status[s]}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="flex flex-col gap-[7px]">
          <label className="text-[13px] font-medium text-body">{t.descriptionOptional}</label>
          <TextArea value={description} onChange={(e) => setDescription(e.target.value)} className="h-16" />
        </div>
        {error && (
          <p className="text-sm text-red-700" role="alert">
            {error}
          </p>
        )}
        <div className="flex items-center gap-2">
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <button type="button" onClick={onDelete} className="text-xs font-medium text-urgent hover:underline">
                {dict.common.confirm}
              </button>
              <button type="button" onClick={() => setConfirmDelete(false)} className="text-xs text-meta hover:underline">
                {dict.common.cancel}
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirmDelete(true)} className="text-xs font-medium text-urgent hover:underline">
              {dict.common.delete}
            </button>
          )}
          <Button type="submit" className="ml-auto" disabled={pending}>
            {pending ? dict.common.saving : dict.common.save}
          </Button>
        </div>
      </form>

      <div className="flex flex-col gap-3 border-t border-black/[.07] pt-5">
        <span className="text-[13px] font-semibold text-ink">{t.itemsHeading}</span>

        {sections.map(([section, items]) => (
          <div key={section || "_none"} className="flex flex-col gap-1">
            {section && <span className="font-mono text-[10.5px] uppercase tracking-[.08em] text-eyebrow">{section}</span>}
            {items.map((item, i) => (
              <ItemRow2
                key={item.id}
                item={item}
                isFirst={i === 0}
                isLast={i === items.length - 1}
                templateId={template.id}
                namespace={namespace}
                onChanged={onRefresh}
                onError={setError}
              />
            ))}
          </div>
        ))}
        {template.items.length === 0 && <p className="text-[12.5px] text-subtle">{t.noItemsYet}</p>}

        <form onSubmit={handleAddItem} className="mt-2 flex flex-wrap items-end gap-[10px]">
          <div className="flex flex-col gap-[7px]">
            <label className="text-[12px] font-medium text-body">{t.sectionOptional}</label>
            <TextField
              value={itemSection}
              onChange={(e) => setItemSection(e.target.value)}
              placeholder={t.sectionPlaceholder}
              className="w-40"
            />
          </div>
          <div className="flex flex-1 flex-col gap-[7px]">
            <label className="text-[12px] font-medium text-body">{t.itemLabel}</label>
            <TextField
              value={itemLabel}
              onChange={(e) => setItemLabel(e.target.value)}
              placeholder={t.itemLabelPlaceholder}
            />
          </div>
          <Button type="submit" variant="outline">
            {t.addItem}
          </Button>
        </form>
      </div>
    </div>
  );
}

// A single checklist item row: view mode with hover-revealed
// move/edit/delete controls, or an inline edit form when `editing`.
function ItemRow2({
  item,
  isFirst,
  isLast,
  templateId,
  namespace,
  onChanged,
  onError,
}: {
  item: ItemRow;
  isFirst: boolean;
  isLast: boolean;
  templateId: string;
  namespace: Namespace;
  onChanged: () => void;
  onError: (msg: string | null) => void;
}) {
  const dict = useDictionary();
  const t = useInspectionsDict(namespace);
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(item.label);
  const [section, setSection] = useState(item.section ?? "");

  async function handleSave() {
    if (!label.trim()) return;
    try {
      await updateItem(item.id, { label: label.trim(), section: section.trim() });
      setEditing(false);
      onChanged();
    } catch (e) {
      onError(e instanceof Error ? e.message : t.updateItemError);
    }
  }

  async function handleDelete() {
    try {
      await deleteItem(item.id);
      onChanged();
    } catch (e) {
      onError(e instanceof Error ? e.message : t.deleteItemError);
    }
  }

  // Swaps this item's sort order with its neighbor in the given direction
  async function handleMove(direction: "up" | "down") {
    try {
      await moveItem(item.id, templateId, direction);
      onChanged();
    } catch (e) {
      onError(e instanceof Error ? e.message : t.updateItemError);
    }
  }

  if (editing) {
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-md border border-black/[.09] px-3 py-2">
        <TextField value={section} onChange={(e) => setSection(e.target.value)} className="w-32" placeholder={t.sectionPlaceholder} />
        <TextField value={label} onChange={(e) => setLabel(e.target.value)} className="flex-1" />
        <button onClick={handleSave} className="text-xs font-medium text-link hover:underline">
          {dict.common.save}
        </button>
        <button onClick={() => setEditing(false)} className="text-xs text-meta hover:underline">
          {dict.common.cancel}
        </button>
      </div>
    );
  }

  return (
    <div className="group flex items-center gap-2 rounded-md px-3 py-[7px] hover:bg-hover">
      <span className="flex-1 truncate text-[13px] text-body">☐ {item.label}</span>
      <div className="hidden items-center gap-2 group-hover:flex">
        <button onClick={() => handleMove("up")} disabled={isFirst} className="text-xs text-meta hover:text-ink disabled:opacity-30">
          ↑
        </button>
        <button onClick={() => handleMove("down")} disabled={isLast} className="text-xs text-meta hover:text-ink disabled:opacity-30">
          ↓
        </button>
        <button onClick={() => setEditing(true)} className="text-xs text-meta hover:text-ink">
          {dict.common.edit}
        </button>
        <button onClick={handleDelete} className="text-xs text-meta hover:text-urgent">
          {dict.common.delete}
        </button>
      </div>
    </div>
  );
}

// Slide-over drawer for creating a brand-new checklist template
function NewTemplateDrawer({
  agencies,
  namespace,
  onClose,
  onCreated,
}: {
  agencies: AgencyOption[];
  namespace: Namespace;
  onClose: () => void;
  onCreated: (t: TemplateListRow) => void;
}) {
  const dict = useDictionary();
  const t = useInspectionsDict(namespace);
  const [name, setName] = useState("");
  const [agencyId, setAgencyId] = useState(agencies[0]?.id ?? "");
  const [description, setDescription] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !agencyId) return;
    setPending(true);
    setError(null);
    try {
      const created = await createTemplate({ agency_id: agencyId, name: name.trim(), description: description.trim() });
      onCreated(created);
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : t.createTemplateError);
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-10 bg-black/20" onClick={onClose} />
      <div className="fixed right-0 top-0 z-20 flex h-full w-full flex-col gap-5 bg-surface p-4 shadow-[-12px_0_28px_rgba(0,0,0,.09)] sm:w-[420px] sm:p-6">
        <div className="flex items-center justify-between">
          <span className="text-base font-semibold text-ink">{t.newTemplateTitle}</span>
          <button onClick={onClose} className="text-lg text-meta hover:text-muted">
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 overflow-auto">
          <div className="flex flex-col gap-[7px]">
            <label className="text-[13px] font-medium text-body">{t.templateName}</label>
            <TextField value={name} onChange={(e) => setName(e.target.value)} placeholder={t.templateNamePlaceholder} required />
          </div>
          {agencies.length > 1 && (
            <div className="flex flex-col gap-[7px]">
              <label className="text-[13px] font-medium text-body">{t.agencyField}</label>
              <Select value={agencyId} onChange={(e) => setAgencyId(e.target.value)} required>
                <option value="">{t.selectAgency}</option>
                {agencies.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
            </div>
          )}
          <div className="flex flex-col gap-[7px]">
            <label className="text-[13px] font-medium text-body">{t.descriptionOptional}</label>
            <TextArea value={description} onChange={(e) => setDescription(e.target.value)} className="h-20" />
          </div>
          {error && (
            <p className="text-sm text-red-700" role="alert">
              {error}
            </p>
          )}
          <div className="mt-auto flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              {dict.common.cancel}
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? dict.common.saving : t.createTemplate}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
