import { BarChart2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { BarMeterNodePanel } from "../../../../nodes/bar-meter/BarMeterNodePanel";
import {
  coerceBarMeterConfig,
  gaugePreviewValue,
} from "../../../../nodes/display/gauge-display-config";
import { InspectorCollapsibleSection } from "../../InspectorCollapsibleSection";
import { InspectorCompactToggleRow } from "../../InspectorCompactToggleRow";
import { InspectorSelectRow } from "../../InspectorDenseControls";
import { InspectorNumericScrubRow } from "../../InspectorNumericScrubRow";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";
import { GaugeScaleReadoutInspectorFields } from "../GaugeScaleReadoutInspectorFields";
import { GaugeZonesEditor } from "../GaugeZonesEditor";

export function BarMeterSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField } = props;
  const cfg = useMemo(
    () => coerceBarMeterConfig(selectedNode.data.defaultConfig),
    [selectedNode.data.defaultConfig],
  );

  const [previewValue, setPreviewValue] = useState(() => gaugePreviewValue(cfg));

  useEffect(() => {
    setPreviewValue(gaugePreviewValue(cfg));
  }, [selectedNode.id, cfg.min, cfg.max]);

  const previewConfig = useMemo(
    () => ({ ...selectedNode.data.defaultConfig, ...cfg }),
    [cfg, selectedNode.data.defaultConfig],
  );

  return (
    <>
      <InspectorCollapsibleSection
        title="Preview"
        icon={<BarChart2 className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="Live canvas uses the wired input value. Scrub here to tune zones and scale without telemetry."
        defaultExpanded
      >
        <div className="overflow-hidden rounded border border-zinc-800/80 bg-zinc-950/80">
          <BarMeterNodePanel
            className="relative box-border h-28 max-h-28 w-full min-w-0 overflow-hidden"
            value={previewValue}
            defaultConfig={previewConfig}
          />
        </div>
        <InspectorNumericScrubRow
          label="Preview value"
          description="Design-time fill level only — not saved on the node."
          ariaLabel="Bar meter preview value"
          value={previewValue}
          min={Math.min(cfg.min, cfg.max)}
          max={Math.max(cfg.min, cfg.max)}
          step={cfg.max - cfg.min > 100 ? 1 : 0.1}
          onCommit={setPreviewValue}
        />
      </InspectorCollapsibleSection>

      <InspectorCollapsibleSection
        title="Scale & readout"
        icon={<BarChart2 className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="Bar fill and readout map incoming values into [min, max]."
        defaultExpanded
      >
        <GaugeScaleReadoutInspectorFields
          cfg={cfg}
          labelPrefix="Bar meter"
          decimalsMax={4}
          onUpdateConfigField={onUpdateConfigField}
        />
      </InspectorCollapsibleSection>

      <InspectorCollapsibleSection
        title="Bar layout"
        icon={<BarChart2 className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="Orientation and peak-hold marker behavior."
        defaultExpanded
      >
        <InspectorSelectRow
          label="Orientation"
          ariaLabel="Bar meter orientation"
          value={cfg.orientation}
          options={[
            { value: "vertical", label: "Vertical" },
            { value: "horizontal", label: "Horizontal" },
          ]}
          onChange={(next) => {
            onUpdateConfigField(
              "orientation",
              next === "horizontal" ? "horizontal" : "vertical",
            );
          }}
        />
        <InspectorCompactToggleRow
          label="Peak hold"
          hint="Shows a marker at the recent maximum; decays after two seconds."
          checked={cfg.showPeakHold}
          onCheckedChange={(next) => {
            onUpdateConfigField("showPeakHold", next);
          }}
        />
        <InspectorNumericScrubRow
          label="Fill smoothing"
          description="Time constant in ms (0 = snap to each sample). Softens bar motion on noisy telemetry."
          ariaLabel="Bar meter fill smoothing milliseconds"
          value={cfg.fillSmoothingMs}
          min={0}
          max={5000}
          step={50}
          onCommit={(next) => {
            onUpdateConfigField("fillSmoothingMs", Math.round(Math.max(0, next)));
          }}
        />
      </InspectorCollapsibleSection>

      <InspectorCollapsibleSection
        title="Zones & alarms"
        icon={<BarChart2 className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="Background bands and fill tint by value range."
        defaultExpanded={false}
      >
        <GaugeZonesEditor
          zones={cfg.zones}
          min={cfg.min}
          max={cfg.max}
          onChange={(next) => {
            onUpdateConfigField("zones", next);
          }}
        />
      </InspectorCollapsibleSection>
    </>
  );
}
