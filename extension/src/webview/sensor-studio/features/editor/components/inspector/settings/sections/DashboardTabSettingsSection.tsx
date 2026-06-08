import { InspectorNumericField } from "../../InspectorNumericScrubRow";
import { InspectorCompactToggleRow } from "../../InspectorCompactToggleRow";
import { InspectorSettingsSectionFrame } from "../../InspectorSettingsSectionFrame";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";
import { DashboardOpenLink } from "../../../../../dashboard/DashboardOpenLink";

export function DashboardTabSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField, onUpdateLabel } = props;
  const dc = selectedNode.data.defaultConfig as Record<string, unknown>;
  const title = typeof dc.title === "string" ? dc.title : "Tab";
  const order = typeof dc.order === "number" && Number.isFinite(dc.order) ? dc.order : 0;
  const enabled = dc.enabled !== false;

  return (
    <InspectorSettingsSectionFrame title="Dashboard Tab">
      <div className="mb-2 flex justify-end">
        <DashboardOpenLink sourceNodeId={selectedNode.id} label="Open Dashboard" />
      </div>
      <p className="mb-3 text-[11px] leading-relaxed text-zinc-500">
        Multi-page HMI tab. Wire child dashboard widgets into{" "}
        <span className="font-medium text-zinc-400">Widgets</span>; wire{" "}
        <span className="font-medium text-zinc-400">Tab</span> into Dashboard Output{" "}
        <span className="font-medium text-zinc-400">Tabs</span>.
      </p>
      <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-zinc-500">
        Tab label
      </label>
      <input
        type="text"
        className="mb-2 w-full rounded-md border border-zinc-700/80 bg-zinc-900/60 px-2 py-1.5 text-[12px] text-zinc-100 outline-none focus:border-cyan-500/50"
        value={title}
        onChange={(e) => {
          onUpdateConfigField("title", e.target.value);
          onUpdateLabel(e.target.value);
        }}
      />
      <InspectorNumericField
        label="Tab order"
        description="Lower numbers appear first in the tab bar."
        ariaLabel="Dashboard tab sort order"
        value={order}
        step={1}
        onCommit={(next) => onUpdateConfigField("order", next)}
      />
      <InspectorCompactToggleRow
        label="Enabled"
        hint="Disabled tabs are hidden from the operator tab bar."
        checked={enabled}
        onCheckedChange={(next) => onUpdateConfigField("enabled", next)}
      />
    </InspectorSettingsSectionFrame>
  );
}
