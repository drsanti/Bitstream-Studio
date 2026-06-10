import { Link2 } from "lucide-react";
import { TRNFormField, TRNFormSection } from "../../ui/TRN/TRNForm";
import { TRNHintText } from "../../ui/TRN/TRNHintText";
import { TRNSelect } from "../../ui/TRN/TRNSelect";
import type { DiagramBindingV1, NumericPropV1, Vec3PropV1 } from "../schemas/diagram.v1";
import { diagramBindingSelectOptions } from "../runtime/diagram/diagramBindingCatalog";
import { CourseInspectorCard, COURSE_INSPECTOR_CARD_ICON_CLASS } from "./CourseInspectorCard";
import { DiagramMapOpChainFields } from "./DiagramMapOpChainFields";
import { useDiagram3dDocumentEditor } from "./diagram3dDocumentEditorContext";

const AXIS_LABELS = ["x", "y", "z"] as const;
const POSITION_PATCH_KEYS = {
  x: "positionX",
  y: "positionY",
  z: "positionZ",
} as const;
const SCALE_PATCH_KEYS = {
  x: "scaleX",
  y: "scaleY",
  z: "scaleZ",
} as const;

function readNumericBinding(prop: NumericPropV1 | undefined): DiagramBindingV1 | null {
  if (prop != null && typeof prop !== "number" && prop.binding != null) {
    return prop.binding;
  }
  return null;
}

function AxisBindingRow({
  nodeId,
  axis,
  label,
  binding,
  onPatch,
}: {
  nodeId: string;
  axis: "x" | "y" | "z";
  label: string;
  binding: DiagramBindingV1 | null;
  onPatch: (next: NumericPropV1 | undefined) => void;
}) {
  return (
    <TRNFormSection title={`${label} (${axis})`} showHeading>
      <TRNFormField id={`${nodeId}-bind-${label}-${axis}`} label="Source">
        <TRNSelect
          value={binding?.path ?? "__static__"}
          ariaLabel={`${label} ${axis} binding`}
          options={[
            { value: "__static__", label: "Static value" },
            ...diagramBindingSelectOptions(),
          ]}
          onValueChange={(value) => {
            if (value === "__static__") {
              onPatch(0);
              return;
            }
            onPatch({
              base: 0,
              mode: "add",
              binding: { path: value, fallback: 0, map: binding?.map },
            });
          }}
        />
      </TRNFormField>
      {binding != null ? (
        <DiagramMapOpChainFields
          idPrefix={`${nodeId}-${label}-${axis}-map`}
          binding={binding}
          onChange={(next) =>
            onPatch({
              base: 0,
              mode: "add",
              binding: next,
            })
          }
        />
      ) : null}
    </TRNFormSection>
  );
}

export function Diagram3dPropertyBindingsFields({
  diagramId,
  nodeId,
  position,
  scale,
}: {
  diagramId: string;
  nodeId: string;
  position?: Vec3PropV1;
  scale?: Vec3PropV1;
}) {
  const { patchNode } = useDiagram3dDocumentEditor(diagramId);

  return (
    <CourseInspectorCard
      title="Data bindings"
      hint="Drive position or scale axes from live telemetry paths."
      titleIcon={<Link2 className={COURSE_INSPECTOR_CARD_ICON_CLASS} aria-hidden />}
      defaultExpanded={false}
    >
      <div className="flex flex-col gap-3">
        <TRNHintText className="text-[10px]!">
          Bind individual axes to sensor paths (e.g. <code className="text-2xs">bmi270.ax</code>).
          Rotation bindings stay in the Rotation card.
        </TRNHintText>

        <TRNFormSection title="Position" showHeading>
          {AXIS_LABELS.map((axis) => (
            <AxisBindingRow
              key={`pos-${axis}`}
              nodeId={nodeId}
              axis={axis}
              label="position"
              binding={readNumericBinding(position?.[axis])}
              onPatch={(next) =>
                patchNode(nodeId, { [POSITION_PATCH_KEYS[axis]]: next } as {
                  positionX?: NumericPropV1;
                  positionY?: NumericPropV1;
                  positionZ?: NumericPropV1;
                })
              }
            />
          ))}
        </TRNFormSection>

        <TRNFormSection title="Scale" showHeading>
          {AXIS_LABELS.map((axis) => (
            <AxisBindingRow
              key={`scale-${axis}`}
              nodeId={nodeId}
              axis={axis}
              label="scale"
              binding={readNumericBinding(scale?.[axis])}
              onPatch={(next) =>
                patchNode(nodeId, { [SCALE_PATCH_KEYS[axis]]: next } as {
                  scaleX?: NumericPropV1;
                  scaleY?: NumericPropV1;
                  scaleZ?: NumericPropV1;
                })
              }
            />
          ))}
        </TRNFormSection>
      </div>
    </CourseInspectorCard>
  );
}
