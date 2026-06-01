import { Gauge, Palette, Target } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { TRNInlineToggleRow } from "../../../../../../../ui/TRN";
import { RadialGaugeNodePanel } from "../../../../nodes/radial-gauge/RadialGaugeNodePanel";
import {
  coerceRadialGaugeConfig,
  gaugePreviewValue,
  RADIAL_GAUGE_ARC_PRESET_OPTIONS,
  type RadialGaugeArcPresetId,
} from "../../../../nodes/display/gauge-display-config";
import { InspectorCollapsibleSection } from "../../InspectorCollapsibleSection";
import { InspectorNumericScrubRow } from "../../InspectorNumericScrubRow";
import { InspectorPropertyRow } from "../../InspectorPropertyRow";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";
import { GaugeScaleReadoutInspectorFields } from "../GaugeScaleReadoutInspectorFields";
import { GaugeZonesEditor } from "../GaugeZonesEditor";

const controlClass =
  "w-full rounded border border-zinc-700/80 bg-zinc-900/60 px-2 py-1 text-xs text-zinc-100";

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
            className="relative box-border h-40 min-h-40 w-full min-w-0 overflow-hidden"
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
        <TRNInlineToggleRow
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
        <InspectorPropertyRow label="Setpoint color" description="Marker stroke and dot fill.">
          <input
            type="color"
            className="h-8 w-full cursor-pointer rounded border border-zinc-700/80 bg-zinc-900/60"
            value={cfg.setpointColor}
            aria-label="Radial gauge setpoint color"
            onChange={(event) => {
              onUpdateConfigField("setpointColor", event.target.value);
            }}
          />
        </InspectorPropertyRow>
      </InspectorCollapsibleSection>

      <InspectorCollapsibleSection
        title="Zones & alarms"
        icon={<Gauge className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="Colored arc bands and needle tint by value range."
        defaultExpanded
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
        <InspectorPropertyRow
          label="Arc preset"
          description="Sweep angle and rotation of the scale arc."
        >
          <select
            className={controlClass}
            value={cfg.arcPreset}
            aria-label="Radial gauge arc preset"
            onChange={(event) => {
              onUpdateConfigField("arcPreset", event.target.value as RadialGaugeArcPresetId);
            }}
          >
            {RADIAL_GAUGE_ARC_PRESET_OPTIONS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.label}
              </option>
            ))}
          </select>
        </InspectorPropertyRow>
        <TRNInlineToggleRow
          label="Faceplate"
          hint="Circular background behind the arc."
          checked={cfg.showFaceplate}
          onCheckedChange={(next) => {
            onUpdateConfigField("showFaceplate", next);
          }}
        />
        <TRNInlineToggleRow
          label="Track arc"
          hint="Neutral rail behind colored zones."
          checked={cfg.showTrack}
          onCheckedChange={(next) => {
            onUpdateConfigField("showTrack", next);
          }}
        />
        <TRNInlineToggleRow
          label="Tick marks"
          hint="Major and minor ticks along the arc."
          checked={cfg.showTicks}
          onCheckedChange={(next) => {
            onUpdateConfigField("showTicks", next);
          }}
        />
        <TRNInlineToggleRow
          label="Tick labels"
          hint="Numeric labels at major ticks."
          checked={cfg.showTickLabels}
          onCheckedChange={(next) => {
            onUpdateConfigField("showTickLabels", next);
          }}
        />
        <TRNInlineToggleRow
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
        <TRNInlineToggleRow
          label="Digital value"
          hint="Large numeric readout under the needle."
          checked={cfg.showDigitalValue}
          onCheckedChange={(next) => {
            onUpdateConfigField("showDigitalValue", next);
          }}
        />
        <TRNInlineToggleRow
          label="Unit label"
          hint="Unit suffix on canvas when unit is set in Scale & readout."
          checked={cfg.showUnit}
          onCheckedChange={(next) => {
            onUpdateConfigField("showUnit", next);
          }}
        />
      </InspectorCollapsibleSection>
    </>
  );
}
