"use client";

import { useActionState, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/inputs";
import { Eyebrow } from "@/components/ui/misc";
import { updateSettings } from "@/app/actions/settings";
import { useDictionary } from "@/lib/i18n/language-provider";

export type AppSettings = {
  categories: string[];
  sla_hours: Record<string, number>;
  updated_at: string;
};

const PRIORITIES = ["Urgent", "High", "Medium", "Low"] as const;

export function SettingsForm({
  settings,
  bare = false,
}: {
  settings: AppSettings | null;
  bare?: boolean;
}) {
  const [state, formAction, isPending] = useActionState(updateSettings, undefined);
  const [categories, setCategories] = useState<string[]>(settings?.categories ?? []);
  const [draft, setDraft] = useState("");
  const dict = useDictionary();
  const t = dict.admin.settings;

  if (!settings) {
    const notice = (
      <div className="p-4 text-sm text-meta sm:p-7">
        {t.notInitialized}{" "}
        <code className="rounded bg-chip px-1 py-[2px] font-mono text-xs">
          supabase/migrations/0001_app_settings.sql
        </code>{" "}
        {t.notInitializedSuffix}
      </div>
    );
    if (bare) return notice;
    return (
      <div className="flex flex-1 flex-col overflow-auto">
        <PageHeader title={t.title} subtitle={t.subtitle} />
        {notice}
      </div>
    );
  }

  function addCategory() {
    const value = draft.trim();
    if (value && !categories.includes(value)) setCategories((c) => [...c, value]);
    setDraft("");
  }

  function removeCategory(value: string) {
    setCategories((c) => c.filter((c2) => c2 !== value));
  }

  const form = (
    <form action={formAction} className="flex flex-1 flex-col gap-6 bg-canvas p-4 sm:p-7">
        <input type="hidden" name="categories" value={categories.join(",")} />

        <div className="flex flex-col gap-3 rounded-lg border border-black/[.09] bg-surface p-5">
          <Eyebrow>{t.requestCategories}</Eyebrow>
          <p className="text-[13px] text-subtle">
            {t.categoriesHint}
          </p>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <span
                key={c}
                className="flex items-center gap-1 rounded-full bg-chip px-3 py-[6px] text-xs text-body"
              >
                {c}
                <button
                  type="button"
                  onClick={() => removeCategory(c)}
                  className="text-meta hover:text-urgent"
                  aria-label={`Remove ${c}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <TextField
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCategory();
                }
              }}
              placeholder={t.addCategoryPlaceholder}
              className="w-full sm:w-[220px]"
            />
            <Button type="button" variant="outline" onClick={addCategory}>
              {dict.common.add}
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-black/[.09] bg-surface p-5">
          <Eyebrow>{t.slaTargets}</Eyebrow>
          <p className="text-[13px] text-subtle">
            {t.slaHint}
          </p>
          <div className="flex gap-4">
            {PRIORITIES.map((p) => (
              <div key={p} className="flex flex-col gap-[7px]">
                <label className="text-[13px] font-medium text-body">{dict.common.priority[p]}</label>
                <div className="flex items-center gap-2">
                  <TextField
                    type="number"
                    min={1}
                    name={`sla_${p}`}
                    defaultValue={settings.sla_hours[p] ?? ""}
                    className="w-20"
                  />
                  <span className="text-xs text-meta">{t.hours}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {state?.error && (
          <p className="text-sm text-red-700" role="alert">
            {state.error}
          </p>
        )}

        <div>
          <Button type="submit" disabled={isPending}>
            {isPending ? dict.common.saving : t.saveSettings}
          </Button>
        </div>
      </form>
  );

  if (bare) return form;

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <PageHeader title={t.title} subtitle={t.subtitle} />
      {form}
    </div>
  );
}
