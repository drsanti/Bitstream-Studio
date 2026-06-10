import { Palette } from "lucide-react";
import { useLayoutEffect, useMemo, useState } from "react";
import { twMerge } from "tailwind-merge";
import { TRNButton } from "../../../ui/TRN/TRNButton";
import { TRNFormField } from "../../../ui/TRN/TRNForm";
import { TRNHintText } from "../../../ui/TRN/TRNHintText";
import { TRNInput } from "../../../ui/TRN/TRNInput";
import { TRNWindow, type TRNWindowRect } from "../../../ui/TRN/TRNWindow";
import { slugifyCourseThemePresetId } from "../../schemas/courseThemes.v1";
import type { BlockColorPreviewSwatch } from "./blockColorApplyDialogUtils";
import {
  CourseBlockColorMiniSwatches,
  CourseBlockColorPreviewStrip,
} from "./CourseBlockColorPreviewStrip";

const DIALOG_SHELL_HEIGHT_PX = 520;

export type CourseBlockColorSavedPresetRow = {
  id: string;
  title: string;
  swatches: BlockColorPreviewSwatch[];
};

type SaveSelection = "existing" | "new";

function computeCenteredRect(): Partial<TRNWindowRect> {
  if (typeof window === "undefined") {
    return { x: 120, y: 100, width: 440, height: DIALOG_SHELL_HEIGHT_PX };
  }
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = Math.min(480, Math.max(320, vw - 48));
  const height = Math.min(DIALOG_SHELL_HEIGHT_PX, Math.max(320, vh - 48));
  return {
    x: Math.max(16, (vw - width) / 2),
    y: Math.max(16, (vh - height) / 2),
    width,
    height,
  };
}

