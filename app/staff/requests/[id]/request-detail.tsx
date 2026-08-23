"use client";

import Link from "next/link";
import { useState } from "react";
import { Stepper, Avatar, Eyebrow } from "@/components/ui/misc";
import { UrgentTag } from "@/components/ui/badges";
import { buttonClasses } from "@/components/ui/button";
import { TextArea } from "@/components/ui/inputs";
import { relativeTime } from "@/lib/date";
import { addRequestComment } from "@/app/actions/comments";
import type { Priority } from "@/lib/theme";
import { useDictionary } from "@/lib/i18n/language-provider";

export type RequestDetailData = {
  id: string;
  category: string;
  priority: Priority;
  status: string;
  description: string;
  created_at: string;
  updated_at: string;
  homeName: string;
  reporterName: string;
  assigneeName: string | null;
};

export type CommentItem = {
  id: string;
  message: string;
  created_at: string;
  authorName: string;
};
export type PhotoItem = { id: string; url: string; created_at: string };

const STEP_INDEX: Record<string, number> = {
  Open: 0,
  Assigned: 1,
  "In Progress": 2,
  "Waiting for Parts": 3,
  Completed: 4,
  Cancelled: 4,
};

export function RequestDetail({
  request,
  activity,
  photos,
}: {
  request: RequestDetailData;
  activity: CommentItem[];
  photos: PhotoItem[];
}) {
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dict = useDictionary();
  const t = dict.staff.requestDetail;

  const [title, ...rest] = request.description.split("\n");
  const details = rest.join("\n");

  const statusLabel =
    dict.common.status[request.status as keyof typeof dict.common.status] ??
    request.status;

  async function handleComment() {
    if (!comment.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await addRequestComment(request.id, comment.trim());
      setComment("");
    } catch (e) {
      setError(e instanceof Error ? e.message : t.commentError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex h-[70px] flex-none items-center gap-[14px] border-b border-black/[.08] px-7">
        <Link href="/staff" className="text-[13px] text-meta">
          {dict.staff.nav.myRequests}
        </Link>
        <span className="text-[13px] text-hairline">/</span>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-[10px]">
            <span className="font-mono text-[12.5px] font-medium text-faint">
              {request.id.slice(0, 8).toUpperCase()}
            </span>
            <span className="text-lg font-semibold tracking-[-.01em] text-ink">
              {title}
            </span>
            {request.priority === "Urgent" && <UrgentTag />}
          </div>
          <span className="font-mono text-xs text-meta">
            {request.homeName} · {t.raisedBy} {request.reporterName} ·{" "}
            {relativeTime(request.created_at, dict.common.time)}
          </span>
        </div>
      </div>

      <div className="flex md:flex-1 overflow-hidden flex-col md:flex-row">
        <div className="flex flex-1 flex-col gap-4 overflow-auto bg-canvas p-6">
          {error && (
            <p className="text-sm text-red-700" role="alert">
              {error}
            </p>
          )}
          <div className="flex flex-col gap-[14px] rounded-lg border border-black/[.09] bg-surface p-5">
            <div className="flex items-center justify-between">
              <Eyebrow>{t.progress}</Eyebrow>
              <span className="font-mono text-[11.5px] text-eyebrow">
                {statusLabel} · {t.updated}{" "}
                {relativeTime(request.updated_at, dict.common.time)}
              </span>
            </div>
            <Stepper activeIndex={STEP_INDEX[request.status] ?? 0} />
            <span className="text-[13px] text-subtle">
              {request.assigneeName
                ? t.assignedTo(request.assigneeName)
                : t.notAssigned}
            </span>
          </div>

          <div className="flex flex-col gap-[14px] rounded-lg border border-black/[.09] bg-surface p-5">
            <Eyebrow>{t.reportedIssue}</Eyebrow>
            <p className="max-w-[62ch] text-sm leading-[1.6] text-body">
              {details || title}
            </p>
            <span className="font-mono text-[11.5px] text-eyebrow">
              {request.category}
            </span>
          </div>

          <div className="flex flex-col gap-[14px] rounded-lg border border-black/[.09] bg-surface p-5">
            <Eyebrow>{t.photos}</Eyebrow>
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
              {photos.length === 0 && (
                <span className="text-sm text-meta">{t.noPhotosYet}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex w-[390px] flex-none flex-col border-l border-black/[.08]">
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
            <div className="flex items-center justify-center">
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
