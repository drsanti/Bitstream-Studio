import {
  Cloud,
  CloudUpload,
  Download,
  FolderInput,
  Pencil,
  RefreshCw,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TRNButton, TRNHintText, TRNIconButton, TRNTooltip } from "../../../../../ui/TRN";
import { readFlowGraphStoreStructuralRevision } from "../../flow-graph-store-revisions";
import type { StudioDemoTemplateId } from "../../store/flow-editor.store";
import { useFlowEditorStore } from "../../store/flow-editor.store";
import { formatRemoteCacheAge } from "../../flow-library/flow-preset-remote-cache";
import { useRemoteFlowPresets } from "../../flow-library/use-remote-flow-presets";
import {
  parseStudioFlowPresetFile,
  STUDIO_FLOW_PRESET_CATEGORIES,
  type StudioFlowPresetCategory,
  type StudioFlowPresetFile,
} from "../../flow-library/studio-flow-preset-file";
import {
  FlowLoadModeDialog,
  type FlowLoadMode,
} from "../flow-library/FlowLoadModeDialog";
import { SaveToLibraryDialog } from "../flow-library/SaveToLibraryDialog";
import {
  resolveSaveToLibraryTarget,
  saveToLibraryTargetLabel,
} from "../../flow-library/resolve-save-to-library-target";
import { FlowPresetMaintainerTools } from "../flow-library/FlowPresetMaintainerTools";
import {
  isOfficialFlowPresetId,
  templateIdFromOfficialFlowPresetId,
} from "../../flow-library/demo-template-flow-preset-category";
import { commitOfficialFlowPresetOverride } from "../../flow-library/commit-official-flow-preset-override";
import { formatOfficialFlowPresetCommitStatus } from "../../flow-library/format-official-flow-preset-commit-status";
import { useFlowPresetMaintainerModeStore } from "../../flow-library/flow-preset-maintainer-mode";
import { useFlowPresetMaintainerSessionStore } from "../../flow-library/flow-preset-maintainer-session";
import { useFlowPresetLinkedSessionStore } from "../../flow-library/flow-preset-linked-session";
import {
  officialFlowPresetOverrideHint,
  requestOfficialFlowPresetOverride,
} from "../../flow-library/request-official-flow-preset-override";
import {
  projectFlowPresetUpdateHint,
  requestProjectFlowPresetUpdate,
} from "../../flow-library/request-project-flow-preset-update";
import { useFlowLibraryNavigationStore } from "../../flow-library/flow-library-navigation";
import { STUDIO_ROOT_GRAPH_ID } from "../../subgraphs/studio-subgraph.types";

type FlowLibraryTabPanelProps = {
  dense?: boolean;
  query: string;
  borderColor?: string;
  remoteEnabled?: boolean;
};

