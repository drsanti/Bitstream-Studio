import { useMemo } from "react";
import { StudioSceneViewport } from "../../../../core/viewport/StudioSceneViewport";
import {
  coerceScene3DConfigV1,
  defaultScene3DConfig,
  type Scene3DConfigV1,
} from "../../../../core/scene3d/scene3d-config";
import type { RotationPreviewSceneProps } from "../../../../../bitstream-app/components/3d-rotation/shared/RotationPreviewScene";
import type { FlowWireEnvironmentV1 } from "../environment/flow-wire-environment";
import { mergeFlowWireEnvironmentIntoScene3d } from "../environment/flow-wire-environment";
import type { FlowWireCameraV1 } from "../camera-view/flow-wire-camera";
import { mergeFlowWireCameraIntoScene3d } from "../camera-view/flow-wire-camera";
import type { FlowWireAnimationV1 } from "../animation/flow-wire-animation";
import { buildGlbAnimationPreviewSceneProps } from "../../gltf/build-glb-animation-preview-scene-props";
import { buildGlbScalarPreviewSceneProps } from "../../gltf/build-glb-scalar-preview-scene-props";
import type { FlowWireTransformV1 } from "../transform/flow-wire-transform";
import { mergeFlowWireTransformIntoScene3d } from "../transform/flow-wire-transform";
import { mergeFlowSceneWiresIntoScene3d } from "../scene-fx/merge-flow-scene-wires";
import {
  coerceFlowWirePhysicsSceneV1,
  type FlowWirePhysicsSceneV1,
} from "../physics/flow-wire-physics-scene";
import {
  mergeFlowWirePhysicsIntoScene3d,
  physicsCollidersFromWire,
} from "../physics/merge-flow-physics-into-scene3d";
import type { StagePhysicsColliderV1 } from "../../../../core/stage/stage-physics-colliders";
import type { FlowWireFogV1 } from "../scene-fx/flow-wire-fog";
import type { FlowWireStudioLightV1 } from "../scene-fx/flow-wire-studio-light";
import type { FlowWirePostProcessingV1 } from "../scene-fx/flow-wire-post-processing";
import type { FlowWireContactShadowsV1 } from "../scene-fx/flow-wire-contact-shadows";
import type { FlowWireParticleEmitterV1 } from "../scene-fx/flow-wire-particle-emitter";
import { rotationPreviewOrientationFromTransformWire } from "../transform/flow-wire-transform-preview-orientation";
import { resolveStudioModelScopeNodeId, resolveStudioSourceModelGlbUrl } from "../../model/model-generated-bindings";
import { graphHasVisionHudNodes } from "../../../../core/camera/collect-vision-hud-chips";
import { useFlowEditorStore } from "../../store/flow-editor.store";

export type ModelViewerNodePanelProps = {
  nodeId: string;
  liveValue: unknown;
  liveEnvironmentWire?: FlowWireEnvironmentV1 | null;
  liveCameraWire?: FlowWireCameraV1 | null;
  liveAnimationWire?: FlowWireAnimationV1 | null;
  liveTransformWire?: FlowWireTransformV1 | null;
  liveFogWire?: FlowWireFogV1 | null;
  liveSettingsExposure?: number | null;
  liveStudioLightWire?: FlowWireStudioLightV1 | null;
  livePostProcessingWire?: FlowWirePostProcessingV1 | null;
  liveContactShadowsWire?: FlowWireContactShadowsV1 | null;
  liveParticleEmitterWire?: FlowWireParticleEmitterV1 | null;
  livePhysicsWire?: FlowWirePhysicsSceneV1 | null;
  defaultConfig: Record<string, unknown>;
};

function readBoolean(cfg: Record<string, unknown>, key: string, fallback: boolean): boolean {
  const v = cfg[key];
  return typeof v === "boolean" ? v : fallback;
}

const MODEL_VIEWER_EMPTY_HINT =
  "Wire a Model Source node (drag a 3D model from Asset Browser onto the canvas, or add Model Source from the library).";

/**
 * Flow node: GLTF preview driven by the incoming **Model** wire (fetchable GLB URL).
 * No silent default mesh — stays empty until wired or linked to a configured Model Source.
 */
