import type { ReactNode } from "react";
import type { ConnectionStepStatus } from "../bitstream-app/connection/useConnectionSteps.js";
import type { StartupStepMeta } from "./startup-step-meta.js";
import { StartupStepIcon } from "./StartupStepIcon.js";

export type StartupStepCardProps = {
  meta: StartupStepMeta;
  stepIndex: number;
  stepTotal: number;
  status: ConnectionStepStatus;
  result: string;
  progressPercent: number | null;
  expanded: boolean;
  onToggle: () => void;
  accent?: "default" | "active" | "fail" | "ok";
  children?: ReactNode;
};

function cardShellClass(accent: StartupStepCardProps["accent"], status: ConnectionStepStatus): string {
  const base =
    "rounded-lg border bg-zinc-900/60 backdrop-blur-sm transition-colors border-white/[0.08]";
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

export function StartupStepCard(props: StartupStepCardProps) {
  const {
    meta,
    stepIndex,
    stepTotal,
    status,
    result,
    progressPercent,
    expanded,
    onToggle,
    accent = "default",
    children,
  } = props;

  const showProgress = status === "active" && progressPercent != null;
  const showIndeterminate = status === "active" && progressPercent == null;

  return (
    <section className={cardShellClass(accent, status)} data-startup-step={meta.id}>
      <button
        type="button"
        className="flex w-full items-start gap-3 px-3 py-3 text-left hover:bg-white/[0.02]"
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <StartupStepIcon
          status={status}
          stepIcon={meta.icon}
          label={`${meta.title}: ${status}`}
        />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-sm font-medium text-zinc-100">{meta.title}</span>
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
          <span
            className="mt-2 block text-xs text-zinc-300"
            aria-live="polite"
          >
            <span className="text-zinc-500">Result: </span>
            {result}
          </span>
        </span>
      </button>
      {expanded && children != null ? (
        <div className="border-t border-zinc-800/80 px-3 pb-3 pt-2">{children}</div>
      ) : null}
    </section>
  );
}
