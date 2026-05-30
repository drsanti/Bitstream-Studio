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
import { mergeFlowWireAnimationIntoClipDrives } from "../animation/flow-wire-animation";
import {
  readSourceModelNodeId,
  resolveStudioSourceModelGlbUrl,
} from "../../model/model-generated-bindings";
import { collectGlbScalarDrivesForModel } from "../../gltf/studio-glb-flow-drives";
import { useFlowEditorStore } from "../../store/flow-editor.store";

export type ModelViewerNodePanelProps = {
  liveValue: unknown;
  liveEnvironmentWire?: FlowWireEnvironmentV1 | null;
  liveCameraWire?: FlowWireCameraV1 | null;
  liveAnimationWire?: FlowWireAnimationV1 | null;
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
  const { liveValue, liveEnvironmentWire, liveCameraWire, liveAnimationWire, defaultConfig } = props;

  const sourceModelNodeId = readSourceModelNodeId(defaultConfig) ?? "";

  /** Subscribe to `nodes` only — a selector that returns a fresh object each run breaks `useSyncExternalStore` snapshots. */
  const nodes = useFlowEditorStore((s) => s.nodes);
  const glbDrives = useMemo(
    () => collectGlbScalarDrivesForModel(nodes, sourceModelNodeId),
    [nodes, sourceModelNodeId],
  );

  const wiredUrl =
    typeof liveValue === "string" && liveValue.trim().length > 0 ? liveValue.trim() : "";
  const linkedModelUrl = useMemo(
    () => resolveStudioSourceModelGlbUrl(nodes, sourceModelNodeId),
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
    return mergeFlowWireCameraIntoScene3d(withEnv, liveCameraWire ?? null);
  }, [defaultConfig.scene3d, logicalModelUrl, liveEnvironmentWire, liveCameraWire]);

  const showGrid = readBoolean(defaultConfig, "showGrid", true);

  const sceneProps = useMemo((): RotationPreviewSceneProps => {
    const morphKeys = Object.keys(glbDrives.morphs);
    const lightKeys = Object.keys(glbDrives.lights);
    const partKeys = Object.keys(glbDrives.parts);
    const materialKeys = Object.keys(glbDrives.materials);
    const cameraKeys = Object.keys(glbDrives.cameras);
    const mergedAnim = mergeFlowWireAnimationIntoClipDrives({
      scalarTimesByClipName: glbDrives.anims,
      wire: liveAnimationWire ?? null,
    });
    const mergedAnimKeys = Object.keys(mergedAnim.times);
    const scaleKeys = Object.keys(mergedAnim.scales);
    const loopKeys = Object.keys(mergedAnim.loops);
    const weightKeys = Object.keys(mergedAnim.weights);
    return {
      qw: 1,
      qx: 0,
      qy: 0,
      qz: 0,
      fusionEulerHundredths: null,
      meshOrientationFromEulerFallback: false,
      eulerOnly: false,
      showGrid,
      scene3d,
      glbMorphWeights: morphKeys.length > 0 ? glbDrives.morphs : undefined,
      glbLightIntensityByName: lightKeys.length > 0 ? glbDrives.lights : undefined,
      glbAnimationTimeByClipName: mergedAnimKeys.length > 0 ? mergedAnim.times : undefined,
      glbAnimationTimeScaleByClipName: scaleKeys.length > 0 ? mergedAnim.scales : undefined,
      glbAnimationLoopByClipName: loopKeys.length > 0 ? mergedAnim.loops : undefined,
      glbAnimationWeightByClipName: weightKeys.length > 0 ? mergedAnim.weights : undefined,
      glbAnimationClipDrivesByName:
        Object.keys(mergedAnim.drives).length > 0 ? mergedAnim.drives : undefined,
      glbPartVisibilityByPath: partKeys.length > 0 ? glbDrives.parts : undefined,
      glbMaterialEmissiveByName: materialKeys.length > 0 ? glbDrives.materials : undefined,
      glbCameraDriveByName: cameraKeys.length > 0 ? glbDrives.cameras : undefined,
    };
  }, [showGrid, scene3d, glbDrives, liveAnimationWire]);

  return (
    <RotationPreviewPanelV4
      title="3D Model"
      sceneProps={sceneProps}
      emptyHint={logicalModelUrl.length === 0 ? MODEL_VIEWER_EMPTY_HINT : undefined}
    />
  );
}
