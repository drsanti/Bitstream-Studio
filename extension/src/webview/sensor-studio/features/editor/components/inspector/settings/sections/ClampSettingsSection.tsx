import { Shrink } from "lucide-react";
import { InspectorCollapsibleSection } from "../../InspectorCollapsibleSection";
import { InspectorNumericScrubRow } from "../../InspectorNumericScrubRow";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";

function readFiniteConfigNumber(
  raw: unknown,
  fallback: number,
): number {
  const n = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export function ClampSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField } = props;
  const cfg = selectedNode.data.defaultConfig;

  return (
    <InspectorCollapsibleSection
      title="Clamp"
      icon={<Shrink className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
      iconHint="Limits the incoming float to the configured minimum and maximum. Wired in pins override unwired defaults on the node card when present."
      defaultExpanded
    >
      <InspectorNumericScrubRow
        label="Min"
        description="Values below min output min."
        ariaLabel="Clamp minimum"
        value={readFiniteConfigNumber(cfg.min, -1)}
        step={0.01}
        onCommit={(next) => {
          onUpdateConfigField("min", next);
        }}
      />
      <InspectorNumericScrubRow
        label="Max"
        description="Values above max output max."
        ariaLabel="Clamp maximum"
        value={readFiniteConfigNumber(cfg.max, 1)}
        step={0.01}
        onCommit={(next) => {
          onUpdateConfigField("max", next);
        }}
      />
    </InspectorCollapsibleSection>
  );
}
