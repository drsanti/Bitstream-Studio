import type { ComponentType } from "react";
import type { NodeInspectorSettingsSectionProps } from "./node-inspector-settings-types";
import { BooleanConstantSettingsSection } from "./sections/BooleanConstantSettingsSection";
import { CompareSettingsSection } from "./sections/CompareSettingsSection";
import { ClampSettingsSection } from "./sections/ClampSettingsSection";
import { EnvironmentSettingsSection } from "./sections/EnvironmentSettingsSection";
import { GlbMaterialTextureSettingsSection } from "./sections/GlbMaterialTextureSettingsSection";
import { GlbAnimationBundleConnectionSection } from "./sections/GlbAnimationBundleConnectionSection";
import { GlbMaterialParamSettingsSection } from "./sections/GlbMaterialParamSettingsSection";
import { GlbMaterialColorSettingsSection } from "./sections/GlbMaterialColorSettingsSection";
import { MaterialMixSettingsSection } from "./sections/MaterialMixSettingsSection";
import { LogicGateSettingsSection } from "./sections/LogicGateSettingsSection";
import { MultiplexerSettingsSection } from "./sections/MultiplexerSettingsSection";
import { LedIndicatorSettingsSection } from "./sections/LedIndicatorSettingsSection";
import { LowPassSettingsSection } from "./sections/LowPassSettingsSection";
import { MapRangeSettingsSection } from "./sections/MapRangeSettingsSection";
import { ValueNormalizerSettingsSection } from "./sections/ValueNormalizerSettingsSection";
import { BarMeterSettingsSection } from "./sections/BarMeterSettingsSection";
import { KnobSettingsSection } from "./sections/KnobSettingsSection";
import { NumericDisplaySettingsSection } from "./sections/NumericDisplaySettingsSection";
import { RadialGaugeSettingsSection } from "./sections/RadialGaugeSettingsSection";
import { MathSettingsSection } from "./sections/MathSettingsSection";
import { NumberConstantSettingsSection } from "./sections/NumberConstantSettingsSection";
import { EventSetBooleanSettingsSection } from "./sections/EventSetBooleanSettingsSection";
import { EventTriggerGlbAnimSettingsSection } from "./sections/EventGlbAnimSettingsSection";
import {
  EventSetGlbPartSettingsSection,
  EventToggleGlbPartSettingsSection,
} from "./sections/EventGlbPartSettingsSections";
import { OnClickSettingsSection } from "./sections/OnClickSettingsSection";
import { OnStagePickSettingsSection } from "./sections/OnStagePickSettingsSection";
import { OnKeySettingsSection } from "./sections/OnKeySettingsSection";
import { PlotterSettingsSection } from "./sections/PlotterSettingsSection";
import { SensorInputSettingsSection } from "./sections/SensorInputSettingsSection";
import { VectorQuaternionMathSettingsSection } from "./sections/VectorQuaternionMathSettingsSection";
import { SparklineSettingsSection } from "./sections/SparklineSettingsSection";
import { ThresholdSettingsSection } from "./sections/ThresholdSettingsSection";
import { TransformFromEulerSettingsSection } from "./sections/TransformFromEulerSettingsSection";
import {
  AudioOutputSettingsSection,
  AudioFilePlayerSettingsSection,
  AudioOscillatorSettingsSection,
  AudioScopeSettingsSection,
  AudioMachineSettingsSection,
  AudioSfxSettingsSection,
  MicInputSettingsSection,
} from "./sections/AudioSettingsSections";
import { SceneOutputSettingsSection } from "./sections/SceneOutputSettingsSection";
import { StudioModelSettingsSection } from "./sections/StudioModelSettingsSection";

const VECTOR_QUATERNION_MATH_INSPECTOR_SECTIONS = {
  "vector-add": VectorQuaternionMathSettingsSection,
  "compare-vector-length": VectorQuaternionMathSettingsSection,
} as const;

/**
 * Catalog `nodeId` → settings UI for the Node Inspector **Node** tab (above JSON / rotation blocks).
 * Add a new entry when a node needs typed fields; unknown ids render no extra section.
 */
export const NODE_INSPECTOR_SETTINGS_SECTION_BY_NODE_ID: Partial<
  Record<string, ComponentType<NodeInspectorSettingsSectionProps>>
> = {
  threshold: ThresholdSettingsSection,
  "map-range": MapRangeSettingsSection,
  clamp: ClampSettingsSection,
  "low-pass": LowPassSettingsSection,
  "radial-gauge": RadialGaugeSettingsSection,
  "bar-meter": BarMeterSettingsSection,
  knob: KnobSettingsSection,
  "numeric-display": NumericDisplaySettingsSection,
  "led-indicator": LedIndicatorSettingsSection,
  sparkline: SparklineSettingsSection,
  plotter: PlotterSettingsSection,
  /** @deprecated Migrated to `plotter` on hydrate. */
  oscilloscope: PlotterSettingsSection,
  "sensor-input": SensorInputSettingsSection,
  environment: EnvironmentSettingsSection,
  "model-select": StudioModelSettingsSection,
  "scene-output": SceneOutputSettingsSection,
  "glb-animation-bundle": GlbAnimationBundleConnectionSection,
  "boolean-constant": BooleanConstantSettingsSection,
  "number-constant": NumberConstantSettingsSection,
  "float-constant": NumberConstantSettingsSection,
  "integer-constant": NumberConstantSettingsSection,
  "glb-material-param": GlbMaterialParamSettingsSection,
  "glb-material-texture": GlbMaterialTextureSettingsSection,
  "glb-material-color": GlbMaterialColorSettingsSection,
  "material-mix": MaterialMixSettingsSection,
  math: MathSettingsSection,
  compare: CompareSettingsSection,
  "logic-gate": LogicGateSettingsSection,
  multiplexer: MultiplexerSettingsSection,
  "value-normalizer": ValueNormalizerSettingsSection,
  "transform-from-euler": TransformFromEulerSettingsSection,
  "on-key": OnKeySettingsSection,
  "on-click": OnClickSettingsSection,
  "on-stage-pick": OnStagePickSettingsSection,
  "event-set-boolean": EventSetBooleanSettingsSection,
  "event-toggle-glb-part": EventToggleGlbPartSettingsSection,
  "event-set-glb-part": EventSetGlbPartSettingsSection,
  "event-trigger-glb-anim": EventTriggerGlbAnimSettingsSection,
  "mic-input": MicInputSettingsSection,
  "audio-output": AudioOutputSettingsSection,
  "audio-scope": AudioScopeSettingsSection,
  "audio-file-player": AudioFilePlayerSettingsSection,
  "audio-oscillator": AudioOscillatorSettingsSection,
  "audio-sfx": AudioSfxSettingsSection,
  "audio-machine": AudioMachineSettingsSection,
  ...VECTOR_QUATERNION_MATH_INSPECTOR_SECTIONS,
};
