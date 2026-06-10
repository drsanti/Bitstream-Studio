import { RotateCcw } from "lucide-react";
import { TRNFormField } from "../../ui/TRN/TRNForm";
import { TRNIconButton } from "../../ui/TRN/TRNIconButton";
import { TRNInlineToggleRow } from "../../ui/TRN/TRNInlineToggleRow";
import { TRNSelect } from "../../ui/TRN/TRNSelect";
import type { PageGridV1 } from "../schemas/page.v1";
import {
  PAGE_GRID_CHROME_INSPECTOR_GROUPS,
  PAGE_GRID_CHROME_THEME_DEFAULTS,
  PAGE_GRID_GUIDE_BORDER_STYLE_OPTIONS,
  pageGridChromeDefaultHex,
  patchPageGridChrome,
  patchPageGridChromeColor,
  stripEmptyPageGridChrome,
  type PageGridCellChromeKey,
  type PageGridGuidesChromeKey,
} from "../schemas/pageGridChrome";
import { useCoursePageGridGuidesStore } from "./coursePageGridGuides";
import { CourseBlockColorRow } from "./inspector/CourseBlockColorRow";
import { CourseBlockColorsSection } from "./inspector/CourseBlockColorsSection";
import { useCoursePageEditorStore } from "./useCoursePageEditorStore";

type GridChromeColorKey =
  | "canvasBackground"
  | PageGridGuidesChromeKey
  | PageGridCellChromeKey;

function readGridChromeColor(
  chrome: PageGridV1["chrome"],
  key: GridChromeColorKey,
): string | undefined {
  if (key === "canvasBackground") {
    return chrome?.canvasBackground;
  }
  if (key === "border" || key === "background") {
    return chrome?.guides?.[key];
  }
  return chrome?.cell?.[key];
}

export function CoursePageGridChromeInspectorFields({ grid }: { grid: PageGridV1 }) {
  const updatePageGridChrome = useCoursePageEditorStore((s) => s.updatePageGridChrome);
  const applyPageGridChrome = useCoursePageEditorStore((s) => s.applyPageGridChrome);
  const gridGuidesEnabled = useCoursePageGridGuidesStore((s) => s.enabled);
  const setGridGuidesEnabled = useCoursePageGridGuidesStore((s) => s.setEnabled);
  const chrome = grid.chrome;
  const hasChromeOverrides = stripEmptyPageGridChrome(chrome) != null;

  const patchChromeColor = (key: GridChromeColorKey, next: string | undefined) => {
    applyPageGridChrome(
      patchPageGridChromeColor(chrome, key, next, pageGridChromeDefaultHex(key)),
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[10px] text-[var(--text-muted)]">
        {grid.columns}-column grid · {grid.rowHeightPx}px rows
      </p>

      <TRNInlineToggleRow
        label="Grid guides"
        hint="Show dashboard-style cell grid while editing block placement."
        checked={gridGuidesEnabled}
        ariaLabel="Show page grid guides"
        onCheckedChange={setGridGuidesEnabled}
      />

      {PAGE_GRID_CHROME_INSPECTOR_GROUPS.map((group) => (
        <CourseBlockColorsSection key={group.id} title={group.title}>
          {group.rows.map((row) => (
            <CourseBlockColorRow
              key={row.key}
              label={row.label}
              value={readGridChromeColor(chrome, row.key)}
              defaultHex={pageGridChromeDefaultHex(row.key)}
              onChange={(next) => patchChromeColor(row.key, next)}
            />
          ))}
          {group.id === "guides" ? (
            <TRNFormField id="course-grid-guide-border-style" label="Border style">
              <TRNSelect
                value={
                  chrome?.guides?.borderStyle ?? PAGE_GRID_CHROME_THEME_DEFAULTS.guides.borderStyle
                }
                ariaLabel="Guide cell border style"
                options={PAGE_GRID_GUIDE_BORDER_STYLE_OPTIONS.map((entry) => ({
                  value: entry.value,
                  label: entry.label,
                }))}
                onValueChange={(value) => {
                  const borderStyle =
                    value as (typeof PAGE_GRID_GUIDE_BORDER_STYLE_OPTIONS)[number]["value"];
                  if (borderStyle === PAGE_GRID_CHROME_THEME_DEFAULTS.guides.borderStyle) {
                    updatePageGridChrome({
                      guides: {
                        ...(chrome?.guides ?? {}),
                        borderStyle: undefined,
                      },
                    });
                    return;
                  }
                  updatePageGridChrome({
                    guides: {
                      ...(chrome?.guides ?? {}),
                      borderStyle,
                    },
                  });
                }}
              />
            </TRNFormField>
          ) : null}
        </CourseBlockColorsSection>
      ))}

      <CourseBlockColorsSection title="Published view">
        <TRNInlineToggleRow
          label="Show cell grid"
          hint="Draw idle cell borders in read / preview mode."
          checked={chrome?.published?.showCellChrome === true}
          onCheckedChange={(checked) =>
            updatePageGridChrome({
              published: {
                ...(chrome?.published ?? {}),
                showCellChrome: checked ? true : undefined,
              },
            })
          }
        />
        <TRNInlineToggleRow
          label="Match guide style"
          hint="Use guide border and fill instead of idle cell chrome in published view."
          checked={chrome?.published?.useGuideStyleForCells === true}
          onCheckedChange={(checked) =>
            updatePageGridChrome({
              published: {
                ...(chrome?.published ?? {}),
                useGuideStyleForCells: checked ? true : undefined,
              },
            })
          }
        />
      </CourseBlockColorsSection>

      {hasChromeOverrides ? (
        <div className="flex items-center gap-0 border-t border-white/6 pt-2">
          <TRNIconButton
            variant="ghost"
            className="h-7 w-7"
            icon={<RotateCcw size={13} strokeWidth={2.25} aria-hidden />}
            label="Reset grid chrome"
            nativeTitle={false}
            hint="Clear all grid line and cell style overrides"
            onClick={() => applyPageGridChrome(undefined)}
          />
        </div>
      ) : null}
    </div>
  );
}
