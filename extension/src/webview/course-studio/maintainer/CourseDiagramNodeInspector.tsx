import { Trash2, ArrowDown, ArrowUp, ChevronsDown, ChevronsUp } from "lucide-react";
import { CourseMaintainerScrubNumberInput } from "./CourseMaintainerScrubNumberInput";
import { TRNButton } from "../../ui/TRN/TRNButton";
import { TRNFormField, TRNFormSection } from "../../ui/TRN/TRNForm";
import { TRNHintText } from "../../ui/TRN/TRNHintText";
import { TRNInput } from "../../ui/TRN/TRNInput";
import { TRNSelect } from "../../ui/TRN/TRNSelect";
import type { DiagramBindingV1, DiagramV1, StyleTokenV1 } from "../schemas/diagram.v1";
import { DIAGRAM_STYLE_TOKEN_OPTIONS } from "../runtime/diagram/diagramStyleTokens";
import { DIAGRAM_BINDING_CATALOG, diagramBindingSelectOptions } from "../runtime/diagram/diagramBindingCatalog";
import { defaultQuadraticControl, hasConnectorCurve } from "../runtime/diagram/diagramConnectorPath";
import {
  defaultAccelYBinding,
  defaultPipelineFlowWhenBinding,
  defaultPipelineHighlightWhenBinding,
  diagramNodeZOrderState,
  findDiagramNode,
  isTopLevelDiagramNode,
  isStaticNumericProp,
  listDiagramNodes,
  readNumericBase,
} from "../runtime/diagram/diagramNodeMutations";
import { DiagramMapOpChainFields } from "./DiagramMapOpChainFields";
import { requestRemoveDiagramNode } from "./diagramNodeRemoval";
import { useCourseDiagramEditorStore } from "./useCourseDiagramEditorStore";

const BINDING_OPTIONS = diagramBindingSelectOptions(true);
const BINDING_PATH_OPTIONS = diagramBindingSelectOptions(false);

function DiagramNodePicker({
  diagramId,
  diagram,
  selectedNodeId,
}: {
  diagramId: string;
  diagram: DiagramV1;
  selectedNodeId: string | null;
}) {
  const setSelectedNodeId = useCourseDiagramEditorStore((s) => s.setSelectedNodeId);
  const entries = listDiagramNodes(diagram);

  return (
    <TRNFormField id={`${diagramId}-node-picker`} label="Select node">
      <TRNSelect
        value={selectedNodeId ?? "__none__"}
        ariaLabel="Diagram node picker"
        options={[
          { value: "__none__", label: "— click canvas or pick —" },
          ...entries.map((entry) => ({
            value: entry.id,
            label: `${entry.id} · ${entry.type}`,
          })),
        ]}
        onValueChange={(value) => {
          if (value !== "__none__") {
            setSelectedNodeId(diagramId, value);
          }
        }}
      />
    </TRNFormField>
  );
}

