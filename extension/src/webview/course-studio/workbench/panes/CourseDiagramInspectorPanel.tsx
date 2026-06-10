import { TRNFormSection } from "../../../ui/TRN/TRNForm";import { TRNHintText } from "../../../ui/TRN/TRNHintText";
import { TRNInlineToggleRow } from "../../../ui/TRN/TRNInlineToggleRow";
import { loadCourseDiagram } from "../../content/diagramRegistry";
import { CourseDiagram3dCameraFields } from "../../maintainer/CourseDiagram3dCameraFields";
import { CourseDiagram3dNodeInspector } from "../../maintainer/CourseDiagram3dNodeInspector";
import { CourseDiagram3dSceneOutliner } from "../../maintainer/CourseDiagram3dSceneOutliner";
import { Diagram3dViewportFields } from "../../maintainer/Diagram3dViewportFields";
import { CourseDiagramNodeInspector } from "../../maintainer/CourseDiagramNodeInspector";
import { CourseKonvaDiagramInspectorSections } from "../../maintainer/CourseKonvaDiagramInspectorSections";
import { useCoursePageEditorStore } from "../../maintainer/useCoursePageEditorStore";
import { useCourseDiagramEditorStore } from "../../maintainer/useCourseDiagramEditorStore";
import { diagramHas3dLayer } from "../../schemas/normalizeDiagramV1";
import { useCourseDiagramWorkbenchUiStore } from "../course-diagram-workbench-ui.store";
import { COURSE_WORKBENCH_PANE_LABELS } from "../course-workbench-pane-labels";
import { CourseDiagramBlockInspectorFields } from "./CourseDiagramBlockInspectorFields";

export function CourseDiagramInspectorPanel() {
  const page = useCoursePageEditorStore((s) => s.page);
  const selectedBlockId = useCoursePageEditorStore((s) => s.selectedBlockId);
  const editorPlane = useCourseDiagramWorkbenchUiStore((s) => s.editorPlane);
  const setEditorPlane = useCourseDiagramWorkbenchUiStore((s) => s.setEditorPlane);
  const selectedKonvaShapeId = useCourseDiagramWorkbenchUiStore((s) => s.selectedKonvaShapeId);
  const selectedKonvaShapeType = useCourseDiagramWorkbenchUiStore((s) => s.selectedKonvaShapeType);

  const block =
    page?.blocks.find((entry) => entry.id === selectedBlockId && entry.kind === "diagram-2d") ??
    null;
  const diagramId = block?.diagramId;
  const draft = useCourseDiagramEditorStore((s) =>
    diagramId != null ? s.drafts[diagramId] : undefined,
  );
  const diagram = draft ?? (diagramId != null ? loadCourseDiagram(diagramId) : null);

  if (block == null || diagramId == null) {
    return (
      <TRNFormSection title="Diagram" showHeading={false} className="border-dashed">
        <TRNHintText>
          Select a diagram-2d block on the {COURSE_WORKBENCH_PANE_LABELS.content}, or add one from
          Page → Add block.
        </TRNHintText>
      </TRNFormSection>
    );
  }

  if (diagram == null) {
    return (
      <TRNFormSection title="Diagram" showHeading={false} className="border-dashed">
        <TRNHintText>Diagram "{diagramId}" is not registered.</TRNHintText>
      </TRNFormSection>
    );
  }

  const hasSvgLayer = diagram.nodes.length > 0;

  return (
    <div className="flex flex-col gap-3">
      <TRNFormSection title="Block">
        <CourseDiagramBlockInspectorFields block={block} />
      </TRNFormSection>

      {hasSvgLayer ? (
        <TRNInlineToggleRow
          label="SVG data layer"
          hint="Show legacy SVG node inspector alongside the Konva canvas."
          checked={editorPlane === "live"}
          onCheckedChange={(checked) => setEditorPlane(checked ? "live" : "draw")}
          ariaLabel="Show legacy SVG data layer in inspector"
        />
      ) : null}

      {editorPlane === "draw" ? (
        <CourseKonvaDiagramInspectorSections
          diagramId={diagramId}
          selectedShapeId={selectedKonvaShapeId}
          selectedShapeType={selectedKonvaShapeType}
        />
      ) : (
        <>
          {diagram.nodes.length > 0 ? (
            <TRNFormSection title="SVG nodes">
              <CourseDiagramNodeInspector diagramId={diagramId} diagram={diagram} />
            </TRNFormSection>
          ) : (
            <TRNHintText>
              No SVG data layer on this diagram. Use Konva shapes with data bindings above, or
              duplicate the MEMS pilot for telemetry-bound SVG nodes.
            </TRNHintText>
          )}
          {diagramHas3dLayer(diagram) ? (
            <>
              <CourseDiagram3dCameraFields diagramId={diagramId} diagram={diagram} />
              <Diagram3dViewportFields idPrefix={`${diagramId}-viewport`} />
              <CourseDiagram3dSceneOutliner diagramId={diagramId} diagram={diagram} />
              <CourseDiagram3dNodeInspector diagramId={diagramId} diagram={diagram} />
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
