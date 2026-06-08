import { ListTree, Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { TRNButton, TRNHintText, TRNSelect, TRNSegmentedControl } from "../../../../ui/TRN";
import { STUDIO_COMPACT_FLOW_SELECT_BUTTON_FULL_WIDTH_CLASS } from "../components/inspector/inspector-dense-select-button";
import { useStudioAssetDescriptors } from "../../asset-browser/useStudioAssetDescriptors";
import { GlbExtractionTabPanel } from "../components/node-palette/GlbExtractionTabPanel";
import { readGlbExtractTag, readSourceModelNodeId } from "../model/model-generated-bindings";
import {
  buildStudioModelSourceSelectOptions,
  formatStudioModelSelectOptionLabel,
  listCanvasModelSelectNodes,
} from "../model/studio-model-source-select";
import { buildStudioModelCatalogOnlySelectOptions } from "../nodes/model-nodes/studio-model-catalog-select-ui";
import { applyStudioModelCatalogSelectToNodeConfig } from "../nodes/model-nodes/studio-model-catalog-select";
import {
  studioGlbExtractRowKey,
  type StudioGltfExtractRow,
} from "../gltf/studio-gltf-extract";
import { useStudioGltfExtraction } from "../gltf/useStudioGltfExtraction";
import { readFlowGraphStoreStructuralRevision } from "../flow-graph-store-revisions";
import { useFlowEditorStore } from "../store/flow-editor.store";
import { useStudioWorkbenchShell } from "../workbench/studio-workbench-context";
import { useStageSceneStore } from "../../../state/stage-scene.store";
import { ModelOutlinerCollapsibleBlock } from "./ModelOutlinerCollapsibleBlock";
import { ModelOutlinerDetailStrip, type ModelOutlinerModelSummary } from "./ModelOutlinerDetailStrip";
import { ModelOutlinerHierarchyTree } from "./ModelOutlinerHierarchyTree";
import { ModelOutlinerVerticalSplit } from "./ModelOutlinerVerticalSplit";
import { resolveModelOutlinerDetail } from "./model-outliner-object-detail";
import {
  findExtractRowInExtraction,
  useModelOutlinerNavigationStore,
} from "./model-outliner-navigation";
import {
  pickDefaultCanvasModelSelectId,
  pickDefaultCatalogAssetId,
  resolveOutlinerFetchUrl,
  resolveOutlinerParentModelFlowNodeId,
} from "./model-outliner-scope";
import {
  countModelOutlinerTypeFilter,
  filterExtractionByType,
  isSceneHierarchyTypeFilter,
  MODEL_OUTLINER_TYPE_FILTER_CHIPS,
  type ModelOutlinerTypeFilter,
  typeFilterUsesFlatExtractList,
} from "./model-outliner-type-filter";
import {
  readStoredModelOutlinerCanvasModelId,
  readStoredModelOutlinerCatalogAssetId,
  readStoredModelOutlinerScopeMode,
  readStoredModelOutlinerTreeMode,
  readStoredModelOutlinerAnimationsBlockExpanded,
  readStoredModelOutlinerFollowStagePick,
  readStoredModelOutlinerTypeFilter,
  writeStoredModelOutlinerAnimationsBlockExpanded,
  writeStoredModelOutlinerFollowStagePick,
  writeStoredModelOutlinerCanvasModelId,
  writeStoredModelOutlinerCatalogAssetId,
  writeStoredModelOutlinerScopeMode,
  writeStoredModelOutlinerTreeMode,
  writeStoredModelOutlinerTypeFilter,
  type ModelOutlinerScopeMode,
  type ModelOutlinerTreeMode,
} from "./model-outliner-ui-persistence";
import {
  resolveExtractRowFromStageObjectPath,
  selectedRowKeyFromExtractRow,
  stagePickMatchesOutlinerParent,
} from "./model-outliner-stage-sync";
import {
  buildGlbExtractSpawnMergeConfig,
  buildInlineCatalogSpawnConfig,
  catalogNodeIdForGlbExtractRow,
  findCatalogEntry,
  resolveModelOutlinerSpawnBinding,
} from "./model-outliner-spawn";

const SCOPE_MODE_OPTIONS = [
  { value: "canvas-model-select", label: "Canvas Model Source" },
  { value: "catalog-inline", label: "Catalog model" },
] as const;

const TREE_MODE_OPTIONS = [
  { value: "folders", label: "Type folders" },
  { value: "hierarchy", label: "Scene hierarchy" },
] as const;

const SCOPE_MODE_SEGMENTS = [
  { value: "canvas-model-select", label: "Canvas" },
  { value: "catalog-inline", label: "Catalog" },
] as const;

const TREE_MODE_SEGMENTS = [
  { value: "folders", label: "Folders" },
  { value: "hierarchy", label: "Hierarchy" },
] as const;

export function ModelOutlinerPanel() {
  const shell = useStudioWorkbenchShell();
  const {
    borderColor,
    panelBackgroundColor: panelColor,
    secondaryTextColor: mutedTextColor,
    entries,
    onSpawnGlbExtract,
    onSpawnGlbEventPartExtract,
    onSpawnGlbEventAnimExtract,
    onSpawnGlbAnimationClipExtract,
    onSpawnGlbPartSpinExtract,
    onBuildGlbAnimationSetup,
    onSpawnGlbMaterialTextureExtract,
    onSpawnGlbMaterialColorExtract,
    onAddCatalogEntryAtFlowPosition,
    onSelectionChange,
  } = shell;

  const { descriptors } = useStudioAssetDescriptors();
  const modelGraphRevision = useFlowEditorStore((s) =>
    readFlowGraphStoreStructuralRevision(s.nodes, s.edges),
  );
  const modelNodes = useMemo(
    () => useFlowEditorStore.getState().nodes,
    [modelGraphRevision],
  );
  const selectedNodeIds = useFlowEditorStore((s) => s.selectedNodeIds);
  const updateNodeConfigFieldByNodeId = useFlowEditorStore((s) => s.updateNodeConfigFieldByNodeId);
  const addNodeFromCatalogWithInlineGlbModel = useFlowEditorStore(
    (s) => s.addNodeFromCatalogWithInlineGlbModel,
  );
  const lastViewportPick = useStageSceneStore((s) => s.lastViewportPick);
  const outlinerNavigateSeq = useModelOutlinerNavigationStore((s) => s.seq);
  const outlinerNavigatePayload = useModelOutlinerNavigationStore((s) => s.payload);

  const [scopeMode, setScopeMode] = useState<ModelOutlinerScopeMode>(() =>
    readStoredModelOutlinerScopeMode(),
  );
  const [treeMode, setTreeMode] = useState<ModelOutlinerTreeMode>(() => readStoredModelOutlinerTreeMode());
  const [canvasModelId, setCanvasModelId] = useState<string | null>(() =>
    readStoredModelOutlinerCanvasModelId(),
  );
  const [catalogAssetId, setCatalogAssetId] = useState<string | null>(() =>
    readStoredModelOutlinerCatalogAssetId(),
  );
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<ModelOutlinerTypeFilter>(() =>
    readStoredModelOutlinerTypeFilter(),
  );
  const [followStagePick, setFollowStagePick] = useState(() => readStoredModelOutlinerFollowStagePick());
  const [selectedRow, setSelectedRow] = useState<StudioGltfExtractRow | null>(null);
  const [selectedScenePath, setSelectedScenePath] = useState<string | null>(null);

  const canvasModelSelects = useMemo(() => listCanvasModelSelectNodes(modelNodes), [modelNodes]);

  const effectiveCanvasModelId = useMemo(
    () => pickDefaultCanvasModelSelectId(modelNodes, canvasModelId),
    [canvasModelId, modelNodes],
  );

  const effectiveCatalogAssetId = useMemo(
    () => pickDefaultCatalogAssetId(descriptors, catalogAssetId),
    [catalogAssetId, descriptors],
  );

  useEffect(() => {
    if (effectiveCanvasModelId !== canvasModelId) {
      setCanvasModelId(effectiveCanvasModelId);
      writeStoredModelOutlinerCanvasModelId(effectiveCanvasModelId);
    }
  }, [canvasModelId, effectiveCanvasModelId]);

  useEffect(() => {
    if (effectiveCatalogAssetId !== catalogAssetId) {
      setCatalogAssetId(effectiveCatalogAssetId);
      writeStoredModelOutlinerCatalogAssetId(effectiveCatalogAssetId);
    }
  }, [catalogAssetId, effectiveCatalogAssetId]);

  useEffect(() => {
    if (selectedNodeIds.length !== 1) {
      return;
    }
    const picked = modelNodes.find((n) => n.id === selectedNodeIds[0]);
    if (picked?.data.nodeId !== "model-select") {
      return;
    }
    setScopeMode("canvas-model-select");
    writeStoredModelOutlinerScopeMode("canvas-model-select");
    setCanvasModelId(picked.id);
    writeStoredModelOutlinerCanvasModelId(picked.id);
  }, [modelNodes, selectedNodeIds]);

  const fetchUrl = useMemo(
    () =>
      resolveOutlinerFetchUrl(
        scopeMode,
        effectiveCanvasModelId,
        effectiveCatalogAssetId,
        modelNodes,
        descriptors,
      ),
    [scopeMode, effectiveCanvasModelId, effectiveCatalogAssetId, modelNodes, descriptors],
  );

  const parentModelFlowNodeId = useMemo(
    () =>
      resolveOutlinerParentModelFlowNodeId(
        scopeMode,
        effectiveCanvasModelId,
        effectiveCatalogAssetId,
        modelNodes,
        descriptors,
      ),
    [scopeMode, effectiveCanvasModelId, effectiveCatalogAssetId, modelNodes, descriptors],
  );

  const glbExtraction = useStudioGltfExtraction(fetchUrl);

  const glbRowsFull = useMemo(
    () =>
      glbExtraction.result ?? {
        animations: [],
        parts: [],
        materials: [],
        morphs: [],
        lights: [],
        cameras: [],
        sceneTree: [],
        objectDetailsByPath: {},
        materialDetailsByName: {},
      },
    [glbExtraction.result],
  );

  useEffect(() => {
    if (outlinerNavigatePayload == null) {
      return;
    }
    const payload = outlinerNavigatePayload;
    if (payload.scopeMode != null) {
      setScopeMode(payload.scopeMode);
      writeStoredModelOutlinerScopeMode(payload.scopeMode);
    }
    if (payload.canvasModelId !== undefined) {
      setCanvasModelId(payload.canvasModelId);
      writeStoredModelOutlinerCanvasModelId(payload.canvasModelId);
    }
    if (payload.catalogAssetId !== undefined) {
      setCatalogAssetId(payload.catalogAssetId);
      writeStoredModelOutlinerCatalogAssetId(payload.catalogAssetId);
    }
    if (payload.typeFilter != null) {
      setTypeFilter(payload.typeFilter);
      writeStoredModelOutlinerTypeFilter(payload.typeFilter);
    }
    if (payload.scenePath !== undefined) {
      setSelectedScenePath(payload.scenePath);
    }
    if (payload.selectExtractRow == null && payload.scenePath === undefined) {
      setSelectedRow(null);
    }
  }, [outlinerNavigateSeq, outlinerNavigatePayload]);

  useEffect(() => {
    if (outlinerNavigatePayload == null || glbExtraction.state !== "ok") {
      return;
    }
    const { selectExtractRow, scenePath } = outlinerNavigatePayload;
    if (selectExtractRow != null) {
      const row = findExtractRowInExtraction(glbRowsFull, selectExtractRow);
      setSelectedRow(row);
      if (row == null) {
        setSelectedScenePath(selectExtractRow.ref);
      }
    } else if (scenePath != null) {
      const row = resolveExtractRowFromStageObjectPath(scenePath, glbRowsFull);
      setSelectedRow(row);
    }
  }, [glbExtraction.state, glbRowsFull, outlinerNavigatePayload, outlinerNavigateSeq]);

  useEffect(() => {
    if (!followStagePick || lastViewportPick == null || glbExtraction.state !== "ok") {
      return;
    }
    if (
      parentModelFlowNodeId != null &&
      !stagePickMatchesOutlinerParent(lastViewportPick, parentModelFlowNodeId)
    ) {
      return;
    }
    if (lastViewportPick.sourceNodeId.length > 0) {
      const sourceNode = modelNodes.find((n) => n.id === lastViewportPick.sourceNodeId);
      if (sourceNode?.data.nodeId === "model-select") {
        setScopeMode("canvas-model-select");
        writeStoredModelOutlinerScopeMode("canvas-model-select");
        setCanvasModelId(lastViewportPick.sourceNodeId);
        writeStoredModelOutlinerCanvasModelId(lastViewportPick.sourceNodeId);
      }
    }
    const row = resolveExtractRowFromStageObjectPath(lastViewportPick.objectPath, glbRowsFull);
    setSelectedScenePath(lastViewportPick.objectPath);
    setSelectedRow(row);
    if (row != null && row.kind !== typeFilter && typeFilter !== "all") {
      setTypeFilter(row.kind);
      writeStoredModelOutlinerTypeFilter(row.kind);
    }
  }, [
    followStagePick,
    glbExtraction.state,
    glbRowsFull,
    lastViewportPick,
    modelNodes,
    parentModelFlowNodeId,
    typeFilter,
  ]);

  const selectedRowKey = selectedRow != null ? selectedRowKeyFromExtractRow(selectedRow) : null;

  const glbRows = useMemo(
    () => filterExtractionByType(glbRowsFull, typeFilter),
    [glbRowsFull, typeFilter],
  );

  const filteredRowCount = useMemo(
    () => countModelOutlinerTypeFilter(glbRowsFull, typeFilter),
    [glbRowsFull, typeFilter],
  );

  const typeFilterCounts = useMemo(() => {
    const counts = new Map<ModelOutlinerTypeFilter, number>();
    for (const chip of MODEL_OUTLINER_TYPE_FILTER_CHIPS) {
      counts.set(chip.id, countModelOutlinerTypeFilter(glbRowsFull, chip.id));
    }
    return counts;
  }, [glbRowsFull]);

  const glbPlacedRowKeys = useMemo(() => {
    if (parentModelFlowNodeId == null) {
      return new Set<string>();
    }
    const set = new Set<string>();
    for (const n of modelNodes) {
      const pid = readSourceModelNodeId(n.data.defaultConfig);
      if (pid !== parentModelFlowNodeId) {
        continue;
      }
      const tag = readGlbExtractTag(n.data.defaultConfig);
      if (tag == null) {
        continue;
      }
      set.add(studioGlbExtractRowKey(tag));
    }
    return set;
  }, [modelNodes, parentModelFlowNodeId]);

  const canvasModelOptions = useMemo(
    () => buildStudioModelSourceSelectOptions(modelNodes, descriptors),
    [descriptors, modelNodes],
  );

  const catalogOptions = useMemo(
    () => buildStudioModelCatalogOnlySelectOptions(descriptors),
    [descriptors],
  );

  const focusModelSource = useCallback(() => {
    if (parentModelFlowNodeId == null) {
      return;
    }
    onSelectionChange([parentModelFlowNodeId]);
  }, [onSelectionChange, parentModelFlowNodeId]);

  const ensureModelSourceForCatalog = useCallback(() => {
    if (effectiveCatalogAssetId == null || onAddCatalogEntryAtFlowPosition == null) {
      return;
    }
    const modelEntry = entries.find((e) => e.id === "model-select");
    if (modelEntry == null) {
      return;
    }
    const flowNodeId = onAddCatalogEntryAtFlowPosition(modelEntry, { x: 96, y: 96 });
    if (flowNodeId == null) {
      return;
    }
    applyStudioModelCatalogSelectToNodeConfig(effectiveCatalogAssetId, descriptors, (key, value) => {
      updateNodeConfigFieldByNodeId(flowNodeId, key, value);
    });
    onSelectionChange([flowNodeId]);
  }, [
    descriptors,
    effectiveCatalogAssetId,
    entries,
    onAddCatalogEntryAtFlowPosition,
    onSelectionChange,
    updateNodeConfigFieldByNodeId,
  ]);

  const spawnBinding = useMemo(
    () =>
      resolveModelOutlinerSpawnBinding({
        parentModelFlowNodeId,
        catalogAssetId: effectiveCatalogAssetId,
      }),
    [effectiveCatalogAssetId, parentModelFlowNodeId],
  );

  const spawnRow = useCallback(
    (row: StudioGltfExtractRow) => {
      const binding = resolveModelOutlinerSpawnBinding({
        parentModelFlowNodeId,
        catalogAssetId: effectiveCatalogAssetId,
      });
      if (binding == null) {
        return;
      }
      if (binding.mode === "parent-model-select") {
        if (onSpawnGlbExtract == null) {
          return;
        }
        onSpawnGlbExtract({ parentModelFlowNodeId: binding.parentModelFlowNodeId, row });
        return;
      }
      const catalogNodeId = catalogNodeIdForGlbExtractRow(row);
      const entry = findCatalogEntry(entries, catalogNodeId);
      if (entry == null) {
        return;
      }
      const merge = buildGlbExtractSpawnMergeConfig(catalogNodeId, row);
      const inlineConfig = buildInlineCatalogSpawnConfig(binding.catalogAssetId, descriptors, merge);
      if (inlineConfig == null) {
        return;
      }
      addNodeFromCatalogWithInlineGlbModel(entry, { x: 120, y: 120 }, {
        flowNodeLabel: row.label,
        mergeDefaultConfig: inlineConfig,
      });
    },
    [
      addNodeFromCatalogWithInlineGlbModel,
      descriptors,
      effectiveCatalogAssetId,
      entries,
      onSpawnGlbExtract,
      parentModelFlowNodeId,
    ],
  );

  const selectRow = useCallback((row: StudioGltfExtractRow | null, scenePath?: string) => {
    setSelectedRow(row);
    setSelectedScenePath(scenePath ?? row?.ref ?? null);
  }, []);

  const inlineCatalogAssetId =
    scopeMode === "catalog-inline" ? effectiveCatalogAssetId : null;

  const detailStagePick =
    lastViewportPick != null &&
    (parentModelFlowNodeId == null ||
      stagePickMatchesOutlinerParent(lastViewportPick, parentModelFlowNodeId))
      ? lastViewportPick
      : null;

  const resolvedDetail = useMemo(
    () =>
      resolveModelOutlinerDetail(
        glbRowsFull,
        selectedRow,
        selectedScenePath ?? detailStagePick?.objectPath ?? null,
      ),
    [detailStagePick?.objectPath, glbRowsFull, selectedRow, selectedScenePath],
  );

  const filterExhausted =
    glbExtraction.state === "ok" &&
    typeFilter !== "all" &&
    filteredRowCount === 0 &&
    glbExtraction.totalRows > 0;

  const hierarchyUsesFlatExtract =
    treeMode === "hierarchy" && typeFilterUsesFlatExtractList(typeFilter);

  const hierarchyShowsSceneTree =
    treeMode === "hierarchy" && isSceneHierarchyTypeFilter(typeFilter);

  const hierarchyShowsAnimationsAboveTree =
    treeMode === "hierarchy" &&
    typeFilter === "all" &&
    glbRowsFull.animations.length > 0;

  const hideExtractKindBadge = typeFilter !== "all";

  const spawnParentLabel = useMemo(() => {
    if (parentModelFlowNodeId == null) {
      return null;
    }
    const parentNode = modelNodes.find((n) => n.id === parentModelFlowNodeId);
    return parentNode != null
      ? formatStudioModelSelectOptionLabel(parentNode, descriptors)
      : "Model Source";
  }, [descriptors, modelNodes, parentModelFlowNodeId]);

  const modelSummary = useMemo((): ModelOutlinerModelSummary | null => {
    if (glbExtraction.state !== "ok") {
      return null;
    }
    const catalogLabel = catalogOptions.find((o) => o.value === effectiveCatalogAssetId)?.label;
    const modelLabel = spawnParentLabel ?? catalogLabel ?? "Model";
    return {
      modelLabel,
      animationCount: glbRowsFull.animations.length,
      partCount: glbRowsFull.parts.length,
      materialCount: glbRowsFull.materials.length,
      morphCount: glbRowsFull.morphs.length,
      lightCount: glbRowsFull.lights.length,
      cameraCount: glbRowsFull.cameras.length,
    };
  }, [
    catalogOptions,
    effectiveCatalogAssetId,
    glbExtraction.state,
    glbRowsFull.animations.length,
    glbRowsFull.cameras.length,
    glbRowsFull.lights.length,
    glbRowsFull.materials.length,
    glbRowsFull.morphs.length,
    glbRowsFull.parts.length,
    spawnParentLabel,
  ]);

  const canSpawnRows = spawnBinding != null;

  const scopeHint =
    scopeMode === "canvas-model-select"
      ? canvasModelSelects.length === 0
        ? "Add a Model Source node to the flow graph, then pick it here."
        : effectiveCanvasModelId == null
          ? "Pick a Model Source node."
          : fetchUrl == null
            ? "Selected Model Source has no catalog model yet."
            : null
      : effectiveCatalogAssetId == null
        ? "Pick a catalog GLB."
        : fetchUrl == null
          ? "Could not resolve a fetch URL for this catalog model."
          : parentModelFlowNodeId == null
            ? "Spawn uses inline catalog binding, or add a Model Source below."
            : null;

  return (
    <section
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg ring-1 ring-zinc-800/80"
      style={{ borderColor, backgroundColor: panelColor }}
    >
      <div className="shrink-0 border-b border-zinc-800/90 px-3 pb-2 pt-3" style={{ borderColor }}>
        <div className="mb-2 flex items-center gap-2">
          <h2 className="inline-flex min-w-0 flex-1 items-center gap-1.5 text-sm font-semibold tracking-tight text-zinc-100">
            <ListTree className="h-3.5 w-3.5 shrink-0 text-zinc-400" aria-hidden />
            Model Outliner
          </h2>
          {glbExtraction.state === "ok" ? (
            <span className="rounded-full bg-zinc-800/80 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
              {typeFilter === "all" ? glbExtraction.totalRows : filteredRowCount}
            </span>
          ) : null}
        </div>

        <div className="mb-2 grid grid-cols-2 gap-1.5">
          <TRNSegmentedControl
            ariaLabel="Model scope"
            className="w-full"
            fullWidth
            size="sm"
            tone="neutral"
            variant="surface"
            value={scopeMode}
            options={[...SCOPE_MODE_SEGMENTS]}
            onValueChange={(next) => {
              if (next === "canvas-model-select" || next === "catalog-inline") {
                setScopeMode(next);
                writeStoredModelOutlinerScopeMode(next);
              }
            }}
          />
          <TRNSegmentedControl
            ariaLabel="Tree layout"
            className="w-full"
            fullWidth
            size="sm"
            tone="neutral"
            variant="surface"
            value={treeMode}
            options={[...TREE_MODE_SEGMENTS]}
            onValueChange={(next) => {
              if (next === "folders" || next === "hierarchy") {
                setTreeMode(next);
                writeStoredModelOutlinerTreeMode(next);
              }
            }}
          />
        </div>

        {scopeMode === "canvas-model-select" ? (
          <TRNSelect
            ariaLabel="Canvas Model Source"
            value={effectiveCanvasModelId ?? ""}
            options={canvasModelOptions}
            disabled={canvasModelSelects.length === 0}
            size="sm"
            className="mb-2 min-w-0 w-full"
            buttonClassName={STUDIO_COMPACT_FLOW_SELECT_BUTTON_FULL_WIDTH_CLASS}
            panelClassName="scrollbar-hide max-h-48 overflow-y-auto"
            onValueChange={(next) => {
              setCanvasModelId(next);
              writeStoredModelOutlinerCanvasModelId(next);
            }}
          />
        ) : (
          <TRNSelect
            ariaLabel="Catalog GLB"
            value={effectiveCatalogAssetId ?? ""}
            options={catalogOptions}
            disabled={catalogOptions.length === 0}
            size="sm"
            className="mb-2 min-w-0 w-full"
            buttonClassName={STUDIO_COMPACT_FLOW_SELECT_BUTTON_FULL_WIDTH_CLASS}
            panelClassName="scrollbar-hide max-h-48 overflow-y-auto"
            onValueChange={(next) => {
              setCatalogAssetId(next);
              writeStoredModelOutlinerCatalogAssetId(next);
            }}
          />
        )}

        <div className="relative">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-500"
            aria-hidden
          />
          <input
            type="search"
            placeholder="Search clips, parts, objects…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                setQuery("");
              }
            }}
            className="w-full rounded-lg border border-zinc-700/80 bg-zinc-950/60 py-1.5 pl-8 pr-8 text-[11px] outline-none placeholder:text-zinc-600 focus:border-cyan-500/45 focus:ring-1 focus:ring-cyan-500/25"
            style={{ borderColor }}
            aria-label="Search model outliner"
          />
          {query.trim().length > 0 ? (
            <button
              type="button"
              className="absolute right-1.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-800/80 hover:text-zinc-200"
              onClick={() => setQuery("")}
              aria-label="Clear search"
            >
              <X className="size-3.5 shrink-0" aria-hidden />
            </button>
          ) : null}
        </div>

        {glbExtraction.state === "ok" ? (
          <div
            className="mt-2 flex snap-x snap-mandatory gap-1 overflow-x-auto pb-0.5 scrollbar-hide"
            role="group"
            aria-label="Extract type filter"
          >
            {MODEL_OUTLINER_TYPE_FILTER_CHIPS.map((chip) => {
              const count = typeFilterCounts.get(chip.id) ?? 0;
              if (chip.id !== "all" && count === 0) {
                return null;
              }
              const active = typeFilter === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => {
                    setTypeFilter(chip.id);
                    writeStoredModelOutlinerTypeFilter(chip.id);
                  }}
                  className={`snap-start shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/35 ${
                    active
                      ? "border-cyan-500/50 bg-cyan-950/40 text-cyan-100"
                      : "border-zinc-700/60 bg-zinc-900/40 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                  }`}
                >
                  {chip.label}
                  <span className="ml-1 opacity-70">{count}</span>
                </button>
              );
            })}
          </div>
        ) : null}

        <div className="mt-2 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              const next = !followStagePick;
              setFollowStagePick(next);
              writeStoredModelOutlinerFollowStagePick(next);
            }}
            className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-medium transition-colors ${
              followStagePick
                ? "border-violet-500/45 bg-violet-950/35 text-violet-100"
                : "border-zinc-700/60 bg-zinc-900/40 text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Stage sync {followStagePick ? "on" : "off"}
          </button>
          {spawnParentLabel != null ? (
            <>
              <span className="min-w-0 flex-1 truncate text-[9px] text-zinc-500">
                Spawn → <span className="text-zinc-300">{spawnParentLabel}</span>
              </span>
              <TRNButton
                type="button"
                size="compact"
                className="shrink-0 min-w-0 px-2 text-[10px]"
                hint="Select the linked Model Source on the flow canvas."
                onClick={focusModelSource}
              >
                Focus
              </TRNButton>
            </>
          ) : null}
        </div>
      </div>

      <ModelOutlinerVerticalSplit
        tree={
          <>
        {scopeHint != null ? (
          <p className="mb-2 text-[10px] leading-snug text-zinc-500" style={{ color: mutedTextColor }}>
            {scopeHint}
          </p>
        ) : null}

        {scopeMode === "catalog-inline" && parentModelFlowNodeId == null && effectiveCatalogAssetId != null ? (
          <TRNButton
            type="button"
            size="compact"
            className="mb-2 w-full text-[10px]"
            onClick={ensureModelSourceForCatalog}
          >
            Add Model Source for this catalog model
          </TRNButton>
        ) : null}

        {fetchUrl != null && glbExtraction.state === "loading" ? (
          <div className="rounded border border-zinc-800/80 bg-zinc-950/50 px-2 py-3 text-center text-[11px] text-zinc-400">
            Loading model hierarchy…
          </div>
        ) : null}

        {glbExtraction.state === "error" && glbExtraction.errorMessage != null ? (
          <div className="rounded border border-rose-900/60 bg-rose-950/30 px-2 py-2 text-[11px] text-rose-200/90">
            {glbExtraction.errorMessage}
          </div>
        ) : null}

        {filterExhausted ? (
          <p className="py-4 text-center text-[11px] text-zinc-500">No entries match this type filter.</p>
        ) : null}

        {!filterExhausted && glbExtraction.state === "ok" && treeMode === "folders" ? (
          <GlbExtractionTabPanel
            borderColor={borderColor}
            panelColor={panelColor}
            mutedTextColor={mutedTextColor}
            dense
            suppressRowHints
            compactRows
            hideExtractKindBadge={hideExtractKindBadge}
            parentModelFlowNodeId={parentModelFlowNodeId}
            searchQuery={query}
            state={glbExtraction.state}
            totalRows={filteredRowCount}
            errorMessage={glbExtraction.errorMessage}
            rows={glbRows}
            placedRowKeys={glbPlacedRowKeys}
            selectedRowKey={selectedRowKey}
            selectOnClick
            onRowSelect={(row) => selectRow(row)}
            inlineCatalogAssetId={inlineCatalogAssetId}
            onSpawnRow={spawnRow}
            onSpawnGlbExtract={onSpawnGlbExtract}
            onSpawnGlbEventPartExtract={onSpawnGlbEventPartExtract}
            onSpawnGlbEventAnimExtract={onSpawnGlbEventAnimExtract}
            onSpawnGlbAnimationClipExtract={onSpawnGlbAnimationClipExtract}
            onSpawnGlbPartSpinExtract={onSpawnGlbPartSpinExtract}
            onBuildGlbAnimationSetup={onBuildGlbAnimationSetup}
            onSpawnGlbMaterialTextureExtract={onSpawnGlbMaterialTextureExtract}
            onSpawnGlbMaterialColorExtract={onSpawnGlbMaterialColorExtract}
          />
        ) : null}

        {!filterExhausted && glbExtraction.state === "ok" && hierarchyUsesFlatExtract ? (
          <>
            <TRNHintText tone="muted" className="mb-1.5 text-[10px] leading-snug">
              {typeFilter === "animation"
                ? "Clips are GLB metadata — not in the scene tree."
                : typeFilter === "material"
                  ? "Materials are mesh slots — not scene nodes."
                  : "Morph targets are mesh metadata."}
            </TRNHintText>
            <GlbExtractionTabPanel
              borderColor={borderColor}
              panelColor={panelColor}
              mutedTextColor={mutedTextColor}
              dense
              suppressRowHints
              compactRows
              hideExtractKindBadge={hideExtractKindBadge}
              parentModelFlowNodeId={parentModelFlowNodeId}
              searchQuery={query}
              state={glbExtraction.state}
              totalRows={filteredRowCount}
              errorMessage={glbExtraction.errorMessage}
              rows={glbRows}
              placedRowKeys={glbPlacedRowKeys}
              selectedRowKey={selectedRowKey}
              selectOnClick
              onRowSelect={(row) => selectRow(row)}
              inlineCatalogAssetId={inlineCatalogAssetId}
              onSpawnRow={spawnRow}
              onSpawnGlbExtract={onSpawnGlbExtract}
              onSpawnGlbEventPartExtract={onSpawnGlbEventPartExtract}
              onSpawnGlbEventAnimExtract={onSpawnGlbEventAnimExtract}
              onSpawnGlbAnimationClipExtract={onSpawnGlbAnimationClipExtract}
              onSpawnGlbPartSpinExtract={onSpawnGlbPartSpinExtract}
              onBuildGlbAnimationSetup={onBuildGlbAnimationSetup}
              onSpawnGlbMaterialTextureExtract={onSpawnGlbMaterialTextureExtract}
              onSpawnGlbMaterialColorExtract={onSpawnGlbMaterialColorExtract}
            />
          </>
        ) : null}

        {!filterExhausted && glbExtraction.state === "ok" && hierarchyShowsAnimationsAboveTree ? (
          <ModelOutlinerCollapsibleBlock
            title="Animations"
            count={glbRowsFull.animations.length}
            defaultExpanded={readStoredModelOutlinerAnimationsBlockExpanded()}
            onExpandedChange={writeStoredModelOutlinerAnimationsBlockExpanded}
          >
            <GlbExtractionTabPanel
              borderColor={borderColor}
              panelColor={panelColor}
              mutedTextColor={mutedTextColor}
              dense
              suppressRowHints
              compactRows
              hideExtractKindBadge={hideExtractKindBadge}
              parentModelFlowNodeId={parentModelFlowNodeId}
              searchQuery={query}
              state={glbExtraction.state}
              totalRows={glbRowsFull.animations.length}
              errorMessage={glbExtraction.errorMessage}
              rows={{
                animations: glbRowsFull.animations,
                parts: [],
                materials: [],
                morphs: [],
                lights: [],
                cameras: [],
              }}
              placedRowKeys={glbPlacedRowKeys}
              selectedRowKey={selectedRowKey}
              selectOnClick
              onRowSelect={(row) => selectRow(row)}
              inlineCatalogAssetId={inlineCatalogAssetId}
              onSpawnRow={spawnRow}
              onSpawnGlbExtract={onSpawnGlbExtract}
              onSpawnGlbEventPartExtract={onSpawnGlbEventPartExtract}
              onSpawnGlbEventAnimExtract={onSpawnGlbEventAnimExtract}
              onSpawnGlbAnimationClipExtract={onSpawnGlbAnimationClipExtract}
              onSpawnGlbPartSpinExtract={onSpawnGlbPartSpinExtract}
              onBuildGlbAnimationSetup={onBuildGlbAnimationSetup}
              onSpawnGlbMaterialTextureExtract={onSpawnGlbMaterialTextureExtract}
              onSpawnGlbMaterialColorExtract={onSpawnGlbMaterialColorExtract}
            />
          </ModelOutlinerCollapsibleBlock>
        ) : null}

        {!filterExhausted && glbExtraction.state === "ok" && hierarchyShowsSceneTree ? (
          <ModelOutlinerHierarchyTree
            treeKey={`${fetchUrl ?? "none"}:${scopeMode}:${treeMode}`}
            searchQuery={query}
            typeFilter={typeFilter}
            extraction={glbRowsFull}
            parentModelFlowNodeId={parentModelFlowNodeId}
            inlineCatalogAssetId={inlineCatalogAssetId}
            placedRowKeys={glbPlacedRowKeys}
            selectedRowKey={selectedRowKey}
            selectedScenePath={selectedScenePath}
            canSpawn={canSpawnRows}
            onRowSelect={(row, scenePath) => selectRow(row, scenePath)}
            onSpawn={spawnRow}
          />
        ) : null}
          </>
        }
        properties={
          <>
            <div
              className="shrink-0 border-b border-zinc-800/80 px-2 py-1 text-[10px] font-medium text-zinc-400"
              style={{ borderColor }}
            >
              Properties
            </div>
            <ModelOutlinerDetailStrip
              borderColor={borderColor}
              modelSummary={modelSummary}
              selectedRow={selectedRow}
              stagePick={detailStagePick}
              objectDetail={resolvedDetail.objectDetail}
              materialDetail={resolvedDetail.materialDetail}
              resolvedPath={resolvedDetail.resolvedPath}
              placed={selectedRowKey != null && glbPlacedRowKeys.has(selectedRowKey)}
              onSpawn={selectedRow != null ? () => spawnRow(selectedRow) : undefined}
              spawnDisabled={spawnBinding == null}
            />
          </>
        }
      />
    </section>
  );
}
