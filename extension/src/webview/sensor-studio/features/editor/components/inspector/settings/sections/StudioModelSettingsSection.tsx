import { Link2 } from "lucide-react";
import { useCallback, useMemo } from "react";
import { TRNButton, TRNHintText } from "../../../../../../../ui/TRN";
import { useStudioAssetDescriptors } from "../../../../../asset-browser/useStudioAssetDescriptors";
import {
  getStudioModelDescriptorById,
  STUDIO_MODEL_SELECT_CUSTOM,
} from "../../../../../asset-browser/studio-model-scene-bindings";
import { readStudioModelCatalogSelectValue } from "../../../../nodes/model-nodes/studio-model-catalog-select";
import {
  StudioModelCatalogSourceBadge,
  studioModelCatalogSourceIcon,
} from "../../../../nodes/model-nodes/studio-model-catalog-select-ui";
import { readGeneratedChildNodeIds, readGlbExtractTag } from "../../../../model/model-generated-bindings";
import { useFlowEditorStore } from "../../../../store/flow-editor.store";
import { InspectorSettingsSectionFrame } from "../../InspectorSettingsSectionFrame";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";

export function StudioModelSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode } = props;
  const defaultConfig = selectedNode.data.defaultConfig as Record<string, unknown>;
  const { descriptors } = useStudioAssetDescriptors();
  const nodes = useFlowEditorStore((s) => s.nodes);
  const selectStudioNodesByIds = useFlowEditorStore((s) => s.selectStudioNodesByIds);

  const storedFetchUrl =
    typeof defaultConfig.selectedModelUrl === "string" ? defaultConfig.selectedModelUrl.trim() : "";

  const selectValue = useMemo(
    () => readStudioModelCatalogSelectValue(defaultConfig, descriptors),
    [defaultConfig, descriptors],
  );

  const selectedDescriptor = useMemo(() => {
    if (selectValue === STUDIO_MODEL_SELECT_CUSTOM || selectValue.length === 0) {
      return null;
    }
    return getStudioModelDescriptorById(selectValue, descriptors) ?? null;
  }, [selectValue, descriptors]);

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
    <InspectorSettingsSectionFrame title="Model Source">
      <div className="space-y-3">
        <div>
          <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
            Selected model
          </div>
          {selectedDescriptor != null ? (
            <div className="flex min-w-0 items-start gap-2 rounded-md border border-zinc-700/60 bg-zinc-950/40 px-2.5 py-2">
              <span className="mt-0.5 shrink-0">
                {studioModelCatalogSourceIcon(selectedDescriptor.source)}
              </span>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex min-w-0 items-start justify-between gap-2">
                  <p className="min-w-0 truncate text-[12px] font-medium leading-snug text-zinc-100">
                    {selectedDescriptor.label}
                  </p>
                  <StudioModelCatalogSourceBadge source={selectedDescriptor.source} />
                </div>
                <p className="text-[10px] leading-snug text-zinc-500">
                  Emits on <span className="text-zinc-400">Model</span> output
                </p>
                {storedFetchUrl.length > 0 ? (
                  <p className="truncate text-[10px] leading-snug text-zinc-600">{storedFetchUrl}</p>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="rounded-md border border-zinc-700/55 bg-zinc-950/35 px-2.5 py-2 text-[11px] leading-relaxed text-zinc-500">
              No model selected — pick one on the canvas card or drag a 3D model from Asset Browser onto
              the flow.
            </p>
          )}
        </div>

        {childLinkRows.length > 0 ? (
          <div>
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
              Linked nodes ({childLinkRows.length})
            </div>
            <ul className="scrollbar-hide divide-y divide-zinc-800/80 overflow-hidden rounded-md border border-zinc-700/55 bg-zinc-950/35">
              {childLinkRows.map((row) => (
                <li key={row.id}>
                  <div className="flex min-w-0 items-center gap-1.5 px-2 py-1.5">
                    <Link2 className="h-3 w-3 shrink-0 text-cyan-400/80" aria-hidden />
                    <span className="min-w-0 flex-1 truncate text-[11px] text-zinc-300">
                      {row.label}
                    </span>
                    {row.glbTag != null ? (
                      <span className="shrink-0 rounded border border-cyan-500/30 bg-cyan-950/40 px-1 py-px text-[9px] font-semibold uppercase tracking-wide text-cyan-200/90">
                        {row.glbTag.kind}
                      </span>
                    ) : null}
                    <TRNButton
                      type="button"
                      size="compact"
                      className="shrink-0"
                      hint={`Select ${row.label} on the canvas`}
                      onClick={() => {
                        focusLinkedNode(row.id);
                      }}
                    >
                      Focus
                    </TRNButton>
                  </div>
                </li>
              ))}
            </ul>
            <TRNHintText className="mt-1.5">
              Nodes spawned from Asset Library while this model was selected (GLB extract,
              materials, events, …).
            </TRNHintText>
          </div>
        ) : null}
      </div>
    </InspectorSettingsSectionFrame>
  );
}
