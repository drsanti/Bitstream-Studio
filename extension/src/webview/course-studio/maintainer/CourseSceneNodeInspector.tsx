import type { SceneV1 } from "../schemas/scene.v1";
import { sceneV1ToDiagramV1 } from "../runtime/scene/sceneDiagramBridge";
import { CourseDiagram3dNodeInspector } from "./CourseDiagram3dNodeInspector";
import { Diagram3dSceneDocumentEditorProvider } from "./diagram3dDocumentEditorContext";

export function CourseSceneNodeInspector({
  documentId,
  scene,
}: {
  documentId: string;
  scene: SceneV1;
}) {
  return (
    <Diagram3dSceneDocumentEditorProvider documentId={documentId}>
      <CourseDiagram3dNodeInspector
        diagramId={documentId}
        diagram={sceneV1ToDiagramV1(scene)}
      />
    </Diagram3dSceneDocumentEditorProvider>
  );
}
