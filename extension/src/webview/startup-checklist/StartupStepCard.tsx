import type { KeyboardEvent, ReactNode } from "react";
import type { ConnectionStepStatus } from "../bitstream-app/connection/useConnectionSteps.js";
import { TRNHintTooltip } from "../ui/TRN/TRNHintTooltip.js";
import type { StartupStepMeta } from "./startup-step-meta.js";
import { StartupStepIcon } from "./StartupStepIcon.js";

export type StartupStepCardProps = {
  meta: StartupStepMeta;
  stepIndex: number;
  stepTotal: number;
  status: ConnectionStepStatus;
  result: string;
  resultTooltip?: string;
  progressPercent: number | null;
  expanded: boolean;
  onToggle: () => void;
  accent?: "default" | "active" | "fail" | "ok";
  presentation?: "upcoming" | "current" | "completed";
  isFocus?: boolean;
  children?: ReactNode;
};

function cardShellClass(
  accent: StartupStepCardProps["accent"],
  status: ConnectionStepStatus,
  presentation: StartupStepCardProps["presentation"],
  isFocus: boolean,
): string {
  const base =
    "rounded-lg border bg-zinc-900/60 backdrop-blur-sm transition-all duration-300 border-white/[0.08]";
  if (presentation === "upcoming") {
    return `${base} opacity-55`;
  }
  if (presentation === "current" && isFocus) {
    return `${base} ring-1 ring-sky-500/40 border-sky-500/30 shadow-[0_0_24px_-8px_rgba(56,189,248,0.35)]`;
  }
  if (accent === "active" || status === "active") {
    return `${base} ring-1 ring-sky-500/35 border-sky-500/25`;
  }
  if (accent === "fail" || status === "fail") {
    return `${base} border-l-2 border-l-rose-500/70 border-rose-500/20`;
  }
  if (accent === "ok" || status === "ok") {
    return `${base} border-l-2 border-l-emerald-500/70`;
  }
  return base;
}

function stopTogglePropagation(event: { stopPropagation: () => void }) {
  event.stopPropagation();
}

function StepTitleWithHint(props: { title: string; hint: string }) {
  return (
    <TRNHintTooltip
      trigger={
        <span className="text-sm font-medium text-zinc-100">{props.title}</span>
      }
      content={props.hint}
      triggerAriaLabel={`About ${props.title}`}
      placement="top-start"
      triggerClassName="inline-block max-w-full text-left"
      triggerWrapper="span"
      wide={props.hint.length > 120}
    />
  );
}

function StepResultWithHint(props: { result: string; hint?: string }) {
  const line = (
    <>
      <span className="text-zinc-500">Result: </span>
      {props.result}
    </>
  );
  if (props.hint == null || props.hint.length === 0) {
    return line;
  }
  return (
    <TRNHintTooltip
      trigger={<span className="text-xs text-zinc-300">{line}</span>}
      content={props.hint}
      triggerAriaLabel="More about this result"
      placement="bottom-start"
      triggerClassName="inline-block max-w-full text-left"
      triggerWrapper="span"
      wide
    />
  );
}

export function StartupStepCard(props: StartupStepCardProps) {
  const {
    meta,
    stepIndex,
    stepTotal,
    status,
    result,
    resultTooltip,
    progressPercent,
    expanded,
    onToggle,
    accent = "default",
    presentation = "completed",
    isFocus = false,
    children,
  } = props;

  const showResult = true;
  const showProgress = status === "active" && progressPercent != null;
  const showIndeterminate = status === "active" && progressPercent == null && presentation === "current";

  const onHeaderKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onToggle();
    }
  };

  return (
    <section
      className={cardShellClass(accent, status, presentation, isFocus)}
      data-startup-step={meta.id}
      data-presentation={presentation}
      aria-current={isFocus ? "step" : undefined}
    >
      <div
        role="button"
        tabIndex={presentation === "upcoming" ? 0 : 0}
        className={`flex w-full items-start gap-3 px-3 py-3 text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-white/20 ${
          presentation === "upcoming"
            ? "cursor-pointer hover:bg-white/[0.02]"
            : "cursor-pointer hover:bg-white/[0.02]"
        } ${presentation === "current" ? "animate-in fade-in slide-in-from-bottom-1 duration-300" : ""}`}
        onClick={onToggle}
        onKeyDown={onHeaderKeyDown}
        aria-expanded={expanded}
      >
        <StartupStepIcon
          status={status}
          stepIcon={meta.icon}
          label={`${meta.title}: ${status}`}
        />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-baseline justify-between gap-2">
            <span
              className="min-w-0"
              onClick={stopTogglePropagation}
              onKeyDown={stopTogglePropagation}
              onPointerDown={stopTogglePropagation}
            >
              <StepTitleWithHint title={meta.title} hint={meta.titleTooltip} />
            </span>
            <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
              {stepIndex} / {stepTotal}
            </span>
          </span>
          <span className="mt-0.5 block text-xs leading-snug text-zinc-400">{meta.subtitle}</span>
          {showProgress ? (
            <span className="mt-2 block">
              <span className="mb-1 flex justify-between text-[10px] text-zinc-500">
                <span>Progress</span>
                <span>{progressPercent}%</span>
              </span>
              <span className="block h-1 overflow-hidden rounded-full bg-zinc-800">
                <span
                  className="block h-full rounded-full bg-sky-400/80 transition-[width] duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
                />
              </span>
            </span>
          ) : null}
          {showIndeterminate ? (
            <span className="mt-2 block h-1 overflow-hidden rounded-full bg-zinc-800">
              <span className="block h-full w-1/3 animate-pulse rounded-full bg-sky-400/60" />
            </span>
          ) : null}
          {showResult ? (
            <span className="mt-2 block" aria-live={isFocus ? "polite" : "off"}>
              <StepResultWithHint result={result} hint={resultTooltip} />
            </span>
          ) : null}
        </span>
      </div>
      {expanded && children != null ? (
        <div className="border-t border-zinc-800/80 px-3 pb-3 pt-2">{children}</div>
      ) : null}
    </section>
  );
}
