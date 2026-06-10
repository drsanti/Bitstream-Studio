import { RotateCcw, Video } from "lucide-react";
import { CourseMaintainerScrubNumberInput } from "./CourseMaintainerScrubNumberInput";
import { TRNButton } from "../../ui/TRN/TRNButton";
import { TRNFormField } from "../../ui/TRN/TRNForm";
import { TRNHintText } from "../../ui/TRN/TRNHintText";
import type { DiagramV1 } from "../schemas/diagram.v1";
import { readDiagram3dCamera } from "../runtime/diagram/diagram3dCamera";
import { CourseInspectorCard, COURSE_INSPECTOR_CARD_ICON_CLASS } from "./CourseInspectorCard";
import { useCourseDiagramEditorStore } from "./useCourseDiagramEditorStore";

export function CourseDiagram3dCameraFields({
  diagramId,
  diagram,
}: {
  diagramId: string;
  diagram: DiagramV1;
}) {
  const patch3dCamera = useCourseDiagramEditorStore((s) => s.patch3dCamera);
  const reset3dCamera = useCourseDiagramEditorStore((s) => s.reset3dCamera);
  const camera = readDiagram3dCamera(diagram);

  return (
    <CourseInspectorCard
      title="Default camera"
      hint="Saved with the diagram. Reset camera in the viewport restores these values."
      titleIcon={<Video className={COURSE_INSPECTOR_CARD_ICON_CLASS} aria-hidden />}
      defaultExpanded={false}
    >
      <div className="flex flex-col gap-2">
        <TRNHintText className="!text-[10px]">
          Orbit pan/zoom is session-only. Use viewport Save view or edit fields below to persist the
          diagram default camera.
        </TRNHintText>
        <div className="grid grid-cols-3 gap-2">
          {(["x", "y", "z"] as const).map((axis, index) => (
            <TRNFormField
              key={axis}
              id={`${diagramId}-camera-pos-${axis}`}
              label={`Pos ${axis.toUpperCase()}`}
            >
              <CourseMaintainerScrubNumberInput
                value={camera.position[index]}
                step={0.1}
                onChange={(value) =>
                  patch3dCamera(diagramId, {
                    [`position${axis.toUpperCase()}` as "positionX"]: value,
                  })
                }
              />
            </TRNFormField>
          ))}
        </div>
        <TRNFormField id={`${diagramId}-camera-fov`} label="Field of view">
          <CourseMaintainerScrubNumberInput
            value={camera.fov}
            min={20}
            max={90}
            step={1}
            onChange={(value) => patch3dCamera(diagramId, { fov: value })}
          />
        </TRNFormField>
        <TRNButton
          size="compact"
          className="self-start"
          hint="Restore diagram default camera (3, 2.5, 4 · FOV 45)"
          onClick={() => reset3dCamera(diagramId)}
        >
          <RotateCcw size={13} strokeWidth={2} className="mr-1 inline" />
          Reset to default
        </TRNButton>
      </div>
    </CourseInspectorCard>
  );
}
