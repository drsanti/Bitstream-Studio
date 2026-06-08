import { SlidersHorizontal } from "lucide-react";
import { TRNFormField, TRNHintText, TRNParameterSlider } from "../../../../../../../ui/TRN";
import { INSPECTOR_NODE_TAB_CARD_STACK_CLASS } from "../../inspector-node-tab-stack";
import { InspectorCollapsibleSection } from "../../InspectorCollapsibleSection";
import { InspectorNumericScrubRow } from "../../InspectorNumericScrubRow";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";

function readFactor(dc: Record<string, unknown>): number {
  const n = typeof dc.factor === "number" ? dc.factor : Number(dc.factor);
  return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0.5;
}

function readCrossfadeS(dc: Record<string, unknown>): number {
  const n = typeof dc.crossfadeS === "number" ? dc.crossfadeS : Number(dc.crossfadeS);
  return Number.isFinite(n) ? Math.max(0, n) : 0.3;
}

export function AnimationBlendSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField } = props;
  const dc = selectedNode.data.defaultConfig as Record<string, unknown>;
  const factor = readFactor(dc);
  const crossfadeS = readCrossfadeS(dc);

  return (
    <div className={INSPECTOR_NODE_TAB_CARD_STACK_CLASS}>
      <InspectorCollapsibleSection
        title="Animation blend"
        icon={<SlidersHorizontal className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="Cross-fade two **Animation** wires. **Factor** 0 = A only, 1 = B only. Weights scale multiplicatively (not re-normalized)."
        defaultExpanded
      >
        <TRNFormField
          label="Blend factor"
          id="animation-blend-factor"
          description="0 = input A only, 1 = input B only. Wire **Factor** to override from logic."
          className="mb-2 space-y-1.5"
        >
          <TRNParameterSlider
            name="Factor"
            value={factor}
            min={0}
            max={1}
            step={0.01}
            valueFormatter={(v) => v.toFixed(2)}
            onChange={(v) => {
              onUpdateConfigField("factor", v);
            }}
          />
        </TRNFormField>
        <InspectorNumericScrubRow
          label="Crossfade (s)"
          hint="Fade-out duration on A clips and fade-in on B clips (mixer `fadeInS` / `fadeOutS`)."
          value={crossfadeS}
          min={0}
          max={10}
          step={0.05}
          onChange={(next) => onUpdateConfigField("crossfadeS", next)}
        />
        <TRNHintText tone="muted" className="text-[10px] leading-snug">
          Typical graph: two **Animation Clip** nodes (e.g. Walk + Run) → **A** / **B** → **Model Viewer
          Animation**.
        </TRNHintText>
      </InspectorCollapsibleSection>
    </div>
  );
}