function ConnectorBindingFields({
  diagramId,
  nodeId,
  flowWhen,
  highlightWhen,
  highlightStroke,
}: {
  diagramId: string;
  nodeId: string;
  flowWhen?: DiagramBindingV1;
  highlightWhen?: DiagramBindingV1;
  highlightStroke?: StyleTokenV1;
}) {
  const patchNode = useCourseDiagramEditorStore((s) => s.patchNode);

  return (
    <div className="flex flex-col gap-2 rounded-md border border-dashed border-zinc-700/70 p-2">
      <div className="text-2xs font-semibold text-zinc-300">Pipeline bindings</div>
      <TRNFormField id={`${nodeId}-flow-when`} label="Flow when (live gate)">
        <TRNSelect
          value={flowWhen?.path ?? "__none__"}
          ariaLabel="Flow when binding"
          options={[
            { value: "__none__", label: "Always (dashed lines only)" },
            ...BINDING_PATH_OPTIONS,
          ]}
          onValueChange={(path) => {
            if (path === "__none__") {
              patchNode(diagramId, nodeId, { flowWhen: null });
              return;
            }
            patchNode(diagramId, nodeId, {
              flowWhen: { path, fallback: 0 },
            });
          }}
        />
      </TRNFormField>
      {flowWhen != null ? (
        <DiagramMapOpChainFields
          idPrefix={`${nodeId}-flow`}
          binding={flowWhen}
          onChange={(binding) => patchNode(diagramId, nodeId, { flowWhen: binding })}
        />
      ) : null}
      <TRNFormField id={`${nodeId}-highlight-when`} label="Highlight when">
        <TRNSelect
          value={highlightWhen?.path ?? "__none__"}
          ariaLabel="Highlight when binding"
          options={[
            { value: "__none__", label: "None" },
            ...BINDING_PATH_OPTIONS,
          ]}
          onValueChange={(path) => {
            if (path === "__none__") {
              patchNode(diagramId, nodeId, { highlightWhen: null });
              return;
            }
            patchNode(diagramId, nodeId, {
              highlightWhen:
                path === "bmi270.axAbs"
                  ? defaultPipelineHighlightWhenBinding()
                  : { path, fallback: 0 },
              highlightStroke: highlightStroke ?? "accent-cyan",
            });
          }}
        />
      </TRNFormField>
      {highlightWhen != null ? (
        <>
          <DiagramMapOpChainFields
            idPrefix={`${nodeId}-highlight`}
            binding={highlightWhen}
            onChange={(binding) => patchNode(diagramId, nodeId, { highlightWhen: binding })}
          />
          <StyleTokenField
            id={`${nodeId}-highlight-stroke`}
            label="Highlight stroke"
            value={highlightStroke ?? "accent-cyan"}
            onChange={(stroke) => patchNode(diagramId, nodeId, { highlightStroke: stroke })}
          />
        </>
      ) : null}
      <TRNButton
        size="compact"
        onClick={() =>
          patchNode(diagramId, nodeId, {
            flowWhen: defaultPipelineFlowWhenBinding(),
            highlightWhen: defaultPipelineHighlightWhenBinding(),
            highlightStroke: "accent-cyan",
          })
        }
      >
        Apply pipeline preset
      </TRNButton>
    </div>
  );
}

function StyleTokenField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: StyleTokenV1 | undefined;
  onChange: (value: StyleTokenV1) => void;
}) {
  return (
    <TRNFormField id={id} label={label}>
      <TRNSelect
        value={value ?? "muted"}
        ariaLabel={label}
        options={DIAGRAM_STYLE_TOKEN_OPTIONS}
        onValueChange={(next) => onChange(next as StyleTokenV1)}
      />
    </TRNFormField>
  );
}

function RectAxisField({
  diagramId,
  nodeId,
  axis,
  value,
}: {
  diagramId: string;
  nodeId: string;
  axis: "x" | "y";
  value: number | { base?: number; mode: "absolute" | "add"; binding: DiagramBindingV1 };
}) {
  const patchNode = useCourseDiagramEditorStore((s) => s.patchNode);
  const bound = !isStaticNumericProp(value);
  const selectValue = bound ? value.binding.path : "__static__";

  return (
    <div className="flex flex-col gap-2">
      <TRNFormField id={`${nodeId}-${axis}-mode`} label={`${axis.toUpperCase()} source`}>
        <TRNSelect
          value={selectValue}
          ariaLabel={`${axis} binding`}
          options={BINDING_OPTIONS}
          onValueChange={(next) => {
            if (next === "__static__") {
              patchNode(diagramId, nodeId, {
                [axis]: readNumericBase(value),
              });
              return;
            }
            const catalog = DIAGRAM_BINDING_CATALOG.find((e) => e.id === next);
            const binding: DiagramBindingV1 = {
              path: next,
              fallback: 0,
              ...(catalog?.unit ? { unit: catalog.unit } : {}),
            };
            if (axis === "y" && next === "bmi270.ax") {
              patchNode(diagramId, nodeId, {
                y: defaultAccelYBinding(readNumericBase(value)),
              });
              return;
            }
            patchNode(diagramId, nodeId, {
              [axis]: {
                base: readNumericBase(value),
                mode: "add",
                binding,
              },
            });
          }}
        />
      </TRNFormField>
      {bound ? (
        <>
          <TRNFormField id={`${nodeId}-${axis}-base`} label="Base px (add mode)">
            <CourseMaintainerScrubNumberInput
              value={value.base ?? 0}
              step={1}
              onChange={(base) =>
                patchNode(diagramId, nodeId, {
                  [axis]: { ...value, base },
                })
              }
            />
          </TRNFormField>
          <DiagramMapOpChainFields
            idPrefix={`${nodeId}-${axis}`}
            binding={value.binding}
            onChange={(binding) =>
              patchNode(diagramId, nodeId, {
                [axis]: { ...value, binding },
              })
            }
          />
        </>
      ) : (
        <TRNFormField id={`${nodeId}-${axis}-static`} label={`${axis.toUpperCase()} px`}>
          <CourseMaintainerScrubNumberInput
            value={value}
            step={1}
            onChange={(n) => patchNode(diagramId, nodeId, { [axis]: n })}
          />
        </TRNFormField>
      )}
    </div>
  );
}

