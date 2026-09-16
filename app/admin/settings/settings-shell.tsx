"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { SettingsForm, type AppSettings } from "./settings-form";
import { TroubleshootingManager } from "./troubleshooting-manager";
import type { AssetType, AgencyOption, GuideListItem } from "./troubleshooting-manager";
import { InspectionManager } from "@/components/inspection-manager";
import type { TemplateListItem } from "@/components/inspection-manager";
import { useDictionary } from "@/lib/i18n/language-provider";

export function SettingsShell({
  settings,
  assetTypes,
  agencies,
  guides,
  templates,
}: {
  settings: AppSettings | null;
  assetTypes: AssetType[];
  agencies: AgencyOption[];
  guides: GuideListItem[];
  templates: TemplateListItem[];
}) {
  const [tab, setTab] = useState<"troubleshooting" | "inspections" | "general">("troubleshooting");
  const dict = useDictionary();
  const t = dict.admin.settings;

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <PageHeader
        title={t.title}
        subtitle={t.subtitle}
        actions={
          <div className="flex gap-1 rounded-lg bg-hover p-1">
            {(["troubleshooting", "inspections", "general"] as const).map((key) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`rounded-md px-3 py-[6px] text-[13px] font-medium transition-colors ${
                  tab === key ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"
                }`}
              >
                {key === "troubleshooting" ? t.subTabTroubleshooting : key === "inspections" ? t.subTabInspections : t.subTabGeneral}
              </button>
            ))}
          </div>
        }
      />
      {tab === "troubleshooting" ? (
        <TroubleshootingManager assetTypes={assetTypes} agencies={agencies} guides={guides} />
      ) : tab === "inspections" ? (
        <InspectionManager agencies={agencies} templates={templates} namespace="admin" />
      ) : (
        <SettingsForm settings={settings} bare />
      )}
    </div>
  );
}
