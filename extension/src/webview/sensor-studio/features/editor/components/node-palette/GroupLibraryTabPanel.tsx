import {
  Cloud,
  Download,
  FolderInput,
  GripVertical,
  Pencil,
  RefreshCw,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TRNButton, TRNHintText, TRNIconButton, TRNTooltip } from "../../../../../ui/TRN";
import { SaveToLibraryDialog } from "../flow-library/SaveToLibraryDialog";
import { useGroupPresetLinkedSessionStore } from "../../flow-library/group-preset-linked-session";
import { useFlowLibraryNavigationStore } from "../../flow-library/flow-library-navigation";
import {
  projectGroupPresetUpdateHint,
  requestProjectGroupPresetUpdate,
} from "../../flow-library/request-project-group-preset-update";
import { resolveSaveToLibraryTarget } from "../../flow-library/resolve-save-to-library-target";
import { useFlowEditorStore } from "../../store/flow-editor.store";
import {
  parseStudioNodeAssetFile,
  STUDIO_NODE_ASSET_CATEGORIES,
  type StudioNodeAssetCategory,
  type StudioNodeAssetFile,
} from "../../subgraphs/node-library/studio-node-asset-file";
import { formatRemoteCacheAge } from "../../subgraphs/node-library/node-group-remote-cache";
import { useRemoteNodeGraphPresets } from "../../subgraphs/node-library/use-remote-node-graph-presets";
import { setStudioNodeGroupAssetDragData } from "./node-group-asset-drag";

type GroupLibraryTabPanelProps = {
  dense?: boolean;
  query: string;
  borderColor?: string;
  remoteEnabled?: boolean;
};

type GroupCategoryFilter = "all" | StudioNodeAssetCategory;

function socketSummary(asset: StudioNodeAssetFile): string {
  const host = asset.nodes[0];
  if (host == null) {
    return "";
  }
  const data = host.data as { subgraphId?: string };
  const subKey = data.subgraphId ?? host.id;
  const sub = asset.subgraphs[subKey];
  if (sub == null) {
    return "";
  }
  const inCount = sub.interface.inputs.length;
  const outCount = sub.interface.outputs.length;
  return `${inCount} in · ${outCount} out`;
}

function resolveAssetCategory(asset: StudioNodeAssetFile): StudioNodeAssetCategory {
  return asset.meta.category ?? "composition";
}

