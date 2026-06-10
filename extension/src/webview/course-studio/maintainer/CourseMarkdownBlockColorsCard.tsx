import { ClipboardPaste, Copy, Palette, RotateCcw } from "lucide-react";
import { useState } from "react";
import { TRNIconButton } from "../../ui/TRN/TRNIconButton";
import { TRNSelect } from "../../ui/TRN/TRNSelect";
import type { PageBlockV1 } from "../schemas/page.v1";
import {
  copyMarkdownBlockColorFieldHex,
  copyMarkdownBlockColors,
  pasteMarkdownBlockColorField,
  pasteMarkdownBlockColors,
  useMarkdownBlockColorsClipboardStore,
} from "../schemas/markdownBlockColorsClipboard";
import {
  MARKDOWN_BLOCK_CODE_SYNTAX_THEME_SELECT_OPTIONS,
  MARKDOWN_BLOCK_COLOR_INSPECTOR_GROUPS,
  MARKDOWN_BLOCK_COLOR_THEME_DEFAULTS,
  patchMarkdownBlockCodeSyntaxTheme,
  patchMarkdownBlockColor,
  stripEmptyMarkdownBlockColors,
  type MarkdownBlockColorKey,
} from "../schemas/markdownBlockColors";
import {
  TRN_HIGHLIGHTED_JSON_DEFAULT_SYNTAX_THEME_ID,
  type TRNHighlightedJsonSyntaxThemeId,
} from "../../ui/TRN/trnHighlightedJsonSyntaxThemes";
import { CourseInspectorCard, COURSE_INSPECTOR_CARD_ICON_CLASS } from "./CourseInspectorCard";
import {
  buildMarkdownPresetSelectOptions,
  CourseBlockColorsActionBar,
} from "./inspector/CourseBlockColorsActionBar";
import {
  COURSE_BLOCK_COLOR_ROW_LABEL_CLASS,
  COURSE_BLOCK_COLOR_ROW_VALUE_CLASS,
  CourseBlockColorRow,
} from "./inspector/CourseBlockColorRow";
import { CourseBlockColorsSection } from "./inspector/CourseBlockColorsSection";
import { resolveMarkdownBlockEffectiveColors } from "../runtime/resolveBlockColors";
import { useCourseMarkdownColorStyleActions } from "./useCourseBlockColorStyleActions";
import { useCourseOutlineStore } from "./useCourseOutlineStore";
import { useCoursePageEditorStore } from "./useCoursePageEditorStore";

function MarkdownCodeSyntaxThemeRow({
  value,
  onChange,
}: {
  value: TRNHighlightedJsonSyntaxThemeId | undefined;
  onChange: (next: TRNHighlightedJsonSyntaxThemeId | undefined) => void;
}) {
  const resolved = value ?? TRN_HIGHLIGHTED_JSON_DEFAULT_SYNTAX_THEME_ID;
  const overridden = value != null;

  return (
    <div className="flex min-w-0 items-center gap-2 py-0.5">
      <span className={COURSE_BLOCK_COLOR_ROW_LABEL_CLASS}>Syntax theme</span>
      <div className="min-w-0 flex-1">
        <TRNSelect
          value={resolved}
          ariaLabel="Code block syntax theme"
          options={MARKDOWN_BLOCK_CODE_SYNTAX_THEME_SELECT_OPTIONS}
          onValueChange={(next) => {
            if (next === TRN_HIGHLIGHTED_JSON_DEFAULT_SYNTAX_THEME_ID) {
              onChange(undefined);
              return;
            }
            onChange(next as TRNHighlightedJsonSyntaxThemeId);
          }}
        />
      </div>
      <span
        className={`${COURSE_BLOCK_COLOR_ROW_VALUE_CLASS}${overridden ? " text-zinc-400" : " italic text-zinc-600"}`}
      >
        {overridden
          ? MARKDOWN_BLOCK_CODE_SYNTAX_THEME_SELECT_OPTIONS.find((option) => option.value === resolved)
              ?.label ?? resolved
          : "Default"}
      </span>
      {overridden ? (
        <TRNIconButton
          variant="ghost"
          className="h-6 w-6 shrink-0"
          icon={<RotateCcw size={12} strokeWidth={2.25} aria-hidden />}
          label="Reset syntax theme"
          nativeTitle={false}
          hint="Use default One Dark theme"
          onClick={() => onChange(undefined)}
        />
      ) : null}
    </div>
  );
}

