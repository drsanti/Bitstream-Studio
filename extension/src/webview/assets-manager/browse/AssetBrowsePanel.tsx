import type { DragEvent, LucideIcon } from "lucide-react";
import {
  ArrowDownAZ,
  Box,
  Clock,
  ExternalLink,
  Image as ImageIcon,
  Map as MapIcon,
  MonitorPlay,
  Clapperboard,
  RefreshCw,
  ScanEye,
  Search,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ternionFreeAssetPackCopy } from "../../asset-bootstrap/ternionFreeAssetPackCopy.js";
import type { AssetCategory } from "../registry/asset.types.js";
import { resolveAsset } from "../registry/resolveAsset.js";
import { useAssetRegistry } from "../registry/AssetRegistryProvider.js";
import {
  animationLabModelIdFromAssetDescriptor,
  openAnimationLabForAssetDescriptor,
} from "../../bitstream-app/components/animation-lab/open-animation-lab-from-catalog.js";
import { TRNButton, TRNHintText } from "../../ui/TRN/index.js";
import { useOpenAssetManager } from "../hooks/useOpenAssetManager.js";
import { AssetBrowseEnvironmentPreview } from "./AssetBrowseEnvironmentPreview.js";
import { assetSourceBadgeClasses } from "./asset-source-badge.js";
import { assetSourceLabel } from "./asset-source-label.js";
import {
  readRecentStudioAssetIds,
  readStudioAssetBrowserSortBy,
  recordStudioAssetRecentPick,
  writeStudioAssetBrowserSortBy,
  type StudioAssetBrowserSortBy,
} from "./asset-browser-recent.js";
import { setStudioAssetDragData } from "./asset-drag.js";
import { ModelPreviewModal } from "../../model-catalog/ModelPreviewModal.js";
import { AssetBrowseVisionPackPanel } from "./AssetBrowseVisionPackPanel.js";

export type AssetBrowsePanelProps = {
  borderColor: string;
  panelColor: string;
  /** Embedded in workbench — hides duplicate title chrome. */
  variant?: "default" | "embedded";
  /** When set, show a link to open the full Asset Manager window. */
  showOpenManagerLink?: boolean;
  /** Initial category tab (updated when parent remounts with new key). */
  initialCategory?: AssetCategory;
};

const CATEGORY_TABS: { id: AssetCategory; label: string; Icon: LucideIcon }[] = [
  { id: "model", label: "Models", Icon: Box },
  { id: "environment", label: "Environments", Icon: MapIcon },
  { id: "texture", label: "Textures", Icon: ImageIcon },
  { id: "library", label: "Libraries", Icon: ScanEye },
];

