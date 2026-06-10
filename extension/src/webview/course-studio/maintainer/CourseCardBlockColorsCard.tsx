import { Palette, RotateCcw, Copy, ClipboardPaste } from "lucide-react";
import { useState } from "react";
import { TRNIconButton } from "../../ui/TRN/TRNIconButton";
import type { PageBlockV1 } from "../schemas/page.v1";
import {
  copyCardBlockColorFieldHex,
  copyCardBlockColors,
  pasteCardBlockColorField,
  pasteCardBlockColors,
  useCardBlockColorsClipboardStore,
} from "../schemas/cardBlockColorsClipboard";
import {
  CARD_BLOCK_COLOR_INSPECTOR_GROUPS,
  CARD_BLOCK_COLOR_THEME_DEFAULTS,
  patchCardBlockColor,
  stripEmptyCardBlockColors,
  type CardBlockColorKey,
} from "../schemas/cardBlockColors";
import { CourseInspectorCard, COURSE_INSPECTOR_CARD_ICON_CLASS } from "./CourseInspectorCard";
import {
  buildCardPresetSelectOptions,
  CourseBlockColorsActionBar,
} from "./inspector/CourseBlockColorsActionBar";
import { CourseBlockColorRow } from "./inspector/CourseBlockColorRow";
import { CourseBlockColorsSection } from "./inspector/CourseBlockColorsSection";
import { resolveCardBlockEffectiveColors } from "../runtime/resolveBlockColors";
import { useCourseCardColorStyleActions } from "./useCourseBlockColorStyleActions";
import { useCourseOutlineStore } from "./useCourseOutlineStore";
import { useCoursePageEditorStore } from "./useCoursePageEditorStore";

export function CardColorsCard({ block }: { block: Extract<PageBlockV1, { kind: "card" }> }) {
  const updateBlock = useCoursePageEditorStore((s) => s.updateBlock);
  const pageMeta = useCoursePageEditorStore((s) => s.page?.meta);
  const courseThemes = useCourseOutlineStore((s) => s.course?.themes);
  const previewColors = resolveCardBlockEffectiveColors(block.colors, pageMeta, courseThemes);
  const hasClipboard = useCardBlockColorsClipboardStore((s) => s.hasClipboard);
  const [pasteBusy, setPasteBusy] = useState(false);
  const colors = block.colors;
  const hasOverrides = stripEmptyCardBlockColors(colors) != null;
  const styleActions = useCourseCardColorStyleActions(block);

  const handleCopy = () => {
    void copyCardBlockColors(colors);
  };

  const handlePaste = () => {
    if (pasteBusy) {
      return;
    }
    setPasteBusy(true);
    void (async () => {
      try {
        const pasted = await pasteCardBlockColors();
        if (pasted === null) {
          return;
        }
        updateBlock(block.id, { colors: pasted });
      } finally {
        setPasteBusy(false);
      }
    })();
  };

  const colorRowClipboard = (colorKey: CardBlockColorKey) => ({
    onCopy: () => {
      void copyCardBlockColorFieldHex(
        colors?.[colorKey] ?? CARD_BLOCK_COLOR_THEME_DEFAULTS[colorKey],
      );
    },
    onPaste: async () => {
      const pasted = await pasteCardBlockColorField(colorKey);
      if (pasted != null) {
        updateBlock(block.id, {
          colors: patchCardBlockColor(colors, colorKey, pasted),
        });
      }
    },
  });

  return (
    <CourseInspectorCard
      id={`${block.id}-card-colors`}
      title="Colors"
      titleIcon={<Palette className={COURSE_INSPECTOR_CARD_ICON_CLASS} aria-hidden />}
      hint="Per-block overrides, page defaults, and course presets. Save page + course so View mode and VSIX match."
      defaultExpanded={false}
    >
      <CourseBlockColorsActionBar
        blockKind="card"
        currentBlockId={block.id}
        previewColors={previewColors}
        presetOptions={buildCardPresetSelectOptions(courseThemes)}
        onApplyToAll={styleActions.applyToAll}
        onSetPageDefault={styleActions.setPageDefault}
        onSavePreset={styleActions.savePreset}
        onApplyPreset={styleActions.applyPreset}
      />
      <div className="flex flex-col gap-0.5">
        {CARD_BLOCK_COLOR_INSPECTOR_GROUPS.map((group) => (
          <CourseBlockColorsSection key={group.id} title={group.title}>
            {group.rows.map((row) => (
              <CourseBlockColorRow
                key={row.key}
                label={row.label}
                value={colors?.[row.key]}
                defaultHex={CARD_BLOCK_COLOR_THEME_DEFAULTS[row.key]}
                onChange={(next) =>
                  updateBlock(block.id, {
                    colors: patchCardBlockColor(colors, row.key, next),
                  })
                }
                {...colorRowClipboard(row.key)}
              />
            ))}
          </CourseBlockColorsSection>
        ))}

        <div className="mt-2 flex items-center gap-0 border-t border-white/6 pt-2">
          {hasOverrides ? (
            <TRNIconButton
              variant="ghost"
              className="h-7 w-7"
              icon={<RotateCcw size={13} strokeWidth={2.25} aria-hidden />}
              label="Reset all colors"
              nativeTitle={false}
              hint="Clear block color overrides"
              onClick={() => updateBlock(block.id, { colors: undefined })}
            />
          ) : null}
          <TRNIconButton
            variant="ghost"
            className="h-7 w-7"
            icon={<Copy size={13} strokeWidth={2.25} aria-hidden />}
            label="Copy colors"
            nativeTitle={false}
            hint="Copy this block's color style"
            onClick={handleCopy}
          />
          <TRNIconButton
            variant="ghost"
            className="h-7 w-7"
            icon={<ClipboardPaste size={13} strokeWidth={2.25} aria-hidden />}
            label="Paste colors"
            nativeTitle={false}
            hint={
              hasClipboard
                ? "Apply copied color style to this block"
                : "Paste copied color style (copy from another block first)"
            }
            disabled={pasteBusy}
            onClick={handlePaste}
          />
        </div>
      </div>
    </CourseInspectorCard>
  );
}
