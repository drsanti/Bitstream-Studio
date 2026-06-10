import { RotateCw } from "lucide-react";
import { CourseMaintainerScrubNumberInput } from "./CourseMaintainerScrubNumberInput";
import { TRNFormField, TRNFormSection } from "../../ui/TRN/TRNForm";
import { TRNHintText } from "../../ui/TRN/TRNHintText";
import { TRNSelect } from "../../ui/TRN/TRNSelect";
import type { Diagram3dRotationV1, DiagramBindingV1 } from "../schemas/diagram.v1";
import { diagramBindingSelectOptions } from "../runtime/diagram/diagramBindingCatalog";
import { defaultBmi270QuaternionRotation } from "../runtime/diagram/diagram3dNodeMutations";
import { canDiagram3dNodeUseRotateGizmo } from "../runtime/diagram/diagram3dGizmoHelpers";
import { CourseInspectorCard, COURSE_INSPECTOR_CARD_ICON_CLASS } from "./CourseInspectorCard";
import { DiagramMapOpChainFields } from "./DiagramMapOpChainFields";
import { useDiagram3dDocumentEditor } from "./diagram3dDocumentEditorContext";

const FUSION_BINDING_OPTIONS = diagramBindingSelectOptions(false).filter((entry) =>
  entry.value.startsWith("bmi270."),
);

type RotationMode = "none" | "quaternion" | "euler-static" | "euler-live";

function readRotationMode(rotation: Diagram3dRotationV1 | undefined): RotationMode {
  if (rotation == null) {
    return "none";
  }
  if (Array.isArray(rotation)) {
    return "euler-static";
  }
  return rotation.kind === "euler" ? "euler-live" : "quaternion";
}

export function Diagram3dRotationFields({
  diagramId,
  nodeId,
  rotation,
}: {
  diagramId: string;
  nodeId: string;
  rotation: Diagram3dRotationV1 | undefined;
}) {
  const { patchNode } = useDiagram3dDocumentEditor(diagramId);
  const mode = readRotationMode(rotation);
  const rotateGizmoAllowed = canDiagram3dNodeUseRotateGizmo(rotation);

  return (
    <CourseInspectorCard
      title="Rotation"
      hint="Static euler for gizmo rotate; live bindings drive runtime orientation."
      titleIcon={<RotateCw className={COURSE_INSPECTOR_CARD_ICON_CLASS} aria-hidden />}
      defaultExpanded={mode !== "none"}
    >
      <div className="flex flex-col gap-3">
        <TRNFormField id={`${nodeId}-rotation-mode`} label="Mode">
          <TRNSelect
            value={mode}
            ariaLabel="3D rotation mode"
            options={[
              { value: "none", label: "None (identity)" },
              { value: "quaternion", label: "Live quaternion (BMI270)" },
              { value: "euler-static", label: "Static euler (degrees)" },
              { value: "euler-live", label: "Live euler bindings" },
            ]}
            onValueChange={(next) => {
              if (next === "none") {
                patchNode(nodeId, { rotation: null });
                return;
              }
              if (next === "quaternion") {
                patchNode(nodeId, { rotation: defaultBmi270QuaternionRotation() });
                return;
              }
              if (next === "euler-static") {
                patchNode(nodeId, { rotation: [0, 0, 0] });
                return;
              }
              patchNode(nodeId, {
                rotation: {
                  kind: "euler",
                  pitch: { path: "bmi270.pitch", fallback: 0 },
                  roll: { path: "bmi270.roll", fallback: 0 },
                },
              });
            }}
          />
        </TRNFormField>

        {mode !== "none" && !rotateGizmoAllowed ? (
          <TRNHintText className="!text-[10px]">
            Rotate gizmo (R) is disabled while live telemetry bindings drive orientation.
          </TRNHintText>
        ) : null}

        {mode === "euler-static" && Array.isArray(rotation) ? (
          <TRNFormSection title="Angles (°)" showHeading>
            <div className="grid grid-cols-3 gap-2">
              {(["pitch", "yaw", "roll"] as const).map((label, index) => (
                <TRNFormField key={label} id={`${nodeId}-${label}`} label={label}>
                  <CourseMaintainerScrubNumberInput
                    value={rotation[index] ?? 0}
                    step={1}
                    onChange={(value) => {
                      const next: [number, number, number] = [...rotation];
                      next[index] = value;
                      patchNode(nodeId, { rotation: next });
                    }}
                  />
                </TRNFormField>
              ))}
            </div>
          </TRNFormSection>
        ) : null}

        {mode === "quaternion" &&
        rotation != null &&
        !Array.isArray(rotation) &&
        rotation.kind === "quaternion" ? (
          <>
            <TRNHintText className="!text-[10px]">
              Bound to{" "}
              {(["qw", "qx", "qy", "qz"] as const)
                .map((key) => rotation.bindings[key].path)
                .join(", ")}
              . Adjust MapOp per component below.
            </TRNHintText>
            {(["qw", "qx", "qy", "qz"] as const).map((key) => (
              <TRNFormSection key={key} title={key} showHeading>
                <DiagramMapOpChainFields
                  idPrefix={`${nodeId}-${key}`}
                  binding={rotation.bindings[key]}
                  onChange={(next: DiagramBindingV1) => {
                    if (rotation.kind !== "quaternion") {
                      return;
                    }
                    patchNode(nodeId, {
                      rotation: {
                        ...rotation,
                        bindings: { ...rotation.bindings, [key]: next },
                      },
                    });
                  }}
                />
              </TRNFormSection>
            ))}
          </>
        ) : null}

        {mode === "euler-live" &&
        rotation != null &&
        !Array.isArray(rotation) &&
        rotation.kind === "euler" ? (
          <div className="flex flex-col gap-3">
            {(["pitch", "yaw", "roll"] as const).map((axis) => {
              const prop = rotation[axis];
              const binding =
                typeof prop === "object" && prop != null && "binding" in prop ? prop.binding : null;
              const path = binding?.path ?? null;
              return (
                <TRNFormSection key={axis} title={`${axis} binding`} showHeading>
                  <TRNFormField id={`${nodeId}-${axis}-bind`} label="Source">
                    <TRNSelect
                      value={path ?? "__static__"}
                      ariaLabel={`${axis} euler binding`}
                      options={[
                        { value: "__static__", label: "Static 0" },
                        ...FUSION_BINDING_OPTIONS,
                      ]}
                      onValueChange={(value) => {
                        const current = rotation;
                        if (current.kind !== "euler") {
                          return;
                        }
                        patchNode(nodeId, {
                          rotation: {
                            ...current,
                            [axis]:
                              value === "__static__"
                                ? 0
                                : {
                                    binding: {
                                      path: value,
                                      fallback: 0,
                                      map: binding?.map,
                                    },
                                  },
                          },
                        });
                      }}
                    />
                  </TRNFormField>
                  {binding != null ? (
                    <DiagramMapOpChainFields
                      idPrefix={`${nodeId}-${axis}-map`}
                      binding={binding}
                      onChange={(next) => {
                        const current = rotation;
                        if (current.kind !== "euler") {
                          return;
                        }
                        patchNode(nodeId, {
                          rotation: { ...current, [axis]: { binding: next } },
                        });
                      }}
                    />
                  ) : null}
                </TRNFormSection>
              );
            })}
          </div>
        ) : null}
      </div>
    </CourseInspectorCard>
  );
}
