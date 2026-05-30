import type { DragEvent, LucideIcon } from "lucide-react";
import {
  ArrowDownAZ,
  Box,
  Clock,
  Copy,
  FolderOpen,
  Globe,
  Hash,
  Image as ImageIcon,
  Layers,
  Map as MapIcon,
  Package,
  RefreshCw,
  Search,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { StudioAssetCategory, StudioAssetSource } from "./studio-asset.types";
import { resolveStudioAsset } from "./resolveStudioAsset";
import {
  readRecentStudioAssetIds,
  readStudioAssetBrowserSortBy,
  recordStudioAssetRecentPick,
  writeStudioAssetBrowserSortBy,
  type StudioAssetBrowserSortBy,
} from "./studio-asset-browser-recent";
import { TRNMenuSectionTitle } from "../../../ui/TRN";
import { useOpenAssetManager } from "../../../assets-manager/hooks/useOpenAssetManager.js";
import { AssetBrowserEnvironmentPreview } from "./AssetBrowserEnvironmentPreview";
import { studioAssetSourceBadgeClasses } from "./studio-asset-source-badge";
import { setStudioAssetDragData } from "./studio-asset-drag";
import { useStudioAssetDescriptors } from "./useStudioAssetDescriptors";

type AssetBrowserPanelProps = {
  borderColor: string;
  panelColor: string;
};

const CATEGORY_TABS: { id: StudioAssetCategory; label: string; Icon: LucideIcon }[] = [
  { id: "model", label: "Models", Icon: Box },
  { id: "environment", label: "Environments", Icon: MapIcon },
  { id: "texture", label: "Textures", Icon: ImageIcon },
];

type AssetBrowserSourceFilter = "all" | StudioAssetSource;

function parseSourceFilterValue(raw: string): AssetBrowserSourceFilter {
  if (
    raw === "bundled" ||
    raw === "pack" ||
    raw === "downloaded" ||
    raw === "external"
  ) {
    return raw;
  }
  return "all";
}

export function AssetBrowserPanel(props: AssetBrowserPanelProps) {
  const { borderColor, panelColor } = props;
  const { descriptors, bumpRefresh } = useStudioAssetDescriptors();
  const { openAssetManager } = useOpenAssetManager();
  const [category, setCategory] = useState<StudioAssetCategory>("model");
  const [sourceFilter, setSourceFilter] = useState<AssetBrowserSourceFilter>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "ok" | "err">("idle");
  const [copyIdState, setCopyIdState] = useState<"idle" | "ok" | "err">("idle");
  const [recentIds, setRecentIds] = useState(() => readRecentStudioAssetIds());
  const [sortBy, setSortBy] = useState<StudioAssetBrowserSortBy>(() => readStudioAssetBrowserSortBy());

  useEffect(() => {
    if (descriptors.length === 0) {
      setSelectedId(null);
      return;
    }
    if (selectedId != null && descriptors.some((d) => d.id === selectedId)) {
      return;
    }
    const pick = descriptors.find((d) => d.category === category) ?? descriptors[0];
    setSelectedId(pick?.id ?? null);
  }, [descriptors, category, selectedId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return descriptors.filter((row) => {
      if (row.category !== category) {
        return false;
      }
      if (sourceFilter !== "all" && row.source !== sourceFilter) {
        return false;
      }
      if (q.length === 0) {
        return true;
      }
      return (
        row.label.toLowerCase().includes(q) ||
        row.summary.toLowerCase().includes(q) ||
        row.id.toLowerCase().includes(q) ||
        (row.relativePath?.toLowerCase().includes(q) ?? false) ||
        (row.cubemapSetId?.toLowerCase().includes(q) ?? false) ||
        (row.cubemapFaceBasePath?.toLowerCase().includes(q) ?? false) ||
        (row.externalUrl?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [category, descriptors, query, sourceFilter]);

  const sortedFiltered = useMemo(() => {
    if (sortBy === "label") {
      return [...filtered].sort((a, b) => a.label.localeCompare(b.label));
    }
    const inRecent: typeof filtered = [];
    const seen = new Set<string>();
    for (const id of recentIds) {
      const row = filtered.find((r) => r.id === id);
      if (row != null && !seen.has(row.id)) {
        inRecent.push(row);
        seen.add(row.id);
      }
    }
    const rest = filtered.filter((r) => !seen.has(r.id)).sort((a, b) => a.label.localeCompare(b.label));
    return [...inRecent, ...rest];
  }, [filtered, recentIds, sortBy]);

  const selected = useMemo(
    () => descriptors.find((a) => a.id === selectedId) ?? null,
    [descriptors, selectedId],
  );

  const resolved = useMemo(() => (selected != null ? resolveStudioAsset(selected) : null), [selected]);

  /** Prefer `primaryUrl`; if empty but cubemap faces exist, show first face (avoids blank Resolved URL row). */
  const displayResolvedUrl = useMemo(() => {
    if (resolved == null) {
      return "";
    }
    const p = resolved.primaryUrl.trim();
    if (p.length > 0) {
      return resolved.primaryUrl;
    }
    const fromFace = resolved.cubemapFaceUrls?.find((u) => u.trim().length > 0);
    return fromFace?.trim() ?? "";
  }, [resolved]);

  useEffect(() => {
    if (sortedFiltered.some((f) => f.id === selectedId)) {
      return;
    }
    setSelectedId(sortedFiltered[0]?.id ?? null);
  }, [sortedFiltered, selectedId]);

  const copyPrimaryUrl = useCallback(async () => {
    if (displayResolvedUrl.length === 0) {
      return;
    }
    try {
      await navigator.clipboard.writeText(displayResolvedUrl);
      setCopyState("ok");
      window.setTimeout(() => setCopyState("idle"), 1600);
    } catch {
      setCopyState("err");
      window.setTimeout(() => setCopyState("idle"), 2200);
    }
  }, [displayResolvedUrl]);

  const copyStableId = useCallback(async () => {
    if (selected == null || selected.id.length === 0) {
      return;
    }
    try {
      await navigator.clipboard.writeText(selected.id);
      setCopyIdState("ok");
      window.setTimeout(() => setCopyIdState("idle"), 1600);
    } catch {
      setCopyIdState("err");
      window.setTimeout(() => setCopyIdState("idle"), 2200);
    }
  }, [selected]);

  const setSortMode = useCallback((mode: StudioAssetBrowserSortBy) => {
    writeStudioAssetBrowserSortBy(mode);
    setSortBy(mode);
  }, []);

  return (
    <section
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg ring-1 ring-zinc-800/80"
      style={{ borderColor, backgroundColor: panelColor }}
    >
      <div className="shrink-0 border-b border-zinc-800/90 px-3 pb-2 pt-3" style={{ borderColor }}>
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Layers className="size-4 text-cyan-400/90" aria-hidden />
            <h2 className="text-sm font-semibold tracking-tight text-zinc-100">Asset Browser</h2>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() =>
                openAssetManager({
                  globalDirectoriesTab: "overview",
                })
              }
              className="rounded-md p-1 text-zinc-500 transition-colors hover:bg-zinc-800/80 hover:text-cyan-300/90"
              title="Open Asset Manager (disk paths, runtime bases, loaders)"
              aria-label="Open Asset Manager"
            >
              <FolderOpen className="size-3.5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => bumpRefresh()}
              className="rounded-md p-1 text-zinc-500 transition-colors hover:bg-zinc-800/80 hover:text-zinc-200"
              title="Reload manifest overlay and catalog (including downloaded models)"
              aria-label="Reload asset list"
            >
              <RefreshCw className="size-3.5" aria-hidden />
            </button>
            <span className="rounded-full bg-zinc-800/80 px-2 py-0.5 text-[10px] font-medium tabular-nums text-zinc-400">
              {sortedFiltered.length}
            </span>
          </div>
        </div>

        <div className="mb-2 flex gap-0.5 rounded-lg bg-zinc-950/50 p-0.5 ring-1 ring-zinc-800/80">
          {CATEGORY_TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setCategory(id);
                setQuery("");
                setSourceFilter("all");
              }}
              className={`flex flex-1 items-center justify-center gap-1 rounded-md px-1.5 py-1.5 text-[10px] font-medium transition-colors sm:text-[11px] ${
                category === id ? "bg-zinc-800 text-zinc-100 shadow-sm" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Icon className="size-3 shrink-0 opacity-80" aria-hidden />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </div>

        <div className="relative">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-500"
            aria-hidden
          />
          <input
            type="search"
            placeholder="Filter by name, id, or path…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-lg border border-zinc-700/80 bg-zinc-950/60 py-1.5 pl-8 pr-2 text-[11px] outline-none placeholder:text-zinc-600 focus:border-cyan-500/45 focus:ring-1 focus:ring-cyan-500/25"
            style={{ borderColor }}
            aria-label="Filter assets"
          />
        </div>

        <div className="mt-2 flex items-center gap-2">
          <label htmlFor="asset-browser-source" className="shrink-0 text-[10px] font-medium text-zinc-500">
            Source
          </label>
          <select
            id="asset-browser-source"
            value={sourceFilter}
            onChange={(e) => setSourceFilter(parseSourceFilterValue(e.target.value))}
            className="min-w-0 flex-1 rounded-md border border-zinc-700/80 bg-zinc-950/60 py-1 pl-2 pr-7 text-[10px] text-zinc-200 outline-none focus:border-cyan-500/45 focus:ring-1 focus:ring-cyan-500/25"
            style={{ borderColor }}
            aria-label="Filter by asset source"
          >
            <option value="all">All sources</option>
            <option value="bundled">Bundled</option>
            <option value="pack">Pack</option>
            <option value="downloaded">Downloaded</option>
            <option value="external">External</option>
          </select>
        </div>

        <div className="mt-2 flex gap-0.5">
          <button
            type="button"
            onClick={() => setSortMode("label")}
            className={`flex flex-1 items-center justify-center gap-1 rounded-md border px-1.5 py-1 text-[10px] font-medium transition-colors ${
              sortBy === "label"
                ? "border-cyan-500/40 bg-cyan-950/20 text-cyan-100"
                : "border-zinc-800/80 bg-zinc-950/40 text-zinc-500 hover:text-zinc-300"
            }`}
            style={{ borderColor: sortBy === "label" ? undefined : borderColor }}
            title="Sort alphabetically by label"
          >
            <ArrowDownAZ className="size-3 shrink-0 opacity-80" aria-hidden />
            A–Z
          </button>
          <button
            type="button"
            onClick={() => setSortMode("recent")}
            className={`flex flex-1 items-center justify-center gap-1 rounded-md border px-1.5 py-1 text-[10px] font-medium transition-colors ${
              sortBy === "recent"
                ? "border-cyan-500/40 bg-cyan-950/20 text-cyan-100"
                : "border-zinc-800/80 bg-zinc-950/40 text-zinc-500 hover:text-zinc-300"
            }`}
            style={{ borderColor: sortBy === "recent" ? undefined : borderColor }}
            title="Recent picks in this category first (then A–Z)"
          >
            <Clock className="size-3 shrink-0 opacity-80" aria-hidden />
            Recent
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden px-2 py-2">
        <div className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain pr-0.5">
          {sortedFiltered.length === 0 ? (
            <div className="py-8 text-center text-[11px] text-zinc-500">
              No assets in this category match the search or source filter.
            </div>
          ) : (
            sortedFiltered.map((row) => {
              const active = row.id === selectedId;
              const canDragToFlow = category === "model";
              return (
                <button
                  key={row.id}
                  type="button"
                  draggable={canDragToFlow}
                  onDragStart={(e: DragEvent<HTMLButtonElement>) => {
                    if (!canDragToFlow) {
                      return;
                    }
                    setStudioAssetDragData(e.dataTransfer, {
                      studioAssetId: row.id,
                      label: row.label,
                    });
                  }}
                  onClick={() => {
                    recordStudioAssetRecentPick(row.id);
                    setRecentIds(readRecentStudioAssetIds());
                    setSelectedId(row.id);
                  }}
                  className={`flex w-full flex-col gap-0.5 rounded-lg border px-2 py-1.5 text-left transition-colors ${
                    canDragToFlow ? "cursor-grab active:cursor-grabbing" : ""
                  } ${
                    active ? "border-cyan-500/45 bg-cyan-950/25" : "border-zinc-700/60 bg-zinc-900/30 hover:bg-zinc-800/40"
                  }`}
                  style={{ borderColor: active ? undefined : borderColor }}
                  title={
                    canDragToFlow
                      ? "Drag onto the flow canvas to add a Studio Model node"
                      : undefined
                  }
                >
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-[12px] font-medium text-zinc-100">{row.label}</span>
                    <span
                      className={`shrink-0 rounded border px-1 py-px text-[8px] font-semibold uppercase tracking-wide ${studioAssetSourceBadgeClasses(row.source)}`}
                    >
                      {row.source}
                    </span>
                  </div>
                  <div className="line-clamp-2 text-[10px] leading-snug text-zinc-500">{row.summary}</div>
                  <div className="truncate font-mono text-[9px] text-zinc-600">{row.id}</div>
                </button>
              );
            })
          )}
        </div>

        <div
          className="shrink-0 space-y-1.5 rounded-lg border border-zinc-800/90 bg-zinc-950/40 p-2"
          style={{ borderColor }}
        >
          {category === "environment" && selected != null && resolved != null ? (
            <>
              <AssetBrowserEnvironmentPreview
                faceUrls={resolved.cubemapFaceUrls}
                primaryUrl={displayResolvedUrl.length > 0 ? displayResolvedUrl : resolved.primaryUrl}
              />
              {resolved.cubemapFaceUrls != null && resolved.cubemapFaceUrls.length === 6 ? (
                <p className="text-[9px] leading-snug text-zinc-500">
                  <span className="font-medium text-zinc-400">No load</span> means the JPEG request failed (
                  <span className="text-zinc-400">404</span> or blocked). Put faces under{" "}
                  <span className="font-mono text-zinc-500">src/assets/textures/cubemap/…</span> (
                  <span className="font-mono text-zinc-500">npm run sync:studio-cubemap-assets</span>
                  ), then rebuild the webview (<span className="font-mono text-zinc-500">npm run compile</span> or
                  dev). In the extension webview, cubemap URLs prefer bundled{" "}
                  <span className="font-mono text-zinc-500">out/webview/assets</span> over the free-pack mirror.
                </p>
              ) : null}
            </>
          ) : null}
          <TRNMenuSectionTitle spacing="labelOnly">Resolved URL</TRNMenuSectionTitle>
          {selected == null || resolved == null || displayResolvedUrl.length === 0 ? (
            <div className="text-[10px] text-zinc-600">Select an asset to preview the resolved URL.</div>
          ) : (
            <>
              <div className="max-h-16 overflow-y-auto break-all rounded border border-zinc-800/80 bg-black/30 px-1.5 py-1 font-mono text-[9px] leading-snug text-cyan-100/90">
                {displayResolvedUrl}
              </div>
              {resolved.cubemapFaceUrls != null ? (
                <div className="flex items-start gap-1 text-[9px] leading-snug text-zinc-500">
                  <Globe className="mt-0.5 size-3 shrink-0 text-zinc-500" aria-hidden />
                  <span>Cubemap: six faces resolved; primary is +X face for quick copy / checks.</span>
                </div>
              ) : null}
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => void copyPrimaryUrl()}
                  className="inline-flex items-center gap-1 rounded border border-zinc-600 bg-zinc-800/80 px-2 py-1 text-[10px] font-medium text-zinc-200 hover:bg-zinc-700/90"
                >
                  <Copy className="size-3" aria-hidden />
                  Copy URL
                </button>
                <button
                  type="button"
                  onClick={() => void copyStableId()}
                  className="inline-flex items-center gap-1 rounded border border-zinc-600 bg-zinc-800/80 px-2 py-1 text-[10px] font-medium text-zinc-200 hover:bg-zinc-700/90"
                >
                  <Hash className="size-3" aria-hidden />
                  Copy id
                </button>
                {copyState === "ok" ? <span className="self-center text-[10px] text-emerald-400">Copied URL</span> : null}
                {copyIdState === "ok" ? <span className="self-center text-[10px] text-emerald-400">Copied id</span> : null}
                {copyState === "err" ? (
                  <span className="self-center text-[10px] text-amber-400">URL copy blocked</span>
                ) : null}
                {copyIdState === "err" ? (
                  <span className="self-center text-[10px] text-amber-400">Id copy blocked</span>
                ) : null}
              </div>
              <div className="flex items-start gap-1 text-[9px] leading-snug text-zinc-600">
                <Package className="mt-0.5 size-3 shrink-0" aria-hidden />
                <span>
                  Persist <span className="font-mono text-zinc-500">{selected.id}</span> in configs — resolve at runtime
                  with the same rules as Model / Free pack paths.
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