export function CourseDiagramNodeInspector({
  diagramId,
  diagram,
}: {
  diagramId: string;
  diagram: DiagramV1;
}) {
  const selectedNodeId = useCourseDiagramEditorStore(
    (s) => s.selectedNodeIds[diagramId] ?? null,
  );
  const patchNode = useCourseDiagramEditorStore((s) => s.patchNode);
  const removeNode = useCourseDiagramEditorStore((s) => s.removeNode);
  const reorderNode = useCourseDiagramEditorStore((s) => s.reorderNode);
  const addNode = useCourseDiagramEditorStore((s) => s.addNode);

  const node = selectedNodeId != null ? findDiagramNode(diagram, selectedNodeId) : null;
  const zOrder =
    selectedNodeId != null ? diagramNodeZOrderState(diagram, selectedNodeId) : null;
  const topLevel =
    selectedNodeId != null ? isTopLevelDiagramNode(diagram, selectedNodeId) : false;

  if (node == null) {
    return (
      <TRNFormSection title="Node inspector" className="border-dashed">
        <DiagramNodePicker diagramId={diagramId} diagram={diagram} selectedNodeId={selectedNodeId} />
        <TRNHintText>
          Click a shape on the canvas — top layers win over the background frame. Lines (springs)
          have a wider hit area; or pick a node from the list above.
        </TRNHintText>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <TRNButton
            size="compact"
            onClick={() =>
              addNode(diagramId, {
                id: `label-${Date.now()}`,
                type: "text",
                x: 40,
                y: 40,
                content: "New label",
                fontSize: 10,
                fill: "muted",
              })
            }
          >
            + Text label
          </TRNButton>
          <TRNButton
            size="compact"
            onClick={() =>
              addNode(diagramId, {
                id: `box-${Date.now()}`,
                type: "rect",
                x: 40,
                y: 60,
                width: 80,
                height: 40,
                rx: 6,
                fill: "card",
                stroke: "card",
                label: "Box",
              })
            }
          >
            + Box
          </TRNButton>
          <TRNButton
            size="compact"
            onClick={() =>
              addNode(diagramId, {
                id: `line-${Date.now()}`,
                type: "line",
                x1: 40,
                y1: 120,
                x2: 160,
                y2: 120,
                stroke: "card",
                strokeWidth: 2,
                strokeDasharray: "5 4",
              })
            }
          >
            + Line
          </TRNButton>
          <TRNButton
            size="compact"
            onClick={() =>
              addNode(diagramId, {
                id: `arrow-${Date.now()}`,
                type: "arrow",
                x1: 180,
                y1: 120,
                x2: 280,
                y2: 120,
                stroke: "accent-cyan",
                strokeWidth: 2,
              })
            }
          >
            + Arrow
          </TRNButton>
          <TRNButton
            size="compact"
            onClick={() =>
              addNode(diagramId, {
                id: `curve-${Date.now()}`,
                type: "line",
                x1: 40,
                y1: 160,
                x2: 200,
                y2: 160,
                curve: defaultQuadraticControl({ x1: 40, y1: 160, x2: 200, y2: 160 }),
                stroke: "accent-cyan",
                strokeWidth: 2,
              })
            }
          >
            + Curved line
          </TRNButton>
        </div>
      </TRNFormSection>
    );
  }

  return (
    <TRNFormSection title={`${node.id} · ${node.type}`} showHeading={false}>
      <div className="flex flex-col gap-3">
      <DiagramNodePicker diagramId={diagramId} diagram={diagram} selectedNodeId={selectedNodeId} />
      {node.type === "rect" && node.id === "frame" ? (
        <TRNHintText>
          This is the diagram background card (rounded rect). Shapes drawn on top — springs, proof
          mass, labels — are separate nodes; pick them from the list above.
        </TRNHintText>
      ) : null}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-xs font-semibold text-zinc-100">Selected node</div>
          <div className="text-sm font-semibold text-zinc-300">
            {node.id} · {node.type}
          </div>
        </div>
        <TRNButton
          size="compact"
          hint="Remove node from diagram"
          onClick={() => {
            if (requestRemoveDiagramNode(node)) {
              removeNode(diagramId, node.id);
            }
          }}
        >
          <Trash2 size={14} strokeWidth={2} />
        </TRNButton>
      </div>

      {topLevel && zOrder != null ? (
        <TRNFormSection title="Stack order">
          <TRNHintText>
            Layer {zOrder.index + 1} of {zOrder.count} — later layers draw on top.
          </TRNHintText>
          <div className="flex flex-wrap gap-1.5">
            <TRNButton
              size="compact"
              disabled={!zOrder.canBackward}
              hint="Send to back of stack"
              onClick={() => reorderNode(diagramId, node.id, "back")}
            >
              <ChevronsDown size={13} strokeWidth={2} className="mr-1 inline" />
              Back
            </TRNButton>
            <TRNButton
              size="compact"
              disabled={!zOrder.canBackward}
              hint="Move one layer down"
              onClick={() => reorderNode(diagramId, node.id, "backward")}
            >
              <ArrowDown size={13} strokeWidth={2} className="mr-1 inline" />
              Down
            </TRNButton>
            <TRNButton
              size="compact"
              disabled={!zOrder.canForward}
              hint="Move one layer up"
              onClick={() => reorderNode(diagramId, node.id, "forward")}
            >
              <ArrowUp size={13} strokeWidth={2} className="mr-1 inline" />
              Up
            </TRNButton>
            <TRNButton
              size="compact"
              disabled={!zOrder.canForward}
              hint="Bring to front of stack"
              onClick={() => reorderNode(diagramId, node.id, "front")}
            >
              <ChevronsUp size={13} strokeWidth={2} className="mr-1 inline" />
              Front
            </TRNButton>
          </div>
        </TRNFormSection>
      ) : null}

      {!topLevel && selectedNodeId != null ? (
        <TRNHintText>Stack order applies to top-level nodes only (not children inside a group).</TRNHintText>
      ) : null}

      {node.type === "rect" ? (
        <>
          <RectAxisField diagramId={diagramId} nodeId={node.id} axis="x" value={node.x} />
          <RectAxisField diagramId={diagramId} nodeId={node.id} axis="y" value={node.y} />
          <TRNFormField id={`${node.id}-label`} label="Label">
            <TRNInput
              id={`${node.id}-label`}
              variant="outlined"
              size="sm"
              className="w-full"
              value={node.label ?? ""}
              onChange={(e) => patchNode(diagramId, node.id, { label: e.target.value })}
            />
          </TRNFormField>
          <div className="grid grid-cols-2 gap-2">
            <TRNFormField id={`${node.id}-width`} label="Width">
              <CourseMaintainerScrubNumberInput
                value={node.width}
                min={8}
                step={4}
                onChange={(width) => patchNode(diagramId, node.id, { width })}
              />
            </TRNFormField>
            <TRNFormField id={`${node.id}-height`} label="Height">
              <CourseMaintainerScrubNumberInput
                value={node.height}
                min={8}
                step={4}
                onChange={(height) => patchNode(diagramId, node.id, { height })}
              />
            </TRNFormField>
          </div>
          <TRNFormField id={`${node.id}-rx`} label="Corner radius">
            <CourseMaintainerScrubNumberInput
              value={node.rx ?? 0}
              min={0}
              step={1}
              onChange={(rx) => patchNode(diagramId, node.id, { rx })}
            />
          </TRNFormField>
          <StyleTokenField
            id={`${node.id}-fill`}
            label="Fill"
            value={node.fill}
            onChange={(fill) => patchNode(diagramId, node.id, { fill })}
          />
          <StyleTokenField
            id={`${node.id}-stroke`}
            label="Stroke"
            value={node.stroke}
            onChange={(stroke) => patchNode(diagramId, node.id, { stroke })}
          />
          <TRNFormField id={`${node.id}-strokeWidth`} label="Stroke width">
            <CourseMaintainerScrubNumberInput
              value={node.strokeWidth ?? 1}
              min={0}
              step={1}
              onChange={(strokeWidth) => patchNode(diagramId, node.id, { strokeWidth })}
            />
          </TRNFormField>
        </>
      ) : null}

      {node.type === "text" ? (
        <>
          <TRNFormField id={`${node.id}-x`} label="X">
            <CourseMaintainerScrubNumberInput
              value={node.x}
              step={1}
              onChange={(x) => patchNode(diagramId, node.id, { x })}
            />
          </TRNFormField>
          <TRNFormField id={`${node.id}-y`} label="Y">
            <CourseMaintainerScrubNumberInput
              value={node.y}
              step={1}
              onChange={(y) => patchNode(diagramId, node.id, { y })}
            />
          </TRNFormField>
          {typeof node.content === "string" ? (
            <TRNFormField id={`${node.id}-content`} label="Text">
              <TRNInput
                id={`${node.id}-content`}
                variant="outlined"
                size="sm"
                className="w-full"
                value={node.content}
                onChange={(e) => patchNode(diagramId, node.id, { content: e.target.value })}
              />
            </TRNFormField>
          ) : (
            <>
              <TRNFormField id={`${node.id}-bind-path`} label="Live text binding">
                <TRNSelect
                  value={node.content.binding.path}
                  ariaLabel="Text binding path"
                  options={BINDING_OPTIONS.filter((o) => o.value !== "__static__")}
                  onValueChange={(path) => {
                    const catalog = DIAGRAM_BINDING_CATALOG.find((e) => e.id === path);
                    patchNode(diagramId, node.id, {
                      content: {
                        ...node.content,
                        binding: {
                          ...node.content.binding,
                          path,
                          format: node.content.binding.format ?? "0.000",
                          unit: catalog?.unit,
                        },
                      },
                    });
                  }}
                />
              </TRNFormField>
              <TRNFormField id={`${node.id}-prefix`} label="Prefix">
                <TRNInput
                  id={`${node.id}-prefix`}
                  variant="outlined"
                  size="sm"
                  className="w-full"
                  value={node.content.prefix ?? ""}
                  onChange={(e) =>
                    patchNode(diagramId, node.id, {
                      content: { ...node.content, prefix: e.target.value },
                    })
                  }
                />
              </TRNFormField>
            </>
          )}
          {typeof node.content === "string" ? (
            <TRNButton
              size="compact"
              onClick={() =>
                patchNode(diagramId, node.id, {
                  content: {
                    binding: { path: "bmi270.ax", format: "0.000", unit: "g" },
                    prefix: "aX = ",
                  },
                })
              }
            >
              Bind to live value
            </TRNButton>
          ) : (
            <TRNButton
              size="compact"
              onClick={() => patchNode(diagramId, node.id, { content: "Static label" })}
            >
              Unbind text
            </TRNButton>
          )}
          <StyleTokenField
            id={`${node.id}-fill`}
            label="Text color"
            value={node.fill}
            onChange={(fill) => patchNode(diagramId, node.id, { fill })}
          />
          <TRNFormField id={`${node.id}-fontSize`} label="Font size">
            <CourseMaintainerScrubNumberInput
              value={node.fontSize ?? 10}
              min={6}
              step={1}
              onChange={(fontSize) => patchNode(diagramId, node.id, { fontSize })}
            />
          </TRNFormField>
        </>
      ) : null}

      {node.type === "line" || node.type === "arrow" ? (
        <>
          <TRNFormField id={`${node.id}-curve-mode`} label="Connector shape">
            <TRNSelect
              value={hasConnectorCurve(node) ? "curved" : "straight"}
              ariaLabel="Connector shape"
              options={[
                { value: "straight", label: "Straight" },
                { value: "curved", label: "Quadratic curve" },
              ]}
              onValueChange={(next) => {
                if (next === "curved") {
                  patchNode(diagramId, node.id, {
                    curve: defaultQuadraticControl(node),
                  });
                  return;
                }
                patchNode(diagramId, node.id, { curve: null });
              }}
            />
          </TRNFormField>
          <div className="grid grid-cols-2 gap-2">
            <TRNFormField id={`${node.id}-x1`} label="X1">
              <CourseMaintainerScrubNumberInput
                value={node.x1}
                step={4}
                onChange={(x1) => patchNode(diagramId, node.id, { x1 })}
              />
            </TRNFormField>
            <TRNFormField id={`${node.id}-y1`} label="Y1">
              <CourseMaintainerScrubNumberInput
                value={node.y1}
                step={4}
                onChange={(y1) => patchNode(diagramId, node.id, { y1 })}
              />
            </TRNFormField>
            <TRNFormField id={`${node.id}-x2`} label="X2">
              <CourseMaintainerScrubNumberInput
                value={node.x2}
                step={4}
                onChange={(x2) => patchNode(diagramId, node.id, { x2 })}
              />
            </TRNFormField>
            <TRNFormField id={`${node.id}-y2`} label="Y2">
              <CourseMaintainerScrubNumberInput
                value={node.y2}
                step={4}
                onChange={(y2) => patchNode(diagramId, node.id, { y2 })}
              />
            </TRNFormField>
          </div>
          {hasConnectorCurve(node) ? (
            <div className="grid grid-cols-2 gap-2">
              <TRNFormField id={`${node.id}-curve-cx`} label="Control X">
                <CourseMaintainerScrubNumberInput
                  value={node.curve.cx}
                  step={4}
                  onChange={(curveCx) => patchNode(diagramId, node.id, { curveCx })}
                />
              </TRNFormField>
              <TRNFormField id={`${node.id}-curve-cy`} label="Control Y">
                <CourseMaintainerScrubNumberInput
                  value={node.curve.cy}
                  step={4}
                  onChange={(curveCy) => patchNode(diagramId, node.id, { curveCy })}
                />
              </TRNFormField>
            </div>
          ) : null}
          <StyleTokenField
            id={`${node.id}-stroke`}
            label="Stroke"
            value={node.stroke}
            onChange={(stroke) => patchNode(diagramId, node.id, { stroke })}
          />
          <TRNFormField id={`${node.id}-strokeWidth`} label="Stroke width">
            <CourseMaintainerScrubNumberInput
              value={node.strokeWidth ?? 2}
              min={1}
              step={1}
              onChange={(strokeWidth) => patchNode(diagramId, node.id, { strokeWidth })}
            />
          </TRNFormField>
          {node.type === "line" ? (
            <TRNFormField id={`${node.id}-dash`} label="Dash style">
              <TRNSelect
                value={node.strokeDasharray != null ? "dashed" : "solid"}
                ariaLabel="Line dash style"
                options={[
                  { value: "solid", label: "Solid" },
                  { value: "dashed", label: "Dashed (flow when live)" },
                ]}
                onValueChange={(next) =>
                  patchNode(diagramId, node.id, {
                    strokeDasharray: next === "dashed" ? "5 4" : null,
                  })
                }
              />
            </TRNFormField>
          ) : null}
          <ConnectorBindingFields
            diagramId={diagramId}
            nodeId={node.id}
            flowWhen={node.flowWhen}
            highlightWhen={node.highlightWhen}
            highlightStroke={node.highlightStroke}
          />
          <TRNHintText>
            Drag endpoint handles on the canvas; curved connectors also show a cyan control handle.
          </TRNHintText>
        </>
      ) : null}
      </div>
    </TRNFormSection>
  );
}
