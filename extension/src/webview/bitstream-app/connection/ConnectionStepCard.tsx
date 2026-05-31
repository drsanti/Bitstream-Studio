import type { ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { ConnectionStepStatus, ConnectionStepView } from "./useConnectionSteps";

const STATUS_BADGE: Record<ConnectionStepStatus, { label: string; className: string }> = {
  ok: { label: "OK", className: "border-emerald-500/40 bg-emerald-950/30 text-emerald-200" },
  active: { label: "Active", className: "border-sky-500/40 bg-sky-950/30 text-sky-100" },
  pending: { label: "Pending", className: "border-zinc-600/60 bg-zinc-900/50 text-zinc-300" },
  locked: { label: "Locked", className: "border-zinc-700/50 bg-zinc-950/40 text-zinc-500" },
  fail: { label: "Fail", className: "border-rose-500/40 bg-rose-950/30 text-rose-200" },
  warn: { label: "Warn", className: "border-amber-500/40 bg-amber-950/25 text-amber-100" },
};

export function ConnectionStepCard(props: {
  step: ConnectionStepView;
  stepNumber: number;
  expanded: boolean;
  onToggle: () => void;
  children?: ReactNode;
}) {
  const { step, stepNumber, expanded, onToggle, children } = props;
  const badge = STATUS_BADGE[step.status];

  return (
    <section
      className="rounded-md border border-zinc-700/70 bg-zinc-950/40"
      data-connection-step={step.id}
    >
      <button
        type="button"
        className="flex w-full items-start gap-2 px-2.5 py-2 text-left hover:bg-white/[0.03]"
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <span className="mt-0.5 shrink-0 text-zinc-500">
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-zinc-100">
              {stepNumber}. {step.title}
            </span>
            <span
              className={`rounded border px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide ${badge.className}`}
            >
              {badge.label}
            </span>
          </span>
          <span className="mt-0.5 block text-[10px] leading-snug text-zinc-400">{step.summary}</span>
          {step.detail != null && step.detail.length > 0 && !expanded ? (
            <span className="mt-0.5 block truncate text-[9px] text-zinc-500">{step.detail}</span>
          ) : null}
        </span>
      </button>
      {expanded && children != null ? (
        <div className="border-t border-zinc-800/80 px-2.5 pb-2.5 pt-2">{children}</div>
      ) : null}
      {expanded && step.error != null && step.error.length > 0 ? (
        <div className="mx-2.5 mb-2 rounded border border-rose-500/30 bg-rose-950/20 px-2 py-1.5 text-[10px] text-rose-100/90">
          {step.error}
        </div>
      ) : null}
    </section>
  );
}
