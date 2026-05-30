import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RefObject, ReactNode } from "react";
import { Search, X } from "lucide-react";

export type TRNCommandPaletteItem = {
  id: string;
  label: string;
  group?: string;
  keywords?: string;
  shortcut?: string;
  disabled?: boolean;
};

type TRNCommandPaletteProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
  items: TRNCommandPaletteItem[];
  title?: string;
  placeholder?: string;
  emptyText?: string;
  className?: string;
  zIndex?: number;
  inputRef?: RefObject<HTMLInputElement>;
};

function matchesQuery(
  item: TRNCommandPaletteItem,
  needle: string,
): boolean {
  if (item.disabled) {
    return false;
  }
  if (needle.length === 0) {
    return true;
  }
  const h = [item.label, item.group, item.keywords, item.id]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const tokens = needle
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  for (const t of tokens) {
    if (t.length === 0) {
      continue;
    }
    if (!h.includes(t)) {
      return false;
    }
  }
  return true;
}

/**
 * Renders a VS Code style command surface: search input, grouped list, keyboard
 * selection. When `open` is false, renders nothing. Parent is responsible for
 * mounting a backdrop if desired, or this component is typically placed in a
 * `TRNWindow` / high z-index root.
 */
export function TRNCommandPalette(props: TRNCommandPaletteProps) {
  const {
    open,
    onClose,
    onSelect,
    items,
    title = "Command palette",
    placeholder = "Type a command or search...",
    emptyText = "No results.",
    className = "",
    zIndex = 70,
    inputRef: externalInputRef,
  } = props;
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const localRef = useRef<HTMLInputElement>(null);
  const inputRef = externalInputRef ?? localRef;

  const flat = useMemo(
    () => items.filter((item) => item.disabled !== true),
    [items],
  );
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return flat.filter((item) => matchesQuery(item, needle));
  }, [flat, query]);

  const grouped = useMemo(() => {
    const m = new Map<string, TRNCommandPaletteItem[]>();
    for (const item of filtered) {
      const g = item.group?.trim() || "Commands";
      const list = m.get(g) ?? [];
      list.push(item);
      m.set(g, list);
    }
    return Array.from(m.entries());
  }, [filtered]);

  const flatList = useMemo(
    () => grouped.flatMap(([, list]) => list),
    [grouped],
  );

  useEffect(() => {
    setHighlight(0);
  }, [query, open, filtered.length]);

  useEffect(() => {
    if (!open) {
      return;
    }
    setQuery("");
    window.setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }, [inputRef, open]);

  const selectIndex = useCallback(
    (idx: number) => {
      if (idx < 0 || idx >= flatList.length) {
        return;
      }
      const id = flatList[idx]!.id;
      onSelect(id);
      onClose();
    },
    [flatList, onClose, onSelect],
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (flatList.length === 0) {
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlight((h) => (h + 1 >= flatList.length ? 0 : h + 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlight((h) => (h - 1 < 0 ? flatList.length - 1 : h - 1));
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        selectIndex(highlight);
        return;
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [flatList.length, highlight, onClose, open, selectIndex]);

  if (!open) {
    return null;
  }

  return (
    <div
      className={
        "fixed inset-0 flex items-start justify-center pt-24 px-2 pointer-events-auto " +
        className
      }
      style={{ zIndex }}
    >
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="relative w-full max-w-lg border border-zinc-700/80 rounded-lg bg-zinc-900/95 shadow-2xl overflow-hidden flex flex-col"
        role="dialog"
        aria-label={title}
        aria-modal="true"
        onKeyDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-700/80 px-2 py-1.5">
          <span className="text-xs font-semibold pl-1">{title}</span>
          <button
            type="button"
            className="p-1 rounded border border-transparent hover:bg-zinc-800/70"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-2 border-b border-zinc-700/80 px-2 py-1.5">
          <Search className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
          <input
            ref={inputRef}
            className="w-full bg-transparent text-xs outline-none placeholder:text-zinc-400"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            autoComplete="off"
            spellCheck={false}
            aria-label="Command search"
          />
        </div>
        <div className="max-h-72 min-h-16 overflow-y-auto p-1">
          {flatList.length === 0 ? (
            <div className="px-3 py-4 text-center text-xs text-zinc-400">
              {emptyText}
            </div>
          ) : (
            <div className="space-y-1">
              {grouped.map(([gName, list]) => (
                <div key={gName} className="pt-0.5">
                  <div className="px-2 py-0.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-wide">
                    {gName}
                  </div>
                  {list.map((item) => {
                    const gIdx = flatList.findIndex(
                      (e) => e.id === item.id,
                    );
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onSelect(item.id)}
                        onMouseEnter={() => setHighlight(gIdx)}
                        className={
                          "w-full text-left flex items-center justify-between gap-2 rounded px-2 py-1.5 text-xs transition-colors " +
                          (gIdx === highlight
                            ? "bg-cyan-500/15 text-zinc-100"
                            : "text-zinc-100 hover:bg-zinc-800/80")
                        }
                        disabled={item.disabled}
                      >
                        <span className="truncate min-w-0">
                          {item.label}
                        </span>
                        {item.shortcut ? (
                          <kbd className="shrink-0 text-[10px] px-1.5 py-0.5 rounded border border-zinc-700/80 text-zinc-400 font-mono">
                            {item.shortcut}
                          </kbd>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="border-t border-zinc-700/80 px-2 py-1 text-[10px] text-zinc-400">
          <span>↑/↓ to move · Enter to run · Esc to close</span>
        </div>
      </div>
    </div>
  );
}
