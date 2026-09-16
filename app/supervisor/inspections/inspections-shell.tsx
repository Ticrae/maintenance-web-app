"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { InspectionRunner } from "@/components/inspection-runner";
import { InspectionManager, type AgencyOption, type TemplateListItem } from "@/components/inspection-manager";
import type { RunnableTemplate, RunHistoryRow } from "@/app/actions/inspections";
import { useDictionary } from "@/lib/i18n/language-provider";

export function SupervisorInspectionsShell({
  title,
  runnable,
  history,
  homes,
  defaultHomeId,
  categories,
  agencies,
  templates,
}: {
  title: string;
  runnable: RunnableTemplate[];
  history: RunHistoryRow[];
  homes: { id: string; name: string }[];
  defaultHomeId: string;
  categories: string[];
  agencies: AgencyOption[];
  templates: TemplateListItem[];
}) {
  const [tab, setTab] = useState<"run" | "manage">("run");
  const dict = useDictionary();
  const t = dict.common.inspections;

  const tabSwitcher = (
    <div className="flex gap-1 rounded-lg bg-hover p-1">
      {(["run", "manage"] as const).map((key) => (
        <button
          key={key}
          onClick={() => setTab(key)}
          className={`rounded-md px-3 py-[6px] text-[13px] font-medium transition-colors ${
            tab === key ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"
          }`}
        >
          {key === "run" ? t.runTab : t.manageTab}
        </button>
      ))}
    </div>
  );

  if (tab === "manage") {
    return (
      <div className="flex flex-1 flex-col overflow-auto">
        <PageHeader title={title} actions={tabSwitcher} />
        <InspectionManager agencies={agencies} templates={templates} namespace="supervisor" />
      </div>
    );
  }

  return (
    <InspectionRunner
      title={title}
      headerActions={tabSwitcher}
      runnable={runnable}
      history={history}
      homes={homes}
      defaultHomeId={defaultHomeId}
      categories={categories}
    />
  );
}
