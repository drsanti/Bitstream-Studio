import { Layers } from "lucide-react";
import { useLayoutEffect, useState } from "react";
import { twMerge } from "tailwind-merge";
import { TRNButton } from "../../../ui/TRN/TRNButton";
import { TRNWindow, type TRNWindowRect } from "../../../ui/TRN/TRNWindow";
import type { BlockColorBulkApplyMode } from "../pageBlockColorActions";
import type { BlockColorPreviewSwatch } from "./blockColorApplyDialogUtils";
import { CourseBlockColorPreviewStrip } from "./CourseBlockColorPreviewStrip";

const DIALOG_SHELL_HEIGHT_PX = 460;

function computeCenteredRect(): Partial<TRNWindowRect> {
  if (typeof window === "undefined") {
    return { x: 120, y: 100, width: 440, height: DIALOG_SHELL_HEIGHT_PX };
  }
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = Math.min(480, Math.max(320, vw - 48));
  const height = Math.min(DIALOG_SHELL_HEIGHT_PX, Math.max(280, vh - 48));
  return {
    x: Math.max(16, (vw - width) / 2),
    y: Math.max(16, (vh - height) / 2),
    width,
    height,
  };
}

function ApplyModeCard({
  selected,
  title,
  badge,
  lines,
  onSelect,
}: {
  selected: boolean;
  title: string;
  badge?: string;
  lines: string[];
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={twMerge(
        "w-full rounded-md border px-3 py-2.5 text-left transition-colors",
        selected
          ? "border-sky-500/50 bg-sky-500/10 ring-1 ring-sky-500/30"
          : "border-zinc-700/80 bg-zinc-950/40 hover:border-zinc-600/80 hover:bg-zinc-900/50",
      )}
    >
      <div className="flex items-start gap-2">
        <span
          className={twMerge(
            "mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border",
            selected ? "border-sky-400 bg-sky-500/30" : "border-zinc-600 bg-zinc-900",
          )}
          aria-hidden
        >
          {selected ? <span className="h-1.5 w-1.5 rounded-full bg-sky-300" /> : null}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-[12px] font-medium text-zinc-100">{title}</span>
            {badge != null ? (
              <span className="rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-200/90">
                {badge}
              </span>
            ) : null}
          </span>
          {lines.map((line) => (
            <span key={line} className="mt-1 block text-[11px] leading-snug text-zinc-400">
              {line}
            </span>
          ))}
        </span>
      </div>
    </button>
  );
}

export type CourseBlockColorsApplyDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  sourceLabel: string;
  scopeLabel: string;
  blockNoun: string;
  targetBlockCount: number;
  previewSwatches: BlockColorPreviewSwatch[];
  onConfirm: (mode: BlockColorBulkApplyMode) => void;
};

export function CourseBlockColorsApplyDialog({
  open,
  onOpenChange,
  title,
  sourceLabel,
  scopeLabel,
  blockNoun,
  targetBlockCount,
  previewSwatches,
  onConfirm,
}: CourseBlockColorsApplyDialogProps) {
  const [mode, setMode] = useState<BlockColorBulkApplyMode>("replace");
  const [initialRect, setInitialRect] = useState<Partial<TRNWindowRect>>(computeCenteredRect);

  useLayoutEffect(() => {
    if (!open) {
      return;
    }
    setMode("replace");
    setInitialRect(computeCenteredRect());
  }, [open]);

  const applyLabel =
    targetBlockCount === 1
      ? `Apply to 1 ${blockNoun}`
      : `Apply to ${targetBlockCount} ${blockNoun}s`;

  return (
    <TRNWindow
      open={open}
      title={title}
      prefixIcon={<Layers className="h-4 w-4 text-amber-400" strokeWidth={2.25} aria-hidden />}
      onClose={() => onOpenChange(false)}
      initialRect={initialRect}
      minWidth={320}
      minHeight={280}
      modal
      modalBackdropCloses={false}
      draggable={false}
      resizable={false}
      showMaximize={false}
      showFooter={false}
      heightMode="fixed"
      glass
      glassPreset="medium"
      zIndex={72}
      contentClassName="min-h-0 overflow-y-auto"
    >
      <div className="flex min-h-0 flex-col gap-3">
        <div className="space-y-1 text-[11px] leading-relaxed text-zinc-300">
          <p>
            <span className="text-zinc-500">Source:</span> {sourceLabel}
          </p>
          <p>
            <span className="text-zinc-500">Scope:</span> {scopeLabel}
          </p>
        </div>

        <CourseBlockColorPreviewStrip swatches={previewSwatches} />

        <div>
          <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
            How should we apply?
          </div>
          <div className="flex flex-col gap-1.5" role="radiogroup" aria-label="Apply mode">
            <ApplyModeCard
              selected={mode === "replace"}
              title="Replace all"
              badge="Recommended"
              lines={[
                `Every ${blockNoun} gets exactly these colors.`,
                "Overrides per-block custom colors.",
              ]}
              onSelect={() => setMode("replace")}
            />
            <ApplyModeCard
              selected={mode === "merge"}
              title="Merge unset only"
              lines={[
                `Only fill colors each ${blockNoun} does not already override.`,
                "Keeps existing per-block title, body, and chrome tweaks.",
              ]}
              onSelect={() => setMode("merge")}
            />
          </div>
        </div>

        <p className="border-t border-white/6 pt-2 text-[10px] leading-relaxed text-zinc-500">
          Save the page after applying — View mode and VSIX read the updated page JSON.
        </p>

        <div className="flex flex-wrap justify-end gap-2">
          <TRNButton size="compact" onClick={() => onOpenChange(false)}>
            Cancel
          </TRNButton>
          <TRNButton
            size="compact"
            selected
            disabled={targetBlockCount === 0}
            onClick={() => {
              onConfirm(mode);
              onOpenChange(false);
            }}
          >
            {applyLabel}
          </TRNButton>
        </div>
      </div>
    </TRNWindow>
  );
}
