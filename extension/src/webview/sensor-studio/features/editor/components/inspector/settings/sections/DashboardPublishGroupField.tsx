import { useMemo } from "react";
import { DASHBOARD_GROUP_NODE_ID } from "../../../../../../core/dashboard/evaluate-dashboard-snapshot";
import { useFlowEditorStore } from "../../../../store/flow-editor.store";
import { InspectorSelectRow } from "../../InspectorDenseControls";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";

const TOP_LEVEL_VALUE = "__top__";

export function DashboardPublishGroupField(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField } = props;
  const flowNodes = useFlowEditorStore((s) => s.nodes);

  const groupOptions = useMemo(() => {
    const rows: { value: string; label: string }[] = [
      { value: TOP_LEVEL_VALUE, label: "Top level" },
    ];
    for (const node of flowNodes) {
      if (node.data.nodeId !== DASHBOARD_GROUP_NODE_ID || node.id === selectedNode.id) {
        continue;
      }
      const label =
        typeof node.data.label === "string" && node.data.label.trim().length > 0
          ? node.data.label.trim()
          : "Dashboard Group";
      rows.push({ value: node.id, label });
    }
    return rows;
  }, [flowNodes, selectedNode.id]);

  if (groupOptions.length <= 1) {
    return null;
  }

  const dc = selectedNode.data.defaultConfig as Record<string, unknown>;
  const groupIdRaw = typeof dc.dashboardGroupId === "string" ? dc.dashboardGroupId.trim() : "";
  const selectedValue = groupIdRaw.length > 0 ? groupIdRaw : TOP_LEVEL_VALUE;

  return (
    <InspectorSelectRow
      label="Dashboard group"
      description="Nest this published widget inside a wired Dashboard Group grid."
      ariaLabel="Dashboard group target"
      value={selectedValue}
      options={groupOptions}
      onChange={(next) => {
        onUpdateConfigField("dashboardGroupId", next === TOP_LEVEL_VALUE ? "" : next);
      }}
    />
  );
}
