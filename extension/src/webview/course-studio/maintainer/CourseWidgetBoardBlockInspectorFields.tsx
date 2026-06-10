import type { PageBlockV1 } from "../schemas/page.v1";
import {
  WIDGET_BOARD_THEME_PRESET_OPTIONS,
  type WidgetBoardThemePresetId,
} from "../schemas/widgetBoardTheme.v1";
import { useCoursePageEditorStore } from "./useCoursePageEditorStore";
import { COURSE_INSPECTOR_CARD_ICON_CLASS, CourseInspectorCard } from "./CourseInspectorCard";
import {
  CourseInspectorFieldGrid,
  CourseInspectorFieldGridControls,
  CourseInspectorFieldGridLabels,
} from "./CourseInspectorFieldGrid";
import { CourseMaintainerScrubNumberField } from "./CourseMaintainerScrubNumberField";
import {
  TRNFormField,
  TRNInlineToggleRow,
  TRNInput,
  TRNSelect,
  TRNTextarea,
} from "../../ui/TRN";
import { LayoutGrid, Palette } from "lucide-react";

const INNER_GRID_DEFAULTS = {
  columns: 6,
  rowHeightPx: 48,
  gapPx: 8,
  paddingPx: 16,
} as const;

export function CourseWidgetBoardBlockInspectorFields({
  block,
}: {
  block: Extract<PageBlockV1, { kind: "widget-board" }>;
}) {
  const updateBlock = useCoursePageEditorStore((s) => s.updateBlock);
  const appearance = block.appearance ?? { themePresetId: "ev-compact" as const };
  const grid = block.grid;
  const showMetaLine = appearance.showMetaLine !== false;
  const showCaption = appearance.showCaption !== false;

  const patchAppearance = (patch: Partial<NonNullable<typeof block.appearance>>) => {
    updateBlock(block.id, {
      appearance: { ...appearance, ...patch },
    });
  };

  const patchGrid = (patch: Partial<typeof grid>) => {
    updateBlock(block.id, {
      grid: { ...grid, ...patch },
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <CourseInspectorCard
        title="Inner grid"
        hint="Column layout for widgets inside this board."
        titleIcon={<LayoutGrid className={COURSE_INSPECTOR_CARD_ICON_CLASS} aria-hidden />}
        defaultCollapsed={false}
      >
        <div className="flex flex-col gap-2">
          <CourseInspectorFieldGrid>
            <CourseInspectorFieldGridLabels
              left={{ label: "Columns", description: "Number of inner grid columns." }}
              right={{
                label: "Row height",
                description: "Fixed pixel height per grid row (matches Page Editor cells).",
              }}
            />
            <CourseInspectorFieldGridControls
              left={
                <CourseMaintainerScrubNumberField
                  ariaLabel="Widget board columns"
                  value={grid.columns}
                  step={1}
                  min={2}
                  max={12}
                  fractionDigits={0}
                  defaultValue={INNER_GRID_DEFAULTS.columns}
                  onChange={(columns) => patchGrid({ columns: Math.round(columns) })}
                />
              }
              right={
                <CourseMaintainerScrubNumberField
                  ariaLabel="Widget board row height"
                  value={grid.rowHeightPx}
                  step={4}
                  min={24}
                  max={120}
                  fractionDigits={0}
                  defaultValue={INNER_GRID_DEFAULTS.rowHeightPx}
                  onChange={(rowHeightPx) => patchGrid({ rowHeightPx: Math.round(rowHeightPx) })}
                />
              }
            />
          </CourseInspectorFieldGrid>

          <CourseInspectorFieldGrid>
            <CourseInspectorFieldGridLabels
              left={{ label: "Gap", description: "Space between inner grid cells." }}
              right={{ label: "Padding", description: "Inset around the inner grid." }}
            />
            <CourseInspectorFieldGridControls
              left={
                <CourseMaintainerScrubNumberField
                  ariaLabel="Widget board gap"
                  value={grid.gapPx}
                  step={1}
                  min={0}
                  max={32}
                  fractionDigits={0}
                  defaultValue={INNER_GRID_DEFAULTS.gapPx}
                  onChange={(gapPx) => patchGrid({ gapPx: Math.round(gapPx) })}
                />
              }
              right={
                <CourseMaintainerScrubNumberField
                  ariaLabel="Widget board padding"
                  value={grid.paddingPx}
                  step={1}
                  min={0}
                  max={64}
                  fractionDigits={0}
                  defaultValue={INNER_GRID_DEFAULTS.paddingPx}
                  onChange={(paddingPx) => patchGrid({ paddingPx: Math.round(paddingPx) })}
                />
              }
            />
          </CourseInspectorFieldGrid>
        </div>
      </CourseInspectorCard>

      <CourseInspectorCard
        title="Theme & shell"
        hint="Board chrome, preset colors, and optional meta line / caption."
        titleIcon={<Palette className={COURSE_INSPECTOR_CARD_ICON_CLASS} aria-hidden />}
        defaultCollapsed={false}
      >
        <div className="flex flex-col gap-2">
          <TRNFormField id={`${block.id}-wb-theme`} label="Theme preset">
            <TRNSelect
              value={appearance.themePresetId ?? "ev-compact"}
              ariaLabel="Widget board theme"
              variant="field"
              size="sm"
              options={WIDGET_BOARD_THEME_PRESET_OPTIONS.map((entry) => ({
                value: entry.value,
                label: entry.label,
              }))}
              onValueChange={(value) =>
                patchAppearance({ themePresetId: value as WidgetBoardThemePresetId })
              }
            />
          </TRNFormField>

          <TRNInlineToggleRow
            label="Show meta line"
            checked={showMetaLine}
            onCheckedChange={(checked) => patchAppearance({ showMetaLine: checked })}
            ariaLabel="Show meta line above the widget grid"
          />

          {showMetaLine ? (
            <TRNFormField id={`${block.id}-wb-meta`} label="Meta line">
              <TRNInput
                id={`${block.id}-wb-meta`}
                variant="outlined"
                size="sm"
                className="w-full"
                value={appearance.metaLine ?? ""}
                placeholder="e.g. Decorative · No telemetry"
                onChange={(e) => patchAppearance({ metaLine: e.target.value })}
              />
            </TRNFormField>
          ) : null}

          <TRNInlineToggleRow
            label="Show caption"
            checked={showCaption}
            onCheckedChange={(checked) => patchAppearance({ showCaption: checked })}
            ariaLabel="Show caption below the widget grid"
          />

          {showCaption ? (
            <TRNFormField id={`${block.id}-wb-caption`} label="Caption">
              <TRNTextarea
                id={`${block.id}-wb-caption`}
                variant="outlined"
                size="sm"
                className="w-full"
                rows={2}
                value={appearance.caption ?? ""}
                placeholder="Optional footnote below the grid"
                onChange={(e) => patchAppearance({ caption: e.target.value })}
              />
            </TRNFormField>
          ) : null}
        </div>
      </CourseInspectorCard>
    </div>
  );
}
