import type { ComponentType } from "react";
import type { NodeInspectorSettingsSectionProps } from "./node-inspector-settings-types";
import { BooleanConstantSettingsSection } from "./sections/BooleanConstantSettingsSection";
import { ClampSettingsSection } from "./sections/ClampSettingsSection";
import { EnvironmentSettingsSection } from "./sections/EnvironmentSettingsSection";
import { GlbAnimationBundleSettingsSection } from "./sections/GlbAnimationBundleSettingsSection";
import { GaugeSettingsSection } from "./sections/GaugeSettingsSection";
import { LowPassSettingsSection } from "./sections/LowPassSettingsSection";
import { MapRangeSettingsSection } from "./sections/MapRangeSettingsSection";
import { NumberConstantSettingsSection } from "./sections/NumberConstantSettingsSection";
import { OscilloscopeSettingsSection } from "./sections/OscilloscopeSettingsSection";
import { SensorInputSettingsSection } from "./sections/SensorInputSettingsSection";
import { SparklineSettingsSection } from "./sections/SparklineSettingsSection";
import { ThresholdSettingsSection } from "./sections/ThresholdSettingsSection";

/**
 * Catalog `nodeId` → settings UI for the Node Inspector **Settings** tab (above JSON / rotation blocks).
 * Add a new entry when a node needs typed fields; unknown ids render no extra section.
 */
export const NODE_INSPECTOR_SETTINGS_SECTION_BY_NODE_ID: Partial<
  Record<string, ComponentType<NodeInspectorSettingsSectionProps>>
> = {
  threshold: ThresholdSettingsSection,
  "map-range": MapRangeSettingsSection,
  clamp: ClampSettingsSection,
  "low-pass": LowPassSettingsSection,
  gauge: GaugeSettingsSection,
  sparkline: SparklineSettingsSection,
  oscilloscope: OscilloscopeSettingsSection,
  "sensor-input": SensorInputSettingsSection,
  environment: EnvironmentSettingsSection,
  "glb-animation-bundle": GlbAnimationBundleSettingsSection,
  "boolean-constant": BooleanConstantSettingsSection,
  "number-constant": NumberConstantSettingsSection,
};