export function ModelViewerNodePanel(props: ModelViewerNodePanelProps) {
  const {
    nodeId,
    liveValue,
    liveEnvironmentWire,
    liveCameraWire,
    liveAnimationWire,
    liveTransformWire,
    liveFogWire,
    liveSettingsExposure,
    liveStudioLightWire,
    livePostProcessingWire,
    liveContactShadowsWire,
    liveParticleEmitterWire,
    livePhysicsWire,
    defaultConfig,
  } = props;

  const nodes = useFlowEditorStore((s) => s.nodes);
  const edges = useFlowEditorStore((s) => s.edges);

  const wiredUrl =
    typeof liveValue === "string" && liveValue.trim().length > 0 ? liveValue.trim() : "";
  const linkedModelUrl = useMemo(
    () =>
      resolveStudioSourceModelGlbUrl(
        nodes,
        resolveStudioModelScopeNodeId({
          nodes,
          edges,
          defaultConfig,
          flowNodeId: nodeId,
          catalogNodeId: "model-viewer",
        }) || undefined,
      ),
    [nodes, edges, defaultConfig, nodeId],
  );

  const linkedStudioAssetId = useMemo((): string | undefined => {
    const scopeId = resolveStudioModelScopeNodeId({
      nodes,
      edges,
      defaultConfig,
      flowNodeId: nodeId,
      catalogNodeId: "model-viewer",
    });
    if (scopeId == null || scopeId.trim().length === 0) {
      return undefined;
    }
    const src = nodes.find((n) => n.id === scopeId);
    if (src?.data.nodeId !== "model-select") {
      return undefined;
    }
    const dc = src.data.defaultConfig as Record<string, unknown>;
    const sid =
      typeof dc.selectedStudioAssetId === "string" ? dc.selectedStudioAssetId.trim() : "";
    return sid.length > 0 ? sid : undefined;
  }, [nodes, edges, defaultConfig, nodeId]);
  const fallbackRaw = defaultConfig.fallbackModelUrl;
  const fallback =
    typeof fallbackRaw === "string" && fallbackRaw.trim().length > 0 ? fallbackRaw.trim() : "";

  /** Persisted / wired key only — {@link StudioSceneViewport} resolves fetch URL internally. */
  const logicalModelUrl = useMemo(() => {
    if (wiredUrl.length > 0) {
      return wiredUrl;
    }
    if (linkedModelUrl != null && linkedModelUrl.length > 0) {
      return linkedModelUrl;
    }
    if (fallback.length > 0) {
      return fallback;
    }
    return "";
  }, [wiredUrl, linkedModelUrl, fallback]);

  const scene3d = useMemo((): Scene3DConfigV1 => {
    const base =
      defaultConfig.scene3d != null
        ? coerceScene3DConfigV1(defaultConfig.scene3d)
        : defaultScene3DConfig();
    const withModel: Scene3DConfigV1 = {
      ...base,
      model: {
        ...base.model,
        url: logicalModelUrl,
        studioAssetId: linkedStudioAssetId,
      },
    };
    const withEnv = mergeFlowWireEnvironmentIntoScene3d(withModel, liveEnvironmentWire ?? null);
    const withCam = mergeFlowWireCameraIntoScene3d(withEnv, liveCameraWire ?? null);
    const withXf = mergeFlowWireTransformIntoScene3d(withCam, liveTransformWire ?? null);
    const withFx = mergeFlowSceneWiresIntoScene3d(withXf, {
      fog: liveFogWire ?? null,
      exposure: liveSettingsExposure ?? null,
      studioLight: liveStudioLightWire ?? null,
      postProcessing: livePostProcessingWire ?? null,
      contactShadows: liveContactShadowsWire ?? null,
      particleEmitter: liveParticleEmitterWire ?? null,
    });
    const phys = coerceFlowWirePhysicsSceneV1(livePhysicsWire);
    return mergeFlowWirePhysicsIntoScene3d(withFx, phys.enabled ? phys : null);
  }, [
    defaultConfig.scene3d,
    logicalModelUrl,
    linkedStudioAssetId,
    liveEnvironmentWire,
    liveCameraWire,
    liveTransformWire,
    liveFogWire,
    liveSettingsExposure,
    liveStudioLightWire,
    livePostProcessingWire,
    liveContactShadowsWire,
    liveParticleEmitterWire,
    livePhysicsWire,
  ]);

  const stagePhysicsWire = useMemo(
    () => {
      const phys = coerceFlowWirePhysicsSceneV1(livePhysicsWire);
      return phys.enabled ? phys : null;
    },
    [livePhysicsWire],
  );

  const stagePhysicsColliders = useMemo((): StagePhysicsColliderV1[] => {
    return physicsCollidersFromWire(stagePhysicsWire);
  }, [stagePhysicsWire]);

  const showGrid = readBoolean(defaultConfig, "showGrid", true);

  const glbScalarSceneProps = useMemo(
    () =>
      buildGlbScalarPreviewSceneProps({
        nodes,
        edges,
        flowNodeId: nodeId,
        catalogNodeId: "model-viewer",
        defaultConfig,
        liveStudioLightWire: liveStudioLightWire ?? null,
      }),
    [nodes, edges, nodeId, defaultConfig, liveStudioLightWire],
  );

  const glbAnimationSceneProps = useMemo(
    () =>
      buildGlbAnimationPreviewSceneProps({
        nodes,
        edges,
        flowNodeId: nodeId,
        catalogNodeId: "model-viewer",
        defaultConfig,
        liveAnimationWire: liveAnimationWire ?? null,
      }),
    [nodes, edges, nodeId, defaultConfig, liveAnimationWire],
  );

  const sceneProps = useMemo((): RotationPreviewSceneProps => {
    const orientation = rotationPreviewOrientationFromTransformWire(liveTransformWire ?? null);
    return {
      ...orientation,
      ...glbScalarSceneProps,
      ...glbAnimationSceneProps,
      meshOrientationFromEulerFallback: false,
      showGrid,
      scene3d,
      stagePhysicsWire,
      stagePhysicsColliders,
    };
  }, [
    showGrid,
    scene3d,
    glbScalarSceneProps,
    glbAnimationSceneProps,
    liveTransformWire,
    stagePhysicsWire,
    stagePhysicsColliders,
  ]);

  const visionHudNodes = useMemo(
    () => (graphHasVisionHudNodes(nodes) ? nodes : []),
    [nodes],
  );

  return (
    <StudioSceneViewport
      title="3D Model"
      sceneProps={sceneProps}
      previewScopeId={`flow-node:${nodeId}`}
      visionHudNodes={visionHudNodes}
      visionHudEdges={edges}
      emptyHint={logicalModelUrl.length === 0 ? MODEL_VIEWER_EMPTY_HINT : undefined}
    />
  );
}
