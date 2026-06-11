import { useMemo, useState } from "react";
import { toast } from "react-toastify";
import { TRNButton } from "../../../ui/TRN/TRNButton";
import { TRNSelect } from "../../../ui/TRN/TRNSelect";
import {
  CARD_BLOCK_COLOR_THEME_DEFAULTS,
  type CardBlockColors,
} from "../../schemas/cardBlockColors";
import type { CardThemePresetV1, CourseThemesV1, MarkdownThemePresetV1 } from "../../schemas/courseThemes.v1";
import {
  MARKDOWN_BLOCK_COLOR_THEME_DEFAULTS,
  type MarkdownBlockColors,
} from "../../schemas/markdownBlockColors";
import { mergeCourseThemesWithGlobal } from "../../schemas/courseStudioGlobalDocumentTheme";
import { findCardThemePreset, findMarkdownThemePreset } from "../../schemas/courseThemes.v1";
import type { BlockColorBulkApplyMode } from "../pageBlockColorActions";
import { useCourseOutlineStore } from "../useCourseOutlineStore";
import { useCoursePageEditorStore } from "../useCoursePageEditorStore";
import {
  buildCardColorPreviewSwatches,
  buildMarkdownColorPreviewSwatches,
  countPageBlocksOfKind,
  countSetColorFields,
  pageHasSiblingColorOverrides,
  type BlockColorPreviewSwatch,
} from "./blockColorApplyDialogUtils";
import { CourseBlockColorsApplyDialog } from "./CourseBlockColorsApplyDialog";
import {
  CourseBlockColorsSavePresetDialog,
  type CourseBlockColorSavedPresetRow,
} from "./CourseBlockColorsSavePresetDialog";

export type CourseBlockColorPresetOption = {
  value: string;
  label: string;
};

type CourseBlockColorsActionBarProps = {
  blockKind: "card" | "markdown";
  currentBlockId?: string;
  previewColors: CardBlockColors | MarkdownBlockColors | undefined;
  onApplyToAll: (mode: BlockColorBulkApplyMode) => void;
  onSetPageDefault: () => void;
  onSavePreset: (title: string) => void;
  onApplyPreset: (presetId: string, mode: BlockColorBulkApplyMode) => void;
};

type ApplyDialogState = {
  title: string;
  sourceLabel: string;
  scopeLabel: string;
  previewSwatches: BlockColorPreviewSwatch[];
  onConfirm: (mode: BlockColorBulkApplyMode) => void;
};

