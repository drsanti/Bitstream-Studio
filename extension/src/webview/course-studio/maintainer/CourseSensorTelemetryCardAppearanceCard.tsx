import { ClipboardPaste, Copy, Palette, RotateCcw } from "lucide-react";
import { useState } from "react";
import { TRNButton } from "../../ui/TRN/TRNButton";
import { TRNFormField } from "../../ui/TRN/TRNForm";
import { TRNIconButton } from "../../ui/TRN/TRNIconButton";
import { TRNInlineToggleRow } from "../../ui/TRN/TRNInlineToggleRow";
import { TRNSelect } from "../../ui/TRN/TRNSelect";
import {
  COURSE_SENSOR_TELEMETRY_CARD_SHELL_OPTIONS,
  patchSensorTelemetryCardAppearance,
  stripEmptySensorTelemetryCardAppearance,
  type SensorTelemetryCardAppearance,
} from "../schemas/sensorTelemetryCardAppearance";
import {
  patchSensorTelemetryCardBlockColor,
  SENSOR_TELEMETRY_CARD_BLOCK_COLOR_INSPECTOR_GROUPS,
  SENSOR_TELEMETRY_CARD_BLOCK_COLOR_THEME_DEFAULTS,
  stripEmptySensorTelemetryCardBlockColors,
  type SensorTelemetryCardBlockColorKey,
} from "../schemas/sensorTelemetryCardBlockColors";
import {
  copySensorTelemetryCardBlockColorFieldHex,
  copySensorTelemetryCardBlockColors,
  pasteSensorTelemetryCardBlockColorField,
  pasteSensorTelemetryCardBlockColors,
  useSensorTelemetryCardBlockColorsClipboardStore,
} from "../schemas/sensorTelemetryCardBlockColorsClipboard";
import { CourseInspectorCard, COURSE_INSPECTOR_CARD_ICON_CLASS } from "./CourseInspectorCard";
import { CourseBlockColorRow } from "./inspector/CourseBlockColorRow";
import { CourseBlockColorsSection } from "./inspector/CourseBlockColorsSection";
import { useCourseSensorTelemetryCardColorStyleActions } from "./useCourseBlockColorStyleActions";
import { useCoursePageEditorStore } from "./useCoursePageEditorStore";
import type { CourseSensorTelemetryCardBlock } from "../ui/catalog/CourseSensorTelemetryCard";

