import { ArrowLeftRight } from "lucide-react";
import { TRNInlineToggleRow } from "../../../../../../../ui/TRN";
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
    <div className="flex flex-col gap-2">
      <InspectorCollapsibleSection
        title="Map range"
        icon={<ArrowLeftRight className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="Linearly remaps Value from an input domain to an output domain. Wired pins override the defaults on the node card."
        defaultExpanded
      >
        <TRNInlineToggleRow
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
        iconHint="Input domain (from min / max) and output domain (to min / max). Equal from min and from max passes through out min."
        defaultExpanded
      >
        <InspectorNumericScrubRow
          label="From min"
          description="Lower bound of the incoming value domain."
          ariaLabel="Map range from min"
          value={inMin}
          step={0.01}
          onCommit={(next) => {
            onUpdateConfigField("inMin", next);
          }}
        />
        <InspectorNumericScrubRow
          label="From max"
          description="Upper bound of the incoming value domain."
          ariaLabel="Map range from max"
          value={inMax}
          step={0.01}
          onCommit={(next) => {
            onUpdateConfigField("inMax", next);
          }}
        />
        <InspectorNumericScrubRow
          label="To min"
          description="Output when the input equals from min."
          ariaLabel="Map range to min"
          value={outMin}
          step={0.01}
          onCommit={(next) => {
            onUpdateConfigField("outMin", next);
          }}
        />
        <InspectorNumericScrubRow
          label="To max"
          description="Output when the input equals from max."
          ariaLabel="Map range to max"
          value={outMax}
          step={0.01}
          onCommit={(next) => {
            onUpdateConfigField("outMax", next);
          }}
        />
      </InspectorCollapsibleSection>
    </div>
  );
}
