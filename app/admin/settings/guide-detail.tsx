"use client";

import { useState } from "react";
import { Button, buttonClasses } from "@/components/ui/button";
import { TextField, TextArea, Select } from "@/components/ui/inputs";
import { Eyebrow } from "@/components/ui/misc";
import { SafetyBadge, GuideStatusBadge } from "@/components/ui/badges";
import {
  updateGuideMeta,
  createStep,
  updateStep,
  deleteStep,
  moveStep,
  createOption,
  updateOption,
  deleteOption,
  type GuideDetail,
  type StepRow,
  type OptionRow,
  type StepType,
  type StepAction,
} from "@/app/actions/troubleshooting";
import type { SafetyLevel, GuideStatus } from "@/lib/theme";
import { useDictionary } from "@/lib/i18n/language-provider";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { AssetType, AgencyOption } from "./troubleshooting-manager";

const STATUSES: GuideStatus[] = ["draft", "review", "published", "archived"];
const STEP_TYPES: StepType[] = ["question", "instruction", "information"];
const SAFETY_LEVELS: SafetyLevel[] = ["safe", "caution", "maintenance_required"];

export function GuideDetailPanel({
  guide,
  assetTypes,
  agencies,
  onChanged,
  onDeleteGuide,
  onRefresh,
}: {
  guide: GuideDetail;
  assetTypes: AssetType[];
  agencies: AgencyOption[];
  onChanged: (updated: { id: string; title: string; status: GuideStatus; asset_type_id: string; agency_id: string }) => void;
  onDeleteGuide: () => void;
  onRefresh: () => void;
}) {
  const dict = useDictionary();
  const t = dict.admin.troubleshooting;

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <GuideMetaForm guide={guide} assetTypes={assetTypes} agencies={agencies} onChanged={onChanged} onDeleteGuide={onDeleteGuide} />
      <div className="flex flex-col gap-3">
        <Eyebrow>{t.steps}</Eyebrow>
        {guide.steps.length === 0 && <p className="text-[13px] text-subtle">{t.noStepsYet}</p>}
        <div className="flex flex-col gap-3">
          {guide.steps.map((step, i) => (
            <StepCard
              key={step.id}
              step={step}
              allSteps={guide.steps}
              isFirst={i === 0}
              isLast={i === guide.steps.length - 1}
              onRefresh={onRefresh}
            />
          ))}
        </div>
        <AddStepForm guideId={guide.id} onRefresh={onRefresh} />
      </div>
    </div>
  );
}

