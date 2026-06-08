import { Layers, Minus, Plus } from "lucide-react";
import { TRNButton, TRNHintText } from "../../../../../../../ui/TRN";
import { INSPECTOR_NODE_TAB_CARD_STACK_CLASS } from "../../inspector-node-tab-stack";
import { InspectorCollapsibleSection } from "../../InspectorCollapsibleSection";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";
import {
  ANIMATION_MERGE_INPUT_COUNT_KEY,
  ANIMATION_MERGE_MAX_INPUTS,
  ANIMATION_MERGE_MIN_INPUTS,
  readAnimationMergeInputCount,
} from "../../../../nodes/animation/animation-merge-inputs";

export function AnimationMergeSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField } = props;
  const dc = selectedNode.data.defaultConfig as Record<string, unknown>;
  const inputCount = readAnimationMergeInputCount(dc);

  const setInputCount = (next: number) => {
    onUpdateConfigField(
      ANIMATION_MERGE_INPUT_COUNT_KEY,
      Math.min(ANIMATION_MERGE_MAX_INPUTS, Math.max(ANIMATION_MERGE_MIN_INPUTS, next)),
    );
  };

  return (
    <div className={INSPECTOR_NODE_TAB_CARD_STACK_CLASS}>
      <InspectorCollapsibleSection
        title="Animation merge"
        icon={<Layers className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="Combine ordered **Animation** wires. Later inputs override fields on the same clip name; distinct clip names play in parallel."
        defaultExpanded
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-[10px] font-medium text-zinc-300">Animation inputs</span>
          <div className="flex items-center gap-1">
            <TRNButton
              type="button"
              size="compact"
              disabled={inputCount <= ANIMATION_MERGE_MIN_INPUTS}
              hint="Remove one animation input socket (disconnects wires on dropped sockets)."
              onClick={() => setInputCount(inputCount - 1)}
            >
              <Minus className="h-3 w-3" aria-hidden />
            </TRNButton>
            <span className="min-w-[1.5rem] text-center text-[11px] text-zinc-100">{inputCount}</span>
            <TRNButton
              type="button"
              size="compact"
              disabled={inputCount >= ANIMATION_MERGE_MAX_INPUTS}
              hint="Add one animation input socket."
              onClick={() => setInputCount(inputCount + 1)}
            >
              <Plus className="h-3 w-3" aria-hidden />
            </TRNButton>
          </div>
        </div>
        <TRNHintText tone="muted" className="text-[10px] leading-snug">
          Wire **Animation Clip** or **Animation Clips** outputs into inputs **1 … {inputCount}**. Merge
          order is left-to-right — input {inputCount} wins field conflicts on the same clip name.
        </TRNHintText>
      </InspectorCollapsibleSection>
    </div>
  );
}
