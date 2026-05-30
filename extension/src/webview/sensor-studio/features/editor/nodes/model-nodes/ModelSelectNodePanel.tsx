import { useCallback, useEffect, useMemo, useRef } from "react";
import { TRNSelect, type TRNSelectOption } from "../../../../../ui/TRN";
import { useStudioAssetDescriptors } from "../../../asset-browser/useStudioAssetDescriptors";
import {
  getStudioModelDescriptorById,
  listStudioModelDescriptors,
  persistedModelUrlFromStudioDescriptor,
  resolveStudioModelGltfFetchUrl,
  STUDIO_MODEL_SELECT_CUSTOM,
} from "../../../asset-browser/studio-model-scene-bindings";
import { useFlowEditorStore } from "../../store/flow-editor.store";
import { ReadingPanel } from "../flow-node/readings/ReadingPanel";
import { readGeneratedChildNodeIds, readGlbExtractTag } from "../../model/model-generated-bindings";

export type ModelSelectNodePanelProps = {
  nodeId: string;
  defaultConfig: Record<string, unknown>;
};

/**
 * Flow node: pick a catalog GLB (or clear). Persists `selectedStudioAssetId` + `selectedModelUrl`
 * for the **Model** output pin. Drag from Asset Browser onto the canvas to spawn with a preset.
 */
export function ModelSelectNodePanel(props: ModelSelectNodePanelProps) {
  const { nodeId, defaultConfig } = props;
  const { descriptors } = useStudioAssetDescriptors();
  const updateField = useFlowEditorStore((s) => s.updateNodeConfigFieldByNodeId);
  const nodes = useFlowEditorStore((s) => s.nodes);
  const selectStudioNodesByIds = useFlowEditorStore((s) => s.selectStudioNodesByIds);

  const assetId =
    typeof defaultConfig.selectedStudioAssetId === "string"
      ? defaultConfig.selectedStudioAssetId.trim()
      : "";
  const storedFetchUrl =
    typeof defaultConfig.selectedModelUrl === "string" ? defaultConfig.selectedModelUrl.trim() : "";

  const selectValue = useMemo(() => {
    if (assetId.length > 0) {
      const d = getStudioModelDescriptorById(assetId, descriptors);
      if (d != null) {
        return assetId;
      }
    }
    return STUDIO_MODEL_SELECT_CUSTOM;
  }, [assetId, descriptors]);

  const options = useMemo<TRNSelectOption[]>(
    () => [
      { value: STUDIO_MODEL_SELECT_CUSTOM, label: "None" },
      ...listStudioModelDescriptors(descriptors).map((d) => ({
        value: d.id,
        label: d.label,
      })),
    ],
    [descriptors],
  );

  const applySelection = useCallback(
    (nextId: string) => {
      if (nextId === STUDIO_MODEL_SELECT_CUSTOM || nextId.length === 0) {
        updateField(nodeId, "selectedStudioAssetId", "");
        updateField(nodeId, "selectedModelUrl", "");
        return;
      }
      const d = getStudioModelDescriptorById(nextId, descriptors);
      if (d == null) {
        updateField(nodeId, "selectedStudioAssetId", "");
        updateField(nodeId, "selectedModelUrl", "");
        return;
      }
      const persisted = persistedModelUrlFromStudioDescriptor(d);
      const fetchUrl = resolveStudioModelGltfFetchUrl(
        { url: persisted, studioAssetId: d.id },
        descriptors,
        "",
      );
      updateField(nodeId, "selectedStudioAssetId", d.id);
      updateField(nodeId, "selectedModelUrl", fetchUrl);
    },
    [descriptors, nodeId, updateField],
  );

  /** When catalog refreshes, keep fetch URL in sync with the stored asset id. */
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
    const fetchUrl = resolveStudioModelGltfFetchUrl(
      { url: persisted, studioAssetId: d.id },
      descriptors,
      "",
    );
    const key = `${assetId}\u0000${fetchUrl}`;
    if (key === lastSyncedKeyRef.current) {
      return;
    }
    if (fetchUrl.length > 0 && fetchUrl !== storedFetchUrl) {
      lastSyncedKeyRef.current = key;
      updateField(nodeId, "selectedModelUrl", fetchUrl);
    }
  }, [assetId, descriptors, nodeId, storedFetchUrl, updateField]);

  const childLinkRows = useMemo(() => {
    const ids = readGeneratedChildNodeIds(defaultConfig);
    return ids.map((cid) => {
      const n = nodes.find((x) => x.id === cid);
      const label =
        n != null && typeof n.data.label === "string" && n.data.label.trim().length > 0
          ? n.data.label.trim()
          : cid;
      const glbTag = n != null ? readGlbExtractTag(n.data.defaultConfig) : null;
      return { id: cid, label, glbTag };
    });
  }, [defaultConfig, nodes]);

  const focusLinkedNode = useCallback(
    (targetId: string) => {
      selectStudioNodesByIds([targetId]);
    },
    [selectStudioNodesByIds],
  );

  if (childLinkRows.length === 0) {
    return (
      <ReadingPanel className="py-0.5">
        <TRNSelect
          value={selectValue}
          options={options}
          onValueChange={applySelection}
          ariaLabel="Select GLB model for flow output"
          size="sm"
          className="w-full"
          buttonClassName="h-7 w-full text-[11px]"
          panelClassName="scrollbar-hide max-h-48 overflow-y-auto"
        />
      </ReadingPanel>
    );
  }

  return (
    <ReadingPanel className="space-y-1 py-0.5">
      <TRNSelect
        value={selectValue}
        options={options}
        onValueChange={applySelection}
        ariaLabel="Select GLB model for flow output"
        size="sm"
        className="w-full"
        buttonClassName="h-7 w-full text-[11px]"
        panelClassName="scrollbar-hide max-h-48 overflow-y-auto"
      />
      <ul className="scrollbar-hide max-h-20 divide-y divide-zinc-800/80 overflow-y-auto rounded border border-zinc-700/55 bg-zinc-950/35">
        {childLinkRows.map((row) => (
          <li key={row.id}>
            <button
              type="button"
              className="nodrag flex w-full min-w-0 items-center gap-1.5 truncate px-2 py-1 text-left text-[10px] text-zinc-300 transition-colors hover:bg-zinc-800/60"
              onClick={() => {
                focusLinkedNode(row.id);
              }}
              title={row.label}
            >
              <span className="truncate">{row.label}</span>
              {row.glbTag != null ? (
                <span className="shrink-0 font-mono text-[9px] text-cyan-400/80">{row.glbTag.kind}</span>
              ) : null}
            </button>
          </li>
        ))}
      </ul>
    </ReadingPanel>
  );
}
