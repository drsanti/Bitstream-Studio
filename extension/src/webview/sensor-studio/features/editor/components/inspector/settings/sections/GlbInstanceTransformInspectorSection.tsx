import type { ReactElement } from "react";
import {
  TRNHintText,
  TRNTransformSection,
  type TRNTransformSectionValue,
} from "../../../../../../../ui/TRN";
import { findGlbPartTransformNodeId } from "../../../../../../core/stage/stage-scene-glb-transform-write";
import type { SceneObjectRefV1 } from "../../../../../../core/stage/scene-object-ref";
import {
  glbPartTransformFieldsForNodeConfigPatch,
  readGlbPartTransformFromConfig,
} from "../../../../nodes/scene/glb-part-transform-config";
import { useStageSceneStore } from "../../../../../../state/stage-scene.store";
import { useFlowEditorStore } from "../../../../store/flow-editor.store";

export function GlbInstanceTransformInspectorSection(props: {
  selection: Extract<SceneObjectRefV1, { kind: "glb-instance" }>;
}): ReactElement {
  const { selection } = props;
  const nodes = useFlowEditorStore((s) => s.nodes);
  const edges = useFlowEditorStore((s) => s.edges);
  const patchFields = useFlowEditorStore((s) => s.patchNodeConfigFieldsByNodeId);
  const commitGlbWrite = useFlowEditorStore((s) => s.commitStageGlbPartTransformWrite);
  const gizmoLiveObjectPath = useStageSceneStore((s) => s.gizmoLiveObjectPath);
  const gizmoLiveTransform = useStageSceneStore((s) => s.gizmoLiveTransform);

  const nodeId = findGlbPartTransformNodeId({
    sourceModelNodeId: selection.sourceNodeId,
    partPath: selection.objectPath,
    nodes,
    edges,
  });
  const node = nodeId != null ? nodes.find((n) => n.id === nodeId) : undefined;
  const graphTransform = readGlbPartTransformFromConfig(node?.data.defaultConfig);
  const transform =
    gizmoLiveObjectPath === selection.objectPath && gizmoLiveTransform != null
      ? gizmoLiveTransform
      : graphTransform;

  const uniformScale =
    Math.abs(transform.scale.x - transform.scale.y) < 1e-6 &&
    Math.abs(transform.scale.x - transform.scale.z) < 1e-6;

  const onChange = (next: TRNTransformSectionValue) => {
    const payload = {
      version: 1 as const,
      position: next.position,
      rotationDeg: next.rotationDeg ?? transform.rotationDeg,
      scale: next.scale,
    };
    if (nodeId != null) {
      patchFields(nodeId, glbPartTransformFieldsForNodeConfigPatch(payload));
      return;
    }
    commitGlbWrite({
      selection,
      transform: payload,
    });
  };

  return (
    <div className="space-y-2">
      <TRNTransformSection
        value={{
          position: transform.position,
          rotationDeg: transform.rotationDeg,
          scale: transform.scale,
          uniformScale,
        }}
        onChange={onChange}
        scrubInteraction={{ pointerScrubEnabled: true }}
      />
      <TRNHintText tone="muted" className="text-[10px] leading-snug">
        {nodeId != null
          ? "Edits the bound Part Transform node for this GLB path. Drag the Stage gizmo for live preview."
          : "Edits create a Part Transform node on the graph for this GLB part. Drag the Stage gizmo to place visually first."}
      </TRNHintText>
    </div>
  );
}
