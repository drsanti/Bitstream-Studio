import { ArrowLeftRight } from "lucide-react";
import { InspectorCollapsibleSection } from "../../InspectorCollapsibleSection";
import { InspectorInOutDomainRangeGrid } from "../../InspectorInOutDomainRangeGrid";
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
      <InspectorInOutDomainRangeGrid
        inMin={readFiniteConfigNumber(cfg.inMin, 0)}
        inMax={readFiniteConfigNumber(cfg.inMax, 1)}
        outMin={readFiniteConfigNumber(cfg.outMin, 0)}
        outMax={readFiniteConfigNumber(cfg.outMax, 1)}
        onCommitInMin={(next) => {
          onUpdateConfigField("inMin", next);
        }}
        onCommitInMax={(next) => {
          onUpdateConfigField("inMax", next);
        }}
        onCommitOutMin={(next) => {
          onUpdateConfigField("outMin", next);
        }}
        onCommitOutMax={(next) => {
          onUpdateConfigField("outMax", next);
        }}
      />
    </InspectorCollapsibleSection>
  );
}
