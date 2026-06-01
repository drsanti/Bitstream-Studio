import { Hash } from "lucide-react";
import { useMemo } from "react";
import { NumericDisplayNodePanel } from "../../../../nodes/numeric-display/NumericDisplayNodePanel";
import {
  coerceNumericDisplayConfig,
  gaugePreviewValue,
  numericDisplayZonePresetBounds,
} from "../../../../nodes/display/gauge-display-config";
import { InspectorCollapsibleSection } from "../../InspectorCollapsibleSection";
import { InspectorCompactToggleRow } from "../../InspectorCompactToggleRow";
import { InspectorNumericScrubRow, InspectorTextRow } from "../../InspectorNumericScrubRow";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";
import { GaugeZonesEditor } from "../GaugeZonesEditor";

export function NumericDisplaySettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField } = props;
  const cfg = useMemo(
    () => coerceNumericDisplayConfig(selectedNode.data.defaultConfig),
    [selectedNode.data.defaultConfig],
  );
  const zoneBounds = useMemo(() => numericDisplayZonePresetBounds(cfg), [cfg]);
  const previewValue = useMemo(() => gaugePreviewValue({ ...cfg, min: zoneBounds.min, max: zoneBounds.max }), [cfg, zoneBounds.max, zoneBounds.min]);
  const previewConfig = useMemo(
    () => ({ ...selectedNode.data.defaultConfig, ...cfg }),
    [cfg, selectedNode.data.defaultConfig],
  );

  return (
    <>
      <InspectorCollapsibleSection
        title="Preview"
        icon={<Hash className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="Sample readout using the zone at ~62% of the current zone span."
        defaultExpanded
      >
        <div className="overflow-hidden rounded border border-zinc-800/80 bg-zinc-950/80 px-1 py-1">
          <NumericDisplayNodePanel value={previewValue} defaultConfig={previewConfig} />
        </div>
      </InspectorCollapsibleSection>

      <InspectorCollapsibleSection
        title="Readout"
        icon={<Hash className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="Label, unit, precision, and status bar under the value."
        defaultExpanded
      >
        <InspectorTextRow
          label="Label"
          description="Optional caption above the value (uppercase styling on canvas)."
          ariaLabel="Numeric display label"
          value={cfg.label}
          placeholder="e.g. Tank pressure"
          onChange={(next) => {
            onUpdateConfigField("label", next);
          }}
        />
        <InspectorTextRow
          label="Unit"
          description="Suffix beside the live value."
          ariaLabel="Numeric display unit"
          value={cfg.unit}
          placeholder="e.g. kPa"
          onChange={(next) => {
            onUpdateConfigField("unit", next);
          }}
        />
        <InspectorNumericScrubRow
          label="Decimals"
          ariaLabel="Numeric display decimal places"
          value={cfg.decimals}
          min={0}
          max={6}
          step={1}
          fractionDigits={0}
          onCommit={(next) => {
            onUpdateConfigField("decimals", Math.round(next));
          }}
        />
        <InspectorCompactToggleRow
          label="Status bar"
          hint="Thin colored bar under the value reflecting the active zone."
          checked={cfg.showStatusBar}
          onCheckedChange={(next) => {
            onUpdateConfigField("showStatusBar", next);
          }}
        />
      </InspectorCollapsibleSection>

      <InspectorCollapsibleSection
        title="Zones & alarms"
        icon={<Hash className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="Value thresholds tint the digits and status bar."
        defaultExpanded
      >
        <GaugeZonesEditor
          zones={cfg.zones}
          min={zoneBounds.min}
          max={zoneBounds.max}
          onChange={(next) => {
            onUpdateConfigField("zones", next);
          }}
        />
      </InspectorCollapsibleSection>
    </>
  );
}
