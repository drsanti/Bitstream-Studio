import { Gauge, Palette, Target } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { RadialGaugeNodePanel } from "../../../../nodes/radial-gauge/RadialGaugeNodePanel";
import {
  coerceRadialGaugeConfig,
  gaugePreviewValue,
  RADIAL_GAUGE_ARC_PRESET_OPTIONS,
  type RadialGaugeArcPresetId,
} from "../../../../nodes/display/gauge-display-config";
import { InspectorCollapsibleSection } from "../../InspectorCollapsibleSection";
import { InspectorCompactToggleRow } from "../../InspectorCompactToggleRow";
import { InspectorColorRow, InspectorSelectRow } from "../../InspectorDenseControls";
import { InspectorNumericScrubRow } from "../../InspectorNumericScrubRow";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";
import { GaugeScaleReadoutInspectorFields } from "../GaugeScaleReadoutInspectorFields";
import { GaugeZonesEditor } from "../GaugeZonesEditor";
import { DashboardPublishSettingsSection } from "./DashboardPublishSettingsSection";

export function RadialGaugeSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField } = props;
  const cfg = useMemo(
    () => coerceRadialGaugeConfig(selectedNode.data.defaultConfig),
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
        icon={<Gauge className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="Live canvas uses the wired input value. Scrub here to tune appearance without telemetry."
        defaultExpanded
      >
        <div className="overflow-hidden rounded border border-zinc-800/80 bg-zinc-950/80">
          <RadialGaugeNodePanel
            className="relative box-border aspect-[2/1] max-h-32 w-full min-w-0 overflow-hidden"
            value={previewValue}
            defaultConfig={previewConfig}
          />
        </div>
        <InspectorNumericScrubRow
          label="Preview value"
          description="Design-time needle position only — not saved on the node."
          ariaLabel="Radial gauge preview value"
          value={previewValue}
          min={Math.min(cfg.min, cfg.max)}
          max={Math.max(cfg.min, cfg.max)}
          step={cfg.max - cfg.min > 100 ? 1 : 0.1}
          onCommit={setPreviewValue}
        />
      </InspectorCollapsibleSection>

      <InspectorCollapsibleSection
        title="Scale & readout"
        icon={<Gauge className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="Defines the arc scale and the numeric readout under the needle."
        defaultExpanded
      >
        <GaugeScaleReadoutInspectorFields
          cfg={cfg}
          labelPrefix="Radial gauge"
          minDescription="Scale start — needle and ticks map incoming values into [min, max]."
          onUpdateConfigField={onUpdateConfigField}
        />
      </InspectorCollapsibleSection>

      <InspectorCollapsibleSection
        title="Setpoint"
        icon={<Target className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="Reference marker on the arc for target or alarm levels."
        defaultExpanded={false}
      >
        <InspectorCompactToggleRow
          label="Show setpoint"
          hint="Radial tick and dot at the configured setpoint value."
          checked={cfg.showSetpoint}
          onCheckedChange={(next) => {
            onUpdateConfigField("showSetpoint", next);
          }}
        />
        <InspectorNumericScrubRow
          label="Setpoint value"
          description="Clamped to the current scale min/max."
          ariaLabel="Radial gauge setpoint value"
          value={cfg.setpoint}
          min={Math.min(cfg.min, cfg.max)}
          max={Math.max(cfg.min, cfg.max)}
          step={cfg.max - cfg.min > 100 ? 1 : 0.1}
          onCommit={(next) => {
            onUpdateConfigField("setpoint", next);
          }}
        />
        <InspectorColorRow
          label="Setpoint color"
          description="Marker stroke and dot fill."
          ariaLabel="Radial gauge setpoint color"
          value={cfg.setpointColor}
          onChange={(next) => {
            onUpdateConfigField("setpointColor", next);
          }}
        />
      </InspectorCollapsibleSection>

      <InspectorCollapsibleSection
        title="Zones & alarms"
        icon={<Gauge className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="Colored arc bands and needle tint by value range."
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

      <InspectorCollapsibleSection
        title="Appearance"
        icon={<Palette className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="Arc geometry and which chrome elements are drawn on the canvas."
        defaultExpanded={false}
      >
        <InspectorSelectRow
          label="Arc preset"
          description="Sweep angle and rotation of the scale arc."
          ariaLabel="Radial gauge arc preset"
          value={cfg.arcPreset}
          options={RADIAL_GAUGE_ARC_PRESET_OPTIONS.map((preset) => ({
            value: preset.id,
            label: preset.label,
          }))}
          onChange={(next) => {
            onUpdateConfigField("arcPreset", next as RadialGaugeArcPresetId);
          }}
        />
        <InspectorCompactToggleRow
          label="Faceplate"
          hint="Circular background behind the arc."
          checked={cfg.showFaceplate}
          onCheckedChange={(next) => {
            onUpdateConfigField("showFaceplate", next);
          }}
        />
        <InspectorCompactToggleRow
          label="Track arc"
          hint="Neutral rail behind colored zones."
          checked={cfg.showTrack}
          onCheckedChange={(next) => {
            onUpdateConfigField("showTrack", next);
          }}
        />
        <InspectorCompactToggleRow
          label="Tick marks"
          hint="Major and minor ticks along the arc."
          checked={cfg.showTicks}
          onCheckedChange={(next) => {
            onUpdateConfigField("showTicks", next);
          }}
        />
        <InspectorCompactToggleRow
          label="Tick labels"
          hint="Numeric labels at major ticks."
          checked={cfg.showTickLabels}
          onCheckedChange={(next) => {
            onUpdateConfigField("showTickLabels", next);
          }}
        />
        <InspectorCompactToggleRow
          label="Needle"
          hint="Pointer and hub pivot."
          checked={cfg.showNeedle}
          onCheckedChange={(next) => {
            onUpdateConfigField("showNeedle", next);
          }}
        />
        <InspectorNumericScrubRow
          label="Needle smoothing"
          description="Time constant in ms (0 = snap to each sample). Reduces jitter on noisy telemetry."
          ariaLabel="Radial gauge needle smoothing milliseconds"
          value={cfg.needleSmoothingMs}
          min={0}
          max={5000}
          step={50}
          onCommit={(next) => {
            onUpdateConfigField("needleSmoothingMs", Math.round(Math.max(0, next)));
          }}
        />
        <InspectorCompactToggleRow
          label="Digital value"
          hint="Large numeric readout under the needle."
          checked={cfg.showDigitalValue}
          onCheckedChange={(next) => {
            onUpdateConfigField("showDigitalValue", next);
          }}
        />
        <InspectorCompactToggleRow
          label="Unit label"
          hint="Unit suffix on canvas when unit is set in Scale & readout."
          checked={cfg.showUnit}
          onCheckedChange={(next) => {
            onUpdateConfigField("showUnit", next);
          }}
        />
      </InspectorCollapsibleSection>
      <DashboardPublishSettingsSection {...props} />
    </>
  );
}
