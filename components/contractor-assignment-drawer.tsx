"use client";

import { useEffect, useState } from "react";
import {
  assignContractor,
  updateAssignment,
  getAssignmentsForRequest,
  type AssignmentRow,
  type AssignmentStatus,
  type InvoiceStatus,
} from "@/app/actions/contractors";
import { Button } from "@/components/ui/button";
import { TextField, TextArea, Select } from "@/components/ui/inputs";
import { relativeTime } from "@/lib/date";
import { useDictionary } from "@/lib/i18n/language-provider";

const STATUSES: AssignmentStatus[] = ["awaiting", "scheduled", "completed", "cancelled"];
const INVOICE_STATUSES: InvoiceStatus[] = ["pending", "received", "paid"];

export function ContractorAssignmentDrawer({
  requestId,
  contractors,
  onClose,
}: {
  requestId: string;
  contractors: { id: string; name: string; trade: string | null }[];
  onClose: () => void;
}) {
  const dict = useDictionary();
  const t = dict.common.contractorAssignment;

  const [assignments, setAssignments] = useState<AssignmentRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const [showNew, setShowNew] = useState(false);
  const [contractorId, setContractorId] = useState(contractors[0]?.id ?? "");
  const [appointmentAt, setAppointmentAt] = useState("");
  const [quoteAmount, setQuoteAmount] = useState("");
  const [notes, setNotes] = useState("");

  function refresh() {
    getAssignmentsForRequest(requestId).then(setAssignments);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId]);

  const current = assignments?.[0] ?? null;
  const history = assignments?.slice(1) ?? [];

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    if (!contractorId) return;
    setPending(true);
    setError(null);
    try {
      const parsedQuote = Number(quoteAmount);
      await assignContractor(requestId, contractorId, {
        appointment_at: appointmentAt ? new Date(appointmentAt).toISOString() : undefined,
        quote_amount: quoteAmount.trim() && !Number.isNaN(parsedQuote) ? parsedQuote : undefined,
        notes: notes.trim() || undefined,
      });
      setShowNew(false);
      setAppointmentAt("");
      setQuoteAmount("");
      setNotes("");
      refresh();
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : t.assignError);
    } finally {
      setPending(false);
    }
  }

  async function handleUpdate(id: string, patch: Parameters<typeof updateAssignment>[1]) {
    setPending(true);
    setError(null);
    try {
      await updateAssignment(id, patch);
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t.updateError);
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-10 bg-black/20" onClick={onClose} />
      <div className="fixed right-0 top-0 z-20 flex h-full w-full flex-col gap-5 bg-surface p-4 shadow-[-12px_0_28px_rgba(0,0,0,.09)] sm:w-[420px] sm:p-6">
        <div className="flex items-center justify-between">
          <span className="text-base font-semibold text-ink">{t.title}</span>
          <button onClick={onClose} className="text-lg text-meta hover:text-muted">
            ×
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-5 overflow-auto">
          {error && (
            <p className="text-sm text-red-700" role="alert">
              {error}
            </p>
          )}

          {assignments === null ? (
            <p className="text-sm text-meta">…</p>
          ) : current && !showNew ? (
            <div className="flex flex-col gap-3 rounded-lg border border-black/[.09] p-4">
              <div className="flex items-center justify-between">
                <span className="text-[13.5px] font-semibold text-ink">
                  {current.contractors?.name ?? "—"}
                  {current.contractors?.trade && <span className="text-meta"> · {current.contractors.trade}</span>}
                </span>
                <span className="font-mono text-[10.5px] text-eyebrow">{relativeTime(current.sent_at, dict.common.time)}</span>
              </div>

              <div className="flex flex-col gap-[7px]">
                <label className="text-[12px] font-medium text-body">{t.statusField}</label>
                <Select
                  value={current.status}
                  disabled={pending}
                  onChange={(e) => handleUpdate(current.id, { status: e.target.value as AssignmentStatus })}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {t.status[s]}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="flex flex-col gap-[7px]">
                <label className="text-[12px] font-medium text-body">{t.appointmentField}</label>
                <TextField
                  type="datetime-local"
                  disabled={pending}
                  defaultValue={current.appointment_at ? current.appointment_at.slice(0, 16) : ""}
                  onBlur={(e) =>
                    handleUpdate(current.id, {
                      appointment_at: e.target.value ? new Date(e.target.value).toISOString() : "",
                    })
                  }
                />
              </div>

              <div className="flex flex-col gap-[7px]">
                <label className="text-[12px] font-medium text-body">{t.quoteField}</label>
                <TextField
                  type="number"
                  min="0"
                  step="0.01"
                  disabled={pending}
                  defaultValue={current.quote_amount ?? ""}
                  onBlur={(e) => {
                    const v = Number(e.target.value);
                    if (e.target.value.trim() && !Number.isNaN(v)) handleUpdate(current.id, { quote_amount: v });
                  }}
                />
              </div>

              <div className="flex flex-col gap-[7px]">
                <label className="text-[12px] font-medium text-body">{t.invoiceField}</label>
                <Select
                  value={current.invoice_status}
                  disabled={pending}
                  onChange={(e) => handleUpdate(current.id, { invoice_status: e.target.value as InvoiceStatus })}
                >
                  {INVOICE_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {t.invoice[s]}
                    </option>
                  ))}
                </Select>
              </div>

              <button
                type="button"
                onClick={() => setShowNew(true)}
                className="self-start text-[12.5px] text-link hover:underline"
              >
                {t.reassign}
              </button>
            </div>
          ) : null}

          {(showNew || !current) && assignments !== null && (
            <form onSubmit={handleAssign} className="flex flex-col gap-4 rounded-lg border border-black/[.09] p-4">
              <span className="text-[13px] font-semibold text-ink">{t.newAssignmentTitle}</span>
              {contractors.length === 0 ? (
                <p className="text-sm text-meta">{t.noContractors}</p>
              ) : (
                <>
                  <div className="flex flex-col gap-[7px]">
                    <label className="text-[12px] font-medium text-body">{t.contractorField}</label>
                    <Select value={contractorId} onChange={(e) => setContractorId(e.target.value)} required>
                      {contractors.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                          {c.trade ? ` · ${c.trade}` : ""}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="flex flex-col gap-[7px]">
                    <label className="text-[12px] font-medium text-body">{t.appointmentField}</label>
                    <TextField type="datetime-local" value={appointmentAt} onChange={(e) => setAppointmentAt(e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-[7px]">
                    <label className="text-[12px] font-medium text-body">{t.quoteField}</label>
                    <TextField type="number" min="0" step="0.01" value={quoteAmount} onChange={(e) => setQuoteAmount(e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-[7px]">
                    <label className="text-[12px] font-medium text-body">{t.notesField}</label>
                    <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} className="h-16" />
                  </div>
                  <div className="flex gap-2">
                    {current && (
                      <Button type="button" variant="outline" onClick={() => setShowNew(false)}>
                        {dict.common.cancel}
                      </Button>
                    )}
                    <Button type="submit" disabled={pending}>
                      {t.assignButton}
                    </Button>
                  </div>
                </>
              )}
            </form>
          )}

          {history.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-[12px] font-semibold uppercase tracking-[.06em] text-eyebrow">{t.historyTitle}</span>
              {history.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-md border border-black/[.07] px-3 py-2 text-[12.5px] text-subtle">
                  <span>
                    {a.contractors?.name ?? "—"} · {t.status[a.status]}
                  </span>
                  <span className="font-mono text-[10.5px] text-eyebrow">{relativeTime(a.sent_at, dict.common.time)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
