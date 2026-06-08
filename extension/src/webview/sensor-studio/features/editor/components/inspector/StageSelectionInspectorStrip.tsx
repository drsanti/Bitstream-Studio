import type { Edge } from "@xyflow/react";
import { Crosshair, X } from "lucide-react";
import { TRNButton } from "../../../../../ui/TRN/TRNButton";
import { TRNIconButton } from "../../../../../ui/TRN/TRNIconButton";
import type { SceneObjectRefV1 } from "../../../../core/stage/scene-object-ref";
import { isStageSceneGizmoEligible } from "../../../../core/stage/stage-scene-transform-write";
import type { FlowGraphNode } from "../../store/flow-graph-types";
import { TRNHintText } from "../../../../../ui/TRN";

export type StageSelectionInspectorStripProps = {
  selection: SceneObjectRefV1;
  objectTitle?: string | null;
  objectSubtitle?: string | null;
  nodes: readonly FlowGraphNode[];
  edges: readonly Edge[];
  onFocusInGraph: () => void;
  onClearSelection: () => void;
};

export function StageSelectionInspectorStrip(props: StageSelectionInspectorStripProps) {
  const {
    selection,
    objectTitle,
    objectSubtitle,
    nodes,
    edges,
    onFocusInGraph,
    onClearSelection,
  } = props;
  const kindLabel = selection.kind === "procedural" ? "Procedural mesh" : "GLB instance";
  const gizmoEligible = isStageSceneGizmoEligible(selection, nodes, edges);
  const sourceNode = nodes.find((n) => n.id === selection.sourceNodeId);
  const gizmoHint =
    gizmoEligible
        ? "Move / Rotate / Scale tools are on the Stage toolbar (G / R / S)."
        : sourceNode?.data.nodeId === "mesh-group"
          ? "Pick a mesh inside the bundle on Stage and wire Box/Sphere/Plane nodes to bundle inputs to enable the gizmo."
          : selection.kind === "glb-instance"
            ? "Pick a named GLB part on a wired Model Source to enable the part transform gizmo."
            : "Transform gizmo is not available for this selection. Use the mesh node inspector transform fields.";

  return (
    <div className="mb-2 shrink-0 rounded-lg border border-sky-800/50 bg-sky-950/25 px-2.5 py-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-sky-300/90">
            Stage selection
          </p>
          <p className="truncate text-[11px] font-medium text-zinc-100">
            {objectTitle != null && objectTitle.length > 0
              ? objectTitle
              : selection.sourceNodeId}
          </p>
          <p className="mt-0.5 truncate text-[10px] text-zinc-500">
            {objectSubtitle != null && objectSubtitle.length > 0
              ? objectSubtitle
              : `${kindLabel} · ${selection.objectPath}`}
          </p>
        </div>
        <TRNIconButton
          icon={<X size={14} className="text-zinc-400" />}
          label="Clear selection"
          hint="Clear Stage selection"
          onClick={onClearSelection}
          className="!h-7 !w-7 shrink-0"
        />
      </div>
      <TRNButton
        className="mt-2 h-8 w-full border border-sky-700/60 bg-sky-950/40 text-[11px] text-sky-100 hover:bg-sky-900/50"
        onClick={onFocusInGraph}
        hint="Select the bound flow node and zoom the graph to it"
      >
        <Crosshair size={14} className="mr-1.5 inline opacity-90" aria-hidden />
        Focus in graph
      </TRNButton>
      <TRNHintText tone="muted" className="mt-2 text-[10px] leading-snug">
        {gizmoHint}
      </TRNHintText>
    </div>
  );
}
