import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { TRNButton } from "../../ui/TRN/TRNButton";
import {
  matchesTrnMenuSearch,
  shouldShowTrnMenuSearch,
  TRNMenuSearchField,
} from "../../ui/TRN/TRNMenuSearch";
import { formatGridSpanLabel } from "../schemas/embedBlocks";
import {
  COURSE_BLOCK_PALETTE_CATEGORY_LABELS,
  COURSE_BLOCK_PALETTE_CATEGORY_ORDER,
  coursePageGridAddBlockMenuEntries,
  type CourseBlockPaletteCategory,
  type CourseBlockPaletteEntry,
} from "./blockPaletteMeta";

export function CoursePageAddBlockMenu({
  anchorRect,
  onPick,
  onDismiss,
}: {
  anchorRect: DOMRect;
  onPick: (entry: CourseBlockPaletteEntry) => void;
  onDismiss: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  const entries = useMemo(() => coursePageGridAddBlockMenuEntries(), []);
  const showSearch = shouldShowTrnMenuSearch(entries.length);
  const query = search.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!query) {
      return entries;
    }
    return entries.filter(
      (entry) =>
        matchesTrnMenuSearch(query, entry.label, [entry.description, entry.kind]) ||
        matchesTrnMenuSearch(query, COURSE_BLOCK_PALETTE_CATEGORY_LABELS[entry.category]),
    );
  }, [entries, query]);

  const grouped = useMemo(() => {
    const byCategory = new Map<CourseBlockPaletteCategory, CourseBlockPaletteEntry[]>();
    for (const entry of filtered) {
      const bucket = byCategory.get(entry.category) ?? [];
      bucket.push(entry);
      byCategory.set(entry.category, bucket);
    }
    return COURSE_BLOCK_PALETTE_CATEGORY_ORDER.flatMap((category) => {
      const rows = byCategory.get(category);
      return rows != null && rows.length > 0 ? [{ category, rows }] : [];
    });
  }, [filtered]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onDismiss();
      }
    };
    const onPointer = (event: PointerEvent) => {
      const panel = panelRef.current;
      if (panel != null && !panel.contains(event.target as Node)) {
        onDismiss();
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer, true);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer, true);
    };
  }, [onDismiss]);

  if (typeof document === "undefined") {
    return null;
  }

  const top = anchorRect.bottom + 6;
  const left = Math.max(8, Math.min(anchorRect.left, window.innerWidth - 260));

  return createPortal(
    <div
      ref={panelRef}
      className="fixed z-[210] flex w-[15rem] max-h-[min(28rem,calc(100vh-16px))] flex-col overflow-hidden rounded-md border border-zinc-700/80 bg-zinc-950/95 shadow-[0_12px_32px_rgba(0,0,0,0.45)] backdrop-blur-sm"
      style={{ top, left }}
      role="menu"
      aria-label="Add page block"
      onPointerDown={(event) => event.stopPropagation()}
    >
      <p className="shrink-0 px-2 pt-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
        Place block
      </p>
      {showSearch ? (
        <div className="shrink-0 px-2 pb-1.5 pt-1">
          <TRNMenuSearchField
            value={search}
            onChange={setSearch}
            placeholder="Search blocks…"
            autoFocus={false}
          />
        </div>
      ) : null}
      <div className="min-h-0 flex-1 overflow-y-auto p-1.5 scrollbar-hide">
        {grouped.length === 0 ? (
          <p className="px-1.5 py-2 text-[11px] text-zinc-500">No matching blocks.</p>
        ) : (
          grouped.map(({ category, rows }) => (
            <div key={category} className="mb-1 last:mb-0">
              <p className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                {COURSE_BLOCK_PALETTE_CATEGORY_LABELS[category]}
              </p>
              {rows.map((entry) => (
                <TRNButton
                  key={entry.kind}
                  size="compact"
                  className="h-8 w-full justify-start px-2 text-[11px]"
                  hint={`${entry.description} · ${formatGridSpanLabel(entry.defaultSpan.columnSpan, entry.defaultSpan.rowSpan)}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onPick(entry);
                  }}
                >
                  {entry.label}
                </TRNButton>
              ))}
            </div>
          ))
        )}
      </div>
    </div>,
    document.body,
  );
}
