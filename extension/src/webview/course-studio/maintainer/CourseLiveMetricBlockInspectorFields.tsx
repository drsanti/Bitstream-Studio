import { Link2 } from "lucide-react";
import type { PageBlockV1 } from "../schemas/page.v1";
import { resolveLiveMetricAxisBinding } from "../schemas/courseLiveBindingDefaults";
import { CourseInspectorCard, COURSE_INSPECTOR_CARD_ICON_CLASS } from "./CourseInspectorCard";
import { CourseLiveBindingField } from "./binding/CourseLiveBindingField";
import { useCoursePageEditorStore } from "./useCoursePageEditorStore";

export function CourseLiveMetricBlockInspectorFields({
  block,
}: {
  block: Extract<PageBlockV1, { kind: "live-metric" }>;
}) {
  const updateBlock = useCoursePageEditorStore((s) => s.updateBlock);

  return (
    <CourseInspectorCard
      title="Axis bindings"
      hint="Map each accelerometer axis to live telemetry paths."
      titleIcon={<Link2 className={COURSE_INSPECTOR_CARD_ICON_CLASS} aria-hidden />}
      defaultCollapsed={false}
    >
      <div className="flex flex-col gap-2">
        {(["ax", "ay", "az"] as const).map((axis) => (
          <CourseLiveBindingField
            key={axis}
            label={`Axis ${axis.toUpperCase()}`}
            binding={resolveLiveMetricAxisBinding(axis, block.axes?.[axis])}
            onChange={(next) => {
              const axes = { ...block.axes };
              if (next == null) {
                delete axes[axis];
              } else {
                axes[axis] = next;
              }
              updateBlock(block.id, {
                axes: Object.keys(axes).length > 0 ? axes : undefined,
              });
            }}
          />
        ))}
      </div>
    </CourseInspectorCard>
  );
}
