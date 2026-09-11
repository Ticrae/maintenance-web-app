"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { buttonClasses } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/misc";
import { TextField } from "@/components/ui/inputs";
import type { TroubleshootingSummary } from "@/app/actions/requests";
import type { StaffGuideListItem } from "@/app/actions/troubleshooting";
import { useDictionary } from "@/lib/i18n/language-provider";

import { RequestForm } from "./request-form";
import { GuideRunner, type RunnerResult } from "./guide-runner";

type Phase =
  | "choose"
  | "pick"
  | "run"
  | "resolved"
  | "stopped"
  | "exhausted"
  | "form";

function matchCategory(assetType: string | null, categories: string[]) {
  if (!assetType) return undefined;
  const lower = assetType.toLowerCase();
  return (
    categories.find((c) => c.toLowerCase() === lower) ??
    categories.find(
      (c) => c.toLowerCase().includes(lower) || lower.includes(c.toLowerCase()),
    )
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const dict = useDictionary();
  const t = dict.staff.newRequest;

  return (
    <>
      <div className="flex h-[62px] flex-none items-center gap-[14px] border-b border-black/[.08] px-7">
        <div className="h-[26px] w-[26px] rounded-md bg-graphite" />
        <Link href="/staff" className="text-[13px] text-meta">
          {dict.staff.nav.myRequests}
        </Link>
        <span className="text-[13px] text-hairline">/</span>
        <span className="text-[13px] font-medium text-ink">
          {t.flow.chooseTitle}
        </span>
      </div>
      <div className="flex flex-1 justify-center overflow-auto bg-canvas p-7">
        <div className="w-full max-w-[720px]">{children}</div>
      </div>
    </>
  );
}

export function NewRequestFlow({
  categories,
  homes,
  defaultHomeId,
  guides,
}: {
  categories: string[];
  homes: { id: string; name: string }[];
  defaultHomeId: string;
  guides: StaffGuideListItem[];
}) {
  const dict = useDictionary();
  const t = dict.staff.newRequest.flow;

  const [phase, setPhase] = useState<Phase>("choose");
  const [search, setSearch] = useState("");
  const [selectedGuide, setSelectedGuide] = useState<StaffGuideListItem | null>(
    null,
  );
  const [troubleshooting, setTroubleshooting] =
    useState<TroubleshootingSummary | null>(null);
  // Where the form's "Back" button should return the user, since the form can
  // be reached from the first choice, the guide picker, or an outcome screen.
  const [formBack, setFormBack] = useState<Phase>("choose");

  function goToForm(from: Phase) {
    setFormBack(from);
    setPhase("form");
  }

  const hasGuides = guides.length > 0;

  const filteredGuides = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return guides;
    return guides.filter(
      (g) =>
        g.problem.toLowerCase().includes(q) ||
        g.title.toLowerCase().includes(q) ||
        (g.assetType?.toLowerCase().includes(q) ?? false),
    );
  }, [guides, search]);

  function startTroubleshooting() {
    if (hasGuides) {
      setPhase("pick");
    } else {
      setSelectedGuide(null);
      setTroubleshooting(null);
      goToForm("choose");
    }
  }

  function handleRunnerEnd(result: RunnerResult) {
    if (result.kind === "resolved") {
      setTroubleshooting(null);
      setPhase("resolved");
      return;
    }

    if (selectedGuide) {
      setTroubleshooting({
        problem: selectedGuide.problem,
        guideTitle: selectedGuide.title,
        stepsCompleted: result.stepsCompleted,
        outcome: result.kind === "stopped" ? "stopped" : "unresolved",
      });
    }
    setPhase(result.kind === "stopped" ? "stopped" : "exhausted");
  }

  // --- Form phase renders its own chrome -----------------------------------
  if (phase === "form") {
    return (
      <RequestForm
        categories={categories}
        homes={homes}
        defaultHomeId={defaultHomeId}
        prefill={
          selectedGuide
            ? {
                title: selectedGuide.problem,
                category: matchCategory(selectedGuide.assetType, categories),
              }
            : undefined
        }
        troubleshooting={troubleshooting}
        onBack={() => setPhase(formBack)}
      />
    );
  }

  // --- Choose: troubleshoot vs. submit -----------------------------------
  if (phase === "choose") {
    return (
      <Shell>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <Eyebrow>{t.chooseTitle}</Eyebrow>
            <h1 className="text-[18px] font-semibold text-ink">
              {t.chooseSubtitle}
            </h1>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={startTroubleshooting}
              className="flex flex-col gap-1 rounded-lg border border-black/[.12] bg-surface p-5 text-left transition-colors hover:border-graphite hover:bg-hover"
            >
              <span className="text-[14.5px] font-semibold text-ink">
                🛠️ {t.troubleshootOption}
              </span>
              <span className="text-[12.5px] leading-[1.5] text-meta">
                {t.troubleshootHint}
              </span>
            </button>

            <button
              onClick={() => {
                setSelectedGuide(null);
                setTroubleshooting(null);
                goToForm("choose");
              }}
              className="flex flex-col gap-1 rounded-lg border border-black/[.12] bg-surface p-5 text-left transition-colors hover:border-graphite hover:bg-hover"
            >
              <span className="text-[14.5px] font-semibold text-ink">
                📋 {t.requestOption}
              </span>
              <span className="text-[12.5px] leading-[1.5] text-meta">
                {t.requestHint}
              </span>
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  // --- Pick a guide -----------------------------------------------------
  if (phase === "pick") {
    return (
      <Shell>
        <div className="flex flex-col gap-5">
          <button
            onClick={() => setPhase("choose")}
            className="self-start text-[13px] text-meta hover:text-ink"
          >
            ← {t.back}
          </button>

          <div className="flex flex-col gap-1">
            <Eyebrow>{t.chooseTitle}</Eyebrow>
            <h1 className="text-[18px] font-semibold text-ink">
              {t.pickGuideTitle}
            </h1>
            <p className="text-[12.5px] text-meta">{t.pickGuideSubtitle}</p>
          </div>

          <TextField
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.searchGuidesPlaceholder}
          />

          <div className="flex flex-col gap-2">
            {filteredGuides.length === 0 && (
              <p className="px-1 text-[12.5px] text-subtle">{t.noGuidesMatch}</p>
            )}

            {filteredGuides.map((g) => (
              <button
                key={g.id}
                onClick={() => {
                  setSelectedGuide(g);
                  setPhase("run");
                }}
                className="flex items-center justify-between gap-3 rounded-lg border border-black/[.1] bg-surface px-4 py-[13px] text-left transition-colors hover:border-graphite hover:bg-hover"
              >
                <span className="flex flex-col gap-[3px]">
                  <span className="text-[13.5px] font-medium text-ink">
                    {g.problem}
                  </span>
                  <span className="font-mono text-[11px] text-eyebrow">
                    {g.assetType ? `${g.assetType} · ` : ""}
                    {t.stepsLabel(g.stepCount)}
                  </span>
                </span>
                <span className="text-meta">→</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              setSelectedGuide(null);
              setTroubleshooting(null);
              goToForm("pick");
            }}
            className={buttonClasses("outline", "self-start")}
          >
            {t.noneOfThese}
          </button>
        </div>
      </Shell>
    );
  }

  // --- Run the guide --------------------------------------------------
  if (phase === "run" && selectedGuide) {
    return (
      <Shell>
        <div className="flex justify-center">
          <GuideRunner
            guideId={selectedGuide.id}
            onEnd={handleRunnerEnd}
            onBack={() => setPhase("pick")}
          />
        </div>
      </Shell>
    );
  }

  // --- Outcome screens ----------------------------------------------
  const outcome =
    phase === "resolved"
      ? {
          emoji: "✅",
          title: t.resolvedTitle,
          body: t.resolvedBody,
          showRequestCta: false,
        }
      : phase === "stopped"
        ? {
            emoji: "🔧",
            title: t.stoppedTitle,
            body: t.stoppedBody,
            showRequestCta: true,
          }
        : {
            emoji: "📋",
            title: t.exhaustedTitle,
            body: t.exhaustedBody,
            showRequestCta: true,
          };

  return (
    <Shell>
      <div className="mx-auto flex max-w-[460px] flex-col items-center gap-4 rounded-lg border border-black/[.09] bg-surface p-8 text-center">
        <span className="text-3xl" aria-hidden>
          {outcome.emoji}
        </span>
        <h1 className="text-[16px] font-semibold text-ink">{outcome.title}</h1>
        <p className="text-[13px] leading-[1.6] text-meta">{outcome.body}</p>

        <div className="mt-2 flex flex-wrap justify-center gap-[10px]">
          {outcome.showRequestCta && (
            <button
              onClick={() => goToForm(phase)}
              className={buttonClasses("primary")}
            >
              {t.continueToRequest}
            </button>
          )}

          {hasGuides && (
            <button
              onClick={() => {
                setSelectedGuide(null);
                setTroubleshooting(null);
                setSearch("");
                setPhase("pick");
              }}
              className={buttonClasses("outline")}
            >
              {t.startOver}
            </button>
          )}

          <Link href="/staff" className={buttonClasses("ghost")}>
            {t.backToRequests}
          </Link>
        </div>
      </div>
    </Shell>
  );
}
