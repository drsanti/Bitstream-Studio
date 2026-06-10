import { TRNGridPlacementBadgedFields } from "../../../../../../../ui/TRN/TRNGridPlacementBadgedFields";
import { TRNHintText } from "../../../../../../../ui/TRN/TRNHintText";
import { coerceDashboardPlacementV1 } from "../../../../../../core/dashboard/dashboard-placement";
import { InspectorSettingsSectionFrame } from "../../InspectorSettingsSectionFrame";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";

const DASHBOARD_PLACEMENT_LIMITS = {
  columnMax: 24,
  rowMax: 48,
  columnSpanMax: 24,
  rowSpanMax: 12,
} as const;

export function DashboardPlacementSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField } = props;
  const dc = selectedNode.data.defaultConfig as Record<string, unknown>;
  const placement = coerceDashboardPlacementV1(dc.placement);

  return (
    <InspectorSettingsSectionFrame title="Placement">
      <TRNHintText className="mb-2.5 !text-[11px]">
        Grid position on the <span className="font-medium text-zinc-400">Dashboard</span> workbench
        pane (1-based row and column). Width and height are cell spans.
      </TRNHintText>
      <TRNGridPlacementBadgedFields
        placement={placement}
        limits={DASHBOARD_PLACEMENT_LIMITS}
        layout="grid"
        onPatch={(patch) => {
          onUpdateConfigField("placement", { ...placement, ...patch });
        }}
      />
    </InspectorSettingsSectionFrame>
  );
}
