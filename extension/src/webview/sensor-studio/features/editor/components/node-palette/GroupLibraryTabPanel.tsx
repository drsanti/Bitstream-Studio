import { Cloud, Download, FolderInput, RefreshCw, Trash2 } from "lucide-react";
import { useCallback, useMemo, useRef } from "react";
import { TRNButton, TRNHintText } from "../../../../../ui/TRN";
import { useFlowEditorStore } from "../../store/flow-editor.store";
import { parseStudioNodeAssetFile } from "../../subgraphs/node-library/studio-node-asset-file";
import type { StudioNodeAssetFile } from "../../subgraphs/node-library/studio-node-asset-file";
import { formatRemoteCacheAge } from "../../subgraphs/node-library/node-group-remote-cache";
import { useRemoteNodeGraphPresets } from "../../subgraphs/node-library/use-remote-node-graph-presets";
import { setStudioNodeGroupAssetDragData } from "./node-group-asset-drag";

type GroupLibraryTabPanelProps = {
  dense?: boolean;
  query: string;
  borderColor?: string;
  remoteEnabled?: boolean;
};

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

function filterAssets(assets: StudioNodeAssetFile[], query: string): StudioNodeAssetFile[] {
  const q = query.trim().toLowerCase();
  if (q.length === 0) {
    return assets;
  }
  return assets.filter((asset) => {
    const hay = [asset.meta.name, asset.meta.description ?? "", ...(asset.meta.tags ?? [])]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

function PresetRow(props: {
  asset: StudioNodeAssetFile;
  borderColor?: string;
  dense?: boolean;
  badge?: string;
  onExport?: () => void;
  onRemove?: () => void;
}) {
  const { asset, borderColor, dense, badge, onExport, onRemove } = props;
  const summary = socketSummary(asset);
  return (
    <li>
      <div
        draggable
        onDragStart={(e) => {
          setStudioNodeGroupAssetDragData(e.dataTransfer, asset);
        }}
        className="group flex cursor-grab items-start gap-2 rounded border border-zinc-800/80 bg-zinc-950/40 px-2 py-2 transition-colors hover:border-violet-500/35 hover:bg-violet-950/20 active:cursor-grabbing"
        style={borderColor != null ? { borderColor } : undefined}
        title="Drag onto the flow canvas"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="truncate font-medium text-zinc-100">{asset.meta.name}</div>
            {badge != null ? (
              <span className="shrink-0 rounded bg-cyan-950/50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-cyan-200/90">
                {badge}
              </span>
            ) : null}
          </div>
          {summary.length > 0 ? (
            <div className="mt-0.5 text-[10px] text-zinc-500">{summary}</div>
          ) : null}
          {asset.meta.description ? (
            <div className="mt-1 line-clamp-2 text-[10px] text-zinc-500">{asset.meta.description}</div>
          ) : null}
        </div>
        {onExport != null || onRemove != null ? (
          <div className="flex shrink-0 flex-col gap-1 opacity-80 group-hover:opacity-100">
            {onExport != null ? (
              <button
                type="button"
                className="rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-800/80 hover:text-zinc-100"
                title="Export .trn-node-asset.json"
                onClick={onExport}
              >
                <Download className="h-3.5 w-3.5" aria-hidden />
              </button>
            ) : null}
            {onRemove != null ? (
              <button
                type="button"
                className="rounded p-1 text-zinc-400 transition-colors hover:bg-red-950/40 hover:text-red-200"
                title="Remove from library"
                onClick={onRemove}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </li>
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

export function GroupLibraryTabPanel(props: GroupLibraryTabPanelProps) {
  const { dense = false, query, borderColor, remoteEnabled = false } = props;
  const library = useFlowEditorStore((s) => s.nodeGroupLibrary);
  const remoteAssets = useFlowEditorStore((s) => s.remoteNodeGraphAssets);
  const importNodeAssetToLibrary = useFlowEditorStore((s) => s.importNodeAssetToLibrary);
  const exportNodeAssetById = useFlowEditorStore((s) => s.exportNodeAssetById);
  const removeNodeAssetFromLibrary = useFlowEditorStore((s) => s.removeNodeAssetFromLibrary);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    state: remoteState,
    syncState,
    entries: remoteEntries,
    fetchedAtMs,
    retry,
    refreshFromNetwork,
  } = useRemoteNodeGraphPresets(remoteEnabled);

  const projectFiltered = useMemo(() => filterAssets(library, query), [library, query]);
  const officialFiltered = useMemo(() => {
    const assets = remoteEntries
      .map((entry) => remoteAssets[entry.id])
      .filter((asset): asset is StudioNodeAssetFile => asset != null);
    return filterAssets(assets, query);
  }, [query, remoteAssets, remoteEntries]);

  const officialRowBadge = syncState === "cached" ? "Cached" : "Official";
  const syncBadge = officialSyncBadgeLabel(syncState, fetchedAtMs);

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

  return (
    <div className={dense ? "space-y-2 pt-2" : "space-y-3 pt-3"}>
      <TRNHintText tone="muted" className={dense ? "text-[10px]" : "text-[11px]"}>
        Drag a preset onto the canvas to spawn a deep copy. Official presets sync from the online
        asset pack (session cache when offline); Project presets are saved locally on this machine.
      </TRNHintText>

      <div className="flex flex-wrap gap-2">
        <TRNButton
          type="button"
          size="compact"
          prefixIcon={<FolderInput className="h-3.5 w-3.5" aria-hidden />}
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

      <section className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
            <Cloud className="h-3.5 w-3.5 opacity-80" aria-hidden />
            Official
            {remoteEnabled && officialFiltered.length > 0 ? (
              <span className="font-normal normal-case text-zinc-500">({officialFiltered.length})</span>
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
          {remoteEnabled && (syncState === "offline" || syncState === "cached" || syncState === "fresh") ? (
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
            Loading remote node-graph index…
          </div>
        ) : remoteState === "error" && officialFiltered.length === 0 ? (
          <div className="space-y-2 rounded border border-zinc-800/80 bg-zinc-950/50 px-2 py-3 text-center text-[11px] text-zinc-500">
            <p>Remote presets unavailable — check the online asset base in Asset Manager.</p>
            <TRNButton type="button" size="compact" onClick={retry}>
              Retry sync
            </TRNButton>
          </div>
        ) : officialFiltered.length === 0 ? (
          <div className="rounded border border-zinc-800/80 bg-zinc-950/50 px-2 py-3 text-center text-[11px] text-zinc-500">
            {syncState === "cached" || syncState === "offline"
              ? "No cached official presets match your search."
              : "No official presets match your search."}
          </div>
        ) : (
          <ul className={`space-y-1.5 ${dense ? "text-[10px]" : "text-[11px]"}`}>
            {officialFiltered.map((asset) => (
              <PresetRow
                key={asset.meta.id}
                asset={asset}
                borderColor={borderColor}
                dense={dense}
                badge={officialRowBadge}
              />
            ))}
          </ul>
        )}
        {syncState === "cached" && officialFiltered.length > 0 ? (
          <TRNHintText tone="muted" className="text-[10px]">
            Showing session cache from {fetchedAtMs != null ? formatRemoteCacheAge(fetchedAtMs) : "earlier"}.
            Use Retry to attempt a live sync.
          </TRNHintText>
        ) : null}
      </section>

      <section className="space-y-2">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
          Project
          {projectFiltered.length > 0 ? (
            <span className="ml-1 font-normal normal-case text-zinc-500">({projectFiltered.length})</span>
          ) : null}
        </div>
        {projectFiltered.length === 0 ? (
          <div className="rounded border border-zinc-800/80 bg-zinc-950/50 px-2 py-4 text-center text-[11px] text-zinc-500">
            {library.length === 0
              ? "No saved groups yet. Select a node group → inspector → Save to library."
              : "No project presets match your search."}
          </div>
        ) : (
          <ul className={`space-y-1.5 ${dense ? "text-[10px]" : "text-[11px]"}`}>
            {projectFiltered.map((asset) => (
              <PresetRow
                key={asset.meta.id}
                asset={asset}
                borderColor={borderColor}
                dense={dense}
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
      </section>
    </div>
  );
}
