import { TRNFormSection } from "../../../ui/TRN/TRNForm";
import { TRNHintText } from "../../../ui/TRN/TRNHintText";
import { ensureCourseSceneDraft, loadCourseScene } from "../../content/sceneRegistry";
import { CourseScene3dBlockInspectorFields } from "../../maintainer/CourseScene3dBlockFields";
import { CourseSceneCameraFields } from "../../maintainer/CourseSceneCameraFields";
import { CourseSceneDocumentFields } from "../../maintainer/CourseSceneDocumentFields";
import { CourseSceneEnvironmentFields } from "../../maintainer/CourseSceneEnvironmentFields";
import { CourseSceneNodeInspector } from "../../maintainer/CourseSceneNodeInspector";
import { CourseSceneOutliner } from "../../maintainer/CourseSceneOutliner";
import { Diagram3dViewportFields } from "../../maintainer/Diagram3dViewportFields";
import { useCourseSceneEditorStore } from "../../maintainer/useCourseSceneEditorStore";
import { CourseBlockPlacementInspectorCard } from "../../maintainer/CourseBlockPlacementStrip";
import { useCoursePageEditorStore } from "../../maintainer/useCoursePageEditorStore";
import { COURSE_WORKBENCH_PANE_LABELS } from "../course-workbench-pane-labels";

export function CourseScene3dInspectorPanel() {
  const page = useCoursePageEditorStore((s) => s.page);
  const selectedBlockId = useCoursePageEditorStore((s) => s.selectedBlockId);

  const block =
    page?.blocks.find((entry) => entry.id === selectedBlockId && entry.kind === "scene-3d") ??
    null;

  if (block != null) {
    ensureCourseSceneDraft(block.documentId);
  }

  const sceneDraft = useCourseSceneEditorStore((s) =>
    block != null ? s.drafts[block.documentId] : undefined,
  );
  const scene =
    block != null ? (sceneDraft ?? loadCourseScene(block.documentId)) : null;

  if (block == null || scene == null) {
    return (
      <TRNFormSection title="3D Scene" showHeading={false} className="border-dashed">
        <TRNHintText>
          Select a 3D Scene block on the {COURSE_WORKBENCH_PANE_LABELS.content} to edit scene
          hierarchy, models, and camera.
        </TRNHintText>
      </TRNFormSection>
    );
  }

  return (
    <div className="course-scene-3d-inspector flex flex-col gap-3">
      <CourseScene3dBlockInspectorFields block={block} />
      <CourseBlockPlacementInspectorCard block={block} />
      <CourseSceneDocumentFields documentId={block.documentId} scene={scene} />
      <CourseSceneOutliner documentId={block.documentId} scene={scene} />
      <CourseSceneNodeInspector documentId={block.documentId} scene={scene} />
      <CourseSceneCameraFields documentId={block.documentId} scene={scene} />
      <CourseSceneEnvironmentFields documentId={block.documentId} scene={scene} />
      <Diagram3dViewportFields idPrefix={`${block.documentId}-viewport`} />
    </div>
  );
}
