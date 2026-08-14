"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eyebrow, PhotoPlaceholder, AddPhotoTile } from "@/components/ui/misc";
import { Button, buttonClasses } from "@/components/ui/button";
import { TextField, TextArea, Select, Toggle } from "@/components/ui/inputs";
import { useAppData } from "@/lib/app-data-context";
import type { Priority } from "@/lib/theme";

const CATEGORIES = [
  "Heating & plumbing",
  "Electrical",
  "Fabric",
  "Grounds",
  "Safety",
];

const LOCATIONS = [
  "Willow House · Room 12",
  "Willow House · Room 14",
  "Willow House · Kitchen",
  "Willow House · East corridor",
  "Willow House · Courtyard",
];

export default function NewRequestPage() {
  const router = useRouter();
  const { submitNewRequest } = useAppData();

  const [title, setTitle] = useState("Radiator in Room 12 not heating");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [location, setLocation] = useState(LOCATIONS[0]);
  const [description, setDescription] = useState(
    "Cold to the touch even with the valve fully open. Resident has been moved to the day room this afternoon. Second radiator on the same wall is fine."
  );
  const [priority, setPriority] = useState<Priority>("Medium");
  const [urgent, setUrgent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    submitNewRequest({ title, location, category, description, priority, urgent });
    router.push("/staff");
  }

  return (
    <>
      <div className="flex h-[62px] flex-none items-center gap-[14px] border-b border-black/[.08] px-7">
        <div className="h-[26px] w-[26px] rounded-md bg-graphite" />
        <Link href="/staff" className="text-[13px] text-meta">
          My requests
        </Link>
        <span className="text-[13px] text-hairline">/</span>
        <span className="text-[13px] font-medium text-ink">New request</span>
        <div className="ml-auto flex gap-[10px]">
          <Link href="/staff" className={buttonClasses("outline")}>
            Cancel
          </Link>
          <Button onClick={handleSubmit}>Submit request</Button>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-1 gap-6 overflow-auto bg-canvas p-7"
      >
        <div className="flex max-w-[720px] flex-1 flex-col gap-[18px]">
          <div className="flex flex-col gap-[18px] rounded-lg border border-black/[.09] bg-surface p-6">
            <Eyebrow>What needs fixing</Eyebrow>
            <div className="flex flex-col gap-[7px]">
              <label className="text-[13px] font-medium text-body">
                Short title
              </label>
              <TextField
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="flex gap-[14px]">
              <div className="flex flex-1 flex-col gap-[7px]">
                <label className="text-[13px] font-medium text-body">
                  Category
                </label>
                <Select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </Select>
              </div>
              <div className="flex flex-1 flex-col gap-[7px]">
                <label className="text-[13px] font-medium text-body">
                  Location
                </label>
                <Select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                >
                  {LOCATIONS.map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-[7px]">
              <label className="text-[13px] font-medium text-body">
                Description
              </label>
              <TextArea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-[108px]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-lg border border-black/[.09] bg-surface p-6">
            <Eyebrow>Photos</Eyebrow>
            <div className="flex gap-3">
              <PhotoPlaceholder caption="radiator.jpg" className="h-[112px] w-[150px]" />
              <PhotoPlaceholder caption="valve-close.jpg" className="h-[112px] w-[150px]" />
              <AddPhotoTile className="h-[112px] w-[150px]" />
            </div>
          </div>
        </div>

        <div className="flex w-[340px] flex-none flex-col gap-4">
          <div className="flex flex-col gap-[14px] rounded-lg border border-black/[.09] bg-surface p-5">
            <Eyebrow>Priority</Eyebrow>
            <div className="flex flex-col gap-2">
              {(["Low", "Medium", "High"] as Priority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`rounded-md border px-[13px] py-[11px] text-left text-[13.5px] ${
                    priority === p
                      ? "border-[1.5px] border-graphite bg-selected font-medium text-ink"
                      : "border-black/[.12] text-muted"
                  }`}
                >
                  {p === "Low" && "Low — can wait for the next visit"}
                  {p === "Medium" && "Medium — within a few days"}
                  {p === "High" && "High — same day"}
                </button>
              ))}
            </div>
            <div className="flex items-start gap-[11px] border-t border-black/[.07] pt-[14px]">
              <Toggle on={urgent} onChange={() => setUrgent((v) => !v)} tone="urgent" />
              <div className="flex flex-col gap-[3px]">
                <span className="text-[13px] font-medium text-urgent">
                  Flag as urgent
                </span>
                <span className="text-[11.5px] leading-[1.45] text-meta">
                  Risk to a resident or the building. Pages the on-call
                  maintenance lead immediately.
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-lg border border-black/[.09] bg-surface p-5">
            <Eyebrow>Similar open requests</Eyebrow>
            <div className="flex flex-col gap-[10px]">
              <div className="flex flex-col gap-[3px]">
                <span className="text-[13px] font-medium text-ink">
                  Boiler pressure dropping
                </span>
                <span className="font-mono text-[11.5px] text-eyebrow">
                  WH-0418 · plant room · in progress
                </span>
              </div>
              <div className="flex flex-col gap-[3px]">
                <span className="text-[13px] font-medium text-ink">
                  Room 14 radiator lukewarm
                </span>
                <span className="font-mono text-[11.5px] text-eyebrow">
                  WH-0431 · room 14 · accepted
                </span>
              </div>
            </div>
            <span className="text-[11.5px] leading-[1.45] text-meta">
              Two heating jobs already open in this home — maintenance may
              combine the visit.
            </span>
          </div>
        </div>
      </form>
    </>
  );
}
