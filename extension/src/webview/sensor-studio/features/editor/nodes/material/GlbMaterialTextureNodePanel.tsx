import { useCallback, useEffect, useMemo, useRef } from "react";
import { TRNSelect } from "../../../../../ui/TRN";
import { STUDIO_COMPACT_FLOW_SELECT_BUTTON_H7_FULL_WIDTH_CLASS } from "../../components/inspector/inspector-dense-select-button";
import { useStudioAssetDescriptors } from "../../../asset-browser/useStudioAssetDescriptors";
import {
  getStudioTextureDescriptorById,
  listStudioTextureDescriptors,
  resolveStudioTextureFetchUrl,
  STUDIO_TEXTURE_SELECT_NONE,
} from "../../../asset-browser/studio-texture-scene-bindings";
import {
  STUDIO_TEXTURE_ASSET_ID_KEY,
  STUDIO_TEXTURE_URL_KEY,
} from "../../gltf/studio-glb-material-texture";
import { useFlowEditorStore } from "../../store/flow-editor.store";
import { FlowNodeIntrinsicWidthMarker } from "../flow-node/FlowNodeIntrinsicWidthMarker";
import { widestTrnSelectOptionLabel } from "../flow-node/flow-node-intrinsic-width-utils";
import { FLOW_NODE_TRN_SELECT_CLASS } from "../flow-node/flow-node-trn-select-layout";
import { ReadingPanel } from "../flow-node/readings/ReadingPanel";

export type GlbMaterialTextureNodePanelProps = {
  nodeId: string;
  defaultConfig: Record<string, unknown>;
};

export function GlbMaterialTextureNodePanel(props: GlbMaterialTextureNodePanelProps) {
  const { nodeId, defaultConfig } = props;
  const { descriptors } = useStudioAssetDescriptors();
  const updateField = useFlowEditorStore((s) => s.updateNodeConfigFieldByNodeId);

  const assetId =
    typeof defaultConfig[STUDIO_TEXTURE_ASSET_ID_KEY] === "string"
      ? (defaultConfig[STUDIO_TEXTURE_ASSET_ID_KEY] as string).trim()
      : "";
  const storedFetchUrl =
    typeof defaultConfig[STUDIO_TEXTURE_URL_KEY] === "string"
      ? (defaultConfig[STUDIO_TEXTURE_URL_KEY] as string).trim()
      : "";

  const selectValue = useMemo(() => {
    if (assetId.length > 0) {
      const d = getStudioTextureDescriptorById(assetId, descriptors);
      if (d != null) {
        return assetId;
      }
    }
    return STUDIO_TEXTURE_SELECT_NONE;
  }, [assetId, descriptors]);

  const options = useMemo(
    () => [
      { value: STUDIO_TEXTURE_SELECT_NONE, label: "No texture" },
      ...listStudioTextureDescriptors(descriptors).map((d) => ({
        value: d.id,
        label: d.label,
      })),
    ],
    [descriptors],
  );

  const applySelection = useCallback(
    (nextId: string) => {
      if (nextId === STUDIO_TEXTURE_SELECT_NONE || nextId.length === 0) {
        updateField(nodeId, STUDIO_TEXTURE_ASSET_ID_KEY, "");
        updateField(nodeId, STUDIO_TEXTURE_URL_KEY, "");
        return;
      }
      const d = getStudioTextureDescriptorById(nextId, descriptors);
      if (d == null) {
        updateField(nodeId, STUDIO_TEXTURE_ASSET_ID_KEY, "");
        updateField(nodeId, STUDIO_TEXTURE_URL_KEY, "");
        return;
      }
      const fetchUrl = resolveStudioTextureFetchUrl(d);
      updateField(nodeId, STUDIO_TEXTURE_ASSET_ID_KEY, d.id);
      updateField(nodeId, STUDIO_TEXTURE_URL_KEY, fetchUrl);
    },
    [descriptors, nodeId, updateField],
  );

  const lastSyncedKeyRef = useRef<string>("");
  useEffect(() => {
    if (assetId.length === 0) {
      lastSyncedKeyRef.current = "";
      return;
    }
    const d = getStudioTextureDescriptorById(assetId, descriptors);
    if (d == null) {
      return;
    }
    const fetchUrl = resolveStudioTextureFetchUrl(d);
    const key = `${assetId}\u0000${fetchUrl}`;
    if (key === lastSyncedKeyRef.current) {
      return;
    }
    if (fetchUrl.length > 0 && fetchUrl !== storedFetchUrl) {
      lastSyncedKeyRef.current = key;
      updateField(nodeId, STUDIO_TEXTURE_URL_KEY, fetchUrl);
    }
  }, [assetId, descriptors, nodeId, storedFetchUrl, updateField]);

  const selectedLabel = options.find((o) => o.value === selectValue)?.label ?? "";

  return (
    <ReadingPanel className="relative overflow-hidden py-0.5">
      <FlowNodeIntrinsicWidthMarker
        labels={[selectedLabel, widestTrnSelectOptionLabel(options)]}
      />
      <TRNSelect
        value={selectValue}
        options={options}
        onValueChange={applySelection}
        ariaLabel="Select texture for GLB material map"
        size="sm"
        className={FLOW_NODE_TRN_SELECT_CLASS}
        buttonClassName={STUDIO_COMPACT_FLOW_SELECT_BUTTON_H7_FULL_WIDTH_CLASS}
        panelClassName="scrollbar-hide max-h-48 overflow-y-auto"
      />
    </ReadingPanel>
  );
}
