import { TRNToggleSwitch } from "../../../../../../../ui/TRN";
import { DashboardOpenLink } from "../../../../../dashboard/DashboardOpenLink";
import { InspectorSettingsSectionFrame } from "../../InspectorSettingsSectionFrame";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";
import { DashboardPlacementPanel } from "./DashboardPlacementPanel";

export function DashboardSwitchSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField, onUpdateLabel } = props;
  const dc = selectedNode.data.defaultConfig as Record<string, unknown>;
  const label = typeof dc.label === "string" ? dc.label : "";
  const value = typeof dc.value === "boolean" ? dc.value : false;

  return (
    <>
      <InspectorSettingsSectionFrame title="Dashboard Switch">
        <div className="mb-2 flex justify-end">
          <DashboardOpenLink sourceNodeId={selectedNode.id} label="Open Dashboard" />
        </div>
        <p className="mb-3 text-[11px] leading-relaxed text-zinc-500">
          Renders on the Dashboard pane. Wire <span className="font-medium text-zinc-400">Out</span>{" "}
          into boolean consumers (LED, compare, Set Boolean, etc.).
        </p>
        <div className="mt-2">
          <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-zinc-500">
            Switch label
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
        <div className="mt-3 flex items-center justify-between rounded border border-zinc-800/80 bg-zinc-950/50 px-2 py-2">
          <span className="text-[11px] text-zinc-400">Default state</span>
          <TRNToggleSwitch
            checked={value}
            ariaLabel="Dashboard switch default value"
            onCheckedChange={(checked) => onUpdateConfigField("value", checked)}
          />
        </div>
      </InspectorSettingsSectionFrame>
      <DashboardPlacementPanel {...props} />
    </>
  );
}