function PresetSelectRow({
  selected,
  title,
  subtitle,
  swatches,
  onSelect,
}: {
  selected: boolean;
  title: string;
  subtitle?: string;
  swatches: BlockColorPreviewSwatch[];
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={twMerge(
        "w-full rounded-md border px-3 py-2 text-left transition-colors",
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
          <span className="block text-[12px] font-medium text-zinc-100">{title}</span>
          {subtitle != null ? (
            <span className="mt-0.5 block text-[10px] text-zinc-500">{subtitle}</span>
          ) : null}
          <span className="mt-1.5 block">
            <CourseBlockColorMiniSwatches swatches={swatches} />
          </span>
        </span>
      </div>
    </button>
  );
}

export type CourseBlockColorsSavePresetDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blockKind: "card" | "markdown";
  sourceLabel: string;
  previewSwatches: BlockColorPreviewSwatch[];
  savedPresets: CourseBlockColorSavedPresetRow[];
  canSave: boolean;
  onSave: (title: string) => void;
};

export function CourseBlockColorsSavePresetDialog({
  open,
  onOpenChange,
  blockKind,
  sourceLabel,
  previewSwatches,
  savedPresets,
  canSave,
  onSave,
}: CourseBlockColorsSavePresetDialogProps) {
  const [selection, setSelection] = useState<SaveSelection>("new");
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [presetTitle, setPresetTitle] = useState("");
  const [initialRect, setInitialRect] = useState<Partial<TRNWindowRect>>(computeCenteredRect);

  const blockNoun = blockKind === "card" ? "card" : "markdown";
  const windowTitle =
    blockKind === "card" ? "Save card color preset" : "Save markdown color preset";
  const namePlaceholder = blockKind === "card" ? "Reference card" : "Chapter body";

  useLayoutEffect(() => {
    if (!open) {
      return;
    }
    setSelection(savedPresets.length > 0 ? "existing" : "new");
    const first = savedPresets[0];
    setSelectedPresetId(first?.id ?? null);
    setPresetTitle(first?.title ?? "");
    setInitialRect(computeCenteredRect());
  }, [open, savedPresets]);

  const trimmedTitle = presetTitle.trim();
  const targetSlug = trimmedTitle.length > 0 ? slugifyCourseThemePresetId(trimmedTitle) : "";
  const presetBySlug = useMemo(
    () => savedPresets.find((preset) => preset.id === targetSlug),
    [savedPresets, targetSlug],
  );
  const selectedPreset = useMemo(
    () => savedPresets.find((preset) => preset.id === selectedPresetId) ?? null,
    [savedPresets, selectedPresetId],
  );

  const willOverwriteExisting = presetBySlug != null;
  const overwriteTargetTitle = presetBySlug?.title ?? selectedPreset?.title;
  const renamingToNewSlug =
    selection === "existing" &&
    selectedPreset != null &&
    targetSlug.length > 0 &&
    targetSlug !== selectedPreset.id;

  const primaryLabel = willOverwriteExisting ? "Overwrite preset" : "Save new preset";

  const selectExisting = (preset: CourseBlockColorSavedPresetRow) => {
    setSelection("existing");
    setSelectedPresetId(preset.id);
    setPresetTitle(preset.title);
  };

  const selectNew = () => {
    setSelection("new");
    setSelectedPresetId(null);
    setPresetTitle("");
  };

  return (
    <TRNWindow
      open={open}
      title={windowTitle}
      prefixIcon={<Palette className="h-4 w-4 text-amber-400" strokeWidth={2.25} aria-hidden />}
      onClose={() => onOpenChange(false)}
      initialRect={initialRect}
      minWidth={320}
      minHeight={320}
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
        </div>

        <CourseBlockColorPreviewStrip swatches={previewSwatches} />

        <div>
          <div className="mb-1.5 flex items-baseline justify-between gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
              Saved presets in course
            </span>
            <span className="text-[10px] text-zinc-500">
              {savedPresets.length}{" "}
              {blockNoun} preset{savedPresets.length === 1 ? "" : "s"}
            </span>
          </div>
          <div
            className="scrollbar-hide flex max-h-44 flex-col gap-1.5 overflow-y-auto"
            role="radiogroup"
            aria-label="Save color preset target"
          >
            {savedPresets.length === 0 ? (
              <div className="rounded-md border border-dashed border-zinc-700/80 bg-zinc-950/35 px-3 py-2.5 text-[11px] text-zinc-400">
                No saved presets yet. Name your first style below.
              </div>
            ) : (
              savedPresets.map((preset) => (
                <PresetSelectRow
                  key={preset.id}
                  selected={selection === "existing" && selectedPresetId === preset.id}
                  title={preset.title}
                  subtitle={`id: ${preset.id}`}
                  swatches={preset.swatches}
                  onSelect={() => selectExisting(preset)}
                />
              ))
            )}
            <div className="border-t border-white/6 pt-2">
              <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                Or create new
              </div>
              <PresetSelectRow
                selected={selection === "new"}
                title="New preset"
                swatches={previewSwatches}
                onSelect={selectNew}
              />
            </div>
          </div>
        </div>

        <TRNFormField id="course-block-color-preset-title" label="Preset name">
          <TRNInput
            id="course-block-color-preset-title-input"
            variant="outlined"
            size="sm"
            className="w-full"
            value={presetTitle}
            placeholder={namePlaceholder}
            onChange={(event) => setPresetTitle(event.target.value)}
          />
        </TRNFormField>

        {targetSlug.length > 0 ? (
          <p className="text-[10px] text-zinc-500">
            File id: <span className="text-zinc-400">{targetSlug}</span>
          </p>
        ) : null}

        {willOverwriteExisting && overwriteTargetTitle != null ? (
          <TRNHintText>
            Overwriting &ldquo;{overwriteTargetTitle}&rdquo; replaces stored colors for Load.
          </TRNHintText>
        ) : null}

        {renamingToNewSlug ? (
          <TRNHintText>
            Saves as a new preset ({targetSlug}). The original &ldquo;{selectedPreset.title}&rdquo;
            preset is kept.
          </TRNHintText>
        ) : null}

        <p className="border-t border-white/6 pt-2 text-[10px] leading-relaxed text-zinc-500">
          Presets live in the course manifest and ship with the VSIX. Use top-bar Save after saving a
          preset.
        </p>

        <div className="flex flex-wrap justify-end gap-2">
          <TRNButton size="compact" onClick={() => onOpenChange(false)}>
            Cancel
          </TRNButton>
          <TRNButton
            size="compact"
            selected
            disabled={!canSave || trimmedTitle.length === 0}
            onClick={() => {
              onSave(trimmedTitle);
              onOpenChange(false);
            }}
          >
            {primaryLabel}
          </TRNButton>
        </div>
      </div>
    </TRNWindow>
  );
}
