import { TRNFormSection } from "../../ui/TRN/TRNForm";
import { TRNHintText } from "../../ui/TRN/TRNHintText";
import { KonvaShapeStyleControls } from "./KonvaShapeStyleControls";
import { konvaShapeTypeLabel } from "./konvaShapeStylePresets";
import { useKonvaShapeStyleEditor } from "./useKonvaShapeStyleEditor";

export function CourseKonvaShapeStylePanel({
  diagramId,
  selectedShapeId,
  selectedShapeType,
}: {
  diagramId: string;
  selectedShapeId: string | null;
  selectedShapeType?: string;
}) {
  const { shape, patchShape, hasStroke, hasFill, isText, isGroup, hasCornerRadius, hasConnector } =
    useKonvaShapeStyleEditor(
    diagramId,
    selectedShapeId,
  );

  if (selectedShapeId == null) {
    return (
      <TRNFormSection title="Selected shape">
        <TRNHintText>
          Select a shape on the Diagram canvas. Quick edits also appear in the floating panel on the
          canvas.
        </TRNHintText>
      </TRNFormSection>
    );
  }

  if (shape == null) {
    return (
      <TRNFormSection title="Selected shape">
        <TRNHintText>Selected shape is not in the current diagram draft.</TRNHintText>
      </TRNFormSection>
    );
  }

  return (
    <TRNFormSection title="Selected shape">
      <div className="course-konva-style-inspector-header">
        <span className="course-konva-style-inspector-header__title">
          {konvaShapeTypeLabel(selectedShapeType ?? shape.type)}
        </span>
        <span className="course-konva-style-inspector-header__id">{selectedShapeId}</span>
      </div>
      <KonvaShapeStyleControls
        layout="inspector"
        shapeId={selectedShapeId}
        shape={shape}
        patchShape={patchShape}
        hasStroke={hasStroke}
        hasFill={hasFill}
        isText={isText}
        isGroup={isGroup}
        groupChildCount={shape.type === "group" ? shape.children.length : 0}
        hasCornerRadius={hasCornerRadius}
        hasConnector={hasConnector}
      />
    </TRNFormSection>
  );
}
