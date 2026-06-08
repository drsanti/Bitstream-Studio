import { CircleDot } from "lucide-react";
import { useMemo, useState } from "react";
import { LedIndicatorNodePanel } from "../../../../nodes/led-indicator/LedIndicatorNodePanel";
import { coerceLedIndicatorConfig } from "../../../../nodes/display/led-indicator-config";
import { InspectorCollapsibleSection } from "../../InspectorCollapsibleSection";
import { InspectorCompactToggleRow } from "../../InspectorCompactToggleRow";
import { InspectorColorRow } from "../../InspectorDenseControls";
import { InspectorNumericScrubRow, InspectorTextRow } from "../../InspectorNumericScrubRow";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";
import { DashboardPublishSettingsSection } from "./DashboardPublishSettingsSection";

export function LedIndicatorSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField } = props;
  const cfg = useMemo(
    () => coerceLedIndicatorConfig(selectedNode.data.defaultConfig),
    [selectedNode.data.defaultConfig],
  );
  const previewConfig = useMemo(
    () => ({ ...selectedNode.data.defaultConfig, ...cfg }),
    [cfg, selectedNode.data.defaultConfig],
  );
  const [previewOn, setPreviewOn] = useState(true);

  return (
    <>
      <InspectorCollapsibleSection
        title="Preview"
        icon={<CircleDot className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="Live canvas uses the wired input. Toggle here to tune colors without telemetry."
        defaultExpanded
      >
        <div className="overflow-hidden rounded border border-zinc-800/80 bg-zinc-950/80">
          <LedIndicatorNodePanel
            value={previewOn}
            defaultConfig={previewConfig}
          />
        </div>
        <InspectorCompactToggleRow
          label="Preview ON"
          hint="Design-time state only — not saved on the node."
          checked={previewOn}
          onCheckedChange={setPreviewOn}
        />
      </InspectorCollapsibleSection>

      <InspectorCollapsibleSection
        title="LED appearance"
        icon={<CircleDot className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="Label, colors, and blink when the LED is on."
        defaultExpanded
      >
        <InspectorTextRow
          label="Label"
          description="Optional caption beside the bulb."
          ariaLabel="LED indicator label"
          value={cfg.label}
          placeholder="e.g. Alarm"
          onChange={(next) => {
            onUpdateConfigField("label", next);
          }}
        />
        <InspectorColorRow
          label="On color"
          description="Fill and glow when active."
          ariaLabel="LED on color"
          value={cfg.onColor}
          onChange={(next) => {
            onUpdateConfigField("onColor", next);
          }}
        />
        <InspectorColorRow
          label="Off color"
          description="Bulb body when inactive."
          ariaLabel="LED off color"
          value={cfg.offColor}
          onChange={(next) => {
            onUpdateConfigField("offColor", next);
          }}
        />
        <InspectorCompactToggleRow
          label="Blink when ON"
          hint="Pulse animation while the LED is active."
          checked={cfg.blink}
          onCheckedChange={(next) => {
            onUpdateConfigField("blink", next);
          }}
        />
      </InspectorCollapsibleSection>

      <InspectorCollapsibleSection
        title="Threshold"
        icon={<CircleDot className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="Numeric wires turn ON at or above this value; boolean wires ignore threshold."
        defaultExpanded
      >
        <InspectorNumericScrubRow
          label="Numeric threshold"
          description="Used when the input wire carries a number."
          ariaLabel="LED numeric threshold"
          value={cfg.threshold}
          step={0.1}
          onCommit={(next) => {
            onUpdateConfigField("threshold", next);
          }}
        />
      </InspectorCollapsibleSection>
      <DashboardPublishSettingsSection {...props} />
    </>
  );
}
