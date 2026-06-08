import { RotateCw } from "lucide-react";
import { TRNSelect } from "../../../../../ui/TRN";
import { STUDIO_COMPACT_FLOW_SELECT_BUTTON_FULL_WIDTH_CLASS } from "../../components/inspector/inspector-dense-select-button";
import { useFlowEditorStore } from "../../store/flow-editor.store";
import { ReadingPanel } from "../flow-node/readings/ReadingPanel";
import { AnimationClipModelSourceControl } from "./animation-clip-model-source-control";
import {
  buildAnimationClipBindingPatch,
  GLB_CLIP_UNBOUND,
  useAnimationClipEditorState,
} from "./animation-clip-editor-state";

export type AnimationClipNodePanelProps = {
  nodeId: string;
  defaultConfig: Record<string, unknown>;
};

/** Compact canvas body — model source, clip dropdown, loop/speed summary. */
export function AnimationClipNodePanel(props: AnimationClipNodePanelProps) {
  const { nodeId } = props;
  const updateField = useFlowEditorStore((s) => s.updateNodeConfigFieldByNodeId);
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
  } = useAnimationClipEditorState(nodeId);

  const patchClip = (ref: string) => {
    const modelFlowId = modelRef.status === "ok" ? modelRef.modelFlowId : undefined;
    const patch = buildAnimationClipBindingPatch(ref, modelFlowId);
    for (const [key, value] of Object.entries(patch)) {
      updateField(nodeId, key, value);
    }
  };

  return (
    <ReadingPanel className="nodrag space-y-2 px-2 pb-2 pt-1">
      <AnimationClipModelSourceControl
        nodeId={nodeId}
        variant="canvas"
        isModelWired={isModelWired}
        wiredModelDisplayLabel={wiredModelDisplayLabel}
        modelSourceOptions={modelSourceOptions}
        modelSourceValue={modelSourceValue}
        modelSourceDisabled={modelSourceDisabled}
      />

      <div className="space-y-1">
        <div className="flex items-center gap-1 text-[9px] text-zinc-500">
          <RotateCw className="h-2.5 w-2.5 shrink-0" aria-hidden />
          <span>Clip</span>
        </div>
        <TRNSelect
          ariaLabel="GLB animation clip"
          value={selectValue}
          options={selectOptions}
          disabled={clipSelectDisabled}
          size="sm"
          className="min-w-0 w-full"
          buttonClassName={STUDIO_COMPACT_FLOW_SELECT_BUTTON_FULL_WIDTH_CLASS}
          panelClassName="scrollbar-hide max-h-48 overflow-y-auto"
          onValueChange={(next) => {
            if (next === GLB_CLIP_UNBOUND) {
              return;
            }
            patchClip(next);
          }}
        />
      </div>

      <div className="flex flex-wrap items-center gap-1.5 text-[9px]">
        <span className="rounded bg-zinc-900/60 px-1 py-px text-zinc-500">{parsed.loopMode}</span>
        <span className="rounded bg-zinc-900/60 px-1 py-px text-zinc-500">spd {parsed.speed}</span>
        {!parsed.enabled ? (
          <span className="rounded bg-zinc-900/60 px-1 py-px text-amber-200/80">off</span>
        ) : null}
      </div>
    </ReadingPanel>
  );
}
