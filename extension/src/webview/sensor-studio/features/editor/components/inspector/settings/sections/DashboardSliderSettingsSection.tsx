import { SlidersHorizontal } from "lucide-react";
import { useMemo } from "react";
import { coerceKnobConfig } from "../../../../nodes/display/gauge-display-config";
import { DashboardOpenLink } from "../../../../../dashboard/DashboardOpenLink";
import { InspectorCollapsibleSection } from "../../InspectorCollapsibleSection";
import { InspectorNumericScrubRow } from "../../InspectorNumericScrubRow";
import { GaugeScaleReadoutInspectorFields } from "../GaugeScaleReadoutInspectorFields";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";
import { DashboardPlacementPanel } from "./DashboardPlacementPanel";

export function DashboardSliderSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField, onUpdateLabel } = props;
  const dc = selectedNode.data.defaultConfig as Record<string, unknown>;
  const cfg = useMemo(() => coerceKnobConfig(dc), [dc]);
  const label = typeof dc.label === "string" ? dc.label : "";

  return (
    <>
      <InspectorCollapsibleSection
        title="Dashboard Slider"
        icon={<SlidersHorizontal className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="Horizontal slider on the Dashboard pane — drag to set the numeric Out value."
        defaultExpanded
      >
        <div className="mb-2 flex justify-end">
          <DashboardOpenLink sourceNodeId={selectedNode.id} label="Open Dashboard" />
        </div>
        <div className="mt-2">
          <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-zinc-500">
            Slider label
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
        <GaugeScaleReadoutInspectorFields
          cfg={cfg}
          labelPrefix="Slider"
          decimalsMax={4}
          onUpdateConfigField={onUpdateConfigField}
        />
        <InspectorNumericScrubRow
          label="Step"
          description="Snap increment when dragging (0 = smooth)."
          ariaLabel="Slider step"
          value={cfg.step}
          min={0}
          step={0.01}
          onCommit={(next) => {
            onUpdateConfigField("step", Math.max(0, next));
          }}
        />
      </InspectorCollapsibleSection>
      <DashboardPlacementPanel {...props} />
    </>
  );
}
