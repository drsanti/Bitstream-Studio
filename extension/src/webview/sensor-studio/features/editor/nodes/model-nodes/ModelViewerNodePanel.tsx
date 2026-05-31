import { useMemo } from "react";
import { RotationPreviewPanelV4 } from "../rotation/RotationPreviewPanelV4";
import {
  coerceScene3DConfigV1,
  defaultScene3DConfig,
  type Scene3DConfigV1,
} from "../rotation/scene3d-config";
import type { RotationPreviewSceneProps } from "../../../../../bitstream-app/components/3d-rotation/shared/RotationPreviewScene";
import type { FlowWireEnvironmentV1 } from "../environment/flow-wire-environment";
import { mergeFlowWireEnvironmentIntoScene3d } from "../environment/flow-wire-environment";
import type { FlowWireCameraV1 } from "../camera-view/flow-wire-camera";
import { mergeFlowWireCameraIntoScene3d } from "../camera-view/flow-wire-camera";
import type { FlowWireAnimationV1 } from "../animation/flow-wire-animation";
import { buildGlbAnimationPreviewSceneProps } from "../../gltf/build-glb-animation-preview-scene-props";
import type { FlowWireTransformV1 } from "../transform/flow-wire-transform";
import { mergeFlowWireTransformIntoScene3d } from "../transform/flow-wire-transform";
import { rotationPreviewOrientationFromTransformWire } from "../transform/flow-wire-transform-preview-orientation";
import { resolveStudioModelScopeNodeId, resolveStudioSourceModelGlbUrl } from "../../model/model-generated-bindings";
import { collectGlbScalarDrivesForModel } from "../../gltf/studio-glb-flow-drives";
import { useFlowEditorStore } from "../../store/flow-editor.store";

export type ModelViewerNodePanelProps = {
  nodeId: string;
  liveValue: unknown;
  liveEnvironmentWire?: FlowWireEnvironmentV1 | null;
  liveCameraWire?: FlowWireCameraV1 | null;
  liveAnimationWire?: FlowWireAnimationV1 | null;
  liveTransformWire?: FlowWireTransformV1 | null;
  defaultConfig: Record<string, unknown>;
};

function readBoolean(cfg: Record<string, unknown>, key: string, fallback: boolean): boolean {
  const v = cfg[key];
  return typeof v === "boolean" ? v : fallback;
}

const MODEL_VIEWER_EMPTY_HINT =
  "Wire a Studio Model node (drag a GLB from Asset Browser onto the canvas, or add Studio Model from the palette).";

/**
 * Flow node: GLTF preview driven by the incoming **Model** wire (fetchable GLB URL).
 * No silent default mesh — stays empty until wired or linked to a configured Studio Model.
 */
export function ModelViewerNodePanel(props: ModelViewerNodePanelProps) {
  const { nodeId, liveValue, liveEnvironmentWire, liveCameraWire, liveAnimationWire, liveTransformWire, defaultConfig } = props;

  const nodes = useFlowEditorStore((s) => s.nodes);
  const edges = useFlowEditorStore((s) => s.edges);
  const sourceModelNodeId = useMemo(
    () =>
      resolveStudioModelScopeNodeId({
        nodes,
        edges,
        defaultConfig,
        flowNodeId: nodeId,
        catalogNodeId: "model-viewer",
      }),
    [nodes, edges, defaultConfig, nodeId],
  );

  const glbDrives = useMemo(
    () => collectGlbScalarDrivesForModel(nodes, sourceModelNodeId, edges),
    [nodes, edges, sourceModelNodeId],
  );

  const wiredUrl =
    typeof liveValue === "string" && liveValue.trim().length > 0 ? liveValue.trim() : "";
  const linkedModelUrl = useMemo(
    () => resolveStudioSourceModelGlbUrl(nodes, sourceModelNodeId || undefined),
    [nodes, sourceModelNodeId],
  );
  const fallbackRaw = defaultConfig.fallbackModelUrl;
  const fallback =
    typeof fallbackRaw === "string" && fallbackRaw.trim().length > 0 ? fallbackRaw.trim() : "";

  /** Persisted / wired key only — {@link RotationPreviewPanelV4} resolves fetch URL internally. */
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
      },
    };
    const withEnv = mergeFlowWireEnvironmentIntoScene3d(withModel, liveEnvironmentWire ?? null);
    const withCam = mergeFlowWireCameraIntoScene3d(withEnv, liveCameraWire ?? null);
    return mergeFlowWireTransformIntoScene3d(withCam, liveTransformWire ?? null);
  }, [defaultConfig.scene3d, logicalModelUrl, liveEnvironmentWire, liveCameraWire, liveTransformWire]);

  const showGrid = readBoolean(defaultConfig, "showGrid", true);

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
    const morphKeys = Object.keys(glbDrives.morphs);
    const lightKeys = Object.keys(glbDrives.lights);
    const partKeys = Object.keys(glbDrives.parts);
    const materialKeys = Object.keys(glbDrives.materials);
    const cameraKeys = Object.keys(glbDrives.cameras);
    const orientation = rotationPreviewOrientationFromTransformWire(liveTransformWire ?? null);
    return {
      ...orientation,
      ...glbAnimationSceneProps,
      meshOrientationFromEulerFallback: false,
      showGrid,
      scene3d,
      glbMorphWeights: morphKeys.length > 0 ? glbDrives.morphs : undefined,
      glbLightIntensityByName: lightKeys.length > 0 ? glbDrives.lights : undefined,
      glbPartVisibilityByPath: partKeys.length > 0 ? glbDrives.parts : undefined,
      glbMaterialEmissiveByName: materialKeys.length > 0 ? glbDrives.materials : undefined,
      glbCameraDriveByName: cameraKeys.length > 0 ? glbDrives.cameras : undefined,
    };
  }, [showGrid, scene3d, glbDrives, glbAnimationSceneProps, liveTransformWire]);

  return (
    <RotationPreviewPanelV4
      title="3D Model"
      sceneProps={sceneProps}
      emptyHint={logicalModelUrl.length === 0 ? MODEL_VIEWER_EMPTY_HINT : undefined}
    />
  );
}
