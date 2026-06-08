import { DashboardOpenLink } from "../../../../../dashboard/DashboardOpenLink";
import { InspectorSelectField } from "../../InspectorDenseControls";
import { InspectorSettingsSectionFrame } from "../../InspectorSettingsSectionFrame";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";
import { DashboardPlacementPanel } from "./DashboardPlacementPanel";

const VARIANT_OPTIONS = [
  { value: "primary", label: "Primary" },
  { value: "secondary", label: "Secondary" },
  { value: "danger", label: "Danger" },
] as const;

export function DashboardButtonSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField, onUpdateLabel } = props;
  const dc = selectedNode.data.defaultConfig as Record<string, unknown>;
  const variant =
    dc.variant === "secondary" || dc.variant === "danger" ? dc.variant : "primary";
  const label = typeof dc.label === "string" ? dc.label : "";

  return (
    <>
      <InspectorSettingsSectionFrame title="Dashboard Button">
        <div className="mb-2 flex justify-end">
          <DashboardOpenLink sourceNodeId={selectedNode.id} label="Open Dashboard" />
        </div>
        <p className="mb-3 text-[11px] leading-relaxed text-zinc-500">
          Renders on the Dashboard pane. Wire the <span className="font-medium text-zinc-400">Click</span>{" "}
          event output into actions (Set Boolean, toggles, etc.).
        </p>
        <InspectorSelectField
          label="Variant"
          value={variant}
          options={VARIANT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          onChange={(v) => onUpdateConfigField("variant", v)}
        />
        <div className="mt-2">
          <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-zinc-500">
            Button label
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
      </InspectorSettingsSectionFrame>
      <DashboardPlacementPanel {...props} />
    </>
  );
}
