/**
 * Lazy-loaded flow node panels and chrome for {@link StudioNodeCard}.
 * Keeps the initial Sensor Studio workspace import graph small in Vite dev.
 */
import {
  lazy,
  Suspense,
  type ComponentType,
  type ReactNode,
} from "react";

function lazyNamed<T extends Record<string, ComponentType<object>>>(
  factory: () => Promise<T>,
  exportName: keyof T,
): ReturnType<typeof lazy<ComponentType<object>>> {
  return lazy(() =>
    factory().then((module) => ({
      default: module[exportName] as ComponentType<object>,
    })),
  );
}

export const LazyModelSelectNodePanel = lazyNamed(
  () => import("./model-nodes/ModelSelectNodePanel"),
  "ModelSelectNodePanel",
);
export const LazyGlbMaterialTextureNodePanel = lazyNamed(
  () => import("./material/GlbMaterialTextureNodePanel"),
  "GlbMaterialTextureNodePanel",
);
export const LazyGlbMaterialColorNodePanel = lazyNamed(
  () => import("./material/GlbMaterialColorNodePanel"),
  "GlbMaterialColorNodePanel",
);
export const LazyMeshMaterialNodePanel = lazyNamed(
  () => import("./material/MeshMaterialNodePanel"),
  "MeshMaterialNodePanel",
);
export const LazyMeshGroupNodePanel = lazyNamed(
  () => import("./mesh/MeshGroupNodePanel"),
  "MeshGroupNodePanel",
);
export const LazyMeshPrimitiveNodePanel = lazyNamed(
  () => import("./mesh/MeshPrimitiveNodePanel"),
  "MeshPrimitiveNodePanel",
);
export const LazyMathNodePanel = lazyNamed(
  () => import("./math/MathNodePanel"),
  "MathNodePanel",
);
export const LazyCompareNodePanel = lazyNamed(
  () => import("./math/CompareNodePanel"),
  "CompareNodePanel",
);
export const LazyCompareOperationHeaderChip = lazyNamed(
  () => import("./math/CompareNodePanel"),
  "CompareOperationHeaderChip",
);
export const LazyLogicGateNodePanel = lazyNamed(
  () => import("./math/LogicGateNodePanel"),
  "LogicGateNodePanel",
);
export const LazyMultiplexerNodePanel = lazyNamed(
  () => import("./data/MultiplexerNodePanel"),
  "MultiplexerNodePanel",
);
export const LazyGlbAnimationBundleNodePanel = lazyNamed(
  () => import("./animation/glb-animation-bundle-node-panel"),
  "GlbAnimationBundleNodePanel",
);
export const LazyAnimationClipNodePanel = lazyNamed(
  () => import("./animation/animation-clip-node-panel"),
  "AnimationClipNodePanel",
);
export const LazyPartSpinNodePanel = lazyNamed(
  () => import("./scene/part-spin-node-panel"),
  "PartSpinNodePanel",
);
export const LazyModelViewerNodePanel = lazyNamed(
  () => import("./model-nodes/ModelViewerNodePanel"),
  "ModelViewerNodePanel",
);
export const LazyBooleanConstantNodePanel = lazyNamed(
  () => import("./constants/ConstantGeneratorPanels"),
  "BooleanConstantNodePanel",
);
export const LazyNumberConstantNodePanel = lazyNamed(
  () => import("./constants/ConstantGeneratorPanels"),
  "NumberConstantNodePanel",
);
export const LazyEnvironmentNodePanel = lazyNamed(
  () => import("./environment/EnvironmentNodePanel"),
  "EnvironmentNodePanel",
);
export const LazyCameraViewNodePanel = lazyNamed(
  () => import("./camera-view/CameraViewNodePanel"),
  "CameraViewNodePanel",
);
export const LazyStudioSceneViewport = lazyNamed(
  () => import("../../../core/viewport/StudioSceneViewport"),
  "StudioSceneViewport",
);
export const LazyPlotterCanvas = lazyNamed(
  () => import("./plotter/PlotterCanvas"),
  "PlotterCanvas",
);
export const LazySparklineNodePanel = lazyNamed(
  () => import("./sparkline/SparklineNodePanel"),
  "SparklineNodePanel",
);
export const LazyRadialGaugeNodePanel = lazyNamed(
  () => import("./radial-gauge/RadialGaugeNodePanel"),
  "RadialGaugeNodePanel",
);
export const LazyBarMeterNodePanel = lazyNamed(
  () => import("./bar-meter/BarMeterNodePanel"),
  "BarMeterNodePanel",
);
export const LazyLedIndicatorNodePanel = lazyNamed(
  () => import("./led-indicator/LedIndicatorNodePanel"),
  "LedIndicatorNodePanel",
);
export const LazyKnobNodePanel = lazyNamed(
  () => import("./knob/KnobNodePanel"),
  "KnobNodePanel",
);
export const LazyNumericDisplayNodePanel = lazyNamed(
  () => import("./numeric-display/NumericDisplayNodePanel"),
  "NumericDisplayNodePanel",
);

export const LazyAudioFilePlayerNodePanel = lazyNamed(
  () => import("./audio/AudioNodePanels"),
  "AudioFilePlayerNodePanel",
);
export const LazyAudioOscillatorNodePanel = lazyNamed(
  () => import("./audio/AudioNodePanels"),
  "AudioOscillatorNodePanel",
);
export const LazyAudioOutputNodePanel = lazyNamed(
  () => import("./audio/AudioNodePanels"),
  "AudioOutputNodePanel",
);
export const LazyAudioScopeNodePanel = lazyNamed(
  () => import("./audio/AudioNodePanels"),
  "AudioScopeNodePanel",
);
export const LazyAudioMachineNodePanel = lazyNamed(
  () => import("./audio/AudioNodePanels"),
  "AudioMachineNodePanel",
);
export const LazyAudioSfxNodePanel = lazyNamed(
  () => import("./audio/AudioNodePanels"),
  "AudioSfxNodePanel",
);
export const LazyMicInputNodePanel = lazyNamed(
  () => import("./audio/AudioNodePanels"),
  "MicInputNodePanel",
);

