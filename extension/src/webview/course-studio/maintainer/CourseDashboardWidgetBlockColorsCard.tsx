import { ClipboardPaste, Copy, Palette, RotateCcw } from "lucide-react";
import { useState } from "react";
import { TRNButton } from "../../ui/TRN/TRNButton";
import { TRNHintText } from "../../ui/TRN/TRNHintText";
import { TRNIconButton } from "../../ui/TRN/TRNIconButton";
import type { PageBlockV1 } from "../schemas/page.v1";
import {
  copyDashboardWidgetBlockColorFieldHex,
  copyDashboardWidgetBlockColors,
  pasteDashboardWidgetBlockColorField,
  pasteDashboardWidgetBlockColors,
  useDashboardWidgetBlockColorsClipboardStore,
} from "../schemas/dashboardWidgetBlockColorsClipboard";
import {
  DASHBOARD_WIDGET_BLOCK_COLOR_INSPECTOR_GROUPS,
  DASHBOARD_WIDGET_BLOCK_COLOR_THEME_DEFAULTS,
  patchDashboardWidgetBlockColor,
  stripEmptyDashboardWidgetBlockColors,
  type DashboardWidgetBlockColorKey,
} from "../schemas/dashboardWidgetBlockColors";
import { CourseInspectorCard, COURSE_INSPECTOR_CARD_ICON_CLASS } from "./CourseInspectorCard";
import { CourseBlockColorRow } from "./inspector/CourseBlockColorRow";
import { CourseBlockColorsSection } from "./inspector/CourseBlockColorsSection";
import { useCourseDashboardWidgetColorStyleActions } from "./useCourseBlockColorStyleActions";
import { useCoursePageEditorStore } from "./useCoursePageEditorStore";

export function DashboardWidgetColorsCard({
  block,
}: {
  block: Extract<PageBlockV1, { kind: "dashboard-widget" }>;
}) {
  const updateBlock = useCoursePageEditorStore((s) => s.updateBlock);
  const hasClipboard = useDashboardWidgetBlockColorsClipboardStore((s) => s.hasClipboard);
  const [pasteBusy, setPasteBusy] = useState(false);
  const colors = block.colors;
  const hasOverrides = stripEmptyDashboardWidgetBlockColors(colors) != null;
  const styleActions = useCourseDashboardWidgetColorStyleActions(block);

  const handleCopy = () => {
    void copyDashboardWidgetBlockColors(colors);
  };

  const handlePaste = () => {
    if (pasteBusy) {
      return;
    }
    setPasteBusy(true);
    void (async () => {
      try {
        const pasted = await pasteDashboardWidgetBlockColors();
        if (pasted === null) {
          return;
        }
        updateBlock(block.id, { colors: pasted });
      } finally {
        setPasteBusy(false);
      }
    })();
  };

  const colorRowClipboard = (colorKey: DashboardWidgetBlockColorKey) => ({
    onCopy: () => {
      void copyDashboardWidgetBlockColorFieldHex(
        colors?.[colorKey] ?? DASHBOARD_WIDGET_BLOCK_COLOR_THEME_DEFAULTS[colorKey],
      );
    },
    onPaste: async () => {
      const pasted = await pasteDashboardWidgetBlockColorField(colorKey);
      if (pasted != null) {
        updateBlock(block.id, {
          colors: patchDashboardWidgetBlockColor(colors, colorKey, pasted),
        });
      }
    },
  });

  return (
    <CourseInspectorCard
      id={`${block.id}-dashboard-widget-colors`}
      title="Container colors"
      titleIcon={<Palette className={COURSE_INSPECTOR_CARD_ICON_CLASS} aria-hidden />}
      hint="Background, border, and title bar chrome. Unset fields inherit page defaults and theme surfaces."
      defaultExpanded={false}
    >
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-1.5">
          <TRNButton
            variant="secondary"
            size="sm"
            className="h-7 px-2 text-[11px]"
            onClick={() => {
              styleActions.applyToAll("replace");
            }}
          >
            Apply to all widgets
          </TRNButton>
          <TRNButton
            variant="secondary"
            size="sm"
            className="h-7 px-2 text-[11px]"
            onClick={() => {
              styleActions.setPageDefault();
            }}
          >
            Set page default
          </TRNButton>
        </div>
        <TRNHintText tone="muted">
          Preview uses resolved colors (page default → block override).
        </TRNHintText>

        <div className="flex flex-col gap-0.5">
          {DASHBOARD_WIDGET_BLOCK_COLOR_INSPECTOR_GROUPS.map((group) => (
            <CourseBlockColorsSection key={group.id} title={group.title}>
              {group.rows.map((row) => (
                <CourseBlockColorRow
                  key={row.key}
                  label={row.label}
                  value={colors?.[row.key]}
                  defaultHex={DASHBOARD_WIDGET_BLOCK_COLOR_THEME_DEFAULTS[row.key]}
                  onChange={(next) =>
                    updateBlock(block.id, {
                      colors: patchDashboardWidgetBlockColor(colors, row.key, next),
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
              hint="Copy this widget's color style"
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
                  ? "Apply copied color style to this widget"
                  : "Paste copied color style (copy from another widget first)"
              }
              disabled={pasteBusy}
              onClick={handlePaste}
            />
          </div>
        </div>
      </div>
    </CourseInspectorCard>
  );
}
