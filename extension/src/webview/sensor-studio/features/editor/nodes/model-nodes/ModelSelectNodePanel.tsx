import { useCallback, useEffect, useMemo, useRef } from "react";
import { Link2 } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { TRNSelect, type TRNSelectOption } from "../../../../../ui/TRN";
import { useStudioAssetDescriptors } from "../../../asset-browser/useStudioAssetDescriptors";
import {
  getStudioModelDescriptorById,
  persistedModelUrlFromStudioDescriptor,
  STUDIO_MODEL_SELECT_CUSTOM,
} from "../../../asset-browser/studio-model-scene-bindings";
import {
  applyStudioModelCatalogSelectToNodeConfig,
  buildStudioModelCatalogSelectOptions,
  readStudioModelCatalogSelectValue,
} from "./studio-model-catalog-select";
import {
  StudioModelCatalogSourceBadge,
  studioModelCatalogSourceIcon,
} from "./studio-model-catalog-select-ui";
import { useFlowEditorStore } from "../../store/flow-editor.store";
import { readGeneratedChildNodeIds, readGlbExtractTag } from "../../model/model-generated-bindings";
import { FlowNodeIntrinsicWidthMarker } from "../flow-node/FlowNodeIntrinsicWidthMarker";
import {
  FLOW_NODE_BODY_PANEL_CLASS,
  widestTrnSelectOptionLabel,
} from "../flow-node/flow-node-intrinsic-width-utils";
import {
  FLOW_NODE_TRN_SELECT_BUTTON_SM_CLASS,
  FLOW_NODE_TRN_SELECT_CLASS,
} from "../flow-node/flow-node-trn-select-layout";

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

  const selectValue = useMemo(
    () => readStudioModelCatalogSelectValue(defaultConfig, descriptors),
    [assetId, defaultConfig, descriptors],
  );

  const options = useMemo<TRNSelectOption[]>(
    () => buildStudioModelCatalogSelectOptions(descriptors),
    [descriptors],
  );

  const selectedDescriptor = useMemo(() => {
    if (selectValue === STUDIO_MODEL_SELECT_CUSTOM || selectValue.length === 0) {
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

  return (
    <div
      className={twMerge(
        "nodrag space-y-2 border-t border-zinc-800/55 px-2.5 py-2",
        FLOW_NODE_BODY_PANEL_CLASS,
      )}
      data-flow-node-body-panel
    >
      <FlowNodeIntrinsicWidthMarker labels={intrinsicLabels} />
      <div className="flex min-w-0 items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
          GLB source
        </span>
        {selectedDescriptor ? (
          <StudioModelCatalogSourceBadge source={selectedDescriptor.source} />
        ) : null}
      </div>

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

      {selectedDescriptor ? (
        <div className="flex min-w-0 items-start gap-2 rounded-md border border-zinc-700/60 bg-zinc-950/40 px-2 py-1.5">
          <span className="mt-0.5 shrink-0">
            {studioModelCatalogSourceIcon(selectedDescriptor.source)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-medium leading-snug text-zinc-100">
              {selectedDescriptor.label}
            </p>
            <p className="mt-0.5 text-[10px] leading-snug text-zinc-500">
              Wired on <span className="text-zinc-400">Model</span> output
            </p>
          </div>
        </div>
      ) : (
        <p className="text-[11px] leading-relaxed text-zinc-500">
          Choose a model from the list, or drag a GLB from Asset Browser onto the canvas.
        </p>
      )}

      {childLinkRows.length > 0 ? (
        <div className="min-w-0 space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
            Linked from library
          </span>
          <ul className="scrollbar-hide max-h-24 divide-y divide-zinc-800/80 overflow-y-auto rounded-md border border-zinc-700/55 bg-zinc-950/35">
            {childLinkRows.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  className="flex w-full min-w-0 items-center gap-1.5 truncate px-2 py-1.5 text-left text-[11px] text-zinc-300 transition-colors hover:bg-zinc-800/60"
                  onClick={() => {
                    focusLinkedNode(row.id);
                  }}
                  title={row.label}
                >
                  <Link2 className="h-3 w-3 shrink-0 text-cyan-400/80" aria-hidden />
                  <span className="min-w-0 flex-1 truncate">{row.label}</span>
                  {row.glbTag != null ? (
                    <span className="shrink-0 rounded border border-cyan-500/30 bg-cyan-950/40 px-1 py-px text-[9px] font-semibold uppercase tracking-wide text-cyan-200/90">
                      {row.glbTag.kind}
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
