import { Shrink } from "lucide-react";
import { InspectorCollapsibleSection } from "../../InspectorCollapsibleSection";
import { InspectorMinMaxRangeGrid } from "../../InspectorMinMaxRangeGrid";
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
      iconHint="Limits Value to Min and Max. Wired pins override defaults on the node card."
      defaultExpanded
    >
      <InspectorMinMaxRangeGrid
        min={readFiniteConfigNumber(cfg.min, -1)}
        max={readFiniteConfigNumber(cfg.max, 1)}
        onCommitMin={(next) => {
          onUpdateConfigField("min", next);
        }}
        onCommitMax={(next) => {
          onUpdateConfigField("max", next);
        }}
      />
    </InspectorCollapsibleSection>
  );
}
