import { CircleDot } from "lucide-react";
import { useMemo, useState } from "react";
import { TRNInlineToggleRow } from "../../../../../../../ui/TRN";
import { LedIndicatorNodePanel } from "../../../../nodes/led-indicator/LedIndicatorNodePanel";
import { coerceLedIndicatorConfig } from "../../../../nodes/display/led-indicator-config";
import { InspectorCollapsibleSection } from "../../InspectorCollapsibleSection";
import { InspectorNumericScrubRow } from "../../InspectorNumericScrubRow";
import { InspectorPropertyRow } from "../../InspectorPropertyRow";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";

const controlClass =
  "w-full rounded border border-zinc-700/80 bg-zinc-900/60 px-2 py-1 text-xs text-zinc-100";

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
        <TRNInlineToggleRow
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
        <InspectorPropertyRow label="Label" description="Optional caption beside the bulb.">
          <input
            type="text"
            className={controlClass}
            value={cfg.label}
            placeholder="e.g. Alarm"
            aria-label="LED indicator label"
            onChange={(event) => {
              onUpdateConfigField("label", event.target.value);
            }}
          />
        </InspectorPropertyRow>
        <InspectorPropertyRow label="On color" description="Fill and glow when active.">
          <input
            type="color"
            className="h-8 w-full cursor-pointer rounded border border-zinc-700/80 bg-zinc-900/60"
            value={cfg.onColor}
            aria-label="LED on color"
            onChange={(event) => {
              onUpdateConfigField("onColor", event.target.value);
            }}
          />
        </InspectorPropertyRow>
        <InspectorPropertyRow label="Off color" description="Bulb body when inactive.">
          <input
            type="color"
            className="h-8 w-full cursor-pointer rounded border border-zinc-700/80 bg-zinc-900/60"
            value={cfg.offColor}
            aria-label="LED off color"
            onChange={(event) => {
              onUpdateConfigField("offColor", event.target.value);
            }}
          />
        </InspectorPropertyRow>
        <TRNInlineToggleRow
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
    </>
  );
}
