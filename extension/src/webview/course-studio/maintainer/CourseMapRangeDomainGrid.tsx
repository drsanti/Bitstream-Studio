import {
  CourseInspectorFieldGrid,
  CourseInspectorFieldGridControls,
  CourseInspectorFieldGridLabels,
} from "./CourseInspectorFieldGrid";
import { CourseMaintainerScrubNumberField } from "./CourseMaintainerScrubNumberField";

export type CourseMapRangeDomainGridProps = {
  inMin: number;
  inMax: number;
  outMin: number;
  outMax: number;
  step?: number;
  onCommitInMin: (next: number) => void;
  onCommitInMax: (next: number) => void;
  onCommitOutMin: (next: number) => void;
  onCommitOutMax: (next: number) => void;
};

/** Input / output domain min–max grid — label-above-scrub parity with Scale & readout rows. */
export function CourseMapRangeDomainGrid(props: CourseMapRangeDomainGridProps) {
  const {
    inMin,
    inMax,
    outMin,
    outMax,
    step = 0.01,
    onCommitInMin,
    onCommitInMax,
    onCommitOutMin,
    onCommitOutMax,
  } = props;

  return (
    <div className="flex flex-col gap-2">
      <CourseInspectorFieldGrid>
        <CourseInspectorFieldGridLabels
          left={{ label: "Input min", description: "Sensor range start — raw telemetry maps from here." }}
          right={{ label: "Input max", description: "Sensor range end." }}
        />
        <CourseInspectorFieldGridControls
          left={
            <CourseMaintainerScrubNumberField
              ariaLabel="Map range input minimum"
              value={inMin}
              step={step}
              onChange={onCommitInMin}
            />
          }
          right={
            <CourseMaintainerScrubNumberField
              ariaLabel="Map range input maximum"
              value={inMax}
              step={step}
              onChange={onCommitInMax}
            />
          }
        />
      </CourseInspectorFieldGrid>

      <CourseInspectorFieldGrid>
        <CourseInspectorFieldGridLabels
          left={{ label: "Output min", description: "Display range start — mapped value lands here." }}
          right={{ label: "Output max", description: "Display range end." }}
        />
        <CourseInspectorFieldGridControls
          left={
            <CourseMaintainerScrubNumberField
              ariaLabel="Map range output minimum"
              value={outMin}
              step={step}
              onChange={onCommitOutMin}
            />
          }
          right={
            <CourseMaintainerScrubNumberField
              ariaLabel="Map range output maximum"
              value={outMax}
              step={step}
              onChange={onCommitOutMax}
            />
          }
        />
      </CourseInspectorFieldGrid>
    </div>
  );
}