export function CourseBlockColorsActionBar({
  blockKind,
  currentBlockId,
  previewColors,
  onApplyToAll,
  onSetPageDefault,
  onSavePreset,
  onApplyPreset,
  presetOptions,
}: CourseBlockColorsActionBarProps & {
  presetOptions: CourseBlockColorPresetOption[];
}) {
  const page = useCoursePageEditorStore((s) => s.page);
  const courseThemes = useCourseOutlineStore((s) => s.course?.themes);
  const [applyDialog, setApplyDialog] = useState<ApplyDialogState | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState(presetOptions[0]?.value ?? "");

  const blockNoun = blockKind === "card" ? "card" : "markdown block";
  const targetBlockCount = countPageBlocksOfKind(page, blockKind);
  const fieldCount = countSetColorFields(previewColors);

  const previewSwatches = useMemo(() => {
    if (blockKind === "card") {
      return buildCardColorPreviewSwatches(
        previewColors as CardBlockColors | undefined,
        CARD_BLOCK_COLOR_THEME_DEFAULTS,
      );
    }
    return buildMarkdownColorPreviewSwatches(
      previewColors as MarkdownBlockColors | undefined,
      MARKDOWN_BLOCK_COLOR_THEME_DEFAULTS,
    );
  }, [blockKind, previewColors]);

  const scopeLabel =
    page != null
      ? `${targetBlockCount} ${targetBlockCount === 1 ? blockNoun : `${blockNoun}s`} on “${page.title}”`
      : `0 ${blockNoun}s`;

  const saveSourceLabel =
    fieldCount > 0
      ? `This block's colors (${fieldCount} field${fieldCount === 1 ? "" : "s"} set)`
      : "This block's colors (theme defaults)";

  const savedPresetRows = useMemo((): CourseBlockColorSavedPresetRow[] => {
    if (blockKind === "card") {
      return (courseThemes?.card ?? []).map((preset) => ({
        id: preset.id,
        title: preset.title,
        swatches: buildCardColorPreviewSwatches(preset.colors, CARD_BLOCK_COLOR_THEME_DEFAULTS),
      }));
    }
    return (courseThemes?.markdown ?? []).map((preset) => ({
      id: preset.id,
      title: preset.title,
      swatches: buildMarkdownColorPreviewSwatches(
        preset.colors,
        MARKDOWN_BLOCK_COLOR_THEME_DEFAULTS,
      ),
    }));
  }, [blockKind, courseThemes]);

  const openApplyDialog = (state: Omit<ApplyDialogState, "scopeLabel">) => {
    setApplyDialog({
      ...state,
      scopeLabel,
      previewSwatches: state.previewSwatches,
    });
  };

  const handleApplyToAllClick = () => {
    if (targetBlockCount === 0) {
      toast.info(`No ${blockNoun}s on this page`);
      return;
    }
    const sourceLabel =
      fieldCount > 0
        ? `This block's colors (${fieldCount} field${fieldCount === 1 ? "" : "s"} set)`
        : "This block's colors (theme defaults)";

    const needsConfirm = pageHasSiblingColorOverrides(page, blockKind, currentBlockId);
    if (!needsConfirm) {
      onApplyToAll("replace");
      return;
    }

    openApplyDialog({
      title: `Apply ${blockKind === "card" ? "card" : "markdown"} colors to this page`,
      sourceLabel,
      previewSwatches,
      onConfirm: onApplyToAll,
    });
  };

  const handlePresetLoadClick = () => {
    if (selectedPresetId.length === 0) {
      return;
    }
    const preset = presetOptions.find((option) => option.value === selectedPresetId);
    if (preset == null) {
      return;
    }
    if (targetBlockCount === 0) {
      toast.info(`No ${blockNoun}s on this page`);
      return;
    }

    const presetColors =
      blockKind === "card"
        ? findCardThemePreset(courseThemes, selectedPresetId)?.colors
        : findMarkdownThemePreset(courseThemes, selectedPresetId)?.colors;
    const presetSwatches =
      blockKind === "card"
        ? buildCardColorPreviewSwatches(
            presetColors,
            CARD_BLOCK_COLOR_THEME_DEFAULTS,
          )
        : buildMarkdownColorPreviewSwatches(
            presetColors,
            MARKDOWN_BLOCK_COLOR_THEME_DEFAULTS,
          );

    openApplyDialog({
      title: `Load preset: “${preset.label}”`,
      sourceLabel: `Course preset “${preset.label}”`,
      previewSwatches: presetSwatches,
      onConfirm: (mode) => onApplyPreset(selectedPresetId, mode),
    });
  };

  return (
    <>
      <div className="mb-2 flex flex-col gap-2 border-b border-white/6 pb-2">
        <div className="flex flex-wrap gap-1">
          <TRNButton size="compact" onClick={handleApplyToAllClick}>
            Apply to all
          </TRNButton>
          <TRNButton size="compact" onClick={onSetPageDefault}>
            Page default
          </TRNButton>
          <TRNButton size="compact" onClick={() => setSaveDialogOpen(true)}>
            Save preset…
          </TRNButton>
        </div>
        {presetOptions.length > 0 ? (
          <div className="flex min-w-0 items-center gap-1.5">
            <div className="min-w-0 flex-1">
              <TRNSelect
                value={selectedPresetId}
                ariaLabel={`${blockKind} color preset`}
                options={presetOptions}
                onValueChange={setSelectedPresetId}
              />
            </div>
            <TRNButton
              size="compact"
              disabled={selectedPresetId.length === 0}
              onClick={handlePresetLoadClick}
            >
              Load
            </TRNButton>
          </div>
        ) : null}
      </div>

      <CourseBlockColorsApplyDialog
        open={applyDialog != null}
        onOpenChange={(open) => {
          if (!open) {
            setApplyDialog(null);
          }
        }}
        title={applyDialog?.title ?? ""}
        sourceLabel={applyDialog?.sourceLabel ?? ""}
        scopeLabel={applyDialog?.scopeLabel ?? scopeLabel}
        blockNoun={blockNoun}
        targetBlockCount={targetBlockCount}
        previewSwatches={applyDialog?.previewSwatches ?? previewSwatches}
        onConfirm={(mode) => applyDialog?.onConfirm(mode)}
      />

      <CourseBlockColorsSavePresetDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        blockKind={blockKind}
        sourceLabel={saveSourceLabel}
        previewSwatches={previewSwatches}
        savedPresets={savedPresetRows}
        canSave={fieldCount > 0}
        onSave={onSavePreset}
      />
    </>
  );
}

export function buildCardPresetSelectOptions(
  themes: CourseThemesV1 | undefined,
): CourseBlockColorPresetOption[] {
  return (mergeCourseThemesWithGlobal(themes).card ?? []).map((preset: CardThemePresetV1) => ({
    value: preset.id,
    label: preset.title,
  }));
}

export function buildMarkdownPresetSelectOptions(
  themes: CourseThemesV1 | undefined,
): CourseBlockColorPresetOption[] {
  return (mergeCourseThemesWithGlobal(themes).markdown ?? []).map(
    (preset: MarkdownThemePresetV1) => ({
      value: preset.id,
      label: preset.title,
    }),
  );
}
