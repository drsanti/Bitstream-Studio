import { useCallback, useEffect, useMemo, useRef } from "react";
import { twMerge } from "tailwind-merge";
import { TRNSelect, type TRNSelectOption } from "../../../../../ui/TRN";
import { useStudioAssetDescriptors } from "../../../asset-browser/useStudioAssetDescriptors";
import {
  getStudioModelDescriptorById,
  persistedModelUrlFromStudioDescriptor,
} from "../../../asset-browser/studio-model-scene-bindings";
import {
  applyStudioModelCatalogSelectToNodeConfig,
  buildStudioModelCatalogSelectOptions,
  readStudioModelCatalogSelectValue,
} from "./studio-model-catalog-select";
import { useFlowEditorStore } from "../../store/flow-editor.store";
import { FlowNodeIntrinsicWidthMarker } from "../flow-node/FlowNodeIntrinsicWidthMarker";
import {
  FLOW_NODE_BODY_PANEL_CLASS,
  widestTrnSelectOptionLabel,
} from "../flow-node/flow-node-intrinsic-width-utils";
import {
  FLOW_NODE_TRN_SELECT_BUTTON_SM_CLASS,
  FLOW_NODE_TRN_SELECT_CLASS,
} from "../flow-node/flow-node-trn-select-layout";
import { ModelOutlinerOpenLink } from "../../model-outliner/ModelOutlinerOpenLink";

export type ModelSelectNodePanelProps = {
  nodeId: string;
  defaultConfig: Record<string, unknown>;
};

/**
 * Flow node: pick a catalog GLB (or clear). Persists `selectedStudioAssetId` + `selectedModelUrl`
 * for the **Model** output pin. Drag from Asset Browser onto the canvas to spawn with a preset.
 * Model summary and library-linked nodes live in the Node Inspector.
 */
export function ModelSelectNodePanel(props: ModelSelectNodePanelProps) {
  const { nodeId, defaultConfig } = props;
  const { descriptors } = useStudioAssetDescriptors();
  const updateField = useFlowEditorStore((s) => s.updateNodeConfigFieldByNodeId);

  const assetId =
    typeof defaultConfig.selectedStudioAssetId === "string"
      ? defaultConfig.selectedStudioAssetId.trim()
      : "";
  const storedFetchUrl =
    typeof defaultConfig.selectedModelUrl === "string" ? defaultConfig.selectedModelUrl.trim() : "";

  const selectValue = useMemo(
    () => readStudioModelCatalogSelectValue(defaultConfig, descriptors),
    [assetId, defaultConfig, descriptors],
  );

  const options = useMemo<TRNSelectOption[]>(
    () => buildStudioModelCatalogSelectOptions(descriptors),
    [descriptors],
  );

  const selectedDescriptor = useMemo(() => {
    if (selectValue.length === 0) {
      return null;
    }
    return getStudioModelDescriptorById(selectValue, descriptors) ?? null;
  }, [selectValue, descriptors]);

  const intrinsicLabels = useMemo(() => {
    const selected = selectedDescriptor?.label?.trim() ?? "";
    const widest = widestTrnSelectOptionLabel(options);
    return selected.length > 0 ? [selected, widest] : [widest];
  }, [options, selectedDescriptor]);

  const applySelection = useCallback(
    (nextId: string) => {
      applyStudioModelCatalogSelectToNodeConfig(nextId, descriptors, (key, value) => {
        updateField(nodeId, key, value);
      });
    },
    [descriptors, nodeId, updateField],
  );

  const lastSyncedKeyRef = useRef<string>("");
  useEffect(() => {
    if (assetId.length === 0) {
      lastSyncedKeyRef.current = "";
      return;
    }
    const d = getStudioModelDescriptorById(assetId, descriptors);
    if (d == null) {
      return;
    }
    const persisted = persistedModelUrlFromStudioDescriptor(d);
    const key = `${assetId}\u0000${persisted}`;
    if (key === lastSyncedKeyRef.current) {
      return;
    }
    if (persisted.length > 0 && persisted !== storedFetchUrl) {
      lastSyncedKeyRef.current = key;
      updateField(nodeId, "selectedModelUrl", persisted);
    }
  }, [assetId, descriptors, nodeId, storedFetchUrl, updateField]);

  return (
    <div
      className={twMerge(
        "nodrag space-y-1.5 border-t border-zinc-800/55 px-2.5 py-2",
        FLOW_NODE_BODY_PANEL_CLASS,
      )}
      data-flow-node-body-panel
    >
      <FlowNodeIntrinsicWidthMarker labels={intrinsicLabels} />
      <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
        Model source
      </span>

      <TRNSelect
        value={selectValue}
        options={options}
        onValueChange={applySelection}
        ariaLabel="Select GLB model for flow output"
        size="sm"
        className={FLOW_NODE_TRN_SELECT_CLASS}
        buttonClassName={FLOW_NODE_TRN_SELECT_BUTTON_SM_CLASS}
        panelClassName="scrollbar-hide max-h-48 overflow-y-auto"
      />

      {selectedDescriptor == null ? (
        <p className="text-[11px] leading-relaxed text-zinc-500">
          Choose a model from the list, or drag a 3D model from Asset Browser onto the canvas.
        </p>
      ) : (
        <ModelOutlinerOpenLink
          label="Browse in Outliner"
          canvasModelId={nodeId}
          className="w-full"
        />
      )}
    </div>
  );
}
