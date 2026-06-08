import { Clapperboard } from "lucide-react";
import {
  TRNFormField,
  TRNHintText,
  TRNSelect,
} from "../../../../../../../ui/TRN";
import { INSPECTOR_NODE_TAB_CARD_STACK_CLASS } from "../../inspector-node-tab-stack";
import { InspectorCollapsibleSection } from "../../InspectorCollapsibleSection";
import { STUDIO_COMPACT_FLOW_SELECT_BUTTON_CLASS } from "../../inspector-dense-select-button";
import { InspectorCompactToggleRow } from "../../InspectorCompactToggleRow";
import { InspectorNumericScrubRow } from "../../InspectorNumericScrubRow";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";
import type { StudioGlbAnimationLoopModeV1 } from "../../../../nodes/animation/flow-wire-animation";
import { AnimationClipModelSourceControl } from "../../../../nodes/animation/animation-clip-model-source-control";
import { STUDIO_MODEL_SELECT_CUSTOM } from "../../../../../asset-browser/studio-model-scene-bindings";
import {
  buildAnimationClipBindingPatch,
  GLB_CLIP_UNBOUND,
  useAnimationClipEditorState,
} from "../../../../nodes/animation/animation-clip-editor-state";
import { ModelOutlinerOpenLink } from "../../../../model-outliner/ModelOutlinerOpenLink";

const LOOP_OPTIONS = [
  { value: "once", label: "Once" },
  { value: "loop", label: "Loop" },
  { value: "pingpong", label: "Ping-pong" },
] as const;

export function AnimationClipSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField } = props;
  const {
    parsed,
    modelRef,
    isModelWired,
    wiredModelDisplayLabel,
    modelSourceOptions,
    modelSourceValue,
    modelSourceDisabled,
    selectOptions,
    selectValue,
    clipSelectDisabled,
    isBound,
    boundRef,
  } = useAnimationClipEditorState(selectedNode.id);

  const modelCatalogNeedsPick = modelSourceValue === STUDIO_MODEL_SELECT_CUSTOM;

  const patchClip = (ref: string) => {
    const modelFlowId = modelRef.status === "ok" ? modelRef.modelFlowId : undefined;
    const patch = buildAnimationClipBindingPatch(ref, modelFlowId);
    for (const [key, value] of Object.entries(patch)) {
      onUpdateConfigField(key, value);
    }
  };

  return (
    <div className={INSPECTOR_NODE_TAB_CARD_STACK_CLASS}>
      <InspectorCollapsibleSection
        title="Animation clip"
        icon={<Clapperboard className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
        iconHint="Pick a **Model Source** (or wire **Model**), choose a clip, wire **Animation** out to **Model Viewer** or Merge/Blend. Time, Speed, Weight, Enabled optional."
        defaultExpanded
      >
        <TRNFormField label="Model" id="animation-clip-model-source" className="mb-2 space-y-1.5">
          <AnimationClipModelSourceControl
            nodeId={selectedNode.id}
            variant="inspector-inline"
            isModelWired={isModelWired}
            wiredModelDisplayLabel={wiredModelDisplayLabel}
            modelSourceOptions={modelSourceOptions}
            modelSourceValue={modelSourceValue}
            modelSourceDisabled={modelSourceDisabled}
          />
        </TRNFormField>
        {!isModelWired && modelSourceDisabled ? (
          <TRNHintText tone="muted" className="mb-2 text-[10px] leading-snug">
            Asset catalog has no GLB models yet. Add a **Model Source** node or import models in Asset
            Browser.
          </TRNHintText>
        ) : null}
        {!isModelWired && !modelSourceDisabled && modelCatalogNeedsPick ? (
          <TRNHintText tone="muted" className="mb-2 text-[10px] leading-snug">
            Pick a GLB model, then choose an animation clip below.
          </TRNHintText>
        ) : null}
        {isModelWired ? (
          <TRNHintText tone="muted" className="mb-2 text-[10px] leading-snug">
            **Model** socket is wired — scope follows the wire.
          </TRNHintText>
        ) : null}
        {modelRef.status === "ok" ? (
          <div className="mb-2">
            <ModelOutlinerOpenLink
              label="Browse clips in Outliner"
              canvasModelId={modelRef.modelFlowId}
              typeFilter="animation"
            />
          </div>
        ) : null}
        <TRNFormField label="Clip" id="animation-clip-select" className="mb-2 space-y-1.5">
          <TRNSelect
            ariaLabel="GLB animation clip"
            value={selectValue}
            options={selectOptions}
            disabled={clipSelectDisabled}
            size="sm"
            className="min-w-0"
            buttonClassName={STUDIO_COMPACT_FLOW_SELECT_BUTTON_CLASS}
            panelClassName="scrollbar-hide max-h-48 overflow-y-auto"
            onValueChange={(next) => {
              if (next === GLB_CLIP_UNBOUND) {
                return;
              }
              patchClip(next);
            }}
          />
        </TRNFormField>
        {isBound && clipSelectDisabled && boundRef.length > 0 ? (
          <TRNHintText tone="muted" className="mb-2 text-[10px]">
            Bound clip: <span className="text-zinc-300">{boundRef}</span>
          </TRNHintText>
        ) : null}
        <InspectorCompactToggleRow
          label="Enabled"
          hint="When off, this clip is paused in the mixer (wired **Enabled** overrides)."
          checked={parsed.enabled}
          onCheckedChange={(next) => onUpdateConfigField("enabled", next)}
        />
        <InspectorNumericScrubRow
          label="Time (s)"
          hint="Local clip time. Wire **Time** input to scrub or drive from logic."
          value={parsed.timeS}
          min={0}
          max={9999}
          step={0.01}
          onChange={(next) => onUpdateConfigField("timeS", next)}
        />
        <InspectorNumericScrubRow
          label="Speed"
          hint="Mixer time scale. Negative speed plays reverse."
          value={parsed.speed}
          min={-10}
          max={10}
          step={0.01}
          onChange={(next) => onUpdateConfigField("speed", next)}
        />
        <InspectorNumericScrubRow
          label="Weight"
          value={parsed.weight}
          min={0}
          max={1}
          step={0.01}
          onChange={(next) => onUpdateConfigField("weight", next)}
        />
        <TRNFormField label="Loop mode" id="animation-clip-loop" className="space-y-1.5">
          <TRNSelect
            ariaLabel="Animation clip loop mode"
            value={parsed.loopMode}
            options={[...LOOP_OPTIONS]}
            size="sm"
            className="min-w-0"
            buttonClassName={STUDIO_COMPACT_FLOW_SELECT_BUTTON_CLASS}
            onValueChange={(next) =>
              onUpdateConfigField("loopMode", next as StudioGlbAnimationLoopModeV1)
            }
          />
        </TRNFormField>
      </InspectorCollapsibleSection>
    </div>
  );
}
