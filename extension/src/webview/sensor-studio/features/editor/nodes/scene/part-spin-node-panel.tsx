import { RotateCw } from "lucide-react";
import { TRNSelect } from "../../../../../ui/TRN";
import { STUDIO_COMPACT_FLOW_SELECT_BUTTON_FULL_WIDTH_CLASS } from "../../components/inspector/inspector-dense-select-button";
import { useStudioAssetDescriptors } from "../../../asset-browser/useStudioAssetDescriptors";
import { GlbScopedModelSourceControl } from "../../model/glb-scoped-model-source-control";
import { useFlowEditorStore } from "../../store/flow-editor.store";
import { ReadingPanel } from "../flow-node/readings/ReadingPanel";
import { applyPartSpinModelCatalogSelect } from "./part-spin-model-catalog";
import {
  buildPartSpinBindingPatch,
  GLB_PART_UNBOUND,
  usePartSpinEditorState,
} from "./part-spin-editor-state";
import type { StudioGlbPartSpinAxisV1 } from "./part-spin-config";

export type PartSpinNodePanelProps = {
  nodeId: string;
  defaultConfig: Record<string, unknown>;
};

function formatAxis(axis: StudioGlbPartSpinAxisV1): string {
  return axis.toUpperCase();
}

/** Compact canvas body for **Part Spin** — model, part, axis/speed summary. */
export function PartSpinNodePanel(props: PartSpinNodePanelProps) {
  const { nodeId } = props;
  const updateField = useFlowEditorStore((s) => s.updateNodeConfigFieldByNodeId);
  const nodes = useFlowEditorStore((s) => s.nodes);
  const edges = useFlowEditorStore((s) => s.edges);
  const defaultConfig = useFlowEditorStore(
    (s) => (s.nodes.find((n) => n.id === nodeId)?.data.defaultConfig ?? {}) as Record<string, unknown>,
  );
  const { descriptors } = useStudioAssetDescriptors();
  const {
    parsed,
    modelRef,
    isModelWired,
    wiredModelDisplayLabel,
    modelSourceOptions,
    modelSourceValue,
    modelSourceDisabled,
    partSelectOptions,
    partSelectValue,
    partSelectDisabled,
  } = usePartSpinEditorState(nodeId);

  const patchPart = (ref: string) => {
    const modelFlowId = modelRef.status === "ok" ? modelRef.modelFlowId : undefined;
    const patch = buildPartSpinBindingPatch(ref, modelFlowId);
    for (const [key, value] of Object.entries(patch)) {
      updateField(nodeId, key, value);
    }
  };

  return (
    <ReadingPanel className="nodrag space-y-2 px-2 pb-2 pt-1">
      <GlbScopedModelSourceControl
        variant="canvas"
        isModelWired={isModelWired}
        wiredModelDisplayLabel={wiredModelDisplayLabel}
        modelSourceOptions={modelSourceOptions}
        modelSourceValue={modelSourceValue}
        modelSourceDisabled={modelSourceDisabled}
        onCatalogSelect={(catalogAssetId) => {
          applyPartSpinModelCatalogSelect({
            flowNodeId: nodeId,
            catalogAssetId,
            nodeConfig: defaultConfig,
            nodes,
            edges,
            descriptors,
            updateField,
          });
        }}
      />

      <div className="space-y-1">
        <div className="flex items-center gap-1 text-[9px] text-zinc-500">
          <RotateCw className="h-2.5 w-2.5 shrink-0" aria-hidden />
          <span>Part</span>
        </div>
        <TRNSelect
          ariaLabel="GLB part path"
          value={partSelectValue}
          options={partSelectOptions}
          disabled={partSelectDisabled}
          size="sm"
          className="min-w-0 w-full"
          buttonClassName={STUDIO_COMPACT_FLOW_SELECT_BUTTON_FULL_WIDTH_CLASS}
          panelClassName="scrollbar-hide max-h-48 overflow-y-auto"
          onValueChange={(next) => {
            if (next === GLB_PART_UNBOUND) {
              return;
            }
            patchPart(next);
          }}
        />
      </div>

      <div className="flex flex-wrap items-center gap-1.5 text-[9px]">
        <span className="rounded bg-zinc-900/60 px-1 py-px text-zinc-500">
          {formatAxis(parsed.axis)} axis
        </span>
        <span className="rounded bg-zinc-900/60 px-1 py-px text-zinc-500">
          {parsed.reverse ? "−" : "+"}
          {Math.abs(parsed.speedRadS).toFixed(1)} rad/s
        </span>
        {!parsed.enabled ? (
          <span className="rounded bg-zinc-900/60 px-1 py-px text-amber-200/80">off</span>
        ) : null}
      </div>
    </ReadingPanel>
  );
}
