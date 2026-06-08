import { useDashboardSceneStore } from "../../../../../../state/dashboard-scene.store";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";
import { DashboardFlexPlacementSettingsSection } from "./DashboardFlexPlacementSettingsSection";
import { DashboardPlacementSettingsSection } from "./DashboardPlacementSettingsSection";

/** Grid or flex placement fields based on committed Dashboard Output layout mode. */
export function DashboardPlacementPanel(props: NodeInspectorSettingsSectionProps) {
  const layoutMode = useDashboardSceneStore((s) => s.snapshot.layout.mode);
  if (layoutMode === "flex") {
    return <DashboardFlexPlacementSettingsSection {...props} />;
  }
  return <DashboardPlacementSettingsSection {...props} />;
}
