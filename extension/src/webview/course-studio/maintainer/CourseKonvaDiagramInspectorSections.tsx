import { TRNFormSection } from "../../ui/TRN/TRNForm";
import { CourseKonvaBindingsPanel } from "./CourseKonvaBindingsPanel";
import { CourseKonvaShapeStylePanel } from "./CourseKonvaShapeStylePanel";
import { KonvaShapeOutliner } from "./KonvaShapeOutliner";

/** Shared diagram canvas inspector — shape chrome + telemetry bindings. */
export function CourseKonvaDiagramInspectorSections({
  diagramId,
  selectedShapeId,
  selectedShapeType,
}: {
  diagramId: string;
  selectedShapeId: string | null;
  selectedShapeType?: string;
}) {
  return (
    <>
      <KonvaShapeOutliner diagramId={diagramId} />
      <CourseKonvaShapeStylePanel
        diagramId={diagramId}
        selectedShapeId={selectedShapeId}
        selectedShapeType={selectedShapeType}
      />
      <TRNFormSection title="Data bindings" className="min-h-0 flex-1">
        <CourseKonvaBindingsPanel
          diagramId={diagramId}
          selectedShapeId={selectedShapeId}
          selectedShapeType={selectedShapeType}
        />
      </TRNFormSection>
    </>
  );
}
