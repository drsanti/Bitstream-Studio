import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import { useReactFlow } from "@xyflow/react";
import {
  Activity,
  Box,
  ChevronRight,
  Clock,
  Clapperboard,
  Database,
  GitCompare,
  Hand,
  LayoutGrid,
  Mic,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Wrench,
  Plus,
  Search,
} from "lucide-react";
import type { NodeCatalogEntry } from "../../../core/config/config-types";
import { filterPaletteEntries } from "./node-palette/filter-palette-entries";
import { listAddableCatalogEntries } from "./node-palette/list-addable-catalog-entries";
import {
  groupEntriesByDisplayGroup,
  PALETTE_DISPLAY_GROUP_LABEL,
  PALETTE_DISPLAY_GROUP_ORDER,
  type PaletteDisplayGroup,
  resolvePaletteDisplayGroup,
} from "./node-palette/palette-display-meta";
import { PALETTE_CATEGORY_LABEL } from "./node-palette/palette-category-meta";
import { PaletteCatalogIcon } from "./node-palette/PaletteCatalogIcon";
import {
  clearRecentCatalogNodeIds,
  pushRecentCatalogNodeId,
  readRecentCatalogNodeIds,
  resolveRecentCatalogEntries,
} from "../keyboard/recent-catalog-nodes";

import type { LayoutMenuEntryId } from "../layout/layout-flow-nodes.types";
import {
  FLOW_LAYOUT_MENU_LAYOUT,
  LAYOUT_MENU_ENTRIES,
} from "../layout/layout-flow-menu-entries";

export type FlowAddNodeMenuProps = {
  clientX: number;
  clientY: number;
  entries: readonly NodeCatalogEntry[];
  /** Shown under search during smart connect (compatible / fallback / full catalog). */
  bannerHint?: string;
  bannerHintTone?: "info" | "warn";
  /** Smart connect: reorder browse groups (e.g. Output before Layout). */
  browseGroupPrefs?: {
    catalogGroupOrder: readonly PaletteDisplayGroup[];
    layoutGroupLast: boolean;
  };
  categoryColors: Record<NodeCatalogEntry["category"], string>;
  onPickEntry: (
    entry: NodeCatalogEntry,
    flowPosition: { x: number; y: number },
  ) => void;
  onPickLayoutEntry?: (
    kind: LayoutMenuEntryId,
    flowPosition: { x: number; y: number },
  ) => void;
  onClose: () => void;
};

type MenuBrowseGroup = PaletteDisplayGroup | typeof FLOW_LAYOUT_MENU_LAYOUT;

const DISPLAY_GROUP_SCHEMA_COLOR: Record<
  PaletteDisplayGroup,
  NodeCatalogEntry["category"]
> = {
  input: "input",
  audio: "audio",
  data: "sensor",
  transform: "transform",
  logic: "logic",
  output: "output",
  scene: "utility",
  animation: "generator",
  events: "utility",
  utilities: "utility",
};

const DISPLAY_GROUP_ICON: Record<
  PaletteDisplayGroup,
  React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>
> = {
  input: Hand,
  audio: Mic,
  data: Database,
  transform: SlidersHorizontal,
  logic: GitCompare,
  output: Activity,
  scene: Box,
  animation: Clapperboard,
  events: Sparkles,
  utilities: Wrench,
};

function BrowseGroupIcon(props: {
  group: MenuBrowseGroup;
  className?: string;
  style?: CSSProperties;
}) {
  const { group, className } = props;
  if (group === FLOW_LAYOUT_MENU_LAYOUT) {
    return <LayoutGrid className={className} style={props.style} aria-hidden />;
  }
  const Icon = DISPLAY_GROUP_ICON[group];
  return <Icon className={className} style={props.style} aria-hidden />;
}

function clampMenuPosition(
  clientX: number,
  clientY: number,
  menuWidth: number,
  menuHeight: number,
) {
  const pad = 8;
  const maxLeft = Math.max(pad, window.innerWidth - menuWidth - pad);
  const maxTop = Math.max(pad, window.innerHeight - menuHeight - pad);
  return {
    left: Math.min(Math.max(pad, clientX), maxLeft),
    top: Math.min(Math.max(pad, clientY), maxTop),
  };
}

