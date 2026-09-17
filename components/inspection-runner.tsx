"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Button, buttonClasses } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/misc";
import { TextArea, Select } from "@/components/ui/inputs";
import { relativeTime } from "@/lib/date";
import {
  startRun,
  getRun,
  getRunHistory,
  recordResult,
  failItemAndCreateRequest,
  completeRun,
  type RunnableTemplate,
  type RunHistoryRow,
  type RunDetail,
  type ItemRow,
} from "@/app/actions/inspections";
import { useDictionary } from "@/lib/i18n/language-provider";
import type { Priority } from "@/lib/theme";

const PRIORITIES: Priority[] = ["Low", "Medium", "High", "Urgent"];

// Staff/maintenance/supervisor-facing inspection UI: pick a checklist +
// home and start a run, or resume the active run (RunScreen) once started.
// Shows past run history when not mid-run.
export function InspectionRunner({
  title,
  headerActions,
  runnable,
  history: initialHistory,
  homes,
  defaultHomeId,
  categories,
}: {
  title: string;
  headerActions?: React.ReactNode;
  runnable: RunnableTemplate[];
  history: RunHistoryRow[];
  homes: { id: string; name: string }[];
  defaultHomeId: string;
  categories: string[];
}) {
  const dict = useDictionary();
  const t = dict.common.inspections;

  const [history, setHistory] = useState(initialHistory);
  const [templateId, setTemplateId] = useState(runnable[0]?.id ?? "");
  const [homeId, setHomeId] = useState(defaultHomeId || homes[0]?.id || "");
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const [runId, setRunId] = useState<string | null>(null);
  const [run, setRun] = useState<RunDetail | null>(null);
  const [finished, setFinished] = useState(false);

  // Loads the started run's full detail once `runId` is set
  useEffect(() => {
    if (!runId) return;
    let cancelled = false;
    getRun(runId).then((r) => {
      if (!cancelled) setRun(r);
    });
    return () => {
      cancelled = true;
    };
  }, [runId]);

  // Starts a new inspection run, switching the view into RunScreen
  async function handleStart(e: React.FormEvent) {
    e.preventDefault();
    if (!templateId || !homeId) return;
    setStarting(true);
    setStartError(null);
    try {
      const id = await startRun(templateId, homeId);
      setRunId(id);
    } catch (e2) {
      setStartError(e2 instanceof Error ? e2.message : t.startError);
    } finally {
      setStarting(false);
    }
  }

  // Re-fetches the run after an item result is recorded
  function refreshRun() {
    if (!runId) return;
    getRun(runId).then(setRun);
  }

  // Marks the run complete and refreshes the history list to include it
  async function handleFinish() {
    if (!runId) return;
    try {
      await completeRun(runId);
      setFinished(true);
      setHistory(await getRunHistory());
      alert("Inspection completed successfully.");
    } catch (e) {
      window.alert(e instanceof Error ? e.message : t.finishError);
    }
  }

  // Resets local state back to the "start an inspection" screen
  function backToStart() {
    setRunId(null);
    setRun(null);
    setFinished(false);
  }

  // Mid-run: hand off entirely to the run screen
  if (runId) {
    return (
      <RunScreen
        run={run}
        categories={categories}
        onRefresh={refreshRun}
        onFinish={handleFinish}
        onBack={backToStart}
      />
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <PageHeader title={title} actions={headerActions} />

      {/* Completion screen, replacing the start form once a run finishes */}
      {finished ? (
        <div className="mx-auto flex max-w-[480px] flex-col items-center gap-4 py-16 text-center">
          <span className="text-3xl" aria-hidden>
            ✅
          </span>
          <h1 className="text-[16px] font-semibold text-ink">
            {t.finishedTitle}
          </h1>
          <p className="text-[13px] text-meta">{t.finishedBody}</p>
          <button onClick={backToStart} className={buttonClasses("primary")}>
            {t.backToStart}
          </button>
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-6 overflow-auto bg-canvas p-4 sm:p-7">
          <div className="flex flex-col gap-4 rounded-lg border border-black/[.09] bg-surface p-5">
            <Eyebrow>{t.startTitle}</Eyebrow>
            {runnable.length === 0 ? (
              <p className="text-sm text-meta">{t.noRunnable}</p>
            ) : (
              <form onSubmit={handleStart} className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-[14px]">
                  <div className="flex min-w-[220px] flex-1 flex-col gap-[7px]">
                    <label className="text-[13px] font-medium text-body">
                      {t.checklistField}
                    </label>
                    <Select
                      value={templateId}
                      onChange={(e) => setTemplateId(e.target.value)}
                      required
                    >
                      {runnable.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} · {t.itemsCount(r.itemCount)}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="flex min-w-[220px] flex-1 flex-col gap-[7px]">
                    <label className="text-[13px] font-medium text-body">
                      {dict.common.table.home}
                    </label>
                    <Select
                      value={homeId}
                      onChange={(e) => setHomeId(e.target.value)}
                      required
                    >
                      {homes.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
                {startError && (
                  <p className="text-sm text-red-700" role="alert">
                    {startError}
                  </p>
                )}
                <Button
                  type="submit"
                  className="self-start"
                  disabled={starting}
                >
                  {starting ? t.starting : t.startButton}
                </Button>
              </form>
            )}
          </div>

          <div className="flex flex-col gap-3 rounded-lg border border-black/[.09] bg-surface p-5">
            <Eyebrow>{t.historyTitle}</Eyebrow>
            <div className="flex flex-col gap-2">
              {history.map((h) => (
                <div
                  key={h.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-black/[.08] px-4 py-3"
                >
                  <div className="flex flex-col gap-[2px]">
                    <span className="text-[13px] font-medium text-ink">
                      {h.inspection_templates?.name ?? "—"}
                    </span>
                    <span className="text-[12px] text-subtle">
                      {h.homes?.name ?? "—"}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-eyebrow">
                    {h.status === "completed"
                      ? t.completedStatus
                      : t.inProgressStatus}{" "}
                    ·{" "}
                    {relativeTime(
                      h.completed_at ?? h.started_at,
                      dict.common.time,
                    )}
                  </span>
                </div>
              ))}
              {history.length === 0 && (
                <p className="text-sm text-meta">{t.noHistoryYet}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Active-run screen: checklist items grouped by section, with a progress
// counter and a "finish" button enabled only once every item is answered.
function RunScreen({
  run,
  categories,
  onRefresh,
  onFinish,
  onBack,
}: {
  run: RunDetail | null;
  categories: string[];
  onRefresh: () => void;
  onFinish: () => void;
  onBack: () => void;
}) {
  const dict = useDictionary();
  const t = dict.common.inspections;
  const sections = useMemoSections(run?.items ?? []);

  if (!run) {
    return <p className="p-8 text-center text-sm text-meta">…</p>;
  }

  const resultByItem = new Map(run.results.map((r) => [r.item_id, r]));
  const answeredCount = run.results.length;
  const allAnswered =
    answeredCount === run.items.length && run.items.length > 0;

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <div className="flex min-h-[62px] flex-none flex-col gap-1 border-b border-black/[.08] px-4 py-3 sm:px-7">
        <button
          onClick={onBack}
          className="w-fit text-[13px] text-meta hover:text-ink hover:cursor-pointer"
        >
          ← {t.backToStart}
        </button>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-lg font-semibold tracking-[-.01em] text-ink">
            {run.template.name}
          </span>
          <span className="font-mono text-xs text-meta">
            {t.progress(answeredCount, run.items.length)}
          </span>
        </div>
        <span className="font-mono text-xs text-eyebrow">{run.homeName}</span>
      </div>

      <div className="flex flex-1 flex-col gap-5 bg-canvas p-4 sm:p-7">
        {sections.map(([section, items]) => (
          <div key={section || "_none"} className="flex flex-col gap-2">
            {section && (
              <span className="font-mono text-[10.5px] uppercase tracking-[.08em] text-eyebrow">
                {section}
              </span>
            )}
            <div className="flex flex-col gap-2">
              {items.map((item) => (
                <ChecklistItem
                  key={item.id}
                  item={item}
                  runId={run.id}
                  result={resultByItem.get(item.id) ?? null}
                  categories={categories}
                  onChanged={onRefresh}
                />
              ))}
            </div>
          </div>
        ))}

        <div className="flex justify-end">
          <Button onClick={onFinish} disabled={!allAnswered}>
            {t.finishButton}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Groups checklist items by their section, preserving each item's order and
// putting section-less items first (mirrors the grouping in inspection-manager.tsx)
function useMemoSections(items: ItemRow[]) {
  return useMemo(() => {
    const groups = new Map<string, ItemRow[]>();
    for (const item of items) {
      const key = item.section ?? "";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item);
    }
    return Array.from(groups.entries());
  }, [items]);
}

// A single checklist item during a run: pass/fail buttons, and when marked
// failing, an expanded form to add notes and optionally raise a maintenance
// request straight from the failure.
function ChecklistItem({
  item,
  runId,
  result,
  categories,
  onChanged,
}: {
  item: ItemRow;
  runId: string;
  result: {
    passed: boolean;
    notes: string | null;
    request_id: string | null;
  } | null;
  categories: string[];
  onChanged: () => void;
}) {
  const dict = useDictionary();
  const t = dict.common.inspections;

  const [failing, setFailing] = useState(false);
  const [notes, setNotes] = useState(result?.notes ?? "");
  const [category, setCategory] = useState(categories[0] ?? "Other");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Records a passing result for this item
  async function markPass() {
    setBusy(true);
    setError(null);
    try {
      await recordResult(runId, item.id, { passed: true });
      setFailing(false);
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : t.saveError);
    } finally {
      setBusy(false);
    }
  }

  // Records a failing result with notes, without raising a maintenance request
  async function saveFailOnly() {
    setBusy(true);
    setError(null);
    try {
      await recordResult(runId, item.id, { passed: false, notes });
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : t.saveError);
    } finally {
      setBusy(false);
    }
  }

  // Records the failure and creates a linked maintenance request in one step
  async function createRequest() {
    if (!notes.trim()) {
      setError(t.notesRequiredError);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await failItemAndCreateRequest(runId, item.id, {
        notes,
        category,
        priority,
      });
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : t.saveError);
    } finally {
      setBusy(false);
    }
  }

  const answered = result !== null;

  return (
    <div className="flex flex-col gap-2 rounded-md border border-black/[.09] bg-surface px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="flex-1 text-[13.5px] text-body">
          {answered ? (result.passed ? "☑" : "☒") : "☐"} {item.label}
        </span>
        <div className="flex gap-[6px]">
          <button
            onClick={markPass}
            disabled={busy}
            className={`rounded-md px-3 py-[6px] text-xs font-medium ${
              result?.passed
                ? "bg-success-bg text-success"
                : "border border-black/[.14] text-muted hover:bg-hover"
            }`}
          >
            {t.pass}
          </button>
          <button
            onClick={() => setFailing((v) => !v)}
            disabled={busy}
            className={`rounded-md px-3 py-[6px] text-xs font-medium ${
              result && !result.passed
                ? "bg-urgent-bg text-urgent"
                : "border border-black/[.14] text-muted hover:bg-hover"
            }`}
          >
            {t.fail}
          </button>
        </div>
      </div>

      {result?.request_id && (
        <span className="font-mono text-[11px] text-eyebrow">
          {t.requestCreated}
        </span>
      )}

      {failing && (
        <div className="flex flex-col gap-3 border-t border-black/[.07] pt-3">
          <TextArea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t.notesPlaceholder}
            className="h-16"
          />
          <div className="flex flex-wrap gap-[10px]">
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-9 w-40 text-xs"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
            <Select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="h-9 w-32 text-xs"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {dict.common.priority[p]}
                </option>
              ))}
            </Select>
          </div>
          {error && (
            <p className="text-sm text-red-700" role="alert">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-[10px]">
            {!result?.request_id && (
              <button
                onClick={createRequest}
                disabled={busy}
                className={buttonClasses("primary")}
              >
                {t.createRequestButton}
              </button>
            )}
            <button
              onClick={saveFailOnly}
              disabled={busy}
              className={buttonClasses("outline")}
            >
              {t.saveFailOnly}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
