import { Search, Tag } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  TRNAccordion,
  TRNAccordionContent,
  TRNAccordionItem,
  TRNAccordionTrigger,
  TRNHighlightedJsonTextarea,
} from "../../../../../ui/TRN";
import { NodeInspectorCanvasLayoutSection } from "./NodeInspectorCanvasLayoutSection";
import { InspectorLinkedStudioModelSection } from "./InspectorLinkedStudioModelSection";
import { InspectorSection } from "./InspectorSection";
import { InspectorTextField } from "./InspectorNumericScrubRow";
import { Rotation3DInspectorCards } from "../rotation/Rotation3DInspectorCards";
import {
  defaultScene3DConfig,
  persistScene3DConfig,
  type Scene3DConfigV1,
} from "../../../../core/scene3d/scene3d-config";
import type { StudioNode } from "../../store/flow-editor.store";
import { NODE_INSPECTOR_SETTINGS_SECTION_BY_NODE_ID } from "./settings/node-inspector-settings-registry";
import type { NodeInspectorSettingsSectionProps } from "./settings/node-inspector-settings-types";
import {
  shouldShowJsonConfigSection,
  shouldShowRotation3dSettings,
  shouldShowTypedSettingsSection,
} from "./settings/node-inspector-settings-search";
import {
  readSettingsJsonAccordionValue,
  SETTINGS_JSON_ACCORDION_VALUE,
  mergeNodeTabSectionOrder,
  readNodeTabSectionOrder,
  writeNodeTabSectionOrder,
  type NodeInspectorSectionId,
  writeSettingsJsonAccordionValue,
} from "./node-inspector-ui-persistence";

export type NodeInspectorNodeTabProps = {
  selectedNode: StudioNode;
  /** Catalog definition title for search + context (may be empty). */
  catalogDefinitionTitle: string;
  isRotation3DNode: boolean;
  /** When true (multi-select, same `nodeId`), hide JSON — store rejects multi JSON apply. */
  suppressDefaultConfigJson?: boolean;
  onUpdateLabel: (nextLabel: string) => void;
  onUpdateNodeUiAllowBodyCollapse: (allow: boolean) => void;
  onUpdateConfigField: (key: string, value: unknown) => boolean;
  onUpdateConfigJson: (
    nextJson: string,
  ) => { ok: true } | { ok: false; message: string };
  jsonDraft: string;
  setJsonDraft: (next: string) => void;
  jsonError: string | null;
  setJsonError: (next: string | null) => void;
  sourceKeyDraft: string;
  setSourceKeyDraft: (next: string) => void;
  sourceKeyFieldError: string | null;
  setSourceKeyFieldError: (next: string | null) => void;
};

