import { GripVertical } from "lucide-react";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useId, useRef, useState, type CSSProperties } from "react";
import type { NodeCatalogEntry } from "../../../../core/config/config-types";
import { FLOW_NODE_HEADER_BADGE_CLASS } from "../../nodes/flow-node/theme/flow-node-tokens";
import { PaletteCatalogIcon } from "./PaletteCatalogIcon";
import { paletteEntryDnDProps } from "./palette-entry-dnd-props";
import {
  getPaletteHeaderBadgeLabel,
  PALETTE_CATEGORY_LABEL,
  resolvePaletteRowVariant,
} from "./palette-entry-meta";
import { paletteIconPulseFromPreview } from "./palette-icon-pulse";
import { usePaletteDensity } from "./palette-density-context";
import { palettePreviewHasReading, PaletteReadingPreview } from "./PaletteReadingPreview";
import type { SensorFamilyTreeGutterRole } from "./sensor-family-tree-layout";
import { usePaletteEntryPreview } from "./usePaletteEntryPreview";

/** Hover dwell before showing the library hint (ms). */
const LIBRARY_HINT_DELAY_MS = 1000;

function LibraryHintPanel(props: {
  entry: NodeCatalogEntry;
  chip?: string | null;
}) {
  const { entry, chip } = props;
  return (
    <div className={`flex max-h-60 max-w-xs flex-col gap-2 overflow-y-auto rounded-lg border border-zinc-600/90 bg-zinc-950/98 px-3 py-2.5 text-left font-sans shadow-xl ring-1 ring-black/40 backdrop-blur-md`}>
      <div>
        <div className="text-[13px] font-semibold leading-snug text-zinc-50">{entry.title}</div>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-zinc-500">
          <code className="rounded bg-zinc-900/90 px-1 py-px font-sans text-[10px] text-cyan-200/90">
            {entry.id}
          </code>
          <span className="text-zinc-500">·</span>
          <span>{PALETTE_CATEGORY_LABEL[entry.category]}</span>
          {chip != null ? (
            <>
              <span className="text-zinc-600">·</span>
              <span className="rounded border border-cyan-500/25 bg-cyan-950/40 px-1 py-px text-[9px] font-semibold uppercase tracking-wide text-cyan-200/85">
                {chip}
              </span>
            </>
          ) : null}
        </div>
      </div>
      <p className="text-[11px] leading-relaxed text-zinc-300">{entry.description}</p>
      <div className="border-t border-zinc-800/90 pt-2 text-[10px] leading-snug text-zinc-500">
        <span className="font-medium text-zinc-400">Actions</span>
        <span className="mx-1 text-zinc-600">—</span>
        Drag onto the canvas to place at a position. Click to add at the default position.
      </div>
    </div>
  );
}

