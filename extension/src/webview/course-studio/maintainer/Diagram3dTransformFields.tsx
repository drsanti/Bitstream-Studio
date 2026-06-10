import { Move } from "lucide-react";
import { CourseMaintainerScrubNumberInput } from "./CourseMaintainerScrubNumberInput";
import { TRNFormField, TRNFormSection } from "../../ui/TRN/TRNForm";
import { TRNInlineToggleRow } from "../../ui/TRN/TRNInlineToggleRow";
import { TRNSelect } from "../../ui/TRN/TRNSelect";
import type { DiagramV1 } from "../schemas/diagram.v1";
import {
  findDiagram3dNodeParentId,
  listDiagram3dGroupIds,
  readDiagram3dScaleAxis,
} from "../runtime/diagram/diagram3dNodeMutations";
import { CourseInspectorCard, COURSE_INSPECTOR_CARD_ICON_CLASS } from "./CourseInspectorCard";
import { useDiagram3dDocumentEditor } from "./diagram3dDocumentEditorContext";

export function Diagram3dTransformFields({
  diagramId,
  diagram,
  nodeId,
  node,
}: {
  diagramId: string;
  diagram: DiagramV1;
  nodeId: string;
  node: {
    position?: { x?: number; y?: number; z?: number };
    scale?: { x?: number; y?: number; z?: number };
    opacity?: number;
    visible?: boolean;
  };
}) {
  const { patchNode, moveNode } = useDiagram3dDocumentEditor(diagramId);
  const parentId = findDiagram3dNodeParentId(diagram, nodeId);
  const groupIds = listDiagram3dGroupIds(diagram).filter((id) => id !== nodeId);

  return (
    <CourseInspectorCard
      title="Transform"
      hint="Position, scale, and visibility for the selected node."
      titleIcon={<Move className={COURSE_INSPECTOR_CARD_ICON_CLASS} aria-hidden />}
      defaultExpanded
    >
      <div className="flex flex-col gap-3">
        {parentId !== undefined ? (
          <TRNFormField id={`${nodeId}-parent-group`} label="Parent group">
            <TRNSelect
              value={parentId ?? "__root__"}
              ariaLabel="3D parent group"
              options={[
                { value: "__root__", label: "Scene root" },
                ...groupIds.map((id) => ({ value: id, label: id })),
              ]}
              onValueChange={(value) => {
                moveNode(nodeId, value === "__root__" ? null : value);
              }}
            />
          </TRNFormField>
        ) : null}

        <TRNFormSection title="Position" showHeading>
          <div className="grid grid-cols-3 gap-2">
            {(["x", "y", "z"] as const).map((axis) => (
              <TRNFormField key={axis} id={`${nodeId}-pos-${axis}`} label={axis.toUpperCase()}>
                <CourseMaintainerScrubNumberInput
                  value={typeof node.position?.[axis] === "number" ? node.position[axis] : 0}
                  step={0.1}
                  onChange={(value) =>
                    patchNode(nodeId, {
                      [`position${axis.toUpperCase()}` as "positionX"]: value,
                    })
                  }
                />
              </TRNFormField>
            ))}
          </div>
        </TRNFormSection>

        <TRNFormSection title="Scale" showHeading>
          <div className="grid grid-cols-3 gap-2">
            {(["x", "y", "z"] as const).map((axis) => (
              <TRNFormField key={axis} id={`${nodeId}-scale-${axis}`} label={axis.toUpperCase()}>
                <CourseMaintainerScrubNumberInput
                  value={readDiagram3dScaleAxis(node, axis)}
                  step={0.05}
                  min={0.01}
                  onChange={(value) =>
                    patchNode(nodeId, {
                      [`scale${axis.toUpperCase()}` as "scaleX"]: value,
                    })
                  }
                />
              </TRNFormField>
            ))}
          </div>
        </TRNFormSection>

        <TRNFormField id={`${nodeId}-opacity`} label="Opacity">
          <CourseMaintainerScrubNumberInput
            value={node.opacity ?? 1}
            step={0.05}
            min={0}
            max={1}
            onChange={(value) => patchNode(nodeId, { opacity: value })}
          />
        </TRNFormField>

        <TRNInlineToggleRow
          label="Visible"
          checked={node.visible !== false}
          onCheckedChange={(checked) => patchNode(nodeId, { visible: checked })}
          ariaLabel="3D node visible"
        />
      </div>
    </CourseInspectorCard>
  );
}
