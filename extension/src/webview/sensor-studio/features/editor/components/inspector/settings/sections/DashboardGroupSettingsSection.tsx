import { InspectorNumericField } from "../../InspectorNumericScrubRow";
import { InspectorCompactToggleRow } from "../../InspectorCompactToggleRow";
import { InspectorSettingsSectionFrame } from "../../InspectorSettingsSectionFrame";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";
import { coerceDashboardGroupLayoutV1 } from "../../../../../../core/dashboard/dashboard-group-layout";
import { DashboardOpenLink } from "../../../../../dashboard/DashboardOpenLink";
import { DashboardPlacementPanel } from "./DashboardPlacementPanel";

export function DashboardGroupSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField, onUpdateLabel } = props;
  const dc = selectedNode.data.defaultConfig as Record<string, unknown>;
  const groupLayout = coerceDashboardGroupLayoutV1(dc.groupLayout);
  const title = typeof dc.title === "string" ? dc.title : "Group";
  const showTitle = dc.showTitle !== false;
  const showBorder = dc.showBorder !== false;

  const patchGroupLayout = (patch: Partial<typeof groupLayout>) => {
    onUpdateConfigField("groupLayout", { ...groupLayout, ...patch });
  };

  return (
    <>
      <InspectorSettingsSectionFrame title="Dashboard Group">
        <div className="mb-2 flex justify-end">
          <DashboardOpenLink sourceNodeId={selectedNode.id} label="Open Dashboard" />
        </div>
        <p className="mb-3 text-[11px] leading-relaxed text-zinc-500">
          Nested grid container. Wire child dashboard widgets into{" "}
          <span className="font-medium text-zinc-400">Widgets</span>; wire{" "}
          <span className="font-medium text-zinc-400">Widget</span> to Dashboard Output.
        </p>
        <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-zinc-500">
          Group title
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
        <InspectorCompactToggleRow
          label="Show title bar"
          checked={showTitle}
          onCheckedChange={(v) => onUpdateConfigField("showTitle", v)}
        />
        <InspectorCompactToggleRow
          label="Show border"
          checked={showBorder}
          onCheckedChange={(v) => onUpdateConfigField("showBorder", v)}
        />
        <div className="mt-3 grid grid-cols-2 gap-2">
          <InspectorNumericField
            ariaLabel="Group grid columns"
            value={groupLayout.columns}
            min={1}
            max={24}
            step={1}
            onCommit={(v) => patchGroupLayout({ columns: v })}
          />
          <InspectorNumericField
            ariaLabel="Group row height px"
            value={groupLayout.rowHeightPx}
            min={24}
            max={200}
            step={4}
            onCommit={(v) => patchGroupLayout({ rowHeightPx: v })}
          />
          <InspectorNumericField
            ariaLabel="Group gap px"
            value={groupLayout.gapPx}
            min={0}
            max={64}
            step={1}
            onCommit={(v) => patchGroupLayout({ gapPx: v })}
          />
          <InspectorNumericField
            ariaLabel="Group padding px"
            value={groupLayout.paddingPx}
            min={0}
            max={48}
            step={1}
            onCommit={(v) => patchGroupLayout({ paddingPx: v })}
          />
        </div>
      </InspectorSettingsSectionFrame>
      <DashboardPlacementPanel {...props} />
    </>
  );
}
