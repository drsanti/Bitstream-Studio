import { CircleSlash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { KnobNodePanel } from "../../../../nodes/knob/KnobNodePanel";
import {
  coerceKnobConfig,
} from "../../../../nodes/display/gauge-display-config";
import { InspectorCollapsibleSection } from "../../InspectorCollapsibleSection";
import { InspectorNumericScrubRow } from "../../InspectorNumericScrubRow";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";
import { GaugeScaleReadoutInspectorFields } from "../GaugeScaleReadoutInspectorFields";
import { GaugeZonesEditor } from "../GaugeZonesEditor";
import { DashboardPublishSettingsSection } from "./DashboardPublishSettingsSection";

export function KnobSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField } = props;
  const cfg = useMemo(
    () => coerceKnobConfig(selectedNode.data.defaultConfig),
    [selectedNode.data.defaultConfig],
  );

  const [previewValue, setPreviewValue] = useState(() => cfg.value);

  useEffect(() => {
    setPreviewValue(cfg.value);
  }, [selectedNode.id, cfg.value]);

  const previewConfig = useMemo(
    () => ({ ...selectedNode.data.defaultConfig, ...cfg, value: previewValue }),
    [cfg, previewValue, selectedNode.data.defaultConfig],
  );

  return (
    <>
      <InspectorCollapsibleSection
        title="Preview"
        icon={<CircleSlash2 className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="Drag on the canvas knob to change output; scrub here for appearance only."
        defaultExpanded
      >
        <div className="overflow-hidden rounded border border-zinc-800/80 bg-zinc-950/80">
          <KnobNodePanel
            className="relative box-border h-36 min-h-36 w-full min-w-0 overflow-hidden"
            nodeId={selectedNode.id}
            defaultConfig={previewConfig}
            updateValue={(_nodeId, next) => {
              setPreviewValue(next);
            }}
          />
        </div>
        <InspectorNumericScrubRow
          label="Default value"
          description="Initial/output value when the graph loads — also used for this preview."
          ariaLabel="Knob default value"
          value={previewValue}
          min={Math.min(cfg.min, cfg.max)}
          max={Math.max(cfg.min, cfg.max)}
          step={cfg.step > 0 ? cfg.step : cfg.max - cfg.min > 100 ? 1 : 0.1}
          onCommit={(next) => {
            setPreviewValue(next);
            onUpdateConfigField("value", next);
          }}
        />
      </InspectorCollapsibleSection>

      <InspectorCollapsibleSection
        title="Scale & readout"
        icon={<CircleSlash2 className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="Drag range and readout under the knob."
        defaultExpanded
      >
        <GaugeScaleReadoutInspectorFields
          cfg={cfg}
          labelPrefix="Knob"
          decimalsMax={4}
          onUpdateConfigField={onUpdateConfigField}
        />
        <InspectorNumericScrubRow
          label="Step"
          description="Snap increment when dragging (0 = smooth)."
          ariaLabel="Knob step"
          value={cfg.step}
          min={0}
          step={0.01}
          onCommit={(next) => {
            onUpdateConfigField("step", Math.max(0, next));
          }}
        />
      </InspectorCollapsibleSection>

      <InspectorCollapsibleSection
        title="Zones & alarms"
        icon={<CircleSlash2 className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="Arc and pointer tint by value range."
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
      <DashboardPublishSettingsSection {...props} />
    </>
  );
}
