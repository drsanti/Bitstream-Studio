import { useMemo } from "react";
import { DASHBOARD_TAB_NODE_ID } from "../../../../../../core/dashboard/evaluate-dashboard-snapshot";
import { useFlowEditorStore } from "../../../../store/flow-editor.store";
import { InspectorSelectRow } from "../../InspectorDenseControls";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";

const TOP_LEVEL_VALUE = "__top__";

export function DashboardPublishTabField(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField } = props;
  const flowNodes = useFlowEditorStore((s) => s.nodes);

  const tabOptions = useMemo(() => {
    const rows: { value: string; label: string }[] = [];
    const outputPresent = flowNodes.some((n) => n.data.nodeId === "dashboard-output");
    if (!outputPresent) {
      return rows;
    }
    for (const node of flowNodes) {
      if (node.data.nodeId !== DASHBOARD_TAB_NODE_ID) {
        continue;
      }
      const label =
        typeof node.data.label === "string" && node.data.label.trim().length > 0
          ? node.data.label.trim()
          : "Dashboard Tab";
      rows.push({ value: node.id, label });
    }
    return rows;
  }, [flowNodes]);

  if (tabOptions.length === 0) {
    return null;
  }

  const dc = selectedNode.data.defaultConfig as Record<string, unknown>;
  const tabIdRaw = typeof dc.dashboardTabId === "string" ? dc.dashboardTabId.trim() : "";
  const selectedValue = tabIdRaw.length > 0 ? tabIdRaw : TOP_LEVEL_VALUE;

  return (
    <InspectorSelectRow
      label="Dashboard tab"
      description="Required when Dashboard Output uses Tabs — pick which tab page shows this widget."
      ariaLabel="Dashboard tab target"
      value={selectedValue}
      options={[
        { value: TOP_LEVEL_VALUE, label: "Select tab…" },
        ...tabOptions,
      ]}
      onChange={(next) => {
        onUpdateConfigField("dashboardTabId", next === TOP_LEVEL_VALUE ? "" : next);
      }}
    />
  );
}