export function NodeInspectorNodeTab(props: NodeInspectorNodeTabProps) {
  const {
    selectedNode,
    catalogDefinitionTitle,
    isRotation3DNode,
    suppressDefaultConfigJson = false,
    onUpdateLabel,
    onUpdateNodeUiAllowBodyCollapse,
    onUpdateConfigField,
    onUpdateConfigJson,
    jsonDraft,
    setJsonDraft,
    jsonError,
    setJsonError,
    sourceKeyDraft,
    setSourceKeyDraft,
    sourceKeyFieldError,
    setSourceKeyFieldError,
  } = props;

  const [settingsSearch, setSettingsSearch] = useState("");

  useEffect(() => {
    setSettingsSearch("");
  }, [selectedNode.id]);

  const [jsonAccordionValue, setJsonAccordionValue] = useState<string>(() => {
    return readSettingsJsonAccordionValue() ?? "";
  });

  const sectionProps = useMemo((): NodeInspectorSettingsSectionProps => {
    return {
      selectedNode,
      onUpdateConfigField,
      sourceKeyDraft,
      setSourceKeyDraft,
      sourceKeyFieldError,
      setSourceKeyFieldError,
    };
  }, [
    selectedNode,
    onUpdateConfigField,
    sourceKeyDraft,
    setSourceKeyDraft,
    sourceKeyFieldError,
    setSourceKeyFieldError,
  ]);

  const CatalogSection =
    NODE_INSPECTOR_SETTINGS_SECTION_BY_NODE_ID[selectedNode.data.nodeId] ??
    null;

  const showTypedSection =
    CatalogSection != null &&
    shouldShowTypedSettingsSection(
      selectedNode.data.nodeId,
      catalogDefinitionTitle,
      settingsSearch,
    );

  const showRotationBlock =
    isRotation3DNode && shouldShowRotation3dSettings(settingsSearch);

  const showJsonSection = shouldShowJsonConfigSection(settingsSearch);

  const visibleSectionIds = useMemo((): NodeInspectorSectionId[] => {
    const out: NodeInspectorSectionId[] = ["linked-model", "identity", "canvas"];
    if (showTypedSection && CatalogSection != null) {
      out.push("typed");
    }
    if (showRotationBlock) {
      out.push("rotation");
    }
    if (showJsonSection && !suppressDefaultConfigJson) {
      out.push("advanced");
    }
    return out;
  }, [
    CatalogSection,
    showJsonSection,
    showRotationBlock,
    showTypedSection,
    suppressDefaultConfigJson,
  ]);

  const [sectionOrder, setSectionOrder] = useState<NodeInspectorSectionId[]>(
    () => mergeNodeTabSectionOrder(readNodeTabSectionOrder(), visibleSectionIds),
  );

  useEffect(() => {
    setSectionOrder((prev) => mergeNodeTabSectionOrder(prev, visibleSectionIds));
  }, [visibleSectionIds]);

  const [dragId, setDragId] = useState<NodeInspectorSectionId | null>(null);

  const onDropSection = (targetId: NodeInspectorSectionId) => {
    if (dragId == null || dragId === targetId) {
      return;
    }
    setSectionOrder((prev) => {
      const next = prev.filter((id) => id !== dragId);
      const targetIdx = next.indexOf(targetId);
      if (targetIdx < 0) {
        return prev;
      }
      next.splice(targetIdx, 0, dragId);
      writeNodeTabSectionOrder(next);
      return next;
    });
  };

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden text-xs">
      <div className="shrink-0 pb-2">
        <div className="flex items-center gap-1.5 rounded border border-zinc-700/70 bg-zinc-900/50 px-2 py-1">
          <Search className="h-3.5 w-3.5 shrink-0 text-zinc-500" aria-hidden />
          <input
            type="search"
            aria-label="Filter node settings"
            placeholder="Filter node settings…"
            className="min-w-0 flex-1 bg-transparent text-[11px] text-zinc-200 outline-none placeholder:text-zinc-600"
            value={settingsSearch}
            onChange={(e) => setSettingsSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="scrollbar-hide min-h-0 flex-1 space-y-3 overflow-y-auto overflow-x-hidden pb-0.5">
        {selectedNode.data.configErrors != null &&
        selectedNode.data.configErrors.length > 0 ? (
          <div className="rounded border border-rose-700/70 bg-rose-950/35 px-2 py-1.5">
            <div className="text-[11px] font-semibold text-rose-200">
              Config validation
            </div>
            <ul className="mt-1 list-inside list-disc space-y-0.5 text-[11px] text-rose-100/95">
              {selectedNode.data.configErrors.map((msg, i) => (
                <li key={`${i}-${msg}`}>{msg}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {sectionOrder.map((id) => {
          const content =
            id === "linked-model" ? (
              <InspectorLinkedStudioModelSection selectedNode={selectedNode} />
            ) : id === "identity" ? (
              <InspectorSection title="Identity" variant="compact">
                <InspectorTextField
                  ariaLabel="Node label"
                  value={selectedNode.data.label}
                  placeholder="Display name on canvas"
                  leadingIcon={<Tag className="h-3.5 w-3.5" aria-hidden />}
                  onChange={onUpdateLabel}
                />
              </InspectorSection>
            ) : id === "canvas" ? (
              <NodeInspectorCanvasLayoutSection
                selectedNode={selectedNode}
                onAllowBodyCollapseChange={onUpdateNodeUiAllowBodyCollapse}
              />
            ) : id === "typed" ? (
              showTypedSection && CatalogSection != null ? (
                <CatalogSection {...sectionProps} />
              ) : null
            ) : id === "rotation" ? (
              showRotationBlock ? (
                <div className="space-y-2">
                  <div className="sticky top-0 z-1 border-b border-emerald-900/30 bg-zinc-950/92 py-1 text-[10px] font-semibold tracking-wide text-emerald-100/85 backdrop-blur-sm supports-backdrop-filter:bg-zinc-950/75">
                    3D Scene Settings
                  </div>
                  <Rotation3DInspectorCards
                    scene3dRaw={selectedNode.data.defaultConfig.scene3d}
                    inspectorRailResetKey={selectedNode.id}
                    onChangeScene3d={(next: Scene3DConfigV1) => {
                      const snap =
                        next != null ? persistScene3DConfig(next) : defaultScene3DConfig();
                      onUpdateConfigField("scene3d", snap);
                    }}
                  />
                </div>
              ) : null
            ) : id === "advanced" ? (
              showJsonSection && !suppressDefaultConfigJson ? (
                <InspectorSection title="Advanced" variant="compact" defaultExpanded={false}>
                  <TRNAccordion
                    type="single"
                    collapsible
                    className="rounded-md border border-zinc-700/70 bg-zinc-950/40"
                    value={jsonAccordionValue}
                    onValueChange={(next) => {
                      const raw = typeof next === "string" ? next : "";
                      const normalized =
                        raw === SETTINGS_JSON_ACCORDION_VALUE
                          ? SETTINGS_JSON_ACCORDION_VALUE
                          : "";
                      setJsonAccordionValue(normalized);
                      writeSettingsJsonAccordionValue(
                        normalized === "" ? undefined : SETTINGS_JSON_ACCORDION_VALUE,
                      );
                    }}
                  >
                    <TRNAccordionItem value="default-config-json" className="border-0">
                      <TRNAccordionTrigger className="px-2 py-1.5 text-xs font-normal text-zinc-400 hover:bg-zinc-800/35">
                        Default config (JSON)
                      </TRNAccordionTrigger>
                      <TRNAccordionContent
                        className="border-t border-zinc-800/60 bg-zinc-950/35"
                        innerClassName="flex flex-col gap-1 px-2 pb-2 pt-1 text-xs text-zinc-300"
                      >
                        <TRNHighlightedJsonTextarea
                          aria-label="Default node configuration JSON"
                          className="min-h-[160px] w-full max-h-[min(40vh,360px)]"
                          value={jsonDraft}
                          onChange={setJsonDraft}
                          onBlur={() => {
                            const result = onUpdateConfigJson(jsonDraft);
                            if (!result.ok) {
                              setJsonError(result.message);
                              return;
                            }
                            setJsonError(null);
                          }}
                        />
                        {jsonError != null ? (
                          <div className="shrink-0 text-[11px] text-red-400">{jsonError}</div>
                        ) : null}
                      </TRNAccordionContent>
                    </TRNAccordionItem>
                  </TRNAccordion>
                </InspectorSection>
              ) : null
            ) : null;

          if (content == null) {
            return null;
          }

          return (
            <div
              key={id}
              className="min-w-0"
              draggable
              onDragStart={(e) => {
                const header = (e.target as HTMLElement | null)?.closest?.("[data-trn-card-header]");
                if (header == null) {
                  e.preventDefault();
                  return;
                }
                setDragId(id);
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", id);
              }}
              onDragEnd={() => setDragId(null)}
              onDragOver={(e) => {
                if (dragId == null || dragId === id) {
                  return;
                }
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
              }}
              onDrop={(e) => {
                e.preventDefault();
                onDropSection(id);
              }}
            >
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
