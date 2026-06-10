import {
  Box,
  ChevronRight,
  FolderPlus,
  Layers,
  Package,
  Plus,
  Search,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { createPortal } from "react-dom";
import type { Diagram3dNodeV1 } from "../schemas/diagram.v1";
import { TRNHintText } from "../../ui/TRN/TRNHintText";
import { shouldShowTrnMenuSearch } from "../../ui/TRN/TRNMenuSearch";
import {
  buildCourseScene3dAddMenuEntries,
  COURSE_SCENE_3D_ADD_CATEGORIES,
  categoryEntryCount,
  entriesForCategory,
  filterCourseScene3dAddMenuEntries,
  spawnCourseScene3dGroupNode,
  type CourseScene3dAddCategoryId,
} from "./courseScene3dAddCatalog";

const CATEGORY_ICON: Record<
  CourseScene3dAddCategoryId,
  ComponentType<{ className?: string; "aria-hidden"?: boolean }>
> = {
  mesh: Box,
  presets: Layers,
  catalog: Package,
};

const MENU_ITEM_CLASS =
  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[11px] font-medium text-zinc-200 transition-colors hover:bg-white/8";

function clampMenuPosition(clientX: number, clientY: number, menuWidth: number, menuHeight: number) {
  const pad = 8;
  const maxLeft = Math.max(pad, window.innerWidth - menuWidth - pad);
  const maxTop = Math.max(pad, window.innerHeight - menuHeight - pad);
  return {
    left: Math.min(Math.max(pad, clientX), maxLeft),
    top: Math.min(Math.max(pad, clientY), maxTop),
  };
}

export function CourseSceneAddMenu({
  clientX,
  clientY,
  onPickNode,
  onClose,
}: {
  clientX: number;
  clientY: number;
  onPickNode: (node: Diagram3dNodeV1) => void;
  onClose: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [hoveredCategory, setHoveredCategory] = useState<CourseScene3dAddCategoryId>("mesh");

  const entries = useMemo(() => buildCourseScene3dAddMenuEntries(), []);
  const visibleCategories = useMemo(
    () =>
      COURSE_SCENE_3D_ADD_CATEGORIES.filter(
        (category) => categoryEntryCount(entries, category.id) > 0,
      ),
    [entries],
  );

  const activeCategory = visibleCategories.some((category) => category.id === hoveredCategory)
    ? hoveredCategory
    : (visibleCategories[0]?.id ?? "mesh");

  const isSearching = search.trim().length > 0;
  const searchRows = useMemo(
    () => filterCourseScene3dAddMenuEntries(entries, search),
    [entries, search],
  );
  const activeEntries = entriesForCategory(entries, activeCategory);
  const showCatalogSearch = shouldShowTrnMenuSearch(activeEntries.length);

  const pickEntry = useCallback(
    (spawn: () => Diagram3dNodeV1) => {
      onPickNode(spawn());
      onClose();
    },
    [onClose, onPickNode],
  );

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

  const menuWidth = isSearching ? 17.5 : 28;
  const { left, top } = clampMenuPosition(clientX, clientY, menuWidth * 16, 26 * 16);
  const submenuAccent =
    activeCategory === "mesh"
      ? "#38bdf8"
      : activeCategory === "presets"
        ? "#fbbf24"
        : "#a78bfa";

  const menu = (
    <div
      ref={containerRef}
      className="fixed z-[1200] flex animate-in fade-in zoom-in-95 duration-100"
      style={{ left, top }}
      onClick={(event) => event.stopPropagation()}
      role="dialog"
      aria-label="Add object"
    >
      <div className="flex w-[13.5rem] flex-col overflow-hidden rounded-xl border border-white/15 bg-black/70 shadow-[0_16px_48px_-16px_rgba(0,0,0,0.9)] backdrop-blur-2xl ring-1 ring-white/10">
        <div className="border-b border-white/10 px-2.5 pb-2 pt-2">
          <div className="mb-2 flex items-center gap-1.5">
            <Plus className="h-3.5 w-3.5 text-zinc-400" aria-hidden />
            <span className="text-[11px] font-semibold text-zinc-100">Add object</span>
            <span className="ml-auto text-[10px] text-zinc-500">Shift+A</span>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-2 py-1.5">
            <Search className="h-3 w-3 shrink-0 text-zinc-500" aria-hidden />
            <input
              ref={searchRef}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search…"
              className="min-w-0 flex-1 bg-transparent text-[11px] text-zinc-100 outline-none placeholder:text-zinc-500"
            />
          </div>
        </div>

        {isSearching ? (
          <div className="scrollbar-hide max-h-[min(60vh,22rem)] overflow-y-auto p-1.5">
            {searchRows.length === 0 ? (
              <TRNHintText className="px-1 py-2">No matching objects.</TRNHintText>
            ) : (
              searchRows.map(({ entry, categoryLabel }) => (
                <button
                  key={entry.id}
                  type="button"
                  className={MENU_ITEM_CLASS}
                  onClick={() => pickEntry(entry.spawn)}
                >
                  <span className="text-[10px] text-zinc-500">{categoryLabel}</span>
                  <span className="text-zinc-300">·</span>
                  <span>{entry.label}</span>
                </button>
              ))
            )}
          </div>
        ) : (
          <div className="scrollbar-hide flex max-h-[min(60vh,22rem)] flex-col p-1">
            {visibleCategories.map((category) => {
              const Icon = CATEGORY_ICON[category.id];
              const isActive = category.id === activeCategory;
              return (
                <button
                  key={category.id}
                  type="button"
                  onMouseEnter={() => setHoveredCategory(category.id)}
                  onFocus={() => setHoveredCategory(category.id)}
                  className={
                    isActive
                      ? "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[11px] font-medium text-zinc-100 transition-colors"
                      : "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[11px] font-medium text-zinc-400 transition-colors hover:text-zinc-100"
                  }
                >
                  <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                  <span className="flex-1 text-left">{category.label}</span>
                  <ChevronRight
                    className={isActive ? "h-3 w-3 opacity-60" : "h-3 w-3 opacity-25"}
                    aria-hidden
                  />
                </button>
              );
            })}
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[11px] font-medium text-zinc-400 transition-colors hover:bg-white/8 hover:text-zinc-100"
              onClick={() => pickEntry(spawnCourseScene3dGroupNode)}
            >
              <FolderPlus className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
              <span className="flex-1 text-left">Group</span>
            </button>
          </div>
        )}

        <div className="border-t border-white/10 px-2.5 py-1.5">
          <p className="text-[10px] text-zinc-500">
            1/3/7/9 · view snap (numpad or number row) · Esc close
          </p>
        </div>
      </div>

      {!isSearching && activeEntries.length > 0 ? (
        <div
          className="ml-1 flex w-[13rem] flex-col overflow-hidden rounded-xl border border-white/15 bg-black/70 shadow-[0_16px_48px_-16px_rgba(0,0,0,0.9)] backdrop-blur-2xl ring-1 ring-white/10"
          style={{ borderLeftWidth: 3, borderLeftColor: submenuAccent }}
        >
          <div
            className="border-b border-white/10 px-2.5 py-2 text-[11px] font-semibold"
            style={{ color: submenuAccent }}
          >
            {COURSE_SCENE_3D_ADD_CATEGORIES.find((category) => category.id === activeCategory)
              ?.label ?? activeCategory}
          </div>
          {showCatalogSearch && activeCategory === "catalog" ? (
            <div className="border-b border-white/10 px-2 py-1.5">
              <div className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-2 py-1">
                <Search className="h-3 w-3 text-zinc-500" aria-hidden />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Filter catalog…"
                  className="min-w-0 flex-1 bg-transparent text-[11px] text-zinc-100 outline-none placeholder:text-zinc-500"
                />
              </div>
            </div>
          ) : null}
          <div className="scrollbar-hide max-h-[min(60vh,20rem)] overflow-y-auto p-1.5">
            {activeEntries.map((entry) => (
              <button
                key={entry.id}
                type="button"
                className={MENU_ITEM_CLASS}
                onClick={() => pickEntry(entry.spawn)}
              >
                {entry.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );

  return createPortal(menu, document.body);
}
