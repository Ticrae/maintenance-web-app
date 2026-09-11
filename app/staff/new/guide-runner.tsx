"use client";

import { useEffect, useRef, useState } from "react";

import { buttonClasses } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/misc";
import { SafetyBadge } from "@/components/ui/badges";
import {
  getStaffGuideRunner,
  type StaffGuideRunner,
  type RunnerStep,
  type RunnerOption,
} from "@/app/actions/troubleshooting";
import { useDictionary } from "@/lib/i18n/language-provider";

export type RunnerResult = {
  kind: "resolved" | "stopped" | "unresolved";
  stepsCompleted: number;
};

// Safety net against a guide whose options loop back on themselves — walking
// more than this many steps almost certainly means a cycle in the graph.
const MAX_TRANSITIONS = 100;

function firstStep(steps: RunnerStep[]): RunnerStep | null {
  if (steps.length === 0) return null;
  return steps.reduce((min, s) => (s.step_number < min.step_number ? s : min));
}

function nextByNumber(steps: RunnerStep[], current: RunnerStep): RunnerStep | null {
  const ahead = steps
    .filter((s) => s.step_number > current.step_number)
    .sort((a, b) => a.step_number - b.step_number);
  return ahead[0] ?? null;
}

export function GuideRunner({
  guideId,
  onEnd,
  onBack,
}: {
  guideId: string;
  onEnd: (result: RunnerResult) => void;
  onBack: () => void;
}) {
  const dict = useDictionary();
  const t = dict.staff.newRequest.flow;

  const [guide, setGuide] = useState<StaffGuideRunner | null>(null);
  const [error, setError] = useState(false);
  const [currentStepId, setCurrentStepId] = useState<string | null>(null);
  const [answered, setAnswered] = useState(0);
  const transitions = useRef(0);

  useEffect(() => {
    let cancelled = false;
    getStaffGuideRunner(guideId)
      .then((data) => {
        if (cancelled) return;
        if (!data || data.steps.length === 0) {
          setError(true);
          return;
        }
        setGuide(data);
        setCurrentStepId(firstStep(data.steps)?.id ?? null);
        transitions.current = 0;
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [guideId]);

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <p className="text-sm text-body">{t.runnerError}</p>
        <button onClick={onBack} className={buttonClasses("outline")}>
          {t.back}
        </button>
      </div>
    );
  }

  if (!guide || !currentStepId) {
    return <p className="py-12 text-center text-sm text-meta">{t.loading}</p>;
  }

  const step = guide.steps.find((s) => s.id === currentStepId) ?? firstStep(guide.steps)!;
  const position = [...guide.steps]
    .sort((a, b) => a.step_number - b.step_number)
    .findIndex((s) => s.id === step.id);

  function goToStep(target: RunnerStep | null, completed: number) {
    if (!target || transitions.current >= MAX_TRANSITIONS) {
      onEnd({ kind: "unresolved", stepsCompleted: completed });
      return;
    }
    transitions.current += 1;
    setAnswered(completed);
    setCurrentStepId(target.id);
  }

  function handleOption(option: RunnerOption) {
    const completed = answered + 1;
    const action = option.action ?? "continue";

    if (action === "finish") {
      onEnd({ kind: "resolved", stepsCompleted: completed });
      return;
    }
    if (action === "stop") {
      onEnd({ kind: "stopped", stepsCompleted: completed });
      return;
    }
    if (action === "create_request") {
      onEnd({ kind: "unresolved", stepsCompleted: completed });
      return;
    }

    const target = option.next_step_id
      ? (guide!.steps.find((s) => s.id === option.next_step_id) ?? null)
      : nextByNumber(guide!.steps, step);
    goToStep(target, completed);
  }

  // A step with no author-defined options falls back to a plain
  // "did this fix it?" — Yes ends the flow, No advances to the next step.
  function handleYesNo(fixed: boolean) {
    const completed = answered + 1;
    if (fixed) {
      onEnd({ kind: "resolved", stepsCompleted: completed });
      return;
    }
    goToStep(nextByNumber(guide!.steps, step), completed);
  }

  function restart() {
    transitions.current = 0;
    setAnswered(0);
    setCurrentStepId(firstStep(guide!.steps)?.id ?? null);
  }

  const isMaintenanceOnly = step.safety_level === "maintenance_required";

  return (
    <div className="flex w-full max-w-[640px] flex-col gap-5">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-[13px] text-meta hover:text-ink">
          ← {t.back}
        </button>
        <span className="font-mono text-[11px] uppercase tracking-[.08em] text-eyebrow">
          {t.stepCounter(position + 1, guide.steps.length)}
        </span>
      </div>

      <div className="flex flex-col gap-4 rounded-lg border border-black/[.09] bg-surface p-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Eyebrow>{guide.problem}</Eyebrow>
            <SafetyBadge level={step.safety_level} short />
          </div>
          <h2 className="text-[16px] font-semibold text-ink">{step.title}</h2>
        </div>

        <p className="text-[13.5px] leading-[1.6] text-body">{step.instruction}</p>

        {isMaintenanceOnly && (
          <div
            className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] leading-[1.5] text-red-700"
            role="note"
          >
            {t.safetyNote}
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-black/[.07] pt-4">
          <p className="text-[13.5px] font-medium text-ink">
            {step.question || t.didItWork}
          </p>

          <div className="flex flex-wrap gap-[10px]">
            {step.options.length > 0
              ? step.options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleOption(option)}
                    className={buttonClasses("outline", "min-w-[96px]")}
                  >
                    {option.label}
                  </button>
                ))
              : (
                <>
                  <button
                    onClick={() => handleYesNo(true)}
                    className={buttonClasses("primary", "min-w-[96px]")}
                  >
                    {t.yes}
                  </button>
                  <button
                    onClick={() => handleYesNo(false)}
                    className={buttonClasses("outline", "min-w-[96px]")}
                  >
                    {t.no}
                  </button>
                </>
              )}
          </div>
        </div>
      </div>

      <button
        onClick={restart}
        className="self-start text-[12.5px] text-meta hover:text-ink hover:underline"
      >
        {t.startOver}
      </button>
    </div>
  );
}
