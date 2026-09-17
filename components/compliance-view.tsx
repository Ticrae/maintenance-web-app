"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Eyebrow, StatTile } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { TextField, Select } from "@/components/ui/inputs";
import {
  getHomeActivityReport,
  type ComplianceSummary,
  type HomeActivityReport,
} from "@/app/actions/compliance";
import { useDictionary } from "@/lib/i18n/language-provider";

// Formats a 0–1 rate as a rounded percentage, or an em dash when unknown
// (e.g. no closed requests yet to compute a rate from)
function pct(rate: number | null) {
  return rate === null ? "—" : `${Math.round(rate * 100)}%`;
}

// One compliance checklist line: a ✓/⚠/— icon based on `ok`, plus the raw value
function ChecklistRow({ ok, label, value }: { ok: boolean | null; label: string; value: string }) {
  const icon = ok === null ? "—" : ok ? "✓" : "⚠";
  const tone = ok === null ? "text-meta" : ok ? "text-success" : "text-high";
  return (
    <div className="flex items-center justify-between border-b border-black/[.06] py-2 last:border-b-0">
      <span className={`text-[13px] ${tone}`}>
        {icon} {label}
      </span>
      <span className="font-mono text-[13px] text-ink">{value}</span>
    </div>
  );
}

// Shared compliance page for both admin and supervisor — `namespace` only
// picks which role's page title/subtitle copy to show; the checklist and
// report generator below are otherwise identical.
export function ComplianceView({
  summary,
  homes,
  namespace,
}: {
  summary: ComplianceSummary;
  homes: { id: string; name: string }[];
  namespace: "admin" | "supervisor";
}) {
  const dict = useDictionary();
  const t = namespace === "admin" ? dict.admin.compliance : dict.supervisor.compliance;
  const c = dict.common.compliance;

  const [homeId, setHomeId] = useState(homes[0]?.id ?? "");
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [report, setReport] = useState<HomeActivityReport | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetches and swaps in a home's monthly activity report, replacing the
  // checklist/generator view with the printable ReportCard below.
  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!homeId || !month) return;
    setPending(true);
    setError(null);
    try {
      const [year, m] = month.split("-").map(Number);
      const data = await getHomeActivityReport(homeId, year, m);
      if (!data) throw new Error(c.reportError);
      setReport(data);
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : c.reportError);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <PageHeader title={t.title} subtitle={t.subtitle} />

      <div className="flex flex-1 flex-col gap-5 bg-canvas p-4 sm:p-7 print:bg-white print:p-0">
        {/* Documentation-quality checklist, hidden once a report is generated or when printing */}
        {!report && (
          <div className="flex flex-col gap-2 rounded-lg border border-black/[.09] bg-surface p-5 print:hidden">
            <Eyebrow>{c.checklistTitle}</Eyebrow>
            <ChecklistRow ok={summary.notesRate === null ? null : summary.notesRate >= 0.9} label={c.notesRateLabel} value={pct(summary.notesRate)} />
            <ChecklistRow ok={summary.photoRate === null ? null : summary.photoRate >= 0.9} label={c.photoRateLabel} value={pct(summary.photoRate)} />
            <ChecklistRow
              ok={summary.criticalDocumentedRate === null ? null : summary.criticalDocumentedRate >= 1}
              label={c.criticalDocumentedLabel}
              value={pct(summary.criticalDocumentedRate)}
            />
            <ChecklistRow ok={summary.staleInspectionCount === 0} label={c.staleInspectionsLabel} value={String(summary.staleInspectionCount)} />
            <div className="mt-2 flex flex-wrap gap-3">
              <StatTile label={c.completedCountLabel} value={summary.completedCount} />
              <StatTile label={c.photoCountLabel} value={summary.photoCount} />
              <StatTile label={c.criticalCountLabel} value={summary.criticalCount} />
            </div>
          </div>
        )}

        {/* Home + month picker that generates the printable report below */}
        {!report && (
          <div className="flex flex-col gap-4 rounded-lg border border-black/[.09] bg-surface p-5 print:hidden">
            <Eyebrow>{c.generateTitle}</Eyebrow>
            <form onSubmit={handleGenerate} className="flex flex-wrap items-end gap-[14px]">
              <div className="flex min-w-[200px] flex-1 flex-col gap-[7px]">
                <label className="text-[13px] font-medium text-body">{dict.common.table.home}</label>
                <Select value={homeId} onChange={(e) => setHomeId(e.target.value)} required>
                  {homes.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex flex-col gap-[7px]">
                <label className="text-[13px] font-medium text-body">{c.monthField}</label>
                <TextField type="month" value={month} onChange={(e) => setMonth(e.target.value)} required />
              </div>
              <Button type="submit" disabled={pending}>
                {pending ? c.generating : c.generateButton}
              </Button>
            </form>
            {error && (
              <p className="text-sm text-red-700" role="alert">
                {error}
              </p>
            )}
          </div>
        )}

        {report && <ReportCard report={report} onBack={() => setReport(null)} />}
      </div>
    </div>
  );
}

// Printable monthly activity report for a single home. Uses `print:` Tailwind
// variants throughout to strip chrome (nav buttons, borders) when printed/exported to PDF.
function ReportCard({ report, onBack }: { report: HomeActivityReport; onBack: () => void }) {
  const dict = useDictionary();
  const c = dict.common.compliance;
  // Force UTC so the report always shows the intended calendar month
  // regardless of the viewer's local timezone.
  const monthLabel = new Date(Date.UTC(report.year, report.month - 1, 1)).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-col gap-6 rounded-lg border border-black/[.09] bg-surface p-8 print:border-0 print:p-0 print:shadow-none">
      <div className="flex items-center justify-between print:hidden">
        <button onClick={onBack} className="text-[13px] text-meta hover:text-ink">
          ← {c.backToChecklist}
        </button>
        <Button variant="outline" onClick={() => window.print()}>
          {c.printButton}
        </Button>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-mono uppercase tracking-[.08em] text-eyebrow">{report.agencyName}</span>
        <h1 className="text-xl font-semibold text-ink">{report.homeName}</h1>
        <span className="text-sm text-subtle">
          {c.activityTitle} · {monthLabel}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatTile label={c.receivedLabel} value={report.received} />
        <StatTile label={c.completedLabel} value={report.completed} />
        <StatTile label={c.outstandingLabel} value={report.outstanding} />
        <StatTile label={c.criticalIssuesLabel} value={report.criticalIssues} />
        <StatTile label={c.inspectionsCompletedLabel} value={report.inspectionsCompleted} />
      </div>
    </div>
  );
}
