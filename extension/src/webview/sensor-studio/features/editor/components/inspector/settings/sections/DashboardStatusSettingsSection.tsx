import { Activity } from "lucide-react";
import { DashboardOpenLink } from "../../../../../dashboard/DashboardOpenLink";
import { InspectorSettingsSectionFrame } from "../../InspectorSettingsSectionFrame";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";
import { DashboardPlacementPanel } from "./DashboardPlacementPanel";
import { DashboardStatusLabelFields } from "./DashboardStatusLabelFields";

export function DashboardStatusSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField, onUpdateLabel } = props;
  const dc = selectedNode.data.defaultConfig as Record<string, unknown>;
  const label = typeof dc.label === "string" ? dc.label : "";

  return (
    <>
      <InspectorSettingsSectionFrame title="Dashboard Status">
        <div className="mb-2 flex justify-end">
          <DashboardOpenLink sourceNodeId={selectedNode.id} label="Open Dashboard" />
        </div>
        <p className="mb-3 text-[11px] leading-relaxed text-zinc-500">
          Renders a labeled status pill on the Dashboard pane. Wire a boolean into{" "}
          <span className="font-medium text-zinc-400">On</span> for live updates.
        </p>
        <div className="mt-2">
          <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-zinc-500">
            Status title
          </label>
          <input
            type="text"
            className="w-full rounded-md border border-zinc-700/80 bg-zinc-900/60 px-2 py-1.5 text-[12px] text-zinc-100 outline-none focus:border-cyan-500/50"
            value={label}
            onChange={(e) => {
              onUpdateConfigField("label", e.target.value);
              onUpdateLabel(e.target.value);
            }}
          />
        </div>
        <div className="mt-3">
          <DashboardStatusLabelFields {...props} />
        </div>
      </InspectorSettingsSectionFrame>
      <DashboardPlacementPanel {...props} />
    </>
  );
}
