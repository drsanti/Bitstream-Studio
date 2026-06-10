import { TRNFormField, TRNFormSection } from "../../ui/TRN/TRNForm";
import { TRNHintText } from "../../ui/TRN/TRNHintText";
import { TRNSelect } from "../../ui/TRN/TRNSelect";
import type { DiagramBindingV1 } from "../schemas/diagram.v1";
import {
  KONVA_NUMERIC_BINDABLE_PROPERTIES,
  KONVA_TEXT_BINDABLE_PROPERTY,
} from "../schemas/konvaPropertyBindings";
import { diagramBindingSelectOptions } from "../runtime/diagram/diagramBindingCatalog";
import { DiagramMapOpChainFields } from "./DiagramMapOpChainFields";
import { useCourseDiagramEditorStore } from "./useCourseDiagramEditorStore";
import { COURSE_WORKBENCH_PANE_LABELS } from "../workbench/course-workbench-pane-labels";

const PROPERTY_OPTIONS = [
  ...KONVA_NUMERIC_BINDABLE_PROPERTIES.map((property) => ({
    value: property,
    label: property,
  })),
  { value: KONVA_TEXT_BINDABLE_PROPERTY, label: "text (live label)" },
  { value: "visible", label: "visible (live gate)" },
];

function defaultNumericBinding(path: string): {
  base: number;
  mode: "add";
  binding: DiagramBindingV1;
} {
  return {
    base: 0,
    mode: "add",
    binding: { path, fallback: 0 },
  };
}

export function CourseKonvaBindingsPanel({
  diagramId,
  selectedShapeId,
  selectedShapeType,
}: {
  diagramId: string;
  selectedShapeId: string | null;
  selectedShapeType?: string;
}) {
  const draft = useCourseDiagramEditorStore((s) => s.drafts[diagramId]);
  const patchKonvaPropertyBinding = useCourseDiagramEditorStore((s) => s.patchKonvaPropertyBinding);
  const bindings = draft?.freeform?.propertyBindings ?? {};

  if (selectedShapeId == null) {
    return (
      <div className="flex flex-col gap-2 p-2.5">
        <TRNHintText>
          Select a shape on the canvas, then bind any property — position, size, opacity, text, and
          more — to live sensor data. Use toolbar <strong>Simulator</strong> or <strong>Bitstream</strong>{" "}
          mode so the {COURSE_WORKBENCH_PANE_LABELS.content} preview shows live motion.
        </TRNHintText>
      </div>
    );
  }

  const shapeBindings = bindings[selectedShapeId] ?? {};
  const boundProperties = Object.keys(shapeBindings);

  return (
    <div className="flex flex-col gap-2 overflow-y-auto p-2.5 scrollbar-hide course-workbench-pane-scroll min-h-0">
      <TRNFormSection title="Data bindings">
        <TRNHintText>
          Any property can be driven by telemetry (e.g. <code className="text-2xs">bmi270.ax</code>)
          or bridge state. Layout edits stay on the canvas; live values apply at preview/runtime.
        </TRNHintText>
        <div className="text-2xs text-[var(--text-muted)]">
          Shape <span className="text-[var(--text-primary)]">{selectedShapeId}</span>
          {selectedShapeType != null ? ` · ${selectedShapeType}` : null}
        </div>
      </TRNFormSection>

      {boundProperties.map((property) => {
        const spec = shapeBindings[property];
        if (spec == null) {
          return null;
        }
        const isText = property === KONVA_TEXT_BINDABLE_PROPERTY;
        const isGate = property === "visible";

        return (
          <div
            key={property}
            className="flex flex-col gap-2 rounded-md border border-[var(--surface-border)] p-2"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-2xs font-semibold text-[var(--text-primary)]">{property}</span>
              <button
                type="button"
                className="text-2xs text-[var(--text-muted)] hover:text-red-400"
                onClick={() =>
                  patchKonvaPropertyBinding(diagramId, selectedShapeId, property, null)
                }
              >
                Remove
              </button>
            </div>
            {isText && typeof spec === "object" && "binding" in spec ? (
              <>
                <TRNFormField id={`${selectedShapeId}-${property}-path`} label="Data path">
                  <TRNSelect
                    value={spec.binding.path}
                    ariaLabel={`${property} binding path`}
                    options={diagramBindingSelectOptions()}
                    onValueChange={(path) =>
                      patchKonvaPropertyBinding(diagramId, selectedShapeId, property, {
                        ...spec,
                        binding: { ...spec.binding, path },
                      })
                    }
                  />
                </TRNFormField>
                <DiagramMapOpChainFields
                  idPrefix={`${selectedShapeId}-${property}`}
                  binding={spec.binding}
                  onChange={(binding) =>
                    patchKonvaPropertyBinding(diagramId, selectedShapeId, property, {
                      ...spec,
                      binding,
                    })
                  }
                />
              </>
            ) : isGate && typeof spec === "object" && "path" in spec ? (
              <>
                <TRNFormField id={`${selectedShapeId}-${property}-path`} label="Visible when">
                  <TRNSelect
                    value={spec.path}
                    ariaLabel={`${property} gate path`}
                    options={diagramBindingSelectOptions()}
                    onValueChange={(path) =>
                      patchKonvaPropertyBinding(diagramId, selectedShapeId, property, {
                        ...spec,
                        path,
                      })
                    }
                  />
                </TRNFormField>
                <DiagramMapOpChainFields
                  idPrefix={`${selectedShapeId}-${property}`}
                  binding={spec}
                  onChange={(binding) =>
                    patchKonvaPropertyBinding(diagramId, selectedShapeId, property, binding)
                  }
                />
              </>
            ) : typeof spec === "object" && "binding" in spec ? (
              <>
                <TRNFormField id={`${selectedShapeId}-${property}-path`} label="Data path">
                  <TRNSelect
                    value={spec.binding.path}
                    ariaLabel={`${property} binding path`}
                    options={diagramBindingSelectOptions()}
                    onValueChange={(path) =>
                      patchKonvaPropertyBinding(
                        diagramId,
                        selectedShapeId,
                        property,
                        defaultNumericBinding(path),
                      )
                    }
                  />
                </TRNFormField>
                <DiagramMapOpChainFields
                  idPrefix={`${selectedShapeId}-${property}`}
                  binding={spec.binding}
                  onChange={(binding) =>
                    patchKonvaPropertyBinding(diagramId, selectedShapeId, property, {
                      ...spec,
                      binding,
                    })
                  }
                />
              </>
            ) : null}
          </div>
        );
      })}

      <TRNFormField id={`${selectedShapeId}-add-binding`} label="Add property binding">
        <TRNSelect
          value="__pick__"
          ariaLabel="Property to bind"
          options={[
            { value: "__pick__", label: "Choose property…" },
            ...PROPERTY_OPTIONS.filter((option) => !boundProperties.includes(option.value)),
          ]}
          onValueChange={(property) => {
            if (property === "__pick__") {
              return;
            }
            if (property === KONVA_TEXT_BINDABLE_PROPERTY) {
              patchKonvaPropertyBinding(diagramId, selectedShapeId, property, {
                binding: { path: "bmi270.ax", format: "0.000", unit: "g", fallback: 0 },
              });
              return;
            }
            if (property === "visible") {
              patchKonvaPropertyBinding(diagramId, selectedShapeId, property, {
                path: "bmi270.hasSample",
                fallback: 0,
              });
              return;
            }
            patchKonvaPropertyBinding(
              diagramId,
              selectedShapeId,
              property,
              defaultNumericBinding("bmi270.ax"),
            );
          }}
        />
      </TRNFormField>
    </div>
  );
}
