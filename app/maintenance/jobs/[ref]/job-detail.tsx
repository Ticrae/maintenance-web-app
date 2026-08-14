"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PhotoPlaceholder, AddPhotoTile, Stepper } from "@/components/ui/misc";
import { Avatar, Eyebrow } from "@/components/ui/misc";
import { UrgentTag } from "@/components/ui/badges";
import { Button, buttonClasses } from "@/components/ui/button";
import { TextArea } from "@/components/ui/inputs";
import { useAppData } from "@/lib/app-data-context";
import type { QueueJob, MyJob } from "@/lib/fixtures";

type JobSummary = {
  ref: string;
  title: string;
  meta: string;
  priority: QueueJob["priority"];
  urgent: boolean;
  stepIndex: number;
};

function findJob(
  refParam: string,
  queue: QueueJob[],
  myJobGroups: { items: MyJob[] }[]
): JobSummary | null {
  const inQueue = queue.find((j) => j.ref === refParam);
  if (inQueue) {
    return {
      ref: inQueue.ref,
      title: inQueue.title,
      meta: inQueue.meta,
      priority: inQueue.priority,
      urgent: inQueue.urgent,
      stepIndex: inQueue.action === "Accept" ? 0 : 1,
    };
  }
  for (const g of myJobGroups) {
    const found = g.items.find((j) => j.ref === refParam);
    if (found) {
      return {
        ref: found.ref,
        title: found.title,
        meta: found.meta,
        priority: found.priority,
        urgent: found.urgent,
        stepIndex: found.stage === "site" ? 2 : found.stage === "parts" ? 3 : 1,
      };
    }
  }
  return null;
}

export function JobDetail({ refParam }: { refParam: string }) {
  const router = useRouter();
  const { queue, myJobGroups, activity, addComment, markJobCompleted, setJobStage } =
    useAppData();
  const [comment, setComment] = useState("");

  const job = findJob(refParam, queue, myJobGroups);

  if (!job) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-canvas">
        <span className="text-sm text-meta">No job found for {refParam}.</span>
        <button
          onClick={() => router.push("/maintenance")}
          className={buttonClasses("outline")}
        >
          Back to queue
        </button>
      </div>
    );
  }

  const [home, room] = job.meta.split(" · ");

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex h-[70px] flex-none items-center gap-[14px] border-b border-black/[.08] px-7">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-[10px]">
            <span className="font-mono text-[12.5px] font-medium text-faint">
              {job.ref}
            </span>
            <span className="text-lg font-semibold tracking-[-.01em] text-ink">
              {job.title}
            </span>
            {job.urgent && <UrgentTag />}
          </div>
          <span className="font-mono text-xs text-meta">
            {home} · {room} · raised by Deborah Amos, 08:14 today
          </span>
        </div>
        <div className="ml-auto flex gap-[10px]">
          <Button variant="outline">Reassign</Button>
          <Button
            onClick={() => {
              markJobCompleted(job.ref);
              router.push("/maintenance/completed");
            }}
          >
            Mark completed
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col gap-4 overflow-auto bg-canvas p-6">
          <div className="flex flex-col gap-[14px] rounded-lg border border-black/[.09] bg-surface p-5">
            <div className="flex items-center justify-between">
              <Eyebrow>Progress</Eyebrow>
              <span className="font-mono text-[11.5px] text-eyebrow">
                accepted 08:31 · target today 18:00
              </span>
            </div>
            <Stepper activeIndex={job.stepIndex} />
          </div>

          <div className="flex flex-col gap-[14px] rounded-lg border border-black/[.09] bg-surface p-5">
            <Eyebrow>Reported issue</Eyebrow>
            <p className="max-w-[62ch] text-sm leading-[1.6] text-body">
              Cold to the touch even with the valve fully open. Resident has
              been moved to the day room this afternoon. Second radiator on
              the same wall is fine.
            </p>
            <div className="flex gap-[10px]">
              <PhotoPlaceholder caption="reported · radiator" className="h-24 w-[132px]" />
              <PhotoPlaceholder caption="reported · valve" className="h-24 w-[132px]" />
            </div>
          </div>

          <div className="flex flex-col gap-[14px] rounded-lg border border-black/[.09] bg-surface p-5">
            <div className="flex items-center justify-between">
              <Eyebrow>Completion evidence</Eyebrow>
              <span className="text-[11.5px] text-meta">
                required before completing
              </span>
            </div>
            <div className="flex gap-[10px]">
              <PhotoPlaceholder caption="after · bled valve" className="h-24 w-[132px]" />
              <AddPhotoTile label="Upload" hint="after photo" className="h-24 w-[132px]" />
            </div>
            <div className="rounded-md border border-black/[.14] px-3 py-[11px] text-[13.5px] leading-[1.55] text-body">
              Bled the radiator and reseated the TRV head — heat restored to
              about 80%. Valve body is weeping slightly; ordered a
              replacement head, fitting Thursday.
            </div>
            <div className="flex gap-[9px]">
              <Button variant="outline">Save note</Button>
              <Button variant="outline" onClick={() => setJobStage(job.ref, "parts")}>
                Set status: parts ordered
              </Button>
            </div>
          </div>
        </div>

        <div className="flex w-[390px] flex-none flex-col border-l border-black/[.08]">
          <div className="flex items-center justify-between border-b border-black/[.07] px-[22px] py-4">
            <span className="text-[13px] font-semibold text-ink">Activity</span>
            <span className="font-mono text-[11.5px] text-eyebrow">
              shared with the home
            </span>
          </div>
          <div className="flex flex-1 flex-col gap-[18px] overflow-auto px-[22px] py-[18px]">
            {activity.map((a) => (
              <div key={a.id} className="flex gap-[11px]">
                <Avatar initials={a.initials} size={28} />
                <div className="flex min-w-0 flex-col gap-1">
                  <div className="flex items-baseline gap-[7px]">
                    <span className="text-[12.5px] font-medium text-ink">{a.who}</span>
                    <span className="font-mono text-[11px] text-eyebrow">{a.time}</span>
                  </div>
                  <span className="text-[13px] leading-[1.55] text-muted">{a.text}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-[9px] border-t border-black/[.07] px-[22px] py-4">
            <TextArea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment for the home team…"
              className="h-16"
            />
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11.5px] text-eyebrow">
                notifies 2 staff
              </span>
              <button
                onClick={() => {
                  if (!comment.trim()) return;
                  addComment(comment.trim());
                  setComment("");
                }}
                className={buttonClasses("primary")}
              >
                Comment
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
