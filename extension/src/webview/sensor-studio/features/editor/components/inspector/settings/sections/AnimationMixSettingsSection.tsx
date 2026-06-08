import { Blend, Minus, Plus } from "lucide-react";
import { TRNButton, TRNHintText, TRNParameterSlider } from "../../../../../../../ui/TRN";
import { INSPECTOR_NODE_TAB_CARD_STACK_CLASS } from "../../inspector-node-tab-stack";
import { InspectorCollapsibleSection } from "../../InspectorCollapsibleSection";
import { InspectorCompactToggleRow } from "../../InspectorCompactToggleRow";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";
import {
  ANIMATION_MERGE_INPUT_COUNT_KEY,
  ANIMATION_MERGE_MAX_INPUTS,
  ANIMATION_MERGE_MIN_INPUTS,
  ANIMATION_MIX_NORMALIZE_WEIGHTS_KEY,
  ANIMATION_MIX_WEIGHTS_KEY,
  readAnimationMixInputCount,
  readMixWeights,
  readNormalizeMixWeights,
} from "../../../../nodes/animation/animation-mix-inputs";

export function AnimationMixSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField } = props;
  const dc = selectedNode.data.defaultConfig as Record<string, unknown>;
  const inputCount = readAnimationMixInputCount(dc);
  const weights = readMixWeights(dc, inputCount);
  const normalize = readNormalizeMixWeights(dc);

  const setInputCount = (next: number) => {
    const count = Math.min(
      ANIMATION_MERGE_MAX_INPUTS,
      Math.max(ANIMATION_MERGE_MIN_INPUTS, next),
    );
    onUpdateConfigField(ANIMATION_MERGE_INPUT_COUNT_KEY, count);
  };

  const setWeight = (index: number, value: number) => {
    const next = [...weights];
    next[index] = Math.max(0, value);
    onUpdateConfigField(ANIMATION_MIX_WEIGHTS_KEY, next);
  };

  return (
    <div className={INSPECTOR_NODE_TAB_CARD_STACK_CLASS}>
      <InspectorCollapsibleSection
        title="Animation mix"
        icon={<Blend className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="Blend **2–8 Animation** wires with per-input weights. Distinct clips play in parallel; clip weights are scaled then combined."
        defaultExpanded
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-[10px] font-medium text-zinc-300">Animation inputs</span>
          <div className="flex items-center gap-1">
            <TRNButton
              type="button"
              size="compact"
              disabled={inputCount <= ANIMATION_MERGE_MIN_INPUTS}
              hint="Remove one animation input pair (animation + weight socket)."
              onClick={() => setInputCount(inputCount - 1)}
            >
              <Minus className="h-3 w-3" aria-hidden />
            </TRNButton>
            <span className="min-w-[1.5rem] text-center text-[11px] text-zinc-100">{inputCount}</span>
            <TRNButton
              type="button"
              size="compact"
              disabled={inputCount >= ANIMATION_MERGE_MAX_INPUTS}
              hint="Add one animation input pair."
              onClick={() => setInputCount(inputCount + 1)}
            >
              <Plus className="h-3 w-3" aria-hidden />
            </TRNButton>
          </div>
        </div>

        <InspectorCompactToggleRow
          label="Normalize weights"
          hint="When on, weights are scaled to sum to 1 before mixing. When off, weights multiply clip weights directly."
          checked={normalize}
          onCheckedChange={(next) => onUpdateConfigField(ANIMATION_MIX_NORMALIZE_WEIGHTS_KEY, next)}
        />

        <div className="mt-2 space-y-2">
          {weights.map((weight, index) => (
            <TRNParameterSlider
              key={`mix-weight-${index}`}
              name={`Input ${index + 1} weight`}
              value={weight}
              min={0}
              max={1}
              step={0.01}
              valueFormatter={(v) => v.toFixed(2)}
              onChange={(v) => setWeight(index, v)}
            />
          ))}
        </div>

        <TRNHintText tone="muted" className="mt-2 text-[10px] leading-snug">
          Wire **Animation** into **1…{inputCount}** and optional **W1…W{inputCount}** number inputs to
          override inspector weights from logic.
        </TRNHintText>
      </InspectorCollapsibleSection>
    </div>
  );
}
