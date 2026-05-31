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
import { InspectorSection } from "./InspectorSection";
import { Rotation3DInspectorCards } from "../rotation/Rotation3DInspectorCards";
import {
  defaultScene3DConfig,
  persistScene3DConfig,
  type Scene3DConfigV1,
} from "../../nodes/rotation/scene3d-config";
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
  onUpdateNodeUiResizable: (resizable: boolean) => void;
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
    onUpdateNodeUiResizable,
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

  const scrollColumnUsesRotationFlex =
    isRotation3DNode && showRotationBlock;

  return (
    <>
      <div className="shrink-0 space-y-2 px-0 pt-0 text-xs">
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
        className={
          scrollColumnUsesRotationFlex
            ? "shrink-0 space-y-2 overflow-x-hidden overflow-y-auto text-xs"
            : "min-h-0 flex flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden text-xs"
        }
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

        <InspectorSection title="Identity" contentClassName="px-2.5 py-2">
          <div className="relative min-w-0">
            <Tag
              className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500"
              aria-hidden
            />
            <input
              type="text"
              aria-label="Node label"
              placeholder="Display name on canvas"
              className="w-full rounded border border-zinc-700/80 bg-zinc-900/60 py-1.5 pl-8 pr-2 text-[11px] outline-none focus:border-cyan-400/60"
              value={selectedNode.data.label}
              onChange={(event) => onUpdateLabel(event.target.value)}
            />
          </div>
        </InspectorSection>

        <NodeInspectorCanvasLayoutSection
          selectedNode={selectedNode}
          onResizableChange={onUpdateNodeUiResizable}
        />

        {showTypedSection && CatalogSection != null ? (
          selectedNode.data.nodeId === "glb-animation-bundle" ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <CatalogSection {...sectionProps} />
            </div>
          ) : (
            <CatalogSection {...sectionProps} />
          )
        ) : null}
      </div>

      {showRotationBlock ? (
        <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-hidden text-xs">
          <div className="sticky top-0 z-1 shrink-0 border-b border-emerald-900/30 bg-zinc-950/92 py-1.5 text-[11px] font-semibold tracking-wide text-emerald-100/85 backdrop-blur-sm supports-backdrop-filter:bg-zinc-950/75">
            3D Scene Settings
          </div>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <Rotation3DInspectorCards
              scene3dRaw={selectedNode.data.defaultConfig.scene3d}
              inspectorRailResetKey={selectedNode.id}
              onChangeScene3d={(next: Scene3DConfigV1) => {
                const snap =
                  next != null
                    ? persistScene3DConfig(next)
                    : defaultScene3DConfig();
                onUpdateConfigField("scene3d", snap);
              }}
            />
          </div>
        </div>
      ) : null}

      {showJsonSection && !suppressDefaultConfigJson ? (
        <InspectorSection title="Advanced" contentClassName="px-2 py-2">
          <TRNAccordion
            type="single"
            collapsible
            className="rounded-md border border-zinc-700/70 bg-zinc-950/40"
            value={jsonAccordionValue}
            onValueChange={(next) => {
              const raw = typeof next === "string" ? next : "";
              const normalized =
                raw === SETTINGS_JSON_ACCORDION_VALUE ? SETTINGS_JSON_ACCORDION_VALUE : "";
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
                  className="min-h-[200px] w-full max-h-[min(52vh,440px)] sm:min-h-[240px]"
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
      ) : null}
    </>
  );
}
