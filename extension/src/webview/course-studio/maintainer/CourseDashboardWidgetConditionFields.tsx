import { TRNFormField } from "../../ui/TRN/TRNForm";
import { TRNHintText } from "../../ui/TRN/TRNHintText";
import { TRNSelect } from "../../ui/TRN/TRNSelect";
import {
  COMPARE_OPERATION_OPTIONS,
  COURSE_DASHBOARD_WIDGET_CONDITION_DEFAULT,
  readCourseDashboardWidgetCondition,
  type CourseDashboardWidgetCondition,
} from "../schemas/courseDashboardWidgetCondition";
import { CourseMaintainerScrubNumberField } from "./CourseMaintainerScrubNumberField";

export function CourseDashboardWidgetConditionFields({
  blockId,
  style,
  bindingPath,
  bindingValueKind,
  onPatch,
}: {
  blockId: string;
  style: Record<string, unknown>;
  bindingPath?: string;
  bindingValueKind?: "number" | "boolean";
  onPatch: (patch: Partial<CourseDashboardWidgetCondition & { threshold: number }>) => void;
}) {
  const condition = readCourseDashboardWidgetCondition(style);
  const isBooleanPath = bindingValueKind === "boolean";

  if (isBooleanPath) {
    return (
      <TRNHintText>
        Boolean binding{ bindingPath != null && bindingPath.length > 0 ? ` (${bindingPath})` : "" } — ON
        follows telemetry directly; compare rule is ignored.
      </TRNHintText>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <TRNFormField id={`${blockId}-compare-op`} label="ON when">
        <TRNSelect
          value={condition.compareOp}
          ariaLabel="Compare operator"
          options={COMPARE_OPERATION_OPTIONS.map((opt) => ({
            value: opt.value,
            label: opt.label,
          }))}
          onValueChange={(value) => {
            onPatch({ compareOp: value });
          }}
        />
      </TRNFormField>
      <TRNFormField id={`${blockId}-compare-value`} label="Compare value">
        <CourseMaintainerScrubNumberField
          ariaLabel="Compare value for ON/OFF rule"
          value={condition.compareValue}
          step={0.1}
          defaultValue={COURSE_DASHBOARD_WIDGET_CONDITION_DEFAULT.compareValue}
          onChange={(compareValue) => {
            onPatch({ compareValue, threshold: compareValue });
          }}
        />
      </TRNFormField>
    </div>
  );
}
