import type { ReactElement } from "react";
import {
  TRNHintText,
  TRNTransformSection,
  type TRNTransformSectionValue,
} from "../../../../../../../ui/TRN";
import { resolveStageSceneTransformWriteTarget } from "../../../../../../core/stage/stage-scene-transform-write";
import {
  flowWireTransformFieldsForNodeConfigPatch,
  flowWireTransformFromNodeDefaultConfig,
} from "../../../../nodes/transform/flow-wire-transform";
import { useStageSceneStore } from "../../../../../../state/stage-scene.store";
import { useFlowEditorStore } from "../../../../store/flow-editor.store";

export function MeshPrimitiveTransformInspectorSection(props: {
  meshFlowNodeId: string;
  /** Stage object path — enables live gizmo mirror during Edit mode drag. */
  sceneObjectPath?: string | null;
  showTopDivider?: boolean;
}): ReactElement {
  const { meshFlowNodeId, sceneObjectPath = null, showTopDivider = false } = props;
  const nodes = useFlowEditorStore((s) => s.nodes);
  const edges = useFlowEditorStore((s) => s.edges);
  const patchFields = useFlowEditorStore((s) => s.patchNodeConfigFieldsByNodeId);
  const gizmoLiveObjectPath = useStageSceneStore((s) => s.gizmoLiveObjectPath);
  const gizmoLiveTransform = useStageSceneStore((s) => s.gizmoLiveTransform);

  const meshNode = nodes.find((n) => n.id === meshFlowNodeId);
  const writeTarget = resolveStageSceneTransformWriteTarget({
    meshFlowNodeId,
    nodes,
    edges,
  });

  const transformEdge = edges.find(
    (e) =>
      e.target === meshFlowNodeId && (e.targetHandle ?? "transform") === "transform",
  );
  const wiredSource =
    transformEdge != null ? nodes.find((n) => n.id === transformEdge.source) : undefined;
  const wiredNonObjectTransform =
    wiredSource != null && wiredSource.data.nodeId !== "object-transform";

  const targetNodeId = writeTarget?.nodeId ?? meshFlowNodeId;
  const targetNode = nodes.find((n) => n.id === targetNodeId);
  const graphTransform = flowWireTransformFromNodeDefaultConfig(
    (targetNode?.data.defaultConfig ?? {}) as Record<string, unknown>,
  );
  const transform =
    sceneObjectPath != null &&
    gizmoLiveObjectPath === sceneObjectPath &&
    gizmoLiveTransform != null
      ? gizmoLiveTransform
      : graphTransform;

  const uniformScale =
    Math.abs(transform.scale.x - transform.scale.y) < 1e-6 &&
    Math.abs(transform.scale.x - transform.scale.z) < 1e-6;

  const disabled = wiredNonObjectTransform || targetNode == null;
  const wiredLabel =
    wiredSource != null && wiredSource.data.label.trim().length > 0
      ? wiredSource.data.label.trim()
      : (wiredSource?.data.nodeId ?? "upstream node");

  const hint =
    writeTarget?.kind === "object-transform"
      ? "Edits the wired Object Transform node. Disconnect Transform to author on this mesh instead."
      : wiredNonObjectTransform
        ? `Transform input is wired from ${wiredLabel}; disconnect it to edit embedded position, rotation, and scale here.`
        : "Embedded transform when the Transform input is unwired. Wire Object Transform to drive this mesh from another node.";

  const onChange = (next: TRNTransformSectionValue) => {
    if (disabled) {
      return;
    }
    patchFields(
      targetNodeId,
      flowWireTransformFieldsForNodeConfigPatch({
        version: 1,
        position: next.position,
        rotationDeg: next.rotationDeg ?? transform.rotationDeg,
        scale: next.scale,
      }),
    );
  };

  return (
    <div
      className={
        showTopDivider ? "space-y-2 border-t border-zinc-800/70 pt-3" : "space-y-2"
      }
    >
      <TRNTransformSection
        value={{
          position: transform.position,
          rotationDeg: transform.rotationDeg,
          scale: transform.scale,
          uniformScale,
        }}
        onChange={onChange}
        disabled={disabled || meshNode == null}
        scrubInteraction={{ pointerScrubEnabled: true }}
      />
      <TRNHintText tone="muted" className="text-[10px] leading-snug">
        {hint}
      </TRNHintText>
    </div>
  );
}
