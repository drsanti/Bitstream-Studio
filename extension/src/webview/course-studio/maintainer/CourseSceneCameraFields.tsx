import { RotateCcw, Video } from "lucide-react";
import { CourseMaintainerScrubNumberInput } from "./CourseMaintainerScrubNumberInput";
import { TRNButton } from "../../ui/TRN/TRNButton";
import { TRNFormField } from "../../ui/TRN/TRNForm";
import { TRNHintText } from "../../ui/TRN/TRNHintText";
import type { SceneV1 } from "../schemas/scene.v1";
import { readDiagram3dCamera } from "../runtime/diagram/diagram3dCamera";
import { sceneV1ToDiagramV1 } from "../runtime/scene/sceneDiagramBridge";
import { CourseInspectorCard, COURSE_INSPECTOR_CARD_ICON_CLASS } from "./CourseInspectorCard";
import { useCourseSceneEditorStore } from "./useCourseSceneEditorStore";

export function CourseSceneCameraFields({
  documentId,
  scene,
}: {
  documentId: string;
  scene: SceneV1;
}) {
  const patchCamera = useCourseSceneEditorStore((s) => s.patchCamera);
  const resetCamera = useCourseSceneEditorStore((s) => s.resetCamera);
  const camera = readDiagram3dCamera(sceneV1ToDiagramV1(scene));

  return (
    <CourseInspectorCard
      title="Default camera"
      hint="Saved with the scene document. Reset camera in the viewport restores these values."
      titleIcon={<Video className={COURSE_INSPECTOR_CARD_ICON_CLASS} aria-hidden />}
      defaultExpanded={false}
    >
      <div className="flex flex-col gap-2">
        <TRNHintText>
          Orbit pan/zoom is session-only. Use viewport Save view or edit fields below to persist the
          default camera on this 3D Scene Block.
        </TRNHintText>
        <div className="grid grid-cols-3 gap-2">
          {(["x", "y", "z"] as const).map((axis, index) => (
            <TRNFormField
              key={axis}
              id={`${documentId}-camera-pos-${axis}`}
              label={`Pos ${axis.toUpperCase()}`}
            >
              <CourseMaintainerScrubNumberInput
                value={camera.position[index]}
                step={0.1}
                onChange={(value) =>
                  patchCamera(documentId, {
                    [`position${axis.toUpperCase()}` as "positionX"]: value,
                  })
                }
              />
            </TRNFormField>
          ))}
        </div>
        <TRNFormField id={`${documentId}-camera-fov`} label="Field of view">
          <CourseMaintainerScrubNumberInput
            value={camera.fov}
            min={20}
            max={90}
            step={1}
            onChange={(value) => patchCamera(documentId, { fov: value })}
          />
        </TRNFormField>
        <TRNButton
          size="compact"
          className="self-start"
          hint="Restore scene default camera (3, 2.5, 4 · FOV 45)"
          onClick={() => resetCamera(documentId)}
        >
          <RotateCcw size={13} strokeWidth={2} className="mr-1 inline" />
          Reset to default
        </TRNButton>
      </div>
    </CourseInspectorCard>
  );
}
