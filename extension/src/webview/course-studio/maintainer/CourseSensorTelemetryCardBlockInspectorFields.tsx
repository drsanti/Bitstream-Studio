import { Activity } from "lucide-react";
import { TRNFormField } from "../../ui/TRN/TRNForm";
import { TRNSelect } from "../../ui/TRN/TRNSelect";
import type { PageBlockV1 } from "../schemas/page.v1";
import { COURSE_SENSOR_TELEMETRY_CARD_PRESET_OPTIONS } from "../schemas/sensorTelemetryCardPreset";
import { CourseInspectorCard, COURSE_INSPECTOR_CARD_ICON_CLASS } from "./CourseInspectorCard";
import { CourseSensorTelemetryCardAppearanceCard } from "./CourseSensorTelemetryCardAppearanceCard";
import { useCoursePageEditorStore } from "./useCoursePageEditorStore";

export function CourseSensorTelemetryCardBlockInspectorFields({
  block,
}: {
  block: Extract<PageBlockV1, { kind: "sensor-telemetry-card" }>;
}) {
  const updateBlock = useCoursePageEditorStore((s) => s.updateBlock);

  return (
    <div className="flex flex-col gap-3">
      <CourseInspectorCard
        id={`${block.id}-sensor-card-content`}
        title="Sensor card"
        titleIcon={<Activity className={COURSE_INSPECTOR_CARD_ICON_CLASS} aria-hidden />}
        hint="Which Telemetry Data card to embed on this page."
        defaultExpanded
      >
        <div className="flex flex-col gap-3">
          <TRNFormField id={`${block.id}-preset`} label="Preset">
            <TRNSelect
              value={block.preset}
              ariaLabel="Sensor telemetry card preset"
              options={COURSE_SENSOR_TELEMETRY_CARD_PRESET_OPTIONS.map((entry) => ({
                value: entry.value,
                label: entry.label,
              }))}
              onValueChange={(value) =>
                updateBlock(block.id, {
                  preset: value as typeof block.preset,
                })
              }
            />
          </TRNFormField>
        </div>
      </CourseInspectorCard>

      <CourseSensorTelemetryCardAppearanceCard block={block} />
    </div>
  );
}