export function LibraryEntryRow(props: {
  entry: NodeCatalogEntry;
  borderColor: string;
  onAddNode: (entry: NodeCatalogEntry) => void;
  chip?: string | null;
  categoryAccent?: string;
  variant?: "default" | "primary" | "tap";
  hideChip?: boolean;
  grouped?: boolean;
  treeRole?: SensorFamilyTreeGutterRole | null;
}) {
  const {
    entry,
    borderColor,
    onAddNode,
    chip,
    categoryAccent,
    variant: variantProp,
    hideChip = false,
    grouped = false,
    treeRole = null,
  } = props;
  const variant = variantProp ?? resolvePaletteRowVariant(entry, grouped);
  const isTap = variant === "tap";
  const isPrimary = variant === "primary";
  const isGroupedRow = variant !== "default";
  const density = usePaletteDensity();
  const dense = density === "dense";
  const preview = usePaletteEntryPreview(entry);
  const { livePulse, pulseTriggerKey } = paletteIconPulseFromPreview(preview);
  const hintBodyId = useId();
  const btnRef = useRef<HTMLButtonElement>(null);
  const showTimerRef = useRef<number | null>(null);
  const leaveDismissTimerRef = useRef<number | null>(null);
  const [hintOpen, setHintOpen] = useState(false);
  const [hintStyle, setHintStyle] = useState<CSSProperties | null>(null);
  const showChip = !hideChip && chip != null;
  const isHeaderRootRow = treeRole === "header-root";
  const groupedPlainIcon = grouped && (isPrimary || isTap);
  const headerBadge = isGroupedRow ? getPaletteHeaderBadgeLabel(entry) : null;
  const showReadingRow =
    palettePreviewHasReading(preview) && (!isPrimary || preview.kind === "primaryBundle");

  const clearShowTimer = useCallback(() => {
    if (showTimerRef.current != null) {
      window.clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
  }, []);

  const clearLeaveDismissTimer = useCallback(() => {
    if (leaveDismissTimerRef.current != null) {
      window.clearTimeout(leaveDismissTimerRef.current);
      leaveDismissTimerRef.current = null;
    }
  }, []);

  const dismissHint = useCallback(() => {
    clearShowTimer();
    clearLeaveDismissTimer();
    setHintOpen(false);
    setHintStyle(null);
  }, [clearShowTimer, clearLeaveDismissTimer]);

  const armLeaveDismiss = useCallback(() => {
    clearLeaveDismissTimer();
    leaveDismissTimerRef.current = window.setTimeout(() => {
      leaveDismissTimerRef.current = null;
      dismissHint();
    }, 220);
  }, [clearLeaveDismissTimer, dismissHint]);

  const scheduleHint = useCallback(() => {
    clearShowTimer();
    clearLeaveDismissTimer();
    showTimerRef.current = window.setTimeout(() => {
      showTimerRef.current = null;
      const el = btnRef.current;
      if (el == null) {
        return;
      }
      const anchor = el.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const maxW = 288;
      const gutter = 8;
      const left = Math.max(gutter, Math.min(anchor.left, vw - gutter - maxW));
      const spaceBelow = vh - anchor.bottom - gutter;
      const placeBelow = spaceBelow >= 96;
      const overlap = 6;
      if (placeBelow) {
        setHintStyle({
          position: "fixed",
          left,
          top: anchor.bottom - overlap,
          maxWidth: maxW,
          zIndex: 340,
        });
      } else {
        setHintStyle({
          position: "fixed",
          left,
          bottom: vh - anchor.top + overlap,
          maxWidth: maxW,
          zIndex: 340,
        });
      }
      setHintOpen(true);
    }, LIBRARY_HINT_DELAY_MS);
  }, [clearShowTimer, clearLeaveDismissTimer]);

  useEffect(() => {
    return () => {
      clearShowTimer();
      clearLeaveDismissTimer();
    };
  }, [clearShowTimer, clearLeaveDismissTimer]);

  useEffect(() => {
    if (!hintOpen) {
      return;
    }
    const onScroll = () => {
      dismissHint();
    };
    window.addEventListener("scroll", onScroll, true);
    return () => window.removeEventListener("scroll", onScroll, true);
  }, [hintOpen, dismissHint]);

  const { draggable, onDragStart } = paletteEntryDnDProps(entry);

  const cardPadClass = isHeaderRootRow
    ? dense
      ? "px-1.5 py-1.5"
      : "px-2 py-2"
    : isPrimary
      ? dense
        ? "px-2 py-2"
        : "px-2.5 py-2.5"
      : isTap
        ? dense
          ? "px-2 py-1.5"
          : "px-2.5 py-2"
        : dense
          ? "px-2 py-1.5"
          : "px-2.5 py-2";

  const cardChromeClass = isHeaderRootRow
    ? "rounded-none border-0 bg-transparent hover:bg-zinc-800/45"
    : isPrimary
      ? "rounded-md border border-cyan-500/25 bg-zinc-900/55 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:border-cyan-500/40 hover:bg-zinc-800/55"
      : "rounded-md border border-zinc-700/55 bg-zinc-900/35 hover:border-zinc-600/65 hover:bg-zinc-800/50";

  const rowButtonClass = [
    "group relative grid w-full min-w-0 cursor-grab grid-cols-[auto_auto_minmax(0,1fr)] gap-x-2 text-left transition-colors active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/35",
    showReadingRow ? "grid-rows-[auto_auto] items-start" : "grid-rows-[auto] items-center",
    cardPadClass,
    cardChromeClass,
  ].join(" ");

  const titleClass = [
    "min-w-0 truncate leading-tight text-zinc-100",
    isPrimary ? "font-semibold" : "font-medium",
    dense ? "text-[12px]" : "text-[13px]",
  ].join(" ");

  const iconSizeClass = isTap
    ? dense
      ? "h-3.5 w-3.5"
      : "h-4 w-4"
    : dense
      ? "h-4 w-4"
      : "h-4 w-4";

  const badgeClass = `${FLOW_NODE_HEADER_BADGE_CLASS} shrink-0 border-cyan-500/45 bg-cyan-950/35 text-cyan-200/90`;

  return (
    <>
      <span id={hintBodyId} className="sr-only">
        {entry.description}
      </span>
      <div
        className={`w-full ${grouped && !isHeaderRootRow ? "px-1.5 pb-1" : ""}`}
        onMouseEnter={() => {
          clearLeaveDismissTimer();
          scheduleHint();
        }}
        onMouseLeave={armLeaveDismiss}
      >
        <button
          ref={btnRef}
          type="button"
          className={rowButtonClass}
          style={isGroupedRow || isHeaderRootRow ? undefined : { borderColor }}
          onClick={() => onAddNode(entry)}
          draggable={draggable}
          onDragStart={(e) => {
            dismissHint();
            onDragStart(e);
          }}
          aria-describedby={hintBodyId}
        >
          <GripVertical
            className={`col-start-1 row-start-1 self-center h-3.5 w-3.5 shrink-0 text-zinc-600 transition-opacity group-hover:text-zinc-400 group-hover:opacity-100 group-focus-visible:opacity-100 group-active:opacity-100 ${
              isTap ? "opacity-70" : "opacity-80"
            }`}
            aria-hidden
          />
          {groupedPlainIcon ? (
            <span
              className={`col-start-2 row-start-1 flex shrink-0 items-center justify-center self-center ${
                isTap ? "text-zinc-500" : "text-zinc-400"
              }`}
            >
              <PaletteCatalogIcon
                icon={entry.icon}
                livePulse={livePulse}
                pulseTriggerKey={pulseTriggerKey}
                className={iconSizeClass}
              />
            </span>
          ) : (
            <span
              className={`col-start-2 row-start-1 flex shrink-0 items-center justify-center self-center rounded-md border-l-[3px] border-l-transparent bg-zinc-900/80 ring-1 ring-zinc-700/60 group-hover:bg-zinc-800/90 ${
                dense ? "size-7" : "size-8"
              }`}
              style={
                categoryAccent != null
                  ? { borderLeftColor: categoryAccent }
                  : undefined
              }
            >
              <PaletteCatalogIcon
                icon={entry.icon}
                livePulse={livePulse}
                pulseTriggerKey={pulseTriggerKey}
                className={dense ? "h-3.5 w-3.5" : undefined}
              />
            </span>
          )}
          <span className="col-start-3 row-start-1 flex min-w-0 items-center justify-between gap-2">
            <span className="flex min-w-0 flex-1 items-center gap-1.5">
              <span className={titleClass}>{entry.title}</span>
              {showChip ? (
                <span
                  className={`shrink-0 rounded border border-cyan-500/30 bg-cyan-950/35 font-semibold uppercase tracking-wide text-cyan-200/90 ${
                    dense
                      ? "px-0.5 py-px text-[8px]"
                      : "px-1 py-px text-[9px]"
                  }`}
                >
                  {chip}
                </span>
              ) : null}
            </span>
            {headerBadge != null ? (
              <span className={badgeClass}>{headerBadge}</span>
            ) : null}
          </span>
          {showReadingRow ? (
            <span className="col-start-3 row-start-2 flex min-w-0 w-full justify-end overflow-x-auto scrollbar-hide">
              <PaletteReadingPreview preview={preview} align="end" density={density} />
            </span>
          ) : null}
        </button>
      </div>
      {hintOpen && hintStyle != null && typeof document !== "undefined"
        ? createPortal(
            <div
              role="tooltip"
              className="pointer-events-auto"
              style={hintStyle}
              onMouseEnter={clearLeaveDismissTimer}
              onMouseLeave={dismissHint}
            >
              <LibraryHintPanel entry={entry} chip={showChip ? chip : null} />
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
