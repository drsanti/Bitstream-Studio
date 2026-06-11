/*******************************************************************************
 * File Name : BitstreamStudioLoadingScreen.tsx
 *
 * Description : Branded loading shell — boot handoff, WebGL route gap, lazy workspace.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { Loader2 } from "lucide-react";
import { useMemo } from "react";
import { twMerge } from "tailwind-merge";
import type { BitstreamWorkspaceId } from "../../bitstream-app/state/bitstreamWorkspaceMode.store";
import {
  BITSTREAM_STUDIO_LOADING_SHELL_CLASS,
  BitstreamStudioLoadingBackdrop,
} from "./BitstreamStudioLoadingBackdrop.js";

export type BitstreamStudioLoadingScreenProps = {
  label?: string;
  hint?: string;
  /** `fullscreen` — route / app shell; `embedded` — workspace Suspense pane */
  layout?: "fullscreen" | "embedded";
  workspace?: BitstreamWorkspaceId;
  /** 0–100 download estimate; omit for indeterminate spinner only */
  progressPercent?: number;
  /** Short line under the bar — e.g. module count or bytes transferred */
  progressDetail?: string;
  /**
   * Landing-style 2D nebula backdrop. Default on — unmounts with this screen so
   * canvas loops dispose when the workspace chunk is ready.
   */
  animatedBackdrop?: boolean;
};

const WORKSPACE_LABEL: Record<BitstreamWorkspaceId, string> = {
  "sensor-telemetry": "Sensor Telemetry",
  "sensor-studio": "Sensor Studio",
  presentation: "Presentation",
  "course-studio": "Course Studio",
};

/** What the operator is waiting for — product language, same in dev and VSIX. */
const WORKSPACE_HINT: Record<BitstreamWorkspaceId, string> = {
  "sensor-telemetry":
    "Sensor configuration, 3D orientation, and live telemetry decks.",
  "sensor-studio": "Flow canvas, node inspector, dashboard, and stage preview.",
  presentation: "Slide deck and chapter navigation.",
  "course-studio": "Course pages, theory blocks, and live sensor bindings.",
};

const WORKSPACE_ACCENT: Record<
  BitstreamWorkspaceId,
  { spinner: string; ring: string; glow: string; progress: string }
> = {
  "sensor-telemetry": {
    spinner: "text-emerald-400/90",
    ring: "border-emerald-500/25",
    glow: "from-emerald-500/10",
    progress: "bg-emerald-400/85",
  },
  "sensor-studio": {
    spinner: "text-violet-400/90",
    ring: "border-violet-500/25",
    glow: "from-violet-500/10",
    progress: "bg-violet-400/85",
  },
  presentation: {
    spinner: "text-sky-400/90",
    ring: "border-sky-500/25",
    glow: "from-sky-500/10",
    progress: "bg-sky-400/85",
  },
  "course-studio": {
    spinner: "text-amber-400/90",
    ring: "border-amber-500/25",
    glow: "from-amber-500/10",
    progress: "bg-amber-400/85",
  },
};

const DEFAULT_ACCENT = WORKSPACE_ACCENT["sensor-telemetry"];

export function BitstreamStudioLoadingScreen({
  label,
  hint,
  layout = "embedded",
  workspace,
  progressPercent,
  progressDetail,
  animatedBackdrop = true,
}: BitstreamStudioLoadingScreenProps) {
  const reducedMotion = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  const accent = workspace != null ? WORKSPACE_ACCENT[workspace] : DEFAULT_ACCENT;
  const resolvedLabel =
    label ??
    (workspace != null ? `Loading ${WORKSPACE_LABEL[workspace]}…` : "Loading studio…");
  const resolvedHint =
    hint ?? (workspace != null ? WORKSPACE_HINT[workspace] : "Starting Bitstream Studio…");

  const shellClass =
    layout === "fullscreen"
      ? twMerge(
          "fixed inset-0 z-400 flex items-center justify-center overflow-hidden bg-[#030308] px-6",
          BITSTREAM_STUDIO_LOADING_SHELL_CLASS,
        )
      : twMerge(
          "relative flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden bg-[#030308] px-6 py-16",
          BITSTREAM_STUDIO_LOADING_SHELL_CLASS,
        );

  return (
    <div
      className={shellClass}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={resolvedLabel}
    >
      {animatedBackdrop ? <BitstreamStudioLoadingBackdrop /> : null}
      <div
        className={twMerge(
          "pointer-events-none absolute left-1/2 top-1/2 z-2 h-[min(28rem,80vw)] w-[min(28rem,80vw)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-b to-transparent opacity-80 blur-3xl",
          accent.glow,
        )}
        aria-hidden
      />

      <div
        className={twMerge(
          "relative z-3 flex w-full max-w-sm flex-col items-center gap-5 rounded-xl border bg-zinc-900/55 px-8 py-9 text-center shadow-[0_24px_64px_-24px_rgba(0,0,0,0.85)] backdrop-blur-md",
          accent.ring,
        )}
      >
        <div className="relative flex h-14 w-14 items-center justify-center">
          <span
            className={twMerge(
              "absolute inset-0 rounded-full border border-white/10",
              reducedMotion ? "" : "animate-pulse",
            )}
            aria-hidden
          />
          <Loader2
            className={twMerge(
              "relative h-9 w-9 shrink-0",
              accent.spinner,
              reducedMotion ? "" : "animate-spin",
            )}
            strokeWidth={2.25}
            aria-hidden
          />
        </div>

        <div className="flex min-w-0 flex-col items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
            TERNION Bitstream
          </span>
          <span className="text-base font-medium text-zinc-100">{resolvedLabel}</span>
          <span className="max-w-[18rem] text-xs leading-relaxed text-zinc-500">
            {resolvedHint}
          </span>
        </div>

        {progressPercent != null ? (
          <div className="w-full max-w-[16rem]" aria-hidden={false}>
            <div className="mb-1.5 flex items-center justify-between gap-2 text-[10px] text-zinc-500">
              <span className="truncate">{progressDetail ?? "Downloading workspace…"}</span>
              <span className="shrink-0">{Math.round(progressPercent)}%</span>
            </div>
            <div
              className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800/90"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progressPercent)}
              aria-label="Workspace download progress"
            >
              <div
                className={twMerge("h-full rounded-full transition-[width] duration-200 ease-out", accent.progress)}
                style={{ width: `${Math.max(0, Math.min(100, progressPercent))}%` }}
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
