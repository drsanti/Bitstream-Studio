import type { SceneV1 } from "../schemas/scene.v1";
import { sceneV1ToDiagramV1 } from "../runtime/scene/sceneDiagramBridge";
import { CourseDiagram3dViewportToolbar } from "./CourseDiagram3dViewportToolbar";
import type { Diagram3dTransformGizmoMode } from "../runtime/diagram/diagram3dGizmoHelpers";

export function CourseScene3dViewportToolbar({
  scene,
  selectedNodeId,
  gizmoMode,
  onGizmoModeChange,
  onClearSelection,
  onResetCamera,
  onSaveCameraView,
}: {
  scene: SceneV1;
  selectedNodeId: string | null;
  gizmoMode?: Diagram3dTransformGizmoMode;
  onGizmoModeChange?: (mode: Diagram3dTransformGizmoMode) => void;
  onClearSelection?: () => void;
  onResetCamera?: () => void;
  onSaveCameraView?: () => void;
}) {
  return (
    <CourseDiagram3dViewportToolbar
      diagram={sceneV1ToDiagramV1(scene)}
      selectedNodeId={selectedNodeId}
      gizmoMode={gizmoMode}
      onGizmoModeChange={onGizmoModeChange}
      onClearSelection={onClearSelection}
      onResetCamera={onResetCamera}
      onSaveCameraView={onSaveCameraView}
    />
  );
}