export function CourseSensorTelemetryCardAppearanceCard({
  block,
}: {
  block: CourseSensorTelemetryCardBlock;
}) {
  const updateBlock = useCoursePageEditorStore((s) => s.updateBlock);
  const pageColorDefaults = useCoursePageEditorStore((s) => s.page?.meta?.sensorTelemetryCardColors);
  const hasClipboard = useSensorTelemetryCardBlockColorsClipboardStore((s) => s.hasClipboard);
  const [pasteBusy, setPasteBusy] = useState(false);
  const appearance = block.appearance;
  const colors = appearance?.colors;
  const hasColorOverrides = stripEmptySensorTelemetryCardBlockColors(colors) != null;
  const hasAppearanceOverrides = stripEmptySensorTelemetryCardAppearance(appearance) != null;
  const styleActions = useCourseSensorTelemetryCardColorStyleActions({ appearance });

  const patchAppearance = (patch: Partial<SensorTelemetryCardAppearance>) => {
    updateBlock(block.id, {
      appearance: patchSensorTelemetryCardAppearance(appearance, patch),
    });
  };

  const handleCopyColors = () => {
    void copySensorTelemetryCardBlockColors(colors);
  };

  const handlePasteColors = () => {
    if (pasteBusy) {
      return;
    }
    setPasteBusy(true);
    void (async () => {
      try {
        const pasted = await pasteSensorTelemetryCardBlockColors();
        if (pasted === null) {
          return;
        }
        patchAppearance({ colors: pasted });
      } finally {
        setPasteBusy(false);
      }
    })();
  };

  const resolvedDefaultHex = (colorKey: SensorTelemetryCardBlockColorKey) =>
    pageColorDefaults?.[colorKey] ?? SENSOR_TELEMETRY_CARD_BLOCK_COLOR_THEME_DEFAULTS[colorKey];

  const colorRowClipboard = (colorKey: SensorTelemetryCardBlockColorKey) => ({
    onCopy: () => {
      void copySensorTelemetryCardBlockColorFieldHex(
        colors?.[colorKey] ?? resolvedDefaultHex(colorKey),
      );
    },
    onPaste: async () => {
      const pasted = await pasteSensorTelemetryCardBlockColorField(colorKey);
      if (pasted != null) {
        patchAppearance({
          colors: patchSensorTelemetryCardBlockColor(colors, colorKey, pasted),
        });
      }
    },
  });

  return (
    <CourseInspectorCard
      id={`${block.id}-sensor-card-appearance`}
      title="Appearance"
      titleIcon={<Palette className={COURSE_INSPECTOR_CARD_ICON_CLASS} aria-hidden />}
      hint="Card shell, container colors, and header chrome. Unset colors inherit page defaults."
      defaultExpanded={false}
    >
      <div className="flex flex-col gap-3">
        <TRNFormField id={`${block.id}-shell`} label="Shell preset">
          <TRNSelect
            value={appearance?.shell ?? "solid"}
            ariaLabel="Sensor card shell preset"
            options={COURSE_SENSOR_TELEMETRY_CARD_SHELL_OPTIONS.map((entry) => ({
              value: entry.value,
              label: entry.label,
            }))}
            onValueChange={(value) => {
              if (value === "solid") {
                const next = { ...(appearance ?? {}) };
                delete next.shell;
                updateBlock(block.id, {
                  appearance: stripEmptySensorTelemetryCardAppearance(next),
                });
                return;
              }
              patchAppearance({
                shell: value as NonNullable<SensorTelemetryCardAppearance["shell"]>,
              });
            }}
          />
        </TRNFormField>

        <TRNInlineToggleRow
          label="Show update badge"
          checked={appearance?.showUpdateBadge !== false}
          onCheckedChange={(checked) =>
            patchAppearance({ showUpdateBadge: checked ? undefined : false })
          }
          hint="Δms timing badge in the card header."
        />
        <TRNInlineToggleRow
          label="Show display settings"
          checked={appearance?.showDisplaySettings !== false}
          onCheckedChange={(checked) =>
            patchAppearance({ showDisplaySettings: checked ? undefined : false })
          }
          hint="Header gear menu for unit and display options."
        />
        <TRNInlineToggleRow
          label="Start collapsed"
          checked={appearance?.defaultCollapsed === true}
          onCheckedChange={(checked) =>
            patchAppearance({ defaultCollapsed: checked ? true : undefined })
          }
          hint="Card body hidden until the reader expands the header."
        />

        <div className="flex min-w-0 gap-1.5">
          <TRNButton
            variant="secondary"
            size="sm"
            className="h-7 min-w-0 flex-1 truncate px-2 text-[11px]"
            hint="Apply colors to all sensor cards"
            onClick={() => {
              styleActions.applyToAll("replace");
            }}
          >
            Apply colors to all sensor cards
          </TRNButton>
          <TRNButton
            variant="secondary"
            size="sm"
            className="h-7 min-w-0 flex-1 truncate px-2 text-[11px]"
            hint="Set page color default"
            onClick={() => {
              styleActions.setPageDefault();
            }}
          >
            Set page color default
          </TRNButton>
        </div>

        <div className="flex flex-col gap-0.5">
          {SENSOR_TELEMETRY_CARD_BLOCK_COLOR_INSPECTOR_GROUPS.map((group) => (
            <CourseBlockColorsSection key={group.id} title={group.title}>
              {group.rows.map((row) => (
                <CourseBlockColorRow
                  key={row.key}
                  label={row.label}
                  hint={row.hint}
                  value={colors?.[row.key]}
                  defaultHex={resolvedDefaultHex(row.key)}
                  onChange={(next) =>
                    patchAppearance({
                      colors: patchSensorTelemetryCardBlockColor(colors, row.key, next),
                    })
                  }
                  {...colorRowClipboard(row.key)}
                />
              ))}
            </CourseBlockColorsSection>
          ))}

          <div className="mt-2 flex items-center gap-0 border-t border-white/6 pt-2">
            {hasAppearanceOverrides ? (
              <TRNIconButton
                variant="ghost"
                className="h-7 w-7"
                icon={<RotateCcw size={13} strokeWidth={2.25} aria-hidden />}
                label="Reset appearance"
                nativeTitle={false}
                hint="Clear block appearance overrides"
                onClick={() => updateBlock(block.id, { appearance: undefined })}
              />
            ) : null}
            {hasColorOverrides ? (
              <TRNIconButton
                variant="ghost"
                className="h-7 w-7"
                icon={<RotateCcw size={13} strokeWidth={2.25} aria-hidden />}
                label="Reset colors only"
                nativeTitle={false}
                hint="Clear block color overrides"
                onClick={() =>
                  patchAppearance({
                    colors: undefined,
                  })
                }
              />
            ) : null}
            <TRNIconButton
              variant="ghost"
              className="h-7 w-7"
              icon={<Copy size={13} strokeWidth={2.25} aria-hidden />}
              label="Copy colors"
              nativeTitle={false}
              hint="Copy this sensor card's color style"
              onClick={handleCopyColors}
            />
            <TRNIconButton
              variant="ghost"
              className="h-7 w-7"
              icon={<ClipboardPaste size={13} strokeWidth={2.25} aria-hidden />}
              label="Paste colors"
              nativeTitle={false}
              hint={
                hasClipboard
                  ? "Apply copied color style to this sensor card"
                  : "Paste copied color style (copy from another sensor card first)"
              }
              disabled={pasteBusy}
              onClick={handlePasteColors}
            />
          </div>
        </div>
      </div>
    </CourseInspectorCard>
  );
}
