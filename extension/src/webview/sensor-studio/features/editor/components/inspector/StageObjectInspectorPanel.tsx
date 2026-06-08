import type { Edge } from "@xyflow/react";
import { Box, Cable, Move3d, Palette, Shapes } from "lucide-react";
import { useMemo } from "react";
import { TRNButton, TRNHintText } from "../../../../../ui/TRN";
import {
  isStageObjectGeometryEditable,
  resolveStageObjectInspectorLabels,
} from "../../../../core/stage/stage-scene-object-inspector-labels";
import type { SceneObjectRefV1 } from "../../../../core/stage/scene-object-ref";
import { MESH_BUNDLE_NODE_TITLE } from "../../nodes/mesh/mesh-group-inputs";
import { useFlowEditorStore, type StudioNode } from "../../store/flow-editor.store";
import { InspectorCollapsibleSection } from "./InspectorCollapsibleSection";
import { INSPECTOR_NODE_TAB_CARD_STACK_CLASS } from "./inspector-node-tab-stack";
import { GlbInstanceTransformInspectorSection } from "./settings/sections/GlbInstanceTransformInspectorSection";
import { MeshPrimitiveTransformInspectorSection } from "./settings/sections/MeshPrimitiveTransformInspectorSection";
import { MeshPrimitiveSettingsSection } from "./settings/sections/MeshPrimitiveSettingsSection";
import { StageSelectionMaterialQuickEdit } from "./StageSelectionMaterialQuickEdit";

export type StageObjectInspectorPanelProps = {
  selection: SceneObjectRefV1;
  boundNode: StudioNode | null;
  boundCatalogTitle: string;
  nodes: readonly StudioNode[];
  edges: readonly Edge[];
  onSelectFlowNode: (nodeId: string) => void;
};

