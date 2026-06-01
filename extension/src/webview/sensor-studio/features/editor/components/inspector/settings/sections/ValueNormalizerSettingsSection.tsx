import { ArrowLeftRight } from "lucide-react";
import { InspectorCollapsibleSection } from "../../InspectorCollapsibleSection";
import { InspectorNumericScrubRow } from "../../InspectorNumericScrubRow";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";

function readFiniteConfigNumber(raw: unknown, fallback: number): number {
  const n = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export function ValueNormalizerSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField } = props;
  const cfg = selectedNode.data.defaultConfig;

  return (
    <InspectorCollapsibleSection
      title="Normalize"
      icon={<ArrowLeftRight className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
      iconHint="Maps Value from input domain to output domain. Wired pins override these defaults when connected."
      defaultExpanded
    >
      <InspectorNumericScrubRow
        label="In min"
        ariaLabel="Value normalizer in min"
        value={readFiniteConfigNumber(cfg.inMin, 0)}
        step={0.01}
        onCommit={(next) => {
          onUpdateConfigField("inMin", next);
        }}
      />
      <InspectorNumericScrubRow
        label="In max"
        ariaLabel="Value normalizer in max"
        value={readFiniteConfigNumber(cfg.inMax, 1)}
        step={0.01}
        onCommit={(next) => {
          onUpdateConfigField("inMax", next);
        }}
      />
      <InspectorNumericScrubRow
        label="Out min"
        ariaLabel="Value normalizer out min"
        value={readFiniteConfigNumber(cfg.outMin, 0)}
        step={0.01}
        onCommit={(next) => {
          onUpdateConfigField("outMin", next);
        }}
      />
      <InspectorNumericScrubRow
        label="Out max"
        ariaLabel="Value normalizer out max"
        value={readFiniteConfigNumber(cfg.outMax, 1)}
        step={0.01}
        onCommit={(next) => {
          onUpdateConfigField("outMax", next);
        }}
      />
    </InspectorCollapsibleSection>
  );
}
