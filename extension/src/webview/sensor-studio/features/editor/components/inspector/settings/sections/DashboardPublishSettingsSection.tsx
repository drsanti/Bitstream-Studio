import { LayoutGrid } from "lucide-react";
import { TRNHintText } from "../../../../../../../ui/TRN/TRNHintText";
import { useDashboardSceneStore } from "../../../../../../state/dashboard-scene.store";
import { DashboardOpenLink } from "../../../../../dashboard/DashboardOpenLink";
import { InspectorCollapsibleSection } from "../../InspectorCollapsibleSection";
import { InspectorCompactToggleRow } from "../../InspectorCompactToggleRow";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";
import { DashboardPlacementPanel } from "./DashboardPlacementPanel";
import { DashboardPublishGroupField } from "./DashboardPublishGroupField";
import { DashboardPublishTabField } from "./DashboardPublishTabField";

/**
 * Publish existing flow output / control nodes to the Dashboard without a Widget wire.
 */
export function DashboardPublishSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField } = props;
  const dc = selectedNode.data.defaultConfig as Record<string, unknown>;
  const publish = dc.publishToDashboard === true;
  const hasDashboardOutput = useDashboardSceneStore(
    (s) => s.snapshot.dashboardOutputNodeId != null,
  );

  return (
    <InspectorCollapsibleSection
      title="Dashboard"
      icon={<LayoutGrid className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
      iconHint="Mirror this node on the Dashboard pane when Dashboard Output is present — no Widget wire required."
      defaultExpanded={publish}
    >
      <InspectorCompactToggleRow
        label="Show on Dashboard"
        hint="When enabled, this node appears on the committed Dashboard layout alongside wired dashboard-* widgets."
        checked={publish}
        onCheckedChange={(next) => onUpdateConfigField("publishToDashboard", next)}
      />
      {publish && !hasDashboardOutput ? (
        <TRNHintText tone="warn">
          Add a Dashboard Output node to commit layout and theme.
        </TRNHintText>
      ) : null}
      {publish ? (
        <>
          <div className="flex justify-end">
            <DashboardOpenLink sourceNodeId={selectedNode.id} label="Open Dashboard" />
          </div>
          <DashboardPublishTabField {...props} />
          <DashboardPublishGroupField {...props} />
          <DashboardPlacementPanel {...props} />
        </>
      ) : null}
    </InspectorCollapsibleSection>
  );
}