export function StageObjectInspectorPanel(props: StageObjectInspectorPanelProps) {
  const {
    selection,
    boundNode,
    boundCatalogTitle,
    nodes,
    edges,
    onSelectFlowNode,
  } = props;

  const updateMeshConfigField = useFlowEditorStore((s) => s.updateNodeConfigFieldByNodeId);

  const labels = useMemo(
    () =>
      resolveStageObjectInspectorLabels({
        selection,
        boundNode,
        nodes,
        edges,
        boundCatalogTitle,
      }),
    [boundCatalogTitle, boundNode, edges, nodes, selection],
  );

  const meshSourceNode = useMemo((): StudioNode | null => {
    if (labels.meshSourceNodeId == null) {
      return null;
    }
    const found = nodes.find((n) => n.id === labels.meshSourceNodeId);
    return found != null && found.type === "studio" ? found : null;
  }, [labels.meshSourceNodeId, nodes]);

  const geometryEditable = isStageObjectGeometryEditable(meshSourceNode);

  if (selection.kind === "glb-instance") {
    return (
      <div className={INSPECTOR_NODE_TAB_CARD_STACK_CLASS}>
        <p className="text-[10px] leading-snug text-zinc-500">
          Writes to{" "}
          <span className="text-zinc-300">{labels.objectTitle}</span>
          {labels.objectSubtitle != null ? (
            <>
              {" "}
              · <span className="text-zinc-400">{labels.objectSubtitle}</span>
            </>
          ) : null}
        </p>
        <InspectorCollapsibleSection
          title="Transform"
          icon={<Move3d className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
          iconHint="Local position, rotation, and scale for the selected GLB part."
          defaultExpanded
        >
          <GlbInstanceTransformInspectorSection selection={selection} />
        </InspectorCollapsibleSection>
        {boundNode != null ? (
          <TRNButton
            className="mt-2 h-8 w-full border border-zinc-700/70 bg-zinc-900/50 text-[11px] text-zinc-200"
            onClick={() => onSelectFlowNode(boundNode.id)}
            hint="Select the bound model source node on the Flow canvas"
          >
            <Cable size={14} className="mr-1.5 inline opacity-85" aria-hidden />
            Inspect model source on graph
          </TRNButton>
        ) : null}
      </div>
    );
  }

  if (meshSourceNode == null) {
    return (
      <div className={INSPECTOR_NODE_TAB_CARD_STACK_CLASS}>
        <TRNHintText tone="muted" className="text-[11px] leading-relaxed">
          {labels.objectSubtitle ??
            "Pick a wired primitive mesh on Stage to edit transform, material, and geometry here."}
        </TRNHintText>
        {boundNode != null && labels.writesViaBundle ? (
          <TRNButton
            className="mt-2 h-8 w-full border border-zinc-700/70 bg-zinc-900/50 text-[11px] text-zinc-200"
            onClick={() => onSelectFlowNode(boundNode.id)}
            hint={`Open ${MESH_BUNDLE_NODE_TITLE} wiring on the Flow canvas`}
          >
            <Cable size={14} className="mr-1.5 inline opacity-85" aria-hidden />
            Inspect {MESH_BUNDLE_NODE_TITLE} on graph
          </TRNButton>
        ) : null}
      </div>
    );
  }

  const meshSectionProps = {
    selectedNode: meshSourceNode,
    onUpdateConfigField: (key: string, value: unknown) => {
      updateMeshConfigField(meshSourceNode.id, key, value);
      return true;
    },
    sourceKeyDraft: "",
    setSourceKeyDraft: () => {},
    sourceKeyFieldError: null,
    setSourceKeyFieldError: () => {},
  };

  return (
    <div className={INSPECTOR_NODE_TAB_CARD_STACK_CLASS}>
      <p className="text-[10px] leading-snug text-zinc-500">
        Writes to{" "}
        <span className="text-zinc-300">{labels.objectTitle}</span>
        {labels.objectSubtitle != null ? (
          <>
            {" "}
            · <span className="text-zinc-400">{labels.objectSubtitle}</span>
          </>
        ) : null}
      </p>

      <InspectorCollapsibleSection
        title="Transform"
        icon={<Move3d className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="Position, rotation, and scale for the selected Stage object."
        defaultExpanded
      >
        <MeshPrimitiveTransformInspectorSection
          meshFlowNodeId={meshSourceNode.id}
          sceneObjectPath={selection.objectPath}
        />
      </InspectorCollapsibleSection>

      <InspectorCollapsibleSection
        title="Material"
        icon={<Palette className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="Quick-edit the wired mesh material node for this object."
        defaultExpanded
      >
        <StageSelectionMaterialQuickEdit
          selection={selection}
          nodes={nodes}
          edges={edges}
          embedded
        />
      </InspectorCollapsibleSection>

      {geometryEditable ? (
        <InspectorCollapsibleSection
          title="Geometry"
          icon={<Shapes className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
          iconHint="Primitive dimensions emitted on the mesh wire."
          defaultExpanded
        >
          <MeshPrimitiveSettingsSection {...meshSectionProps} includeTransform={false} />
        </InspectorCollapsibleSection>
      ) : null}

      {boundNode != null ? (
        <InspectorCollapsibleSection
          title="Flow wiring"
          icon={<Cable className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
          iconHint="Graph nodes behind this Stage object. Opens full Flow inspector when selected on the canvas."
          defaultExpanded={false}
        >
          <div className="space-y-2">
            <div className="flex items-start gap-2 rounded-md border border-zinc-800/80 bg-zinc-950/40 px-2 py-2">
              <Box className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-500" aria-hidden />
              <div className="min-w-0">
                <p className="truncate text-[11px] font-medium text-zinc-200">
                  {labels.writesViaBundle ? MESH_BUNDLE_NODE_TITLE : boundCatalogTitle}
                </p>
                <p className="mt-0.5 text-[10px] leading-snug text-zinc-500">
                  {labels.writesViaBundle
                    ? "Bundle combines mesh wires for Scene Output Meshes."
                    : "Source flow node for this Stage object."}
                </p>
              </div>
            </div>
            <TRNButton
              className="h-8 w-full border border-zinc-700/70 bg-zinc-900/50 text-[11px] text-zinc-200"
              onClick={() => onSelectFlowNode(boundNode.id)}
              hint="Select this node on the Flow canvas and show the Flow inspector below"
            >
              Inspect on graph
            </TRNButton>
            {labels.writesViaBundle ? (
              <TRNButton
                className="h-8 w-full border border-zinc-700/70 bg-zinc-900/50 text-[11px] text-zinc-200"
                onClick={() => onSelectFlowNode(meshSourceNode.id)}
                hint="Select the wired primitive mesh node on the Flow canvas"
              >
                Inspect wired mesh node
              </TRNButton>
            ) : null}
          </div>
        </InspectorCollapsibleSection>
      ) : null}
    </div>
  );
}
