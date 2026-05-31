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
import { EventSetBooleanSettingsSection } from "./sections/EventSetBooleanSettingsSection";
import { EventTriggerGlbAnimSettingsSection } from "./sections/EventGlbAnimSettingsSection";
import {
  EventSetGlbPartSettingsSection,
  EventToggleGlbPartSettingsSection,
} from "./sections/EventGlbPartSettingsSections";
import { OnClickSettingsSection } from "./sections/OnClickSettingsSection";
import { OnKeySettingsSection } from "./sections/OnKeySettingsSection";
import { PlotterSettingsSection } from "./sections/PlotterSettingsSection";
import { SensorInputSettingsSection } from "./sections/SensorInputSettingsSection";
import { SparklineSettingsSection } from "./sections/SparklineSettingsSection";
import { ThresholdSettingsSection } from "./sections/ThresholdSettingsSection";
import { TransformFromEulerSettingsSection } from "./sections/TransformFromEulerSettingsSection";

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
  gauge: GaugeSettingsSection,
  sparkline: SparklineSettingsSection,
  plotter: PlotterSettingsSection,
  /** @deprecated Migrated to `plotter` on hydrate. */
  oscilloscope: PlotterSettingsSection,
  "sensor-input": SensorInputSettingsSection,
  environment: EnvironmentSettingsSection,
  "glb-animation-bundle": GlbAnimationBundleSettingsSection,
  "boolean-constant": BooleanConstantSettingsSection,
  "number-constant": NumberConstantSettingsSection,
  "transform-from-euler": TransformFromEulerSettingsSection,
  "on-key": OnKeySettingsSection,
  "on-click": OnClickSettingsSection,
  "event-set-boolean": EventSetBooleanSettingsSection,
  "event-toggle-glb-part": EventToggleGlbPartSettingsSection,
  "event-set-glb-part": EventSetGlbPartSettingsSection,
  "event-trigger-glb-anim": EventTriggerGlbAnimSettingsSection,
};