export function AssetBrowsePanel(props: AssetBrowsePanelProps) {
  const { borderColor, panelColor, variant = "default", showOpenManagerLink = false, initialCategory = "model" } = props;
  const embedded = variant === "embedded";
  const { descriptors, catalogModelEntries, bumpRefresh } = useAssetRegistry();
  const { openAssetManager } = useOpenAssetManager();
  const [category, setCategory] = useState<AssetCategory>(initialCategory);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [recentIds, setRecentIds] = useState(() => readRecentStudioAssetIds());
  const [sortBy, setSortBy] = useState<StudioAssetBrowserSortBy>(() => readStudioAssetBrowserSortBy());
  const [modelPreviewOpen, setModelPreviewOpen] = useState(false);

  useEffect(() => {
    setCategory(initialCategory);
  }, [initialCategory]);

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
      if (q.length === 0) {
        return true;
      }
      return (
        row.label.toLowerCase().includes(q) ||
        row.summary.toLowerCase().includes(q) ||
        row.id.toLowerCase().includes(q)
      );
    });
  }, [category, descriptors, query]);

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

  const resolved = useMemo(() => (selected != null ? resolveAsset(selected) : null), [selected]);

  const animationLabCatalogModelId = useMemo(() => {
    if (selected == null) {
      return null;
    }
    return animationLabModelIdFromAssetDescriptor(selected, catalogModelEntries);
  }, [selected, catalogModelEntries]);

  useEffect(() => {
    if (sortedFiltered.some((f) => f.id === selectedId)) {
      return;
    }
    setSelectedId(sortedFiltered[0]?.id ?? null);
  }, [sortedFiltered, selectedId]);

  const setSortMode = useCallback((mode: StudioAssetBrowserSortBy) => {
    writeStudioAssetBrowserSortBy(mode);
    setSortBy(mode);
  }, []);

  const openFullManager = useCallback(() => {
    openAssetManager({ mainTab: "browse", browseCategory: category });
  }, [openAssetManager, category]);

  return (
    <section
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg ring-1 ring-zinc-800/80"
      style={{ borderColor, backgroundColor: panelColor }}
    >
      <div
        className={`shrink-0 border-b border-zinc-800/90 px-3 ${embedded ? "pb-1.5 pt-1.5" : "pb-2 pt-3"}`}
        style={{ borderColor }}
      >
        {!embedded ? (
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold tracking-tight text-zinc-100">Browse assets</h2>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => bumpRefresh()}
                className="rounded-md p-1 text-zinc-500 transition-colors hover:bg-zinc-800/80 hover:text-zinc-200"
                title="Refresh asset list"
                aria-label="Refresh asset list"
              >
                <RefreshCw className="size-3.5" aria-hidden />
              </button>
              <span className="rounded-full bg-zinc-800/80 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                {sortedFiltered.length}
              </span>
            </div>
          </div>
        ) : (
          <div className="mb-1.5 flex items-center justify-end gap-1">
            {showOpenManagerLink ? (
              <button
                type="button"
                onClick={openFullManager}
                className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-cyan-300/90 hover:bg-zinc-800/60"
                title="Open Asset Manager"
              >
                <ExternalLink className="size-3 shrink-0" aria-hidden />
                Asset Manager
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => bumpRefresh()}
              className="rounded-md p-1 text-zinc-500 hover:text-zinc-200"
              aria-label="Refresh"
            >
              <RefreshCw className="size-3.5" aria-hidden />
            </button>
            <span className="text-[10px] text-zinc-500">{sortedFiltered.length}</span>
          </div>
        )}

        <div
          role="tablist"
          aria-label="Asset categories"
          className="mb-2 flex gap-0.5 rounded-lg bg-zinc-950/50 p-0.5 ring-1 ring-zinc-800/80"
        >
          {CATEGORY_TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={category === id}
              onClick={() => {
                setCategory(id);
                setQuery("");
              }}
              className={`flex flex-1 items-center justify-center gap-1 rounded-md px-1 py-1.5 text-[10px] font-medium transition-colors sm:text-[11px] ${
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
            placeholder="Search by name…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-lg border border-zinc-700/80 bg-zinc-950/60 py-1.5 pl-8 pr-2 text-[11px] outline-none placeholder:text-zinc-600 focus:border-cyan-500/45 focus:ring-1 focus:ring-cyan-500/25"
            style={{ borderColor }}
            aria-label="Search assets"
          />
        </div>

        <div className="mt-1.5 flex gap-0.5">
          <button
            type="button"
            onClick={() => setSortMode("label")}
            className={`flex flex-1 items-center justify-center gap-1 rounded-md border px-1 py-1 text-[10px] font-medium ${
              sortBy === "label"
                ? "border-cyan-500/40 bg-cyan-950/20 text-cyan-100"
                : "border-zinc-800/80 bg-zinc-950/40 text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <ArrowDownAZ className="size-3 shrink-0" aria-hidden />
            A–Z
          </button>
          <button
            type="button"
            onClick={() => setSortMode("recent")}
            className={`flex flex-1 items-center justify-center gap-1 rounded-md border px-1 py-1 text-[10px] font-medium ${
              sortBy === "recent"
                ? "border-cyan-500/40 bg-cyan-950/20 text-cyan-100"
                : "border-zinc-800/80 bg-zinc-950/40 text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Clock className="size-3 shrink-0" aria-hidden />
            Recent
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-2 py-2">
        <div className="scrollbar-hide min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain pr-0.5">
          {sortedFiltered.length === 0 ? (
            <div className="space-y-2 py-6 text-center">
              <p className="text-[11px] text-zinc-500">
                {query.trim().length > 0
                  ? "No assets match your search."
                  : category === "model"
                    ? ternionFreeAssetPackCopy.assetBrowseEmptyModels
                    : category === "library"
                      ? "No library entries in the manifest."
                      : ternionFreeAssetPackCopy.assetBrowseEmptyOther}
              </p>
              <button
                type="button"
                onClick={() => openAssetManager({ mainTab: "storage", globalDirectoriesTab: "actions" })}
                className="text-[11px] font-medium text-cyan-300/90 hover:text-cyan-200"
              >
                {ternionFreeAssetPackCopy.assetBrowseCta}
              </button>
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
                  title={canDragToFlow ? "Drag onto the flow canvas to add a model" : row.summary}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-[12px] font-medium text-zinc-100">{row.label}</span>
                    <span
                      className={`shrink-0 rounded border px-1 py-px text-[8px] font-semibold tracking-wide ${assetSourceBadgeClasses(row.source)}`}
                    >
                      {assetSourceLabel(row.source)}
                    </span>
                  </div>
                  <div className="truncate text-[10px] leading-snug text-zinc-500">{row.summary}</div>
                </button>
              );
            })
          )}
        </div>

        {selected != null && resolved != null && category === "environment" ? (
          <div
            className="mt-2 shrink-0 rounded-lg border border-zinc-800/90 bg-zinc-950/40 p-2"
            style={{ borderColor }}
          >
            <AssetBrowseEnvironmentPreview
              faceUrls={resolved.cubemapFaceUrls}
              primaryUrl={resolved.primaryUrl}
            />
          </div>
        ) : null}

        {selected != null && category === "library" ? (
          <AssetBrowseVisionPackPanel borderColor={borderColor} />
        ) : null}

        {selected != null && category === "model" ? (
          <div className="mt-2 shrink-0 space-y-1.5">
            {resolved != null && resolved.primaryUrl.length > 0 ? (
              <div className="flex flex-col gap-1">
                <TRNButton
                  type="button"
                  size="compact"
                  className="w-full justify-center gap-1.5"
                  onClick={() => setModelPreviewOpen(true)}
                >
                  <MonitorPlay className="size-3.5 shrink-0" aria-hidden />
                  Preview 3D
                </TRNButton>
                {selected != null && selected.id.startsWith("catalog-model:") ? (
                  <TRNButton
                    type="button"
                    size="compact"
                    className="w-full justify-center gap-1.5"
                    hint="Open this catalog model in the Telemetry GLB Animation Lab workbench."
                    onClick={() => {
                      openAnimationLabForAssetDescriptor(selected, catalogModelEntries);
                    }}
                  >
                    <Clapperboard className="size-3.5 shrink-0" aria-hidden />
                    Animation Lab
                  </TRNButton>
                ) : null}
              </div>
            ) : null}
            <TRNHintText tone="muted" className="text-[10px] leading-snug">
              Drag onto the canvas to add a model node, or pick from the Model node inspector.
            </TRNHintText>
          </div>
        ) : null}
      </div>

      <ModelPreviewModal
        open={modelPreviewOpen}
        onClose={() => setModelPreviewOpen(false)}
        catalogModelId={animationLabCatalogModelId}
        modelUrl={resolved?.primaryUrl ?? null}
        modelName={selected?.label ?? null}
      />
    </section>
  );
}

/** @deprecated Use {@link AssetBrowsePanel}. */
export const AssetBrowserPanel = AssetBrowsePanel;

export type AssetBrowserPanelProps = AssetBrowsePanelProps;
