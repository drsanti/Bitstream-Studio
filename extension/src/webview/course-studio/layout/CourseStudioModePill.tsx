import { TRNTooltip } from "../../ui/TRN/TRNTooltip";
import { TRN_HINT_HOVER_DELAY_MS } from "../../ui/TRN/TRNHintText";
import {
  useCourseStudioMaintainerModeEnabled,
  useCourseStudioMaintainerModeStore,
} from "../maintainer/courseStudioMaintainerMode";
import {
  COURSE_STUDIO_MODE_PILL_CLASS,
  COURSE_STUDIO_MODE_PILL_SEGMENT_CLASS,
  COURSE_STUDIO_MODE_PILL_SEGMENT_EDIT_ACTIVE_CLASS,
  COURSE_STUDIO_MODE_PILL_SEGMENT_INACTIVE_CLASS,
  COURSE_STUDIO_MODE_PILL_SEGMENT_READ_ACTIVE_CLASS,
  COURSE_STUDIO_MODE_PILL_TOOLTIP_CLASS,
  COURSE_STUDIO_MODE_PILL_TOOLTIP_TRIGGER_CLASS,
} from "./course-studio-topbar-ui";

const MODE_SEGMENTS = [
  {
    id: "edit" as const,
    label: "Edit",
    hint: "Author page layout, blocks, diagrams, and markdown (dev only).",
  },
  {
    id: "read" as const,
    label: "Read",
    hint: "Preview the page without editing tools.",
  },
] as const;

export function CourseStudioModePill() {
  const editMode = useCourseStudioMaintainerModeEnabled();
  const setMaintainerEnabled = useCourseStudioMaintainerModeStore((s) => s.setEnabled);

  return (
    <div className={COURSE_STUDIO_MODE_PILL_CLASS} role="radiogroup" aria-label="Course Studio mode">
      {MODE_SEGMENTS.map((segment) => {
        const active = segment.id === "edit" ? editMode : !editMode;
        const trigger = (
          <button
            type="button"
            role="radio"
            aria-checked={active}
            data-segment={segment.id}
            className={`${COURSE_STUDIO_MODE_PILL_SEGMENT_CLASS} ${
              active
                ? segment.id === "edit"
                  ? COURSE_STUDIO_MODE_PILL_SEGMENT_EDIT_ACTIVE_CLASS
                  : COURSE_STUDIO_MODE_PILL_SEGMENT_READ_ACTIVE_CLASS
                : COURSE_STUDIO_MODE_PILL_SEGMENT_INACTIVE_CLASS
            }`}
            onClick={() => {
              setMaintainerEnabled(segment.id === "edit");
            }}
          >
            {segment.label}
          </button>
        );

        return (
          <TRNTooltip
            key={segment.id}
            content={segment.hint}
            placement="bottom"
            openDelayMs={TRN_HINT_HOVER_DELAY_MS}
            disableHoverFx
            className={COURSE_STUDIO_MODE_PILL_TOOLTIP_CLASS}
            triggerWrapper="span"
            triggerClassName={COURSE_STUDIO_MODE_PILL_TOOLTIP_TRIGGER_CLASS}
            triggerAriaLabel={segment.label}
            trigger={trigger}
          />
        );
      })}
    </div>
  );
}
