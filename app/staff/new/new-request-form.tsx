"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Eyebrow, AddPhotoTile } from "@/components/ui/misc";
import { Button, buttonClasses } from "@/components/ui/button";
import { TextField, TextArea, Select, Toggle } from "@/components/ui/inputs";
import { submitStaffRequest } from "@/app/actions/requests";
import { uploadRequestPhoto } from "@/app/actions/photos";
import type { Priority } from "@/lib/theme";

type PhotoPreview = {
  file: File;
  url: string;
};

export function NewRequestForm({
  categories,
  homes,
  defaultHomeId,
}: {
  categories: string[];
  homes: { id: string; name: string }[];
  defaultHomeId: string;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [homeId, setHomeId] = useState(defaultHomeId || homes[0]?.id || "");
  const [category, setCategory] = useState(categories[0] ?? "");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [urgent, setUrgent] = useState(false);

  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  /*
   * Clean up object URLs when the component unmounts.
   */
  useEffect(() => {
    return () => {
      photos.forEach((photo) => {
        URL.revokeObjectURL(photo.url);
      });
    };
  }, [photos]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);

    if (!files.length) return;

    const validPhotos: PhotoPreview[] = [];

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        setError(`${file.name} is not an image.`);
        continue;
      }

      // 10 MB limit per photo
      if (file.size > 10 * 1024 * 1024) {
        setError(`${file.name} is too large. Maximum size is 10 MB.`);
        continue;
      }

      validPhotos.push({
        file,
        url: URL.createObjectURL(file),
      });
    }

    if (validPhotos.length) {
      setPhotos((current) => [...current, ...validPhotos]);
      setError(null);
    }

    // Allows selecting the same file again
    e.target.value = "";
  }

  function removePhoto(index: number) {
    setPhotos((current) => {
      const photo = current[index];

      if (photo) {
        URL.revokeObjectURL(photo.url);
      }

      return current.filter((_, i) => i !== index);
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (pending) return;

    if (!homeId) {
      setError("Choose a home first.");
      return;
    }

    if (!title.trim()) {
      setError("Enter a short title.");
      return;
    }

    if (!description.trim()) {
      setError("Enter a description.");
      return;
    }

    setError(null);
    setPending(true);

    try {
      /*
       * 1. Create the maintenance request first.
       */
      const { id } = await submitStaffRequest({
        title: title.trim(),
        homeId,
        location: location.trim(),
        category,
        description: description.trim(),
        priority,
        urgent,
      });

      /*
       * 2. Upload each photo and associate it with the request.
       */
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];

        const formData = new FormData();
        formData.append("photo", photo.file);

        try {
          await uploadRequestPhoto(id, formData);
        } catch (photoError) {
          throw new Error(
            `Request was created, but photo ${i + 1} (${photo.file.name}) failed to upload. ${
              photoError instanceof Error ? photoError.message : ""
            }`,
          );
        }
      }

      /*
       * 3. Clean up preview URLs before leaving the page.
       */
      photos.forEach((photo) => {
        URL.revokeObjectURL(photo.url);
      });

      router.push("/staff");
      router.refresh();
    } catch (err) {
      console.error("Submit request error:", err);

      setError(
        err instanceof Error ? err.message : "Could not submit request.",
      );

      setPending(false);
    }
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

          <Button type="submit" form="new-request-form" disabled={pending}>
            {pending ? "Submitting…" : "Submit request"}
          </Button>
        </div>
      </div>

      <form
        id="new-request-form"
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
                  Home
                </label>

                <Select
                  value={homeId}
                  onChange={(e) => setHomeId(e.target.value)}
                  required
                >
                  {homes.length === 0 && (
                    <option value="">No homes available</option>
                  )}

                  {homes.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="flex flex-1 flex-col gap-[7px]">
                <label className="text-[13px] font-medium text-body">
                  Category
                </label>

                <Select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-[7px]">
              <label className="text-[13px] font-medium text-body">
                Room / location (optional)
              </label>

              <TextField
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Room 12"
              />
            </div>

            <div className="flex flex-col gap-[7px]">
              <label className="text-[13px] font-medium text-body">
                Description
              </label>

              <TextArea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-[108px]"
                required
              />
            </div>
          </div>

          {/* PHOTOS */}
          <div className="flex flex-col gap-4 rounded-lg border border-black/[.09] bg-surface p-6">
            <Eyebrow>Photos</Eyebrow>

            <div className="flex flex-wrap gap-3">
              {photos.map((photo, i) => (
                <div
                  key={`${photo.file.name}-${photo.file.lastModified}-${i}`}
                  className="relative h-[112px] w-[150px]"
                >
                  <img
                    src={photo.url}
                    alt={photo.file.name}
                    className="h-full w-full rounded-md border border-black/[.1] object-cover"
                  />

                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    disabled={pending}
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white disabled:opacity-50"
                    aria-label={`Remove ${photo.file.name}`}
                  >
                    ×
                  </button>
                </div>
              ))}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />

              <button
                type="button"
                disabled={pending}
                onClick={() => fileInputRef.current?.click()}
                className="disabled:opacity-50"
              >
                <AddPhotoTile className="h-[112px] w-[150px]" />
              </button>
            </div>

            <p className="text-[11.5px] text-meta">
              JPG, PNG, WebP or GIF. Maximum 10 MB per photo.
            </p>
          </div>

          {error && (
            <div
              className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              role="alert"
            >
              {error}
            </div>
          )}
        </div>

        {/* PRIORITY */}
        <div className="flex w-[340px] flex-none flex-col gap-4">
          <div className="flex flex-col gap-[14px] rounded-lg border border-black/[.09] bg-surface p-5">
            <Eyebrow>Priority</Eyebrow>

            <div className="flex flex-col gap-2">
              {(["Low", "Medium", "High"] as Priority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  disabled={pending}
                  onClick={() => setPriority(p)}
                  className={`rounded-md border px-[13px] py-[11px] text-left text-[13.5px] disabled:opacity-50 ${
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
              <Toggle
                on={urgent}
                onChange={() => setUrgent((v) => !v)}
                tone="urgent"
              />

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
        </div>
      </form>
    </>
  );
}
