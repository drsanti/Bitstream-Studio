import { Cloud, Download, FolderInput, Trash2 } from "lucide-react";
import { useCallback, useMemo, useRef } from "react";
import { TRNButton, TRNHintText } from "../../../../../ui/TRN";
import { useFlowEditorStore } from "../../store/flow-editor.store";
import { parseStudioNodeAssetFile } from "../../subgraphs/node-library/studio-node-asset-file";
import type { StudioNodeAssetFile } from "../../subgraphs/node-library/studio-node-asset-file";
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

export function GroupLibraryTabPanel(props: GroupLibraryTabPanelProps) {
  const { dense = false, query, borderColor, remoteEnabled = false } = props;
  const library = useFlowEditorStore((s) => s.nodeGroupLibrary);
  const remoteAssets = useFlowEditorStore((s) => s.remoteNodeGraphAssets);
  const importNodeAssetToLibrary = useFlowEditorStore((s) => s.importNodeAssetToLibrary);
  const exportNodeAssetById = useFlowEditorStore((s) => s.exportNodeAssetById);
  const removeNodeAssetFromLibrary = useFlowEditorStore((s) => s.removeNodeAssetFromLibrary);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { state: remoteState, entries: remoteEntries } = useRemoteNodeGraphPresets(remoteEnabled);

  const projectFiltered = useMemo(() => filterAssets(library, query), [library, query]);
  const officialFiltered = useMemo(() => {
    const assets = remoteEntries
      .map((entry) => remoteAssets[entry.id])
      .filter((asset): asset is StudioNodeAssetFile => asset != null);
    return filterAssets(assets, query);
  }, [query, remoteAssets, remoteEntries]);

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
        asset pack; Project presets are saved locally on this machine.
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
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
          <Cloud className="h-3.5 w-3.5 opacity-80" aria-hidden />
          Official
        </div>
        {remoteState === "loading" ? (
          <div className="rounded border border-zinc-800/80 bg-zinc-950/50 px-2 py-3 text-center text-[11px] text-zinc-500">
            Loading remote node-graph index…
          </div>
        ) : remoteState === "error" ? (
          <div className="rounded border border-zinc-800/80 bg-zinc-950/50 px-2 py-3 text-center text-[11px] text-zinc-500">
            Remote presets unavailable (check online asset base in Asset Manager).
          </div>
        ) : officialFiltered.length === 0 ? (
          <div className="rounded border border-zinc-800/80 bg-zinc-950/50 px-2 py-3 text-center text-[11px] text-zinc-500">
            No official presets match your search.
          </div>
        ) : (
          <ul className={`space-y-1.5 ${dense ? "text-[10px]" : "text-[11px]"}`}>
            {officialFiltered.map((asset) => (
              <PresetRow
                key={asset.meta.id}
                asset={asset}
                borderColor={borderColor}
                dense={dense}
                badge="Official"
              />
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Project</div>
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