function GuideMetaForm({
  guide,
  assetTypes,
  agencies,
  onChanged,
  onDeleteGuide,
}: {
  guide: GuideDetail;
  assetTypes: AssetType[];
  agencies: AgencyOption[];
  onChanged: (updated: { id: string; title: string; status: GuideStatus; asset_type_id: string; agency_id: string }) => void;
  onDeleteGuide: () => void;
}) {
  const dict = useDictionary();
  const t = dict.admin.troubleshooting;
  const [title, setTitle] = useState(guide.title);
  const [problem, setProblem] = useState(guide.problem);
  const [description, setDescription] = useState(guide.description ?? "");
  const [status, setStatus] = useState<GuideStatus>(guide.status);
  const [assetTypeId, setAssetTypeId] = useState(guide.asset_type_id);
  const [agencyId, setAgencyId] = useState(guide.agency_id);
  const [pending, setPending] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !problem.trim()) return;
    setPending(true);
    setError(null);
    try {
      await updateGuideMeta(guide.id, {
        title: title.trim(),
        problem: problem.trim(),
        description: description.trim(),
        status,
        asset_type_id: assetTypeId,
        agency_id: agencyId,
      });
      onChanged({ id: guide.id, title: title.trim(), status, asset_type_id: assetTypeId, agency_id: agencyId });
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : t.updateGuideError);
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-4 rounded-lg border border-black/[.09] p-5">
      <div className="flex items-center justify-between">
        <Eyebrow>{t.guideDetails}</Eyebrow>
        <GuideStatusBadge status={guide.status} />
      </div>
      <div className="flex gap-[14px]">
        <div className="flex flex-1 flex-col gap-[7px]">
          <label className="text-[13px] font-medium text-body">{t.assetTypeField}</label>
          <Select value={assetTypeId} onChange={(e) => setAssetTypeId(e.target.value)}>
            {assetTypes.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-1 flex-col gap-[7px]">
          <label className="text-[13px] font-medium text-body">{t.agencyField}</label>
          <Select value={agencyId} onChange={(e) => setAgencyId(e.target.value)}>
            {agencies.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className="flex gap-[14px]">
        <div className="flex flex-1 flex-col gap-[7px]">
          <label className="text-[13px] font-medium text-body">{t.problemField}</label>
          <TextField value={problem} onChange={(e) => setProblem(e.target.value)} required />
        </div>
        <div className="flex flex-1 flex-col gap-[7px]">
          <label className="text-[13px] font-medium text-body">{t.statusField}</label>
          <Select value={status} onChange={(e) => setStatus(e.target.value as GuideStatus)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {t.status[s]}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className="flex flex-col gap-[7px]">
        <label className="text-[13px] font-medium text-body">{t.guideTitleField}</label>
        <TextField value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div className="flex flex-col gap-[7px]">
        <label className="text-[13px] font-medium text-body">{t.descriptionOptional}</label>
        <TextArea value={description} onChange={(e) => setDescription(e.target.value)} className="h-16" />
      </div>
      {error && (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
      <div className="flex items-center gap-2">
        {confirmDelete ? (
          <div className="flex items-center gap-2">
            <button type="button" onClick={onDeleteGuide} className="text-xs font-medium text-urgent hover:underline">
              {dict.common.confirm}
            </button>
            <button type="button" onClick={() => setConfirmDelete(false)} className="text-xs text-meta hover:underline">
              {dict.common.cancel}
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirmDelete(true)} className="text-xs font-medium text-urgent hover:underline">
            {t.deleteGuide}
          </button>
        )}
        <Button type="submit" disabled={pending} className="ml-auto">
          {pending ? dict.common.saving : t.saveGuide}
        </Button>
      </div>
    </form>
  );
}

function stepLabel(step: StepRow, t: Dictionary["admin"]["troubleshooting"]) {
  return `${t.step} ${step.step_number}: ${step.title}`;
}

function outcomeLabel(option: OptionRow, allSteps: StepRow[], t: Dictionary["admin"]["troubleshooting"]) {
  if (option.action === "create_request") return t.createRequestAction;
  if (option.action === "finish") return t.finishAction;
  if (option.action === "stop") return t.stopAction;
  const target = allSteps.find((s) => s.id === option.next_step_id);
  return target ? t.goToStep(target.step_number) : t.chooseTargetStep;
}

function StepCard({
  step,
  allSteps,
  isFirst,
  isLast,
  onRefresh,
}: {
  step: StepRow;
  allSteps: StepRow[];
  isFirst: boolean;
  isLast: boolean;
  onRefresh: () => void;
}) {
  const dict = useDictionary();
  const t = dict.admin.troubleshooting;
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addingOption, setAddingOption] = useState(false);

  async function handleMove(direction: "up" | "down") {
    setPending(true);
    try {
      await moveStep(step.id, step.guide_id, direction);
      onRefresh();
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    setPending(true);
    setError(null);
    try {
      await deleteStep(step.id, step.guide_id);
      onRefresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t.deleteStepError);
      setPending(false);
    }
  }

  if (editing) {
    return (
      <StepForm
        guideId={step.guide_id}
        step={step}
        onRefresh={onRefresh}
        onDone={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-black/[.09] bg-canvas p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[.08em] text-eyebrow">
              {t.step} {step.step_number}
            </span>
            <span className="text-[13.5px] font-medium text-ink">{step.title}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded bg-chip px-[6px] py-[2px] text-[10.5px] font-medium text-graphite">
              {t.stepTypeLabel[step.step_type]}
            </span>
            <SafetyBadge level={step.safety_level} short />
          </div>
        </div>
        <div className="flex flex-none items-center gap-1">
          <button
            onClick={() => handleMove("up")}
            disabled={isFirst || pending}
            className="rounded px-2 py-1 text-xs text-meta hover:bg-hover disabled:opacity-30"
            aria-label={t.moveUp}
          >
            ↑
          </button>
          <button
            onClick={() => handleMove("down")}
            disabled={isLast || pending}
            className="rounded px-2 py-1 text-xs text-meta hover:bg-hover disabled:opacity-30"
            aria-label={t.moveDown}
          >
            ↓
          </button>
          <button onClick={() => setEditing(true)} className="rounded px-2 py-1 text-xs font-medium text-link hover:underline">
            {dict.common.edit}
          </button>
          {confirmDelete ? (
            <>
              <button onClick={handleDelete} disabled={pending} className="rounded px-2 py-1 text-xs font-medium text-urgent hover:underline">
                {dict.common.confirm}
              </button>
              <button onClick={() => setConfirmDelete(false)} className="rounded px-2 py-1 text-xs text-meta hover:underline">
                {dict.common.cancel}
              </button>
            </>
          ) : (
            <button onClick={() => setConfirmDelete(true)} className="rounded px-2 py-1 text-xs font-medium text-urgent hover:underline">
              {dict.common.delete}
            </button>
          )}
        </div>
      </div>

      <p className="text-[13px] leading-[1.5] text-body">{step.instruction}</p>
      {step.question && (
        <p className="text-[13px] font-medium text-ink">{step.question}</p>
      )}

      {error && (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-2 border-t border-black/[.06] pt-3">
        <Eyebrow>{t.options}</Eyebrow>
        {step.options.length === 0 && <p className="text-[12px] text-subtle">{t.noOptionsYet}</p>}
        {step.options.map((o) => (
          <OptionEditor key={o.id} option={o} allSteps={allSteps} currentStepId={step.id} onRefresh={onRefresh} />
        ))}
        {addingOption ? (
          <OptionForm
            stepId={step.id}
            allSteps={allSteps}
            currentStepId={step.id}
            onRefresh={onRefresh}
            onDone={() => setAddingOption(false)}
          />
        ) : (
          <button
            onClick={() => setAddingOption(true)}
            className="self-start text-xs font-medium text-link hover:underline"
          >
            + {t.addOption}
          </button>
        )}
      </div>
    </div>
  );
}

function OptionEditor({
  option,
  allSteps,
  currentStepId,
  onRefresh,
}: {
  option: OptionRow;
  allSteps: StepRow[];
  currentStepId: string;
  onRefresh: () => void;
}) {
  const dict = useDictionary();
  const t = dict.admin.troubleshooting;
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (editing) {
    return (
      <OptionForm
        stepId={currentStepId}
        allSteps={allSteps}
        currentStepId={currentStepId}
        option={option}
        onRefresh={onRefresh}
        onDone={() => setEditing(false)}
      />
    );
  }

  async function handleDelete() {
    setPending(true);
    setError(null);
    try {
      await deleteOption(option.id);
      onRefresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t.deleteOptionError);
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2 rounded-md bg-hover px-3 py-[8px]">
        <span className="text-[13px] text-ink">
          <span className="font-medium">{option.label}</span>
          <span className="text-meta"> → {outcomeLabel(option, allSteps, t)}</span>
        </span>
        <div className="flex flex-none items-center gap-2">
          <button onClick={() => setEditing(true)} className="text-xs font-medium text-link hover:underline">
            {dict.common.edit}
          </button>
          <button onClick={handleDelete} disabled={pending} className="text-xs font-medium text-urgent hover:underline">
            {dict.common.delete}
          </button>
        </div>
      </div>
      {error && (
        <p className="text-xs text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function OptionForm({
  stepId,
  allSteps,
  currentStepId,
  option,
  onRefresh,
  onDone,
}: {
  stepId: string;
  allSteps: StepRow[];
  currentStepId: string;
  option?: OptionRow;
  onRefresh: () => void;
  onDone: () => void;
}) {
  const dict = useDictionary();
  const t = dict.admin.troubleshooting;
  const [label, setLabel] = useState(option?.label ?? "");
  const [action, setAction] = useState<StepAction>(option?.action ?? "continue");
  const [nextStepId, setNextStepId] = useState(option?.next_step_id ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const targetSteps = allSteps.filter((s) => s.id !== currentStepId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) return;
    if (action === "continue" && !nextStepId) return;
    setPending(true);
    setError(null);
    try {
      const payload = { label: label.trim(), action, next_step_id: action === "continue" ? nextStepId : null };
      if (option) await updateOption(option.id, payload);
      else await createOption({ step_id: stepId, ...payload });
      onRefresh();
      onDone();
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : option ? t.updateOptionError : t.createOptionError);
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 rounded-md border border-black/[.09] bg-surface p-3">
      <div className="flex flex-wrap gap-2">
        <TextField
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={t.optionLabelPlaceholder}
          className="w-full sm:w-[140px]"
          required
        />
        <span className="flex items-center text-[13px] text-meta">{t.optionOutcomeField}</span>
        <Select value={action} onChange={(e) => setAction(e.target.value as StepAction)} className="w-full sm:w-auto">
          <option value="continue">{t.continueAction}</option>
          <option value="create_request">{t.createRequestAction}</option>
          <option value="finish">{t.finishAction}</option>
          <option value="stop">{t.stopAction}</option>
        </Select>
        {action === "continue" && (
          <Select value={nextStepId} onChange={(e) => setNextStepId(e.target.value)} className="w-full sm:w-auto" required>
            <option value="">{t.chooseTargetStep}</option>
            {targetSteps.map((s) => (
              <option key={s.id} value={s.id}>
                {stepLabel(s, t)}
              </option>
            ))}
          </Select>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-700" role="alert">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className={buttonClasses("primary")}>
          {pending ? dict.common.saving : dict.common.save}
        </button>
        <button type="button" onClick={onDone} className={buttonClasses("outline")}>
          {dict.common.cancel}
        </button>
      </div>
    </form>
  );
}

function StepForm({
  guideId,
  step,
  onRefresh,
  onDone,
}: {
  guideId: string;
  step?: StepRow;
  onRefresh: () => void;
  onDone: () => void;
}) {
  const dict = useDictionary();
  const t = dict.admin.troubleshooting;
  const [title, setTitle] = useState(step?.title ?? "");
  const [instruction, setInstruction] = useState(step?.instruction ?? "");
  const [question, setQuestion] = useState(step?.question ?? "");
  const [stepType, setStepType] = useState<StepType>(step?.step_type ?? "question");
  const [safetyLevel, setSafetyLevel] = useState<SafetyLevel>(step?.safety_level ?? "safe");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !instruction.trim()) return;
    setPending(true);
    setError(null);
    try {
      const payload = {
        title: title.trim(),
        instruction: instruction.trim(),
        question: question.trim(),
        step_type: stepType,
        safety_level: safetyLevel,
      };
      if (step) await updateStep(step.id, payload);
      else await createStep({ guide_id: guideId, ...payload });
      onRefresh();
      onDone();
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : step ? t.updateStepError : t.createStepError);
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-lg border border-black/[.09] bg-canvas p-4">
      <Eyebrow>{step ? t.editStepTitle : t.addStepTitle}</Eyebrow>
      <div className="flex flex-col gap-[7px]">
        <label className="text-[13px] font-medium text-body">{t.stepTitleField}</label>
        <TextField value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t.stepTitlePlaceholder} required />
      </div>
      <div className="flex flex-col gap-[7px]">
        <label className="text-[13px] font-medium text-body">{t.instructionField}</label>
        <TextArea value={instruction} onChange={(e) => setInstruction(e.target.value)} placeholder={t.instructionPlaceholder} className="h-16" required />
      </div>
      <div className="flex flex-col gap-[7px]">
        <label className="text-[13px] font-medium text-body">{t.questionField}</label>
        <TextField value={question} onChange={(e) => setQuestion(e.target.value)} placeholder={t.questionPlaceholder} />
      </div>
      <div className="flex gap-[14px]">
        <div className="flex flex-1 flex-col gap-[7px]">
          <label className="text-[13px] font-medium text-body">{t.stepTypeField}</label>
          <Select value={stepType} onChange={(e) => setStepType(e.target.value as StepType)}>
            {STEP_TYPES.map((s) => (
              <option key={s} value={s}>
                {t.stepTypeLabel[s]}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-1 flex-col gap-[7px]">
          <label className="text-[13px] font-medium text-body">{t.safetyLevelField}</label>
          <Select value={safetyLevel} onChange={(e) => setSafetyLevel(e.target.value as SafetyLevel)}>
            {SAFETY_LEVELS.map((s) => (
              <option key={s} value={s}>
                {t.safetyShort[s]}
              </option>
            ))}
          </Select>
        </div>
      </div>
      {error && (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className={buttonClasses("primary")}>
          {pending ? dict.common.saving : t.saveStep}
        </button>
        <button type="button" onClick={onDone} className={buttonClasses("outline")}>
          {dict.common.cancel}
        </button>
      </div>
    </form>
  );
}

function AddStepForm({ guideId, onRefresh }: { guideId: string; onRefresh: () => void }) {
  const dict = useDictionary();
  const t = dict.admin.troubleshooting;
  const [open, setOpen] = useState(false);

  if (open) return <StepForm guideId={guideId} onRefresh={onRefresh} onDone={() => setOpen(false)} />;

  return (
    <button onClick={() => setOpen(true)} className={buttonClasses("outline", "self-start")}>
      + {t.addStep}
    </button>
  );
}
