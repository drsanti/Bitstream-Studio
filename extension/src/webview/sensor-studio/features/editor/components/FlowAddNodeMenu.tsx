import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useReactFlow } from "@xyflow/react";
import { ChevronRight, Plus, Search } from "lucide-react";
import type { NodeCatalogEntry } from "../../../core/config/config-types";
import { filterPaletteEntries } from "./node-palette/filter-palette-entries";
import {
  PALETTE_CATEGORY_LABEL,
  PALETTE_CATEGORY_ORDER,
} from "./node-palette/palette-category-meta";
import { PaletteCatalogIcon } from "./node-palette/PaletteCatalogIcon";

export type FlowAddNodeMenuProps = {
  clientX: number;
  clientY: number;
  entries: readonly NodeCatalogEntry[];
  categoryColors: Record<NodeCatalogEntry["category"], string>;
  onPickEntry: (entry: NodeCatalogEntry, flowPosition: { x: number; y: number }) => void;
  onClose: () => void;
};

function clampMenuPosition(clientX: number, clientY: number, menuWidth: number, menuHeight: number) {
  const pad = 8;
  const maxLeft = Math.max(pad, window.innerWidth - menuWidth - pad);
  const maxTop = Math.max(pad, window.innerHeight - menuHeight - pad);
  return {
    left: Math.min(Math.max(pad, clientX), maxLeft),
    top: Math.min(Math.max(pad, clientY), maxTop),
  };
}

export function FlowAddNodeMenu(props: FlowAddNodeMenuProps) {
  const { clientX, clientY, entries, categoryColors, onPickEntry, onClose } = props;
  const { screenToFlowPosition } = useReactFlow();
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [hoveredCategory, setHoveredCategory] = useState<NodeCatalogEntry["category"] | null>(null);

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

  const addable = useMemo(() => listAddableFromProps(entries), [entries]);

  const categoryMap = useMemo(() => {
    const map = new Map<NodeCatalogEntry["category"], NodeCatalogEntry[]>();
    for (const c of PALETTE_CATEGORY_ORDER) {
      map.set(c, []);
    }
    for (const entry of addable) {
      map.get(entry.category)?.push(entry);
    }
    return map;
  }, [addable]);

  const orderedCategories = useMemo(
    () => PALETTE_CATEGORY_ORDER.filter((c) => (categoryMap.get(c)?.length ?? 0) > 0),
    [categoryMap],
  );

  const activeCategory = hoveredCategory ?? orderedCategories[0] ?? null;

  const isSearching = search.trim().length > 0;
  const searchResults = useMemo(
    () => (isSearching ? filterPaletteEntries(addable, search) : []),
    [addable, isSearching, search],
  );

  const spawnEntry = useCallback(
    (entry: NodeCatalogEntry) => {
      const flowPosition = screenToFlowPosition({ x: clientX, y: clientY });
      onPickEntry(entry, flowPosition);
      onClose();
    },
    [clientX, clientY, onClose, onPickEntry, screenToFlowPosition],
  );

  const { left, top } = clampMenuPosition(clientX, clientY, isSearching ? 280 : 480, 420);
  const submenuAccent =
    activeCategory != null ? (categoryColors[activeCategory] ?? "#71717a") : "#71717a";

  const menu = (
    <div
      ref={containerRef}
      className="fixed z-[2000] flex animate-in fade-in zoom-in-95 duration-100"
      style={{ left, top }}
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-label="Add node"
    >
      <div className="flex w-56 flex-col overflow-hidden rounded-md border border-zinc-600/80 bg-zinc-950/95 shadow-2xl shadow-black/80 backdrop-blur-md">
        <div className="border-b border-zinc-700/80 px-3 pt-3 pb-2.5">
          <div className="mb-2.5 flex items-center gap-1.5">
            <Plus size={12} className="text-zinc-400" aria-hidden />
            <span className="text-[12px] font-medium text-zinc-100">Add node</span>
            <span className="ml-auto text-[9px] font-normal text-zinc-500">Shift+A</span>
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
        </div>

        {isSearching ? (
          <div className="scrollbar-hide max-h-[min(60vh,420px)] overflow-y-auto py-1">
            {searchResults.length === 0 ? (
              <div className="px-4 py-6 text-center text-[10px] text-zinc-500">No nodes found</div>
            ) : (
              searchResults.map((entry) => (
                <AddNodeMenuRow key={entry.id} entry={entry} onPick={() => spawnEntry(entry)} />
              ))
            )}
          </div>
        ) : (
          <div className="scrollbar-hide max-h-[min(60vh,420px)] overflow-y-auto py-1">
            {orderedCategories.map((category) => {
              const isActive = category === activeCategory;
              const color = categoryColors[category] ?? "#71717a";
              return (
                <button
                  key={category}
                  type="button"
                  onMouseEnter={() => setHoveredCategory(category)}
                  onFocus={() => setHoveredCategory(category)}
                  className={
                    isActive
                      ? "flex w-full items-center gap-2.5 px-3 py-[7px] text-[12px] font-medium text-zinc-100 transition-colors"
                      : "flex w-full items-center gap-2.5 px-3 py-[7px] text-[12px] font-medium text-zinc-400 transition-colors hover:text-zinc-100"
                  }
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: color }}
                    aria-hidden
                  />
                  <span className="flex-1 text-left">{PALETTE_CATEGORY_LABEL[category]}</span>
                  <ChevronRight size={11} className={isActive ? "opacity-60" : "opacity-25"} aria-hidden />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {!isSearching && activeCategory != null ? (
        <div
          className="ml-0.5 flex w-52 flex-col overflow-hidden rounded-md border border-zinc-600/80 bg-zinc-950/95 shadow-2xl shadow-black/80 backdrop-blur-md animate-in fade-in slide-in-from-left-1 duration-100"
          style={{ borderLeftWidth: 3, borderLeftColor: submenuAccent }}
        >
          <div
            className="border-b border-zinc-700/80 px-3 py-2 text-[12px] font-medium text-zinc-100"
            style={{ color: submenuAccent }}
          >
            {PALETTE_CATEGORY_LABEL[activeCategory]}
          </div>
          <div className="scrollbar-hide flex max-h-[min(60vh,420px)] flex-col gap-0.5 overflow-y-auto p-1.5">
            {(categoryMap.get(activeCategory) ?? []).map((entry) => (
              <AddNodeMenuRow key={entry.id} entry={entry} onPick={() => spawnEntry(entry)} compact />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );

  return createPortal(menu, document.body);
}

function listAddableFromProps(entries: readonly NodeCatalogEntry[]): NodeCatalogEntry[] {
  return entries.filter((e) => e.defaultVisible !== false);
}

function AddNodeMenuRow(props: {
  entry: NodeCatalogEntry;
  onPick: () => void;
  compact?: boolean;
}) {
  const { entry, onPick, compact = false } = props;
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
      <PaletteCatalogIcon icon={entry.icon} className="size-3.5 shrink-0 text-zinc-400" />
      <span className="min-w-0 flex-1 truncate">{entry.title}</span>
      {!compact ? (
        <span className="shrink-0 text-[9px] font-normal text-zinc-500">
          {PALETTE_CATEGORY_LABEL[entry.category]}
        </span>
      ) : null}
    </button>
  );
}