function filterPresets(
  presets: StudioFlowPresetFile[],
  query: string,
  category: StudioFlowPresetCategory | "all",
): StudioFlowPresetFile[] {
  const q = query.trim().toLowerCase();
  return presets.filter((preset) => {
    if (category !== "all" && preset.meta.category !== category) {
      return false;
    }
    if (q.length === 0) {
      return true;
    }
    const hay = [
      preset.meta.name,
      preset.meta.description ?? "",
      preset.meta.category,
      ...(preset.meta.tags ?? []),
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

function presetSummary(preset: StudioFlowPresetFile): string {
  const nodeCount = preset.document.nodes.length;
  const edgeCount = preset.document.edges.length;
  const kind =
    preset.meta.presetKind === "flowPartial" ? "Selection" : "Full flow";
  return `${kind} · ${nodeCount} nodes · ${edgeCount} edges`;
}

function officialSyncBadgeLabel(
  syncState: ReturnType<typeof useRemoteFlowPresets>["syncState"],
  fetchedAtMs: number | null,
): string | null {
  switch (syncState) {
    case "fresh":
      return "Live";
    case "cached":
      return fetchedAtMs != null
        ? `Cached · ${formatRemoteCacheAge(fetchedAtMs)}`
        : "Cached";
    case "offline":
      return "Offline";
    default:
      return null;
  }
}

function FlowPresetRow(props: {
  preset: StudioFlowPresetFile;
  borderColor?: string;
  dense?: boolean;
  badge?: string;
  highlighted?: boolean;
  onLoad: () => void;
  onEdit?: () => void;
  onExport?: () => void;
  exportHint?: string;
  onOverride?: () => void;
  overrideHint?: string;
  overrideBusy?: boolean;
  onUpdate?: () => void;
  updateHint?: string;
  updateBusy?: boolean;
  onRemove?: () => void;
}) {
  const {
    preset,
    borderColor,
    dense,
    badge,
    highlighted = false,
    onLoad,
    onEdit,
    onExport,
    exportHint,
    onOverride,
    overrideHint,
    overrideBusy = false,
    onUpdate,
    updateHint,
    updateBusy = false,
    onRemove,
  } = props;
  return (
    <li id={`flow-preset-row-${preset.meta.id}`}>
      <div
        className={`group flex items-start gap-2 rounded border px-2 py-2 transition-colors hover:border-cyan-500/35 hover:bg-cyan-950/15 ${
          highlighted
            ? "border-cyan-400/70 bg-cyan-950/30 ring-1 ring-cyan-400/40"
            : "border-zinc-800/80 bg-zinc-950/40"
        }`}
        style={borderColor != null ? { borderColor } : undefined}
      >
        <button
          type="button"
          className="min-w-0 flex-1 text-left"
          onClick={onLoad}
        >
          <div className="flex items-center gap-1.5">
            <div className="min-w-0 truncate font-medium text-zinc-100">
              {preset.meta.name}
            </div>
            {badge != null ? (
              <span className="shrink-0 rounded bg-cyan-950/50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-cyan-200/90">
                {badge}
              </span>
            ) : (
              <span className="shrink-0 rounded bg-zinc-800/80 px-1.5 py-0.5 text-[9px] font-medium capitalize text-zinc-400">
                {preset.meta.category}
              </span>
            )}
          </div>
          <div className="mt-0.5 text-[10px] text-zinc-500">
            {presetSummary(preset)}
          </div>
          {preset.meta.description ? (
            <div className="mt-1 line-clamp-2 text-[10px] text-zinc-500">
              {preset.meta.description}
            </div>
          ) : null}
        </button>
        {onOverride != null ||
        onUpdate != null ||
        onEdit != null ||
        onExport != null ||
        onRemove != null ? (
          <div className="flex shrink-0 flex-col gap-1 opacity-80 group-hover:opacity-100">
            {onUpdate != null ? (
              <TRNIconButton
                label="Update project preset"
                hint={updateHint ?? "Overwrite this project preset with the current canvas."}
                hintPlacement="left"
                nativeTitle={false}
                disabled={updateBusy}
                className="h-[22px] w-[22px] min-h-0 min-w-0 rounded border-cyan-800/70 bg-cyan-950/45 p-0 text-cyan-100 hover:bg-cyan-900/55 hover:border-cyan-700/80"
                icon={<Upload className="h-3.5 w-3.5" aria-hidden />}
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdate();
                }}
              />
            ) : null}
            {onOverride != null ? (
              <TRNIconButton
                label="Override official preset"
                hint={overrideHint ?? "Update this official flow from the current canvas."}
                hintPlacement="left"
                nativeTitle={false}
                disabled={overrideBusy}
                className="h-[22px] w-[22px] min-h-0 min-w-0 rounded border-red-800/70 bg-red-950/50 p-0 text-red-100 hover:bg-red-900/55 hover:border-red-700/80"
                icon={<CloudUpload className="h-3.5 w-3.5" aria-hidden />}
                onClick={(e) => {
                  e.stopPropagation();
                  onOverride();
                }}
              />
            ) : null}
            {onEdit != null ? (
              <TRNIconButton
                label="Edit flow preset"
                hint="Rename or edit metadata for this project preset."
                hintPlacement="left"
                nativeTitle={false}
                className="h-[22px] w-[22px] min-h-0 min-w-0 rounded border-0 bg-transparent p-0 text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-100"
                icon={<Pencil className="h-3.5 w-3.5" aria-hidden />}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              />
            ) : null}
            {onExport != null ? (
              <TRNTooltip
                placement="left"
                openDelayMs={450}
                triggerWrapper="span"
                triggerAriaLabel={exportHint ?? "Export flow preset"}
                content={
                  exportHint ??
                  "Download this saved project preset as a trn-flow-preset JSON file."
                }
                trigger={
                  <button
                    type="button"
                    className="rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-800/80 hover:text-zinc-100"
                    aria-label={exportHint ?? "Export flow preset"}
                    onClick={onExport}
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden />
                  </button>
                }
              />
            ) : null}
            {onRemove != null ? (
              <TRNIconButton
                label="Remove flow preset"
                hint="Remove this preset from the project library."
                hintPlacement="left"
                nativeTitle={false}
                className="h-[22px] w-[22px] min-h-0 min-w-0 rounded border-0 bg-transparent p-0 text-zinc-400 hover:bg-red-950/40 hover:text-red-200"
                icon={<Trash2 className="h-3.5 w-3.5" aria-hidden />}
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
              />
            ) : null}
          </div>
        ) : null}
      </div>
    </li>
  );
}

export function FlowLibraryTabPanel(props: FlowLibraryTabPanelProps) {
  const { dense = false, query, borderColor, remoteEnabled = false } = props;
  const library = useFlowEditorStore((s) => s.flowPresetLibrary);
  const remotePresets = useFlowEditorStore((s) => s.remoteFlowPresets);
  const graphStructuralRevision = useFlowEditorStore((s) =>
    readFlowGraphStoreStructuralRevision(s.nodes, s.edges),
  );
  const rootStructuralRevision = useFlowEditorStore((s) =>
    readFlowGraphStoreStructuralRevision(s.rootNodes, s.rootEdges),
  );
  const nodes = useMemo(
    () => useFlowEditorStore.getState().nodes,
    [graphStructuralRevision],
  );
  const edges = useMemo(
    () => useFlowEditorStore.getState().edges,
    [graphStructuralRevision],
  );
  const subgraphs = useFlowEditorStore((s) => s.subgraphs);
  const rootNodes = useMemo(
    () => useFlowEditorStore.getState().rootNodes,
    [rootStructuralRevision],
  );
  const rootEdges = useMemo(
    () => useFlowEditorStore.getState().rootEdges,
    [rootStructuralRevision],
  );
  const activeGraphId = useFlowEditorStore((s) => s.activeGraphId);
  const maintainerMode = useFlowPresetMaintainerModeStore(
    (s) => s.enabled && import.meta.env.DEV,
  );
  const lastLoadedOfficialPresetId = useFlowPresetMaintainerSessionStore(
    (s) => s.lastLoadedOfficialPresetId,
  );
  const lastLoadedOfficialPresetName = useFlowPresetMaintainerSessionStore(
    (s) => s.lastLoadedOfficialPresetName,
  );
  const setLastLoadedOfficialPreset = useFlowPresetMaintainerSessionStore(
    (s) => s.setLastLoadedOfficialPreset,
  );
  const clearLastLoadedOfficialPreset = useFlowPresetMaintainerSessionStore(
    (s) => s.clearLastLoadedOfficialPreset,
  );
  const linkedProjectPresetId = useFlowPresetLinkedSessionStore(
    (s) => s.linkedProjectPresetId,
  );
  const linkedProjectPresetName = useFlowPresetLinkedSessionStore(
    (s) => s.linkedProjectPresetName,
  );
  const setLinkedProjectPreset = useFlowPresetLinkedSessionStore(
    (s) => s.setLinkedProjectPreset,
  );
  const clearLinkedProjectPreset = useFlowPresetLinkedSessionStore(
    (s) => s.clearLinkedProjectPreset,
  );
  const setLastCommitStatus = useFlowPresetMaintainerSessionStore(
    (s) => s.setLastCommitStatus,
  );
  const openSaveToLibraryDialog = useFlowEditorStore(
    (s) => s.openSaveToLibraryDialog,
  );
  const loadFlowPresetFromLibrary = useFlowEditorStore(
    (s) => s.loadFlowPresetFromLibrary,
  );
  const reportFlowImportDependencies = useFlowEditorStore(
    (s) => s.reportFlowImportDependencies,
  );
  const importFlowPresetToLibrary = useFlowEditorStore(
    (s) => s.importFlowPresetToLibrary,
  );
  const exportFlowPresetById = useFlowEditorStore(
    (s) => s.exportFlowPresetById,
  );
  const removeFlowPresetFromLibrary = useFlowEditorStore(
    (s) => s.removeFlowPresetFromLibrary,
  );
  const updateFlowPresetInLibrary = useFlowEditorStore(
    (s) => s.updateFlowPresetInLibrary,
  );
  const updateFlowPresetFromCanvas = useFlowEditorStore(
    (s) => s.updateFlowPresetFromCanvas,
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const officialSectionRef = useRef<HTMLElement>(null);
  const [loadPresetId, setLoadPresetId] = useState<string | null>(null);
  const [editPresetId, setEditPresetId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<
    StudioFlowPresetCategory | "all"
  >("all");
  const [highlightPresetId, setHighlightPresetId] = useState<string | null>(
    null,
  );
  const flowLibraryNavSeq = useFlowLibraryNavigationStore((s) => s.seq);
  const flowLibraryNavPayload = useFlowLibraryNavigationStore((s) => s.payload);

  useEffect(() => {
    if (flowLibraryNavPayload == null) {
      return;
    }
    if (flowLibraryNavPayload.highlightPresetId != null) {
      setCategoryFilter("all");
      setHighlightPresetId(flowLibraryNavPayload.highlightPresetId);
    }
    if (flowLibraryNavPayload.scrollToOfficial) {
      requestAnimationFrame(() => {
        officialSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    }
    if (flowLibraryNavPayload.highlightPresetId != null) {
      const presetId = flowLibraryNavPayload.highlightPresetId;
      requestAnimationFrame(() => {
        document.getElementById(`flow-preset-row-${presetId}`)?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      });
      const clearHighlight = window.setTimeout(
        () => setHighlightPresetId(null),
        2500,
      );
      useFlowLibraryNavigationStore.getState().clearNavigate();
      return () => window.clearTimeout(clearHighlight);
    }
    useFlowLibraryNavigationStore.getState().clearNavigate();
    return undefined;
  }, [flowLibraryNavSeq, flowLibraryNavPayload]);

  const {
    state: remoteState,
    syncState,
    entries: remoteEntries,
    fetchedAtMs,
    retry,
    refreshFromNetwork,
  } = useRemoteFlowPresets(remoteEnabled);

  const saveTarget = useMemo(() => resolveSaveToLibraryTarget(nodes), [nodes]);
  const projectFiltered = useMemo(
    () => filterPresets(library, query, categoryFilter),
    [categoryFilter, library, query],
  );
  const officialFiltered = useMemo(() => {
    const presets = remoteEntries
      .map((entry) => remotePresets[entry.id])
      .filter((preset): preset is StudioFlowPresetFile => preset != null);
    return filterPresets(presets, query, categoryFilter);
  }, [categoryFilter, query, remoteEntries, remotePresets]);

  const loadPreset =
    loadPresetId != null
      ? (library.find((p) => p.meta.id === loadPresetId) ??
        remotePresets[loadPresetId])
      : undefined;
  const editPreset =
    editPresetId != null
      ? library.find((p) => p.meta.id === editPresetId)
      : undefined;

  const scopeHint =
    activeGraphId === STUDIO_ROOT_GRAPH_ID
      ? "Root graph"
      : `Graph ${activeGraphId}`;

  const officialRowBadge = syncState === "cached" ? "Cached" : "Official";
  const syncBadge = officialSyncBadgeLabel(syncState, fetchedAtMs);

  const onImportFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        const text = typeof reader.result === "string" ? reader.result : "";
        const parsed = parseStudioFlowPresetFile(text);
        if (parsed == null) {
          return;
        }
        importFlowPresetToLibrary(parsed);
      };
      reader.readAsText(file);
    },
    [importFlowPresetToLibrary],
  );

  const applyLoad = useCallback(
    (mode: FlowLoadMode) => {
      if (loadPresetId == null) {
        return;
      }
      const preset =
        library.find((p) => p.meta.id === loadPresetId) ??
        remotePresets[loadPresetId];
      loadFlowPresetFromLibrary(loadPresetId, mode);
      if (preset != null) {
        reportFlowImportDependencies(preset.dependencies);
        const isProjectPreset = library.some((p) => p.meta.id === loadPresetId);
        if (mode === "replace" && isProjectPreset) {
          setLinkedProjectPreset(loadPresetId, preset.meta.name);
          clearLastLoadedOfficialPreset();
        } else if (mode === "replace" && isOfficialFlowPresetId(loadPresetId)) {
          setLastLoadedOfficialPreset(loadPresetId, preset.meta.name);
          clearLinkedProjectPreset();
        } else if (mode === "merge") {
          clearLinkedProjectPreset();
        }
      }
      setLoadPresetId(null);
    },
    [
      clearLastLoadedOfficialPreset,
      clearLinkedProjectPreset,
      library,
      loadFlowPresetFromLibrary,
      loadPresetId,
      remotePresets,
      reportFlowImportDependencies,
      setLastLoadedOfficialPreset,
      setLinkedProjectPreset,
    ],
  );

  const [overrideBusyPresetId, setOverrideBusyPresetId] = useState<string | null>(null);
  const [updateBusyPresetId, setUpdateBusyPresetId] = useState<string | null>(null);
  const [updateFeedback, setUpdateFeedback] = useState<string | null>(null);

  const requestProjectPresetUpdate = useCallback(
    (preset: StudioFlowPresetFile) => {
      requestProjectFlowPresetUpdate({
        targetPresetId: preset.meta.id,
        targetPresetName: preset.meta.name,
        linkedProjectPresetId,
        linkedProjectPresetName,
        onUpdate: async () => {
          setUpdateBusyPresetId(preset.meta.id);
          setUpdateFeedback(null);
          try {
            const ok = updateFlowPresetFromCanvas(preset.meta.id);
            if (ok) {
              setUpdateFeedback(`Updated "${preset.meta.name}" from the current canvas.`);
            } else {
              setUpdateFeedback(`Could not update "${preset.meta.name}".`);
            }
          } finally {
            setUpdateBusyPresetId(null);
          }
        },
      });
    },
    [
      linkedProjectPresetId,
      linkedProjectPresetName,
      updateFlowPresetFromCanvas,
    ],
  );

  const requestOverrideExport = useCallback(
    (preset: StudioFlowPresetFile, templateId: StudioDemoTemplateId) => {
      requestOfficialFlowPresetOverride({
        targetPresetId: preset.meta.id,
        targetPresetName: preset.meta.name,
        lastLoadedOfficialPresetId,
        lastLoadedOfficialPresetName,
        onExport: async () => {
          setOverrideBusyPresetId(preset.meta.id);
          setLastCommitStatus(`Updating official flow "${preset.meta.name}"…`);
          try {
            const result = await commitOfficialFlowPresetOverride({
              templateId,
              presetName: preset.meta.name,
              graph: {
                nodes,
                edges,
                subgraphs,
                activeGraphId,
                rootNodes,
                rootEdges,
              },
            });
            if (result.mode === "repo") {
              setLastCommitStatus(
                formatOfficialFlowPresetCommitStatus({
                  path: result.path,
                  warning: result.warning,
                  pipeline: result.pipeline,
                }),
              );
              refreshFromNetwork();
            } else if (result.mode === "download") {
              setLastCommitStatus(`Downloaded ${result.fileName} — import via Maintainer tools in dev.`);
            } else if (result.mode === "error") {
              setLastCommitStatus(
                `Override failed${result.step != null ? ` at ${result.step}` : ""}: ${result.error}`,
              );
            } else {
              setLastCommitStatus(null);
            }
          } finally {
            setOverrideBusyPresetId(null);
          }
        },
      });
    },
    [
      activeGraphId,
      edges,
      lastLoadedOfficialPresetId,
      lastLoadedOfficialPresetName,
      nodes,
      refreshFromNetwork,
      rootEdges,
      rootNodes,
      setLastCommitStatus,
      subgraphs,
    ],
  );

  return (
    <div className={dense ? "space-y-2 pt-2" : "space-y-3 pt-3"}>
      <FlowPresetMaintainerTools dense={dense} />
      <TRNHintText
        tone="muted"
        className={dense ? "text-[10px]" : "text-[11px]"}
      >
        Save the current canvas or selection as a reusable flow. Official
        presets sync from the online asset pack; project presets are stored
        locally on this machine.
      </TRNHintText>

      <div className="flex flex-wrap gap-2">
        <TRNButton
          type="button"
          size="compact"
          prefixIcon={<Save className="h-3.5 w-3.5" aria-hidden />}
          hint={`Saves as ${saveToLibraryTargetLabel(saveTarget).toLowerCase()} (${scopeHint}).`}
          onClick={() => openSaveToLibraryDialog()}
        >
          Save to library
        </TRNButton>
        <TRNButton
          type="button"
          size="compact"
          prefixIcon={<FolderInput className="h-3.5 w-3.5" aria-hidden />}
          onClick={() => fileInputRef.current?.click()}
        >
          Import preset
        </TRNButton>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.trn-flow-preset.json,application/json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file != null) {
              onImportFile(file);
            }
            e.target.value = "";
          }}
        />
      </div>

      <div className="flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => setCategoryFilter("all")}
          className={`rounded px-2 py-0.5 text-[10px] font-medium transition-colors ${
            categoryFilter === "all"
              ? "bg-zinc-800 text-zinc-100"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          All
        </button>
        {STUDIO_FLOW_PRESET_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategoryFilter(cat)}
            className={`rounded px-2 py-0.5 text-[10px] font-medium capitalize transition-colors ${
              categoryFilter === cat
                ? "bg-zinc-800 text-zinc-100"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {remoteEnabled ? (
        <section ref={officialSectionRef} className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
              <Cloud className="h-3.5 w-3.5 opacity-80" aria-hidden />
              Official
              {officialFiltered.length > 0 ? (
                <span className="font-normal normal-case text-zinc-500">
                  ({officialFiltered.length})
                </span>
              ) : null}
            </div>
            {syncBadge != null ? (
              <span
                className={`rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${
                  syncState === "fresh"
                    ? "bg-emerald-950/50 text-emerald-200/90"
                    : syncState === "cached"
                      ? "bg-amber-950/50 text-amber-200/90"
                      : "bg-zinc-800/80 text-zinc-400"
                }`}
              >
                {syncBadge}
              </span>
            ) : null}
            {syncState === "offline" ||
            syncState === "cached" ||
            syncState === "fresh" ? (
              <TRNButton
                type="button"
                size="compact"
                prefixIcon={<RefreshCw className="h-3.5 w-3.5" aria-hidden />}
                onClick={() => {
                  if (syncState === "fresh") {
                    refreshFromNetwork();
                  } else {
                    retry();
                  }
                }}
              >
                {syncState === "fresh" ? "Refresh" : "Retry"}
              </TRNButton>
            ) : null}
          </div>
          {remoteState === "loading" ? (
            <div className="rounded border border-zinc-800/80 bg-zinc-950/50 px-2 py-3 text-center text-[11px] text-zinc-500">
              Loading remote flow preset index…
            </div>
          ) : remoteState === "error" && officialFiltered.length === 0 ? (
            <div className="space-y-2 rounded border border-zinc-800/80 bg-zinc-950/50 px-2 py-3 text-center text-[11px] text-zinc-500">
              <p>
                Remote flow presets unavailable — check the online asset base in
                Asset Manager.
              </p>
              <TRNButton type="button" size="compact" onClick={retry}>
                Retry sync
              </TRNButton>
            </div>
          ) : officialFiltered.length === 0 ? (
            <div className="rounded border border-zinc-800/80 bg-zinc-950/50 px-2 py-3 text-center text-[11px] text-zinc-500">
              {syncState === "cached" || syncState === "offline"
                ? "No cached official flows match your search."
                : "No official flows match your search."}
            </div>
          ) : (
            <ul
              className={`space-y-1.5 ${dense ? "text-[10px]" : "text-[11px]"}`}
            >
              {officialFiltered.map((preset) => {
                const templateId = templateIdFromOfficialFlowPresetId(
                  preset.meta.id,
                );
                return (
                  <FlowPresetRow
                    key={preset.meta.id}
                    preset={preset}
                    borderColor={borderColor}
                    dense={dense}
                    badge={officialRowBadge}
                    highlighted={highlightPresetId === preset.meta.id}
                    onLoad={() => setLoadPresetId(preset.meta.id)}
                    onOverride={
                      maintainerMode && templateId != null
                        ? () => requestOverrideExport(preset, templateId)
                        : undefined
                    }
                    overrideHint={officialFlowPresetOverrideHint({
                      presetName: preset.meta.name,
                      canvasMatchesLoaded:
                        lastLoadedOfficialPresetId === preset.meta.id,
                      lastLoadedOfficialPresetName,
                    })}
                    overrideBusy={overrideBusyPresetId === preset.meta.id}
                  />
                );
              })}
            </ul>
          )}
          {syncState === "cached" && officialFiltered.length > 0 ? (
            <TRNHintText tone="muted" className="text-[10px]">
              Showing session cache from{" "}
              {fetchedAtMs != null
                ? formatRemoteCacheAge(fetchedAtMs)
                : "earlier"}
              . Use Retry to attempt a live sync.
            </TRNHintText>
          ) : null}
        </section>
      ) : null}

      <section className="space-y-2">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
          Project
          {projectFiltered.length > 0 ? (
            <span className="ml-1 font-normal normal-case text-zinc-500">
              ({projectFiltered.length})
            </span>
          ) : null}
        </div>
        {projectFiltered.length === 0 ? (
          <div className="rounded border border-zinc-800/80 bg-zinc-950/50 px-2 py-4 text-center text-[11px] text-zinc-500">
            {library.length === 0
              ? "No saved flows yet. Use Save to library on the current graph."
              : "No flow presets match your search."}
          </div>
        ) : (
          <ul
            className={`space-y-1.5 ${dense ? "text-[10px]" : "text-[11px]"}`}
          >
            {projectFiltered.map((preset) => (
              <FlowPresetRow
                key={preset.meta.id}
                preset={preset}
                borderColor={borderColor}
                dense={dense}
                highlighted={linkedProjectPresetId === preset.meta.id}
                onLoad={() => setLoadPresetId(preset.meta.id)}
                onUpdate={
                  linkedProjectPresetId === preset.meta.id
                    ? () => requestProjectPresetUpdate(preset)
                    : undefined
                }
                updateHint={projectFlowPresetUpdateHint({
                  presetName: preset.meta.name,
                  canvasMatchesLinked: linkedProjectPresetId === preset.meta.id,
                  linkedProjectPresetName,
                })}
                updateBusy={updateBusyPresetId === preset.meta.id}
                onEdit={() => setEditPresetId(preset.meta.id)}
                onExport={() => exportFlowPresetById(preset.meta.id)}
                exportHint={`Download the saved project preset "${preset.meta.name}" as a trn-flow-preset JSON file.`}
                onRemove={() => removeFlowPresetFromLibrary(preset.meta.id)}
              />
            ))}
          </ul>
        )}
        {linkedProjectPresetName != null ? (
          <TRNHintText tone="muted" className="text-[10px]">
            Linked preset:{" "}
            <span className="text-zinc-300">{linkedProjectPresetName}</span>
            {" — "}
            edit the canvas, then use Update on that row.
          </TRNHintText>
        ) : null}
        {updateFeedback != null ? (
          <TRNHintText tone="muted" className="text-[10px]">
            {updateFeedback}
          </TRNHintText>
        ) : null}
      </section>

      <SaveToLibraryDialog
        open={editPreset != null}
        mode="edit"
        target="flow-full"
        defaultName={editPreset?.meta.name ?? ""}
        defaultCategory={editPreset?.meta.category ?? "custom"}
        defaultDescription={editPreset?.meta.description ?? ""}
        onCancel={() => setEditPresetId(null)}
        onConfirm={(args) => {
          if (editPresetId != null && args.flowCategory != null) {
            updateFlowPresetInLibrary(editPresetId, {
              name: args.name,
              category: args.flowCategory,
              description: args.description,
            });
          }
          setEditPresetId(null);
        }}
      />

      <FlowLoadModeDialog
        open={loadPreset != null}
        presetName={loadPreset?.meta.name ?? "Flow preset"}
        onCancel={() => setLoadPresetId(null)}
        onChoose={applyLoad}
      />
    </div>
  );
}