export function FlowAddNodeMenu(props: FlowAddNodeMenuProps) {
  const {
    clientX,
    clientY,
    entries,
    bannerHint,
    bannerHintTone = "warn",
    browseGroupPrefs,
    categoryColors,
    onPickEntry,
    onPickLayoutEntry,
    onClose,
  } = props;
  const { screenToFlowPosition } = useReactFlow();
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [hoveredGroup, setHoveredGroup] = useState<MenuBrowseGroup | null>(
    null,
  );
  const [recentIds, setRecentIds] = useState(() => readRecentCatalogNodeIds());

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (target != null && containerRef.current?.contains(target)) {
        return;
      }
      onClose();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown, true);
    };
  }, [onClose]);

  const addable = useMemo(() => listAddableCatalogEntries(entries), [entries]);

  const recentEntries = useMemo(
    () => resolveRecentCatalogEntries(recentIds, addable),
    [addable, recentIds],
  );

  const displayGroupMap = useMemo(
    () => groupEntriesByDisplayGroup(addable),
    [addable],
  );

  const orderedDisplayGroups = useMemo(() => {
    const order = browseGroupPrefs?.catalogGroupOrder ?? PALETTE_DISPLAY_GROUP_ORDER;
    return order.filter((g) => (displayGroupMap.get(g)?.length ?? 0) > 0);
  }, [browseGroupPrefs?.catalogGroupOrder, displayGroupMap]);

  const orderedBrowseGroups = useMemo((): MenuBrowseGroup[] => {
    const layoutLast = browseGroupPrefs?.layoutGroupLast === true;
    const catalogGroups = orderedDisplayGroups;
    if (layoutLast) {
      return [...catalogGroups, FLOW_LAYOUT_MENU_LAYOUT];
    }
    return [FLOW_LAYOUT_MENU_LAYOUT, ...catalogGroups];
  }, [browseGroupPrefs?.layoutGroupLast, orderedDisplayGroups]);

  const activeGroup = hoveredGroup ?? orderedBrowseGroups[0] ?? null;

  const isSearching = search.trim().length > 0;
  const searchResults = useMemo(() => {
    if (!isSearching) {
      return {
        catalogMatches: [] as NodeCatalogEntry[],
        layoutMatches: [] as typeof LAYOUT_MENU_ENTRIES,
      };
    }
    const catalogMatches = filterPaletteEntries(addable, search);
    const q = search.trim().toLowerCase();
    const layoutMatches = LAYOUT_MENU_ENTRIES.filter(
      (entry) =>
        entry.title.toLowerCase().includes(q) ||
        entry.description.toLowerCase().includes(q),
    );
    return { catalogMatches, layoutMatches };
  }, [addable, isSearching, search]);

  const spawnEntry = useCallback(
    (entry: NodeCatalogEntry) => {
      pushRecentCatalogNodeId(entry.id);
      setRecentIds(readRecentCatalogNodeIds());
      const flowPosition = screenToFlowPosition({ x: clientX, y: clientY });
      onPickEntry(entry, flowPosition);
      onClose();
    },
    [clientX, clientY, onClose, onPickEntry, screenToFlowPosition],
  );

  const displayGroupColor = useCallback(
    (group: PaletteDisplayGroup) => {
      const schema = DISPLAY_GROUP_SCHEMA_COLOR[group];
      return categoryColors[schema] ?? "#71717a";
    },
    [categoryColors],
  );

  const spawnLayoutEntry = useCallback(
    (kind: LayoutMenuEntryId) => {
      if (onPickLayoutEntry == null) {
        return;
      }
      const flowPosition = screenToFlowPosition({ x: clientX, y: clientY });
      onPickLayoutEntry(kind, flowPosition);
      onClose();
    },
    [clientX, clientY, onClose, onPickLayoutEntry, screenToFlowPosition],
  );

  const browseGroupColor = useCallback(
    (group: MenuBrowseGroup) => {
      if (group === FLOW_LAYOUT_MENU_LAYOUT) {
        return "#6b7280";
      }
      return displayGroupColor(group);
    },
    [displayGroupColor],
  );

  const browseGroupLabel = (group: MenuBrowseGroup) =>
    group === FLOW_LAYOUT_MENU_LAYOUT
      ? "Layout"
      : PALETTE_DISPLAY_GROUP_LABEL[group];

  const { left, top } = clampMenuPosition(
    clientX,
    clientY,
    isSearching ? 280 : 480,
    420,
  );
  const submenuAccent =
    activeGroup != null ? browseGroupColor(activeGroup) : "#71717a";

  const menu = (
    <div
      ref={containerRef}
      className="fixed z-2000 flex animate-in fade-in zoom-in-95 duration-100"
      style={{ left, top }}
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-label="Add node"
    >
      <div className="flex w-56 flex-col overflow-hidden rounded-md border border-zinc-600/80 bg-zinc-950/95 shadow-2xl shadow-black/80 backdrop-blur-md">
        <div className="border-b border-zinc-700/80 px-3 pt-3 pb-2.5">
          <div className="mb-2.5 flex items-center gap-1.5">
            <Plus size={12} className="text-zinc-400" aria-hidden />
            <span className="text-[12px] font-medium text-zinc-100">
              Add node
            </span>
            <span className="ml-auto text-[9px] font-normal text-zinc-500">
              Shift+A
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-zinc-700/70 bg-zinc-900/80 px-2.5 py-1.5">
            <Search size={11} className="shrink-0 text-zinc-500" aria-hidden />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="min-w-0 flex-1 bg-transparent text-[11px] text-zinc-100 outline-none placeholder:text-zinc-500"
            />
          </div>
          {bannerHint != null && bannerHint.length > 0 ? (
            <p
              className={
                bannerHintTone === "info"
                  ? "mt-2 text-[10px] leading-snug text-cyan-200/90"
                  : "mt-2 text-[10px] leading-snug text-amber-200/90"
              }
            >
              {bannerHint}
            </p>
          ) : null}
        </div>

        {isSearching ? (
          <div className="scrollbar-hide max-h-[min(60vh,420px)] overflow-y-auto py-1">
            {searchResults.catalogMatches.length === 0 &&
            searchResults.layoutMatches.length === 0 ? (
              <div className="px-4 py-6 text-center text-[10px] text-zinc-500">
                No nodes found
              </div>
            ) : (
              <>
                {searchResults.layoutMatches.map((entry) => (
                  <LayoutMenuRow
                    key={entry.id}
                    entry={entry}
                    onPick={() => spawnLayoutEntry(entry.id)}
                  />
                ))}
                {searchResults.catalogMatches.map((entry) => (
                  <AddNodeMenuRow
                    key={entry.id}
                    entry={entry}
                    groupLabel={
                      PALETTE_DISPLAY_GROUP_LABEL[
                        resolvePaletteDisplayGroup(entry)
                      ]
                    }
                    categoryColors={categoryColors}
                    onPick={() => spawnEntry(entry)}
                  />
                ))}
              </>
            )}
          </div>
        ) : (
          <div className="scrollbar-hide max-h-[min(60vh,420px)] overflow-y-auto py-1">
            {recentEntries.length > 0 ? (
              <div className="mb-1 border-b border-zinc-800/80 pb-1">
                <div className="flex items-center justify-between gap-2 px-3 py-1 text-[9px] font-semibold uppercase tracking-wider text-zinc-500">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <Clock size={10} aria-hidden />
                    <span className="truncate">Recent</span>
                  </div>
                  <button
                    type="button"
                    className="inline-flex size-5 shrink-0 items-center justify-center rounded border border-transparent text-zinc-500 transition-colors hover:border-zinc-700/70 hover:bg-zinc-900/60 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/35"
                    aria-label="Clear recent nodes"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      clearRecentCatalogNodeIds();
                      setRecentIds([]);
                    }}
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </button>
                </div>
                {recentEntries.map((entry) => (
                  <AddNodeMenuRow
                    key={`recent-${entry.id}`}
                    entry={entry}
                    compact
                    categoryColors={categoryColors}
                    onPick={() => spawnEntry(entry)}
                  />
                ))}
              </div>
            ) : null}
            {orderedBrowseGroups.map((group) => {
              const isActive = group === activeGroup;
              const color = browseGroupColor(group);
              return (
                <button
                  key={group}
                  type="button"
                  onMouseEnter={() => setHoveredGroup(group)}
                  onFocus={() => setHoveredGroup(group)}
                  className={
                    isActive
                      ? "flex w-full items-center gap-2.5 px-3 py-[7px] text-[12px] font-medium text-zinc-100 transition-colors"
                      : "flex w-full items-center gap-2.5 px-3 py-[7px] text-[12px] font-medium text-zinc-400 transition-colors hover:text-zinc-100"
                  }
                >
                  <BrowseGroupIcon
                    group={group}
                    className={
                      isActive
                        ? "size-3.5 shrink-0"
                        : "size-3.5 shrink-0 opacity-80"
                    }
                    style={{ color } as any}
                  />
                  <span className="flex-1 text-left">
                    {browseGroupLabel(group)}
                  </span>
                  <ChevronRight
                    size={11}
                    className={isActive ? "opacity-60" : "opacity-25"}
                    aria-hidden
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {!isSearching && activeGroup != null ? (
        <div
          className="ml-0.5 flex w-52 flex-col overflow-hidden rounded-md border border-zinc-600/80 bg-zinc-950/95 shadow-2xl shadow-black/80 backdrop-blur-md animate-in fade-in slide-in-from-left-1 duration-100"
          style={{ borderLeftWidth: 3, borderLeftColor: submenuAccent }}
        >
          <div
            className="border-b border-zinc-700/80 px-3 py-2 text-[12px] font-medium text-zinc-100"
            style={{ color: submenuAccent }}
          >
            {browseGroupLabel(activeGroup)}
          </div>
          <div className="scrollbar-hide flex max-h-[min(60vh,420px)] flex-col gap-0.5 overflow-y-auto p-1.5">
            {activeGroup === FLOW_LAYOUT_MENU_LAYOUT
              ? LAYOUT_MENU_ENTRIES.map((entry) => (
                  <LayoutMenuRow
                    key={entry.id}
                    entry={entry}
                    compact
                    onPick={() => spawnLayoutEntry(entry.id)}
                  />
                ))
              : (displayGroupMap.get(activeGroup) ?? []).map((entry) => (
                  <AddNodeMenuRow
                    key={entry.id}
                    entry={entry}
                    compact
                    categoryColors={categoryColors}
                    onPick={() => spawnEntry(entry)}
                  />
                ))}
          </div>
        </div>
      ) : null}
    </div>
  );

  return createPortal(menu, document.body);
}

function AddNodeMenuRow(props: {
  entry: NodeCatalogEntry;
  onPick: () => void;
  compact?: boolean;
  groupLabel?: string;
  categoryColors?: Record<NodeCatalogEntry["category"], string>;
}) {
  const { entry, onPick, compact = false, groupLabel, categoryColors } = props;
  const accent = categoryColors?.[entry.category] ?? null;
  return (
    <button
      type="button"
      onClick={onPick}
      className={
        compact
          ? "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[11px] font-medium text-zinc-200 transition-colors hover:bg-zinc-800/80"
          : "flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-[11px] font-medium text-zinc-200 transition-colors hover:bg-zinc-800/80"
      }
    >
      <PaletteCatalogIcon
        icon={entry.icon}
        className="size-3.5 shrink-0"
        style={accent != null ? ({ color: accent } as any) : undefined}
      />
      <span className="min-w-0 flex-1 truncate">{entry.title}</span>
      {!compact && groupLabel != null ? (
        <span className="shrink-0 text-[9px] font-normal text-zinc-500">
          {groupLabel}
        </span>
      ) : !compact ? (
        <span className="shrink-0 text-[9px] font-normal text-zinc-500">
          {PALETTE_CATEGORY_LABEL[entry.category]}
        </span>
      ) : null}
    </button>
  );
}

function LayoutMenuRow(props: {
  entry: (typeof LAYOUT_MENU_ENTRIES)[number];
  onPick: () => void;
  compact?: boolean;
}) {
  const { entry, onPick, compact = false } = props;
  const Icon = entry.icon;
  return (
    <button
      type="button"
      onClick={onPick}
      className={
        compact
          ? "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[11px] font-medium text-zinc-200 transition-colors hover:bg-zinc-800/80"
          : "flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-[11px] font-medium text-zinc-200 transition-colors hover:bg-zinc-800/80"
      }
    >
      <Icon className="size-3.5 shrink-0 text-zinc-400" aria-hidden />
      <span className="min-w-0 flex-1 truncate">{entry.title}</span>
      {entry.shortcut != null ? (
        <span className="shrink-0 text-[9px] font-normal text-zinc-500">
          {entry.shortcut}
        </span>
      ) : null}
    </button>
  );
}