function MarkdownColorsCard({ block }: { block: Extract<PageBlockV1, { kind: "markdown" }> }) {
  const updateBlock = useCoursePageEditorStore((s) => s.updateBlock);
  const pageMeta = useCoursePageEditorStore((s) => s.page?.meta);
  const courseThemes = useCourseOutlineStore((s) => s.course?.themes);
  const previewColors = resolveMarkdownBlockEffectiveColors(block.colors, pageMeta, courseThemes);
  const hasClipboard = useMarkdownBlockColorsClipboardStore((s) => s.hasClipboard);
  const [pasteBusy, setPasteBusy] = useState(false);
  const colors = block.colors;
  const hasOverrides = stripEmptyMarkdownBlockColors(colors) != null;
  const styleActions = useCourseMarkdownColorStyleActions(block);

  const handleCopy = () => {
    void copyMarkdownBlockColors(colors);
  };

  const handlePaste = () => {
    if (pasteBusy) {
      return;
    }
    setPasteBusy(true);
    void (async () => {
      try {
        const pasted = await pasteMarkdownBlockColors();
        if (pasted === null) {
          return;
        }
        updateBlock(block.id, { colors: pasted });
      } finally {
        setPasteBusy(false);
      }
    })();
  };

  const colorRowClipboard = (colorKey: MarkdownBlockColorKey) => ({
    onCopy: () => {
      void copyMarkdownBlockColorFieldHex(
        colors?.[colorKey] ?? MARKDOWN_BLOCK_COLOR_THEME_DEFAULTS[colorKey],
      );
    },
    onPaste: async () => {
      const pasted = await pasteMarkdownBlockColorField(colorKey);
      if (pasted != null) {
        updateBlock(block.id, {
          colors: patchMarkdownBlockColor(colors, colorKey, pasted),
        });
      }
    },
  });

  return (
    <CourseInspectorCard
      id={`${block.id}-markdown-colors`}
      title="Colors"
      titleIcon={<Palette className={COURSE_INSPECTOR_CARD_ICON_CLASS} aria-hidden />}
      hint="Per-block overrides, page defaults, and course presets. Save page + course so View mode and VSIX match."
      defaultExpanded={false}
    >
      <CourseBlockColorsActionBar
        blockKind="markdown"
        currentBlockId={block.id}
        previewColors={previewColors}
        presetOptions={buildMarkdownPresetSelectOptions(courseThemes)}
        onApplyToAll={styleActions.applyToAll}
        onSetPageDefault={styleActions.setPageDefault}
        onSavePreset={styleActions.savePreset}
        onApplyPreset={styleActions.applyPreset}
      />
      <div className="flex flex-col gap-0.5">
        {MARKDOWN_BLOCK_COLOR_INSPECTOR_GROUPS.map((group) => (
          <CourseBlockColorsSection
            key={group.id}
            title={group.title}
            footer={
              group.id === "code" ? (
                <MarkdownCodeSyntaxThemeRow
                  value={colors?.codeSyntaxTheme}
                  onChange={(next) =>
                    updateBlock(block.id, {
                      colors: patchMarkdownBlockCodeSyntaxTheme(colors, next),
                    })
                  }
                />
              ) : null
            }
          >
            {group.rows.map((row) => (
              <CourseBlockColorRow
                key={row.key}
                label={row.label}
                value={colors?.[row.key]}
                defaultHex={MARKDOWN_BLOCK_COLOR_THEME_DEFAULTS[row.key]}
                onChange={(next) =>
                  updateBlock(block.id, {
                    colors: patchMarkdownBlockColor(colors, row.key, next),
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
              hint="Clear all custom colors for this block"
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

export { MarkdownColorsCard };
