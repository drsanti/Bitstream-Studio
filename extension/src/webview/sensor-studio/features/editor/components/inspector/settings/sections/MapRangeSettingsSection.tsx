import { ArrowLeftRight } from "lucide-react";
import { INSPECTOR_NODE_TAB_CARD_STACK_CLASS } from "../../inspector-node-tab-stack";
import { InspectorCollapsibleSection } from "../../InspectorCollapsibleSection";
import { InspectorCompactToggleRow } from "../../InspectorCompactToggleRow";
import { InspectorInOutDomainRangeGrid } from "../../InspectorInOutDomainRangeGrid";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";

function readFiniteConfigNumber(
  raw: unknown,
  fallback: number,
): number {
  const n = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function InspectorTypeBadge(props: { children: string }) {
  return (
    <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-zinc-400">
      {props.children}
    </span>
  );
}

/**
 * Reference typed inspector for transform nodes — collapsible TRN sections, scrub rows, clamp toggle.
 * See `sensor-studio/docs/SENSOR_STUDIO_NODE_UI_RULES.md`.
 */
export function MapRangeSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField } = props;
  const cfg = selectedNode.data.defaultConfig;

  const inMin = readFiniteConfigNumber(cfg.inMin, 0);
  const inMax = readFiniteConfigNumber(cfg.inMax, 1);
  const outMin = readFiniteConfigNumber(cfg.outMin, -1);
  const outMax = readFiniteConfigNumber(cfg.outMax, 1);
  const clampEnabled = cfg.clamp !== false;

  return (
    <div className={INSPECTOR_NODE_TAB_CARD_STACK_CLASS}>
      <InspectorCollapsibleSection
        title="Map range"
        icon={<ArrowLeftRight className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="Linearly remaps Value from an input domain to an output domain. Wired pins override the defaults on the node card."
        defaultExpanded
      >
        <InspectorCompactToggleRow
          label="Clamp result to out min / max"
          hint="When enabled, values below out min or above out max are clipped after mapping."
          checked={clampEnabled}
          onCheckedChange={(next) => {
            onUpdateConfigField("clamp", next);
          }}
        />
      </InspectorCollapsibleSection>

      <InspectorCollapsibleSection
        title="Range inputs"
        badge={<InspectorTypeBadge>Float</InspectorTypeBadge>}
        icon={<ArrowLeftRight className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="Input domain (In− / In+) and output domain (Out− / Out+). Equal from min and from max passes through out min."
        defaultExpanded
      >
        <InspectorInOutDomainRangeGrid
          inMin={inMin}
          inMax={inMax}
          outMin={outMin}
          outMax={outMax}
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
    </div>
  );
}