export const LazyAudioFilePlayerHeaderBadge = lazyNamed(
  () => import("./audio/AudioFilePlayerHeaderBadge"),
  "AudioFilePlayerHeaderBadge",
);
export const LazyAudioOscillatorHeaderBadge = lazyNamed(
  () => import("./audio/AudioOscillatorHeaderBadge"),
  "AudioOscillatorHeaderBadge",
);
export const LazyAudioOutputHeaderBadge = lazyNamed(
  () => import("./audio/AudioOutputHeaderBadge"),
  "AudioOutputHeaderBadge",
);
export const LazyAudioScopeHeaderBadge = lazyNamed(
  () => import("./audio/AudioScopeHeaderBadge"),
  "AudioScopeHeaderBadge",
);
export const LazyMicInputHeaderBadge = lazyNamed(
  () => import("./audio/MicInputHeaderBadge"),
  "MicInputHeaderBadge",
);

export const LazyCameraInputNodePanel = lazyNamed(
  () => import("./camera/CameraNodePanels"),
  "CameraInputNodePanel",
);
export const LazyVideoTextureNodePanel = lazyNamed(
  () => import("./camera/CameraNodePanels"),
  "VideoTextureNodePanel",
);
export const LazyMaterialVideoNodePanel = lazyNamed(
  () => import("./camera/MaterialVideoNodePanel"),
  "MaterialVideoNodePanel",
);
export const LazyCss3dCameraFeedNodePanel = lazyNamed(
  () => import("./camera/Css3dCameraFeedNodePanel"),
  "Css3dCameraFeedNodePanel",
);

export const LazyCameraInputHeaderBadge = lazyNamed(
  () => import("./camera/CameraInputHeaderBadge"),
  "CameraInputHeaderBadge",
);
export const LazyVideoTextureHeaderBadge = lazyNamed(
  () => import("./camera/VideoTextureHeaderBadge"),
  "VideoTextureHeaderBadge",
);
export const LazyMaterialVideoHeaderBadge = lazyNamed(
  () => import("./camera/MaterialVideoHeaderBadge"),
  "MaterialVideoHeaderBadge",
);
export const LazyCss3dCameraFeedHeaderBadge = lazyNamed(
  () => import("./camera/Css3dCameraFeedHeaderBadge"),
  "Css3dCameraFeedHeaderBadge",
);
export const LazyVisionPoseHeaderBadge = lazyNamed(
  () => import("./camera/VisionPoseHeaderBadge"),
  "VisionPoseHeaderBadge",
);
export const LazyVisionPoseNodePanel = lazyNamed(
  () => import("./camera/VisionPoseNodePanel"),
  "VisionPoseNodePanel",
);
export const LazyVisionFaceHeaderBadge = lazyNamed(
  () => import("./camera/VisionExpansionNodePanels"),
  "VisionFaceHeaderBadge",
);
export const LazyVisionFaceNodePanel = lazyNamed(
  () => import("./camera/VisionExpansionNodePanels"),
  "VisionFaceNodePanel",
);
export const LazyVisionHandsHeaderBadge = lazyNamed(
  () => import("./camera/VisionExpansionNodePanels"),
  "VisionHandsHeaderBadge",
);
export const LazyVisionHandsNodePanel = lazyNamed(
  () => import("./camera/VisionExpansionNodePanels"),
  "VisionHandsNodePanel",
);
export const LazyVisionLandmarksDebugHeaderBadge = lazyNamed(
  () => import("./camera/VisionExpansionNodePanels"),
  "VisionLandmarksDebugHeaderBadge",
);
export const LazyVisionLandmarksDebugNodePanel = lazyNamed(
  () => import("./camera/VisionExpansionNodePanels"),
  "VisionLandmarksDebugNodePanel",
);
export const LazyVisionObjectHeaderBadge = lazyNamed(
  () => import("./camera/VisionExpansionNodePanels"),
  "VisionObjectHeaderBadge",
);
export const LazyVisionObjectNodePanel = lazyNamed(
  () => import("./camera/VisionExpansionNodePanels"),
  "VisionObjectNodePanel",
);

export const LazyEventSetBooleanNodePanel = lazyNamed(
  () => import("./events/EventFlowNodePanels"),
  "EventSetBooleanNodePanel",
);
export const LazyEventSetGlbPartNodePanel = lazyNamed(
  () => import("./events/EventFlowNodePanels"),
  "EventSetGlbPartNodePanel",
);
export const LazyEventToggleBooleanNodePanel = lazyNamed(
  () => import("./events/EventFlowNodePanels"),
  "EventToggleBooleanNodePanel",
);
export const LazyEventToggleGlbPartNodePanel = lazyNamed(
  () => import("./events/EventFlowNodePanels"),
  "EventToggleGlbPartNodePanel",
);
export const LazyEventTriggerGlbAnimNodePanel = lazyNamed(
  () => import("./events/EventFlowNodePanels"),
  "EventTriggerGlbAnimNodePanel",
);
export const LazyOnClickNodePanel = lazyNamed(
  () => import("./events/EventFlowNodePanels"),
  "OnClickNodePanel",
);
export const LazyOnKeyNodePanel = lazyNamed(
  () => import("./events/EventFlowNodePanels"),
  "OnKeyNodePanel",
);

/** Minimal placeholder while a node panel chunk loads (in-canvas, not full-screen). */
export function StudioNodePanelSuspense({ children }: { children: ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}
