"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AddPhotoTile, Stepper, Avatar, Eyebrow } from "@/components/ui/misc";
import { UrgentTag } from "@/components/ui/badges";
import { Button, buttonClasses } from "@/components/ui/button";
import { TextArea, Select } from "@/components/ui/inputs";
import { relativeTime } from "@/lib/date";
import {
  completeJob,
  updateJobStage,
  type RequestStatus,
} from "@/app/actions/requests";
import { addRequestComment } from "@/app/actions/comments";
import { uploadRequestPhoto } from "@/app/actions/photos";
import { useDictionary } from "@/lib/i18n/language-provider";
import type { Priority } from "@/lib/theme";

export type JobDetailData = {
  id: string;
  category: string;
  priority: Priority;
  status: string;
  description: string;
  created_at: string;
  updated_at: string;
  homeName: string;
  homeAddress: string | null;
  reporterName: string;
};

export type CommentItem = {
  id: string;
  message: string;
  created_at: string;
  authorName: string;
};
export type PhotoItem = { id: string; url: string; created_at: string };

const STATUS_OPTIONS: RequestStatus[] = [
  "Assigned",
  "In Progress",
  "Completed",
  "Cancelled",
];

const STEP_INDEX: Record<string, number> = {
  Open: 0,
  Assigned: 1,
  "In Progress": 2,
  Completed: 3,
  Cancelled: 3,
};

export function JobDetail({
  job,
  activity,
  photos,
}: {
  job: JobDetailData;
  activity: CommentItem[];
  photos: PhotoItem[];
}) {
  const router = useRouter();
  const dict = useDictionary();
  const t = dict.maintenance.jobDetail;
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, ...rest] = job.description.split("\n");
  const details = rest.join("\n");

  async function handleStatusChange(status: RequestStatus) {
    setBusy(true);
    setError(null);
    try {
      if (status === "Completed") {
        await completeJob(job.id);
        router.push("/maintenance/completed");
        return;
      }
      await updateJobStage(job.id, status);
      setBusy(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.updateError);
      setBusy(false);
    }
  }

  async function handleComment() {
    if (!comment.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await addRequestComment(job.id, comment.trim());
      setComment("");
    } catch (e) {
      setError(e instanceof Error ? e.message : t.commentError);
    } finally {
      setBusy(false);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.set("photo", file);
      await uploadRequestPhoto(job.id, formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.photoError);
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex min-h-[70px] flex-none flex-wrap items-center gap-[10px] border-b border-black/[.08] px-4 py-3 sm:gap-[14px] sm:px-7">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-[10px]">
            <span className="font-mono text-[12.5px] font-medium text-faint">
              {job.id.slice(0, 8).toUpperCase()}
            </span>
            <span className="text-lg font-semibold tracking-[-.01em] text-ink">
              {title}
            </span>
            {job.priority === "Urgent" && <UrgentTag />}
          </div>
          <span className="font-mono text-xs text-meta">
            {job.homeName} · {t.raisedBy(job.reporterName)} ·{" "}
            {relativeTime(job.created_at, dict.common.time)}
          </span>
        </div>
        <div className="ml-auto flex gap-[10px]">
          {job.status !== "Completed" && job.status !== "Cancelled" && (
            <Button
              onClick={() => handleStatusChange("Completed")}
              disabled={busy}
            >
              {t.markCompleted}
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col md:flex-row md:overflow-hidden">
        <div className="flex flex-1 flex-col gap-4 overflow-auto bg-canvas p-4 sm:p-6">
          {error && (
            <p className="text-sm text-red-700" role="alert">
              {error}
            </p>
          )}
          <div className="flex flex-col gap-[14px] rounded-lg border border-black/[.09] bg-surface p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Eyebrow>{t.progress}</Eyebrow>
              <span className="font-mono text-[11.5px] text-eyebrow">
                {
                  dict.common.status[
                    job.status as keyof typeof dict.common.status
                  ]
                }{" "}
                · {t.updated(relativeTime(job.updated_at, dict.common.time))}
              </span>
            </div>
            <Stepper activeIndex={STEP_INDEX[job.status] ?? 0} />
          </div>

          <div className="flex flex-col gap-[14px] rounded-lg border border-black/[.09] bg-surface p-5">
            <Eyebrow>{t.reportedIssue}</Eyebrow>
            <p className="max-w-[62ch] text-sm leading-[1.6] text-body">
              {details || title}
            </p>
            <span className="font-mono text-[11.5px] text-eyebrow">
              {job.category}
            </span>
          </div>

          <div className="flex flex-col gap-[14px] rounded-lg border border-black/[.09] bg-surface p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Eyebrow>{t.photos}</Eyebrow>
              {job.status !== "Completed" && job.status !== "Cancelled" && (
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-meta">{t.setStatus}</span>
                  <Select
                    value={job.status}
                    disabled={busy}
                    className="h-8 text-xs"
                    onChange={(e) =>
                      handleStatusChange(e.target.value as RequestStatus)
                    }
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {dict.common.status[s]}
                      </option>
                    ))}
                  </Select>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-[10px]">
              {photos.map((p) => (
                <a key={p.id} href={p.url} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.url}
                    alt=""
                    className="h-24 w-[132px] rounded-md border border-black/[.1] object-cover"
                  />
                </a>
              ))}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={busy}
              >
                <AddPhotoTile
                  label={t.uploadLabel}
                  hint={t.uploadHint}
                  className="h-24 w-[132px]"
                />
              </button>
            </div>
          </div>
        </div>

        <div className="flex w-full flex-none flex-col border-t border-black/[.08] md:w-[390px] md:border-l md:border-t-0">
          <div className="flex items-center justify-between border-b border-black/[.07] px-[22px] py-4">
            <span className="text-[13px] font-semibold text-ink">
              {t.activity}
            </span>
          </div>
          <div className="flex flex-1 flex-col gap-[18px] overflow-auto px-[22px] py-[18px]">
            {activity.map((a) => (
              <div key={a.id} className="flex gap-[11px]">
                <Avatar
                  initials={a.authorName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                  size={28}
                />
                <div className="flex min-w-0 flex-col gap-1">
                  <div className="flex items-baseline gap-[7px]">
                    <span className="text-[12.5px] font-medium text-ink">
                      {a.authorName}
                    </span>
                    <span className="font-mono text-[11px] text-eyebrow">
                      {relativeTime(a.created_at, dict.common.time)}
                    </span>
                  </div>
                  <span className="text-[13px] leading-[1.55] text-muted">
                    {a.message}
                  </span>
                </div>
              </div>
            ))}
            {activity.length === 0 && (
              <span className="text-sm text-meta">{t.noActivityYet}</span>
            )}
          </div>
          <div className="flex flex-col gap-[9px] border-t border-black/[.07] px-[22px] py-4">
            <TextArea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t.commentPlaceholder}
              className="h-16"
            />
            <div className="flex items-center justify-around">
              <button
                onClick={handleComment}
                disabled={busy || !comment.trim()}
                className={buttonClasses("primary")}
              >
                {t.commentButton}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
