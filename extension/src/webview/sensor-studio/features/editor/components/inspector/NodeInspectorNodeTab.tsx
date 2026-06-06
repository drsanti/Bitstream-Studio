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
import { NodeInspectorScene3dSection } from "./NodeInspectorScene3dSection";
import { InspectorLinkedStudioModelSection } from "./InspectorLinkedStudioModelSection";
import { InspectorSection } from "./InspectorSection";
import { InspectorTextField } from "./InspectorNumericScrubRow";
import type { StudioNode } from "../../store/flow-editor.store";
import { NODE_INSPECTOR_SETTINGS_SECTION_BY_NODE_ID } from "./settings/node-inspector-settings-registry";
import type { NodeInspectorSettingsSectionProps } from "./settings/node-inspector-settings-types";
import {
  resolveVisibleNodeScene3dCardIds,
  shouldShowJsonConfigSection,
  shouldShowScene3dInspectorSettings,
  shouldShowTypedSettingsSection,
} from "./settings/node-inspector-settings-search";
import { SCENE3D_INSPECTOR_ACCORDION_TRIGGER_CLASS } from "./scene3d/scene3d-inspector-accordion-chrome";
import { INSPECTOR_NODE_TAB_CARD_STACK_CLASS } from "./inspector-node-tab-stack";
import {
  readSettingsJsonAccordionValue,
  SETTINGS_JSON_ACCORDION_VALUE,
  mergeNodeTabSectionOrder,
  readNodeTabSectionOrder,
  writeNodeTabSectionOrder,
  type NodeInspectorSectionId,
  type Scene3dInspectorPanelId,
  writeSettingsJsonAccordionValue,
} from "./node-inspector-ui-persistence";

export type NodeInspectorNodeTabProps = {
  selectedNode: StudioNode;
  /** Catalog definition title for search + context (may be empty). */
  catalogDefinitionTitle: string;
  hasScene3dInspector: boolean;
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
    hasScene3dInspector,
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

  const visibleScene3dCardIds = useMemo((): Scene3dInspectorPanelId[] | undefined => {
    const resolved = resolveVisibleNodeScene3dCardIds(settingsSearch);
    if (resolved == null) {
      return undefined;
    }
    return resolved as Scene3dInspectorPanelId[];
  }, [settingsSearch]);

  const showScene3dBlock = useMemo(() => {
    if (!hasScene3dInspector || !shouldShowScene3dInspectorSettings(settingsSearch)) {
      return false;
    }
    if (visibleScene3dCardIds != null && visibleScene3dCardIds.length === 0) {
      return false;
    }
    return true;
  }, [hasScene3dInspector, settingsSearch, visibleScene3dCardIds]);

  const showJsonSection = shouldShowJsonConfigSection(settingsSearch);

  const visibleSectionIds = useMemo((): NodeInspectorSectionId[] => {
    const out: NodeInspectorSectionId[] = ["linked-model", "identity", "canvas"];
    if (showTypedSection && CatalogSection != null) {
      out.push("typed");
    }
    if (showScene3dBlock) {
      out.push("scene3d");
    }
    if (showJsonSection && !suppressDefaultConfigJson) {
      out.push("advanced");
    }
    return out;
  }, [
    CatalogSection,
    showJsonSection,
    showScene3dBlock,
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

      <div
        className={`scrollbar-hide min-h-0 flex-1 overflow-y-auto overflow-x-hidden pb-0.5 ${INSPECTOR_NODE_TAB_CARD_STACK_CLASS}`}
      >
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
                  placeholder="Display name on flow canvas"
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
                <div className={INSPECTOR_NODE_TAB_CARD_STACK_CLASS}>
                  <CatalogSection {...sectionProps} />
                </div>
              ) : null
            ) : id === "scene3d" ? (
              showScene3dBlock ? (
                <NodeInspectorScene3dSection
                  selectedNode={selectedNode}
                  onUpdateConfigField={onUpdateConfigField}
                  visibleCardIds={visibleScene3dCardIds}
                  settingsSearch={settingsSearch}
                />
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
                      <TRNAccordionTrigger className={SCENE3D_INSPECTOR_ACCORDION_TRIGGER_CLASS}>
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
