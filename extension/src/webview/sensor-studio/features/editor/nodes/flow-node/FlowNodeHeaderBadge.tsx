import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import { FLOW_NODE_HEADER_BADGE_CLASS } from "./theme/flow-node-tokens";

export type FlowNodeHeaderBadgeTone =
  | "live"
  | "stale"
  | "offline"
  | "neutral"
  | "invalid"
  | "family";

const FLOW_NODE_HEADER_BADGE_TONE_CLASS: Record<FlowNodeHeaderBadgeTone, string> = {
  live: "border-emerald-500/60 bg-emerald-950/50 text-emerald-300",
  stale: "border-amber-500/60 bg-amber-950/45 text-amber-200",
  offline: "border-rose-500/65 bg-rose-950/45 text-rose-200",
  neutral: "border-zinc-500/60 bg-zinc-900/60 text-zinc-300",
  invalid: "border-rose-500/70 bg-rose-950/45 text-rose-200",
  family: "border-cyan-500/45 bg-cyan-950/35 text-cyan-200/90",
};

export type FlowNodeHeaderBadgeProps = {
  tone: FlowNodeHeaderBadgeTone;
  /** Pulse dot before label — used for live stream health. */
  pulseDot?: boolean;
  children: ReactNode;
  className?: string;
};

export function FlowNodeHeaderBadge(props: FlowNodeHeaderBadgeProps) {
  const { tone, pulseDot = false, children, className } = props;
  return (
    <span
      className={twMerge(
        FLOW_NODE_HEADER_BADGE_CLASS,
        "inline-flex items-center gap-1",
        FLOW_NODE_HEADER_BADGE_TONE_CLASS[tone],
        className,
      )}
    >
      {pulseDot ? (
        <span
          className="size-1 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.75)]"
          aria-hidden
        />
      ) : null}
      {children}
    </span>
  );
}
