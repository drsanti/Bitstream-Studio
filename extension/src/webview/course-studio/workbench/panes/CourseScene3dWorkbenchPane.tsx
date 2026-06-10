import { TRNHintText } from "../../../ui/TRN/TRNHintText";
import { ensureCourseSceneDraft, loadCourseScene } from "../../content/sceneRegistry";
import { CourseSceneDocumentMenu } from "../../maintainer/CourseSceneDocumentMenu";
import { CourseSceneEditorViewport } from "../../maintainer/CourseSceneEditorViewport";
import { scene3dBlockWorkbenchLabel } from "../../maintainer/scene3dBlockWorkbenchLabel";
import { useCourseSceneEditorStore } from "../../maintainer/useCourseSceneEditorStore";
import { useCoursePageEditorStore } from "../../maintainer/useCoursePageEditorStore";
import {
  isCourseStudioMaintainerModeAvailable,
  useCourseStudioMaintainerModeEnabled,
} from "../../maintainer/courseStudioMaintainerMode";
import { CourseScene3dWorkbenchPaneEmpty } from "./CourseScene3dWorkbenchPaneEmpty";
import { CourseWorkbenchPaneEmpty } from "./CourseWorkbenchPaneEmpty";

export function CourseScene3dWorkbenchPane() {
  const page = useCoursePageEditorStore((s) => s.page);
  const selectedBlockId = useCoursePageEditorStore((s) => s.selectedBlockId);
  const maintainer = useCourseStudioMaintainerModeEnabled();
  const maintainerAvailable = isCourseStudioMaintainerModeAvailable();

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

  if (!maintainerAvailable || !maintainer) {
    return (
      <CourseWorkbenchPaneEmpty
        title="3D Scene Editor"
        hint="Enable Maintainer mode and select a 3D Scene block to edit models, transforms, and camera."
      />
    );
  }

  if (page == null) {
    return <CourseWorkbenchPaneEmpty title="3D Scene Editor" hint="No page loaded." />;
  }

  if (block == null) {
    return <CourseScene3dWorkbenchPaneEmpty page={page} />;
  }

  if (scene == null) {
    return (
      <CourseWorkbenchPaneEmpty
        title="3D Scene Editor"
        hint={`Scene document "${block.documentId}" is not registered.`}
      />
    );
  }

  return (
    <div className="course-workbench-scene-pane flex h-full min-h-0 flex-col px-2.5 pb-3 pt-2">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="text-[11px] font-semibold text-[var(--text-primary)]">3D Scene Editor</p>
          <TRNHintText>
            Editing <strong>{scene3dBlockWorkbenchLabel(block)}</strong> — Shift+A or right-click
            to add objects; 1 / 3 / 7 / 9 (numpad or number row) for view snaps; bindings and
            camera in the Inspector.
          </TRNHintText>
        </div>
        <CourseSceneDocumentMenu documentId={block.documentId} scene={scene} />
      </div>
      <CourseSceneEditorViewport
        documentId={block.documentId}
        scene={scene}
        className="min-h-0 flex-1"
      />
    </div>
  );
}
