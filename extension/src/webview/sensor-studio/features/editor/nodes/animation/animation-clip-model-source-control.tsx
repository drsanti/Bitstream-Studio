import type { TRNSelectOption } from "../../../../../ui/TRN";
import { useStudioAssetDescriptors } from "../../../asset-browser/useStudioAssetDescriptors";
import { GlbScopedModelSourceControl } from "../../model/glb-scoped-model-source-control";
import { useFlowEditorStore } from "../../store/flow-editor.store";
import { applyAnimationClipModelCatalogSelect } from "./animation-clip-model-catalog";

export type AnimationClipModelSourceControlProps = {
  nodeId: string;
  isModelWired: boolean;
  wiredModelDisplayLabel: string | null;
  modelSourceOptions: TRNSelectOption[];
  modelSourceValue: string;
  modelSourceDisabled: boolean;
  /** Canvas card uses compact label row; inspector uses TRNFormField wrapper externally. */
  variant?: "canvas" | "inspector-inline";
};

export function AnimationClipModelSourceControl(props: AnimationClipModelSourceControlProps) {
  const { nodeId, variant = "canvas", ...modelProps } = props;
  const updateField = useFlowEditorStore((s) => s.updateNodeConfigFieldByNodeId);
  const nodes = useFlowEditorStore((s) => s.nodes);
  const edges = useFlowEditorStore((s) => s.edges);
  const defaultConfig = useFlowEditorStore(
    (s) => (s.nodes.find((n) => n.id === nodeId)?.data.defaultConfig ?? {}) as Record<string, unknown>,
  );
  const { descriptors } = useStudioAssetDescriptors();

  return (
    <GlbScopedModelSourceControl
      {...modelProps}
      variant={variant}
      onCatalogSelect={(catalogAssetId) => {
        applyAnimationClipModelCatalogSelect({
          clipFlowNodeId: nodeId,
          catalogAssetId,
          clipConfig: defaultConfig,
          nodes,
          edges,
          descriptors,
          updateField,
        });
      }}
    />
  );
}