function filterAssets(
  assets: StudioNodeAssetFile[],
  query: string,
  categoryFilter: GroupCategoryFilter,
): StudioNodeAssetFile[] {
  const q = query.trim().toLowerCase();
  return assets.filter((asset) => {
    if (categoryFilter !== "all" && resolveAssetCategory(asset) !== categoryFilter) {
      return false;
    }
    if (q.length === 0) {
      return true;
    }
    const hay = [asset.meta.name, asset.meta.description ?? "", ...(asset.meta.tags ?? [])]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

const PRESET_ICON_BUTTON_CLASS =
  "h-[22px] w-[22px] min-h-0 min-w-0 rounded border-0 bg-transparent p-0";

function GroupPresetRow(props: {
  asset: StudioNodeAssetFile;
  borderColor?: string;
  sourceBadge?: string;
  highlighted?: boolean;
  onUpdate?: () => void;
  updateHint?: string;
  updateBusy?: boolean;
  onEdit?: () => void;
  onExport?: () => void;
  onRemove?: () => void;
}) {
  const {
    asset,
    borderColor,
    sourceBadge,
    highlighted = false,
    onUpdate,
    updateHint,
    updateBusy = false,
    onEdit,
    onExport,
    onRemove,
  } = props;
  const summary = socketSummary(asset);
  const category = resolveAssetCategory(asset);
  const hasActions =
    onUpdate != null || onEdit != null || onExport != null || onRemove != null;
  const tags = asset.meta.tags ?? [];

  return (
    <li id={`group-preset-row-${asset.meta.id}`} className="min-w-0">
      <div
        draggable
        onDragStart={(e) => {
          setStudioNodeGroupAssetDragData(e.dataTransfer, asset);
        }}
        className={`group flex w-full min-w-0 cursor-grab items-start gap-1.5 rounded border px-2 py-2 transition-colors hover:border-violet-500/35 hover:bg-violet-950/20 active:cursor-grabbing ${
          highlighted
            ? "border-violet-400/70 bg-violet-950/30 ring-1 ring-violet-400/40"
            : "border-zinc-800/80 bg-zinc-950/40"
        }`}
        style={borderColor != null && !highlighted ? { borderColor } : undefined}
      >
        <TRNTooltip
          className="shrink-0 self-stretch"
          placement="right"
          openDelayMs={450}
          triggerWrapper="span"
          disableHoverFx
          triggerClassName="flex h-full items-center rounded-none p-0 text-zinc-600 hover:text-violet-300/90"
          triggerAriaLabel={`Drag ${asset.meta.name}`}
          content="Drag onto the flow canvas to spawn a deep copy."
          trigger={
            <span className="flex items-center py-0.5" aria-hidden>
              <GripVertical className="h-3.5 w-3.5" />
            </span>
          }
        />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <div className="min-w-0 truncate font-medium text-zinc-100">{asset.meta.name}</div>
            {sourceBadge != null ? (
              <span className="shrink-0 rounded bg-violet-950/50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-violet-200/90">
                {sourceBadge}
              </span>
            ) : null}
            <span className="shrink-0 rounded bg-zinc-800/80 px-1.5 py-0.5 text-[9px] font-medium capitalize text-zinc-400">
              {category}
            </span>
          </div>
          {summary.length > 0 ? (
            <div className="mt-0.5 text-[10px] text-zinc-500">{summary}</div>
          ) : null}
          {asset.meta.description ? (
            <div className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-zinc-500">
              {asset.meta.description}
            </div>
          ) : null}
          {tags.length > 0 ? (
            <div className="mt-1 flex flex-wrap gap-1">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded bg-zinc-900/80 px-1.5 py-0.5 text-[9px] text-zinc-500"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        {hasActions ? (
          <div className="flex shrink-0 flex-row items-center gap-0.5 self-start opacity-80 group-hover:opacity-100">
            {onUpdate != null ? (
              <TRNIconButton
                label="Update project group preset"
                hint={updateHint ?? "Overwrite this project preset with the canvas group."}
                hintPlacement="left"
                nativeTitle={false}
                disabled={updateBusy}
                className="h-[22px] w-[22px] min-h-0 min-w-0 rounded border-violet-800/70 bg-violet-950/45 p-0 text-violet-100 hover:border-violet-700/80 hover:bg-violet-900/55"
                icon={<Upload className="h-3.5 w-3.5" aria-hidden />}
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdate();
                }}
              />
            ) : null}
            {onEdit != null ? (
              <TRNIconButton
                label="Edit group preset"
                hint="Edit name, category, and description."
                hintPlacement="left"
                nativeTitle={false}
                className={`${PRESET_ICON_BUTTON_CLASS} text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-100`}
                icon={<Pencil className="h-3.5 w-3.5" aria-hidden />}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              />
            ) : null}
            {onExport != null ? (
              <TRNIconButton
                label="Export preset"
                hint="Export .trn-node-asset.json"
                hintPlacement="left"
                nativeTitle={false}
                className={`${PRESET_ICON_BUTTON_CLASS} text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-100`}
                icon={<Download className="h-3.5 w-3.5" aria-hidden />}
                onClick={(e) => {
                  e.stopPropagation();
                  onExport();
                }}
              />
            ) : null}
            {onRemove != null ? (
              <TRNIconButton
                label="Remove preset"
                hint="Remove from library"
                hintPlacement="left"
                nativeTitle={false}
                className={`${PRESET_ICON_BUTTON_CLASS} text-zinc-400 hover:bg-red-950/40 hover:text-red-200`}
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

function GroupLibrarySection(props: {
  title: string;
  count?: number;
  icon?: React.ReactNode;
  headerExtra?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { title, count, icon, headerExtra, footer, children } = props;
  return (
    <section className="overflow-hidden rounded-md border border-zinc-800/80 bg-zinc-950/35">
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800/60 px-2 py-1.5">
        <div className="flex min-w-0 flex-1 items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
          {icon}
          {title}
          {count != null && count > 0 ? (
            <span className="font-normal normal-case text-zinc-500">({count})</span>
          ) : null}
        </div>
        {headerExtra}
      </div>
      <div className="space-y-1.5 p-2">{children}</div>
      {footer != null ? (
        <div className="border-t border-zinc-800/50 px-2 py-1.5">{footer}</div>
      ) : null}
    </section>
  );
}

function officialSyncBadgeLabel(
  syncState: ReturnType<typeof useRemoteNodeGraphPresets>["syncState"],
  fetchedAtMs: number | null,
): string | null {
  switch (syncState) {
    case "fresh":
      return "Live";
    case "cached":
      return fetchedAtMs != null ? `Cached · ${formatRemoteCacheAge(fetchedAtMs)}` : "Cached";
    case "offline":
      return "Offline";
    default:
      return null;
  }
}

function syncBadgeToneClass(
  syncState: ReturnType<typeof useRemoteNodeGraphPresets>["syncState"],
): string {
  if (syncState === "fresh") {
    return "bg-emerald-950/50 text-emerald-200/90";
  }
  if (syncState === "cached") {
    return "bg-amber-950/50 text-amber-200/90";
  }
  return "bg-zinc-800/80 text-zinc-400";
}

export function GroupLibraryTabPanel(props: GroupLibraryTabPanelProps) {
  const { dense = false, query, borderColor, remoteEnabled = false } = props;
  const nodes = useFlowEditorStore((s) => s.nodes);
  const library = useFlowEditorStore((s) => s.nodeGroupLibrary);
  const remoteAssets = useFlowEditorStore((s) => s.remoteNodeGraphAssets);
  const importNodeAssetToLibrary = useFlowEditorStore((s) => s.importNodeAssetToLibrary);
  const exportNodeAssetById = useFlowEditorStore((s) => s.exportNodeAssetById);
  const removeNodeAssetFromLibrary = useFlowEditorStore((s) => s.removeNodeAssetFromLibrary);
  const updateNodeAssetInLibrary = useFlowEditorStore((s) => s.updateNodeAssetInLibrary);
  const updateNodeAssetFromCanvas = useFlowEditorStore((s) => s.updateNodeAssetFromCanvas);
  const openSaveToLibraryDialog = useFlowEditorStore((s) => s.openSaveToLibraryDialog);
  const linkedProjectAssetId = useGroupPresetLinkedSessionStore((s) => s.linkedProjectAssetId);
  const linkedProjectAssetName = useGroupPresetLinkedSessionStore((s) => s.linkedProjectAssetName);
  const flowLibraryNavSeq = useFlowLibraryNavigationStore((s) => s.seq);
  const flowLibraryNavPayload = useFlowLibraryNavigationStore((s) => s.payload);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const projectSectionRef = useRef<HTMLDivElement>(null);
  const [editAssetId, setEditAssetId] = useState<string | null>(null);
  const [highlightAssetId, setHighlightAssetId] = useState<string | null>(null);
  const [updateBusyAssetId, setUpdateBusyAssetId] = useState<string | null>(null);
  const [updateFeedback, setUpdateFeedback] = useState<string | null>(null);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<GroupCategoryFilter>("all");
  const saveTarget = useMemo(() => resolveSaveToLibraryTarget(nodes), [nodes]);
  const canSaveGroup = saveTarget === "group";

  useEffect(() => {
    if (flowLibraryNavPayload == null) {
      return;
    }
    if (flowLibraryNavPayload.highlightGroupAssetId != null) {
      setCategoryFilter("all");
      setHighlightAssetId(flowLibraryNavPayload.highlightGroupAssetId);
    }
    if (flowLibraryNavPayload.scrollToProject) {
      requestAnimationFrame(() => {
        projectSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
    if (flowLibraryNavPayload.highlightGroupAssetId != null) {
      const assetId = flowLibraryNavPayload.highlightGroupAssetId;
      requestAnimationFrame(() => {
        document.getElementById(`group-preset-row-${assetId}`)?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      });
      const clearHighlight = window.setTimeout(() => setHighlightAssetId(null), 2500);
      useFlowLibraryNavigationStore.getState().clearNavigate();
      return () => window.clearTimeout(clearHighlight);
    }
    useFlowLibraryNavigationStore.getState().clearNavigate();
    return undefined;
  }, [flowLibraryNavSeq, flowLibraryNavPayload]);

  const requestProjectAssetUpdate = useCallback(
    (asset: StudioNodeAssetFile) => {
      requestProjectGroupPresetUpdate({
        targetAssetId: asset.meta.id,
        targetAssetName: asset.meta.name,
        onUpdate: async () => {
          setUpdateBusyAssetId(asset.meta.id);
          setUpdateFeedback(null);
          try {
            const ok = updateNodeAssetFromCanvas(asset.meta.id);
            setUpdateFeedback(
              ok
                ? `Updated "${asset.meta.name}" from the canvas group.`
                : `Could not update "${asset.meta.name}" — select the linked group on the canvas.`,
            );
          } finally {
            setUpdateBusyAssetId(null);
          }
        },
      });
    },
    [updateNodeAssetFromCanvas],
  );
  const {
    state: remoteState,
    syncState,
    entries: remoteEntries,
    fetchedAtMs,
    retry,
    refreshFromNetwork,
  } = useRemoteNodeGraphPresets(remoteEnabled);

  const projectFiltered = useMemo(
    () => filterAssets(library, query, categoryFilter),
    [categoryFilter, library, query],
  );
  const editAsset = useMemo(
    () =>
      editAssetId != null
        ? library.find((asset) => asset.meta.id === editAssetId)
        : undefined,
    [editAssetId, library],
  );
  const officialFiltered = useMemo(() => {
    const assets = remoteEntries
      .map((entry) => remoteAssets[entry.id])
      .filter((asset): asset is StudioNodeAssetFile => asset != null);
    return filterAssets(assets, query, categoryFilter);
  }, [categoryFilter, query, remoteAssets, remoteEntries]);

  const officialRowBadge = syncState === "cached" ? "Cached" : "Official";
  const syncBadge = officialSyncBadgeLabel(syncState, fetchedAtMs);
  const textSize = dense ? "text-[10px]" : "text-[11px]";

  const onImportFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        const text = typeof reader.result === "string" ? reader.result : "";
        const parsed = parseStudioNodeAssetFile(text);
        if (parsed == null) {
          return;
        }
        importNodeAssetToLibrary(parsed);
      };
      reader.readAsText(file);
    },
    [importNodeAssetToLibrary],
  );

  const officialHeaderExtra =
    remoteEnabled && (syncState === "offline" || syncState === "cached" || syncState === "fresh") ? (
      <div className="flex flex-wrap items-center gap-1.5">
        {syncBadge != null ? (
          <span
            className={`rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${syncBadgeToneClass(syncState)}`}
          >
            {syncBadge}
          </span>
        ) : null}
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
      </div>
    ) : null;

  return (
    <div className={`space-y-2 ${dense ? "pt-2" : "pt-3"}`}>
      <section className="rounded-md border border-zinc-800/80 bg-zinc-950/35 px-2 py-2">
        <div className="flex flex-wrap gap-2">
          {canSaveGroup ? (
            <TRNButton
              type="button"
              size="compact"
              prefixIcon={<Save className="h-3.5 w-3.5" aria-hidden />}
              hint="Save the selected node group to Presets → Groups."
              onClick={() => openSaveToLibraryDialog()}
            >
              Save to library
            </TRNButton>
          ) : null}
          <TRNButton
            type="button"
            size="compact"
            prefixIcon={<FolderInput className="h-3.5 w-3.5" aria-hidden />}
            hint="Import a .trn-node-asset.json file into the project library."
            onClick={() => {
              fileInputRef.current?.click();
            }}
          >
            Import preset
          </TRNButton>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.trn-node-asset.json,application/json"
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
        <div className={`mt-2 flex flex-wrap items-center gap-2 ${textSize}`}>
          <button
            type="button"
            onClick={() => setHowItWorksOpen((open) => !open)}
            className="rounded px-2 py-0.5 text-[10px] font-medium text-zinc-500 transition-colors hover:bg-zinc-800/80 hover:text-zinc-300"
          >
            {howItWorksOpen ? "Hide how it works" : "How it works"}
          </button>
        </div>
        {howItWorksOpen ? (
          <TRNHintText tone="muted" className={`mt-2 ${textSize} leading-relaxed`}>
            Drag onto the canvas to spawn a deep copy. Official presets sync from the online asset
            pack; project presets are saved on this machine (see workspace bar above for folder
            sync).
          </TRNHintText>
        ) : (
          <TRNHintText tone="muted" className={`mt-2 ${textSize} leading-relaxed`}>
            Drag onto canvas to spawn a copy · official presets sync online.
          </TRNHintText>
        )}
        {updateFeedback != null ? (
          <TRNHintText tone="muted" className={`mt-2 ${textSize} text-emerald-300/90`}>
            {updateFeedback}
          </TRNHintText>
        ) : null}
      </section>

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
        {STUDIO_NODE_ASSET_CATEGORIES.map((cat) => (
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
        <GroupLibrarySection
          title="Official"
          count={officialFiltered.length}
          icon={<Cloud className="h-3.5 w-3.5 opacity-80" aria-hidden />}
          headerExtra={officialHeaderExtra}
          footer={
            syncState === "cached" && officialFiltered.length > 0 ? (
              <TRNHintText tone="muted" className="text-[10px] leading-relaxed">
                Showing session cache from{" "}
                {fetchedAtMs != null ? formatRemoteCacheAge(fetchedAtMs) : "earlier"}. Use Retry to
                attempt a live sync.
              </TRNHintText>
            ) : undefined
          }
        >
          {remoteState === "loading" ? (
            <div className="rounded border border-zinc-800/70 bg-zinc-950/50 px-2 py-3 text-center text-[11px] text-zinc-500">
              Loading remote node-graph index…
            </div>
          ) : remoteState === "error" && officialFiltered.length === 0 ? (
            <div className="space-y-2 rounded border border-zinc-800/70 bg-zinc-950/50 px-2 py-3 text-center text-[11px] text-zinc-500">
              <p>Remote presets unavailable — check the online asset base in Asset Manager.</p>
              <TRNButton type="button" size="compact" onClick={retry}>
                Retry sync
              </TRNButton>
            </div>
          ) : officialFiltered.length === 0 ? (
            <div className="rounded border border-zinc-800/70 bg-zinc-950/50 px-2 py-3 text-center text-[11px] text-zinc-500">
              {syncState === "cached" || syncState === "offline"
                ? "No cached official presets match your filters."
                : "No official presets match your filters."}
            </div>
          ) : (
            <ul className={`space-y-1.5 ${textSize}`}>
              {officialFiltered.map((asset) => (
                <GroupPresetRow
                  key={asset.meta.id}
                  asset={asset}
                  borderColor={borderColor}
                  sourceBadge={officialRowBadge}
                />
              ))}
            </ul>
          )}
        </GroupLibrarySection>
      ) : null}

      <div ref={projectSectionRef}>
      <GroupLibrarySection title="Project" count={projectFiltered.length}>
        {projectFiltered.length === 0 ? (
          <div className="rounded border border-zinc-800/70 bg-zinc-950/50 px-2 py-4 text-center text-[11px] text-zinc-500">
            {library.length === 0
              ? "No saved groups yet. Select a node group → Inspector → Save to library."
              : "No project presets match your filters."}
          </div>
        ) : (
          <ul className={`space-y-1.5 ${textSize}`}>
            {projectFiltered.map((asset) => (
              <GroupPresetRow
                key={asset.meta.id}
                asset={asset}
                borderColor={borderColor}
                highlighted={
                  linkedProjectAssetId === asset.meta.id ||
                  highlightAssetId === asset.meta.id
                }
                onUpdate={
                  linkedProjectAssetId === asset.meta.id
                    ? () => requestProjectAssetUpdate(asset)
                    : undefined
                }
                updateHint={projectGroupPresetUpdateHint({
                  assetName: asset.meta.name,
                  canvasMatchesLinked: linkedProjectAssetId === asset.meta.id,
                  linkedProjectAssetName,
                })}
                updateBusy={updateBusyAssetId === asset.meta.id}
                onEdit={() => setEditAssetId(asset.meta.id)}
                onExport={() => {
                  exportNodeAssetById(asset.meta.id);
                }}
                onRemove={() => {
                  removeNodeAssetFromLibrary(asset.meta.id);
                }}
              />
            ))}
          </ul>
        )}
        {linkedProjectAssetName != null ? (
          <TRNHintText tone="muted" className="text-[10px]">
            Linked preset:{" "}
            <span className="text-zinc-300">{linkedProjectAssetName}</span> — edit the group on
            canvas, then use Update.
          </TRNHintText>
        ) : null}
      </GroupLibrarySection>
      </div>

      <SaveToLibraryDialog
        open={editAsset != null}
        mode="edit"
        target="group"
        defaultName={editAsset?.meta.name ?? ""}
        defaultGroupCategory={editAsset?.meta.category ?? "composition"}
        defaultDescription={editAsset?.meta.description ?? ""}
        onCancel={() => setEditAssetId(null)}
        onConfirm={(args) => {
          if (editAssetId != null) {
            updateNodeAssetInLibrary(editAssetId, {
              name: args.name,
              category: args.groupCategory,
              description: args.description,
            });
          }
          setEditAssetId(null);
        }}
      />
    </div>
  );
}
