import { LayoutGrid, Search, Sparkles, Waves, X, Box } from "lucide-react";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useId, useMemo, useRef, useState, type CSSProperties } from "react";
import type { NodeCatalogEntry } from "../../../core/config/config-types";
import { useFlowEditorStore } from "../store/flow-editor.store";
import { resolveSingleModelSelectParentId, readGlbExtractTag, readSourceModelNodeId } from "../model/model-generated-bindings";
import { studioGlbExtractRowKey } from "../gltf/studio-gltf-extract";
import { useStudioGltfExtraction } from "../gltf/useStudioGltfExtraction";
import { GlbExtractionTabPanel } from "./node-palette/GlbExtractionTabPanel";
import { filterPaletteEntries } from "./node-palette/filter-palette-entries";
import { PaletteCatalogIcon } from "./node-palette/PaletteCatalogIcon";
import { paletteEntryDnDProps } from "./node-palette/palette-entry-dnd-props";
import {
  getPaletteEntryMeta,
  getSubgroupLabel,
  PALETTE_INPUT_SUBGROUP_ORDER,
  type PaletteInputSubgroup,
} from "./node-palette/palette-entry-meta";
import { PaletteDensityProvider, usePaletteDensity } from "./node-palette/palette-density-context";
import { PalettePreviewAffix } from "./node-palette/PalettePreviewAffix";
import { PaletteLiveTickProvider } from "./node-palette/PaletteLiveTickContext";
import {
  readStoredPaletteDensity,
  writeStoredPaletteDensity,
  type NodePaletteDensity,
} from "./node-palette/node-palette-ui-persistence";
import { usePaletteEntryPreview } from "./node-palette/usePaletteEntryPreview";

type NodePaletteTabId = "nodes" | "simulation" | "glb";

type CategoryFilter = "all" | NodeCatalogEntry["category"];

const CATEGORY_ORDER: NodeCatalogEntry["category"][] = [
  "input",
  "transform",
  "logic",
  "output",
  "utility",
  "generator",
];

const CATEGORY_LABEL: Record<NodeCatalogEntry["category"], string> = {
  input: "Input",
  transform: "Transform",
  logic: "Logic",
  output: "Output",
  utility: "Utility",
  generator: "Generator",
};

/** Hover dwell before showing the library hint (ms). */
const LIBRARY_HINT_DELAY_MS = 1000;

function LibraryHintPanel(props: {
  entry: NodeCatalogEntry;
  chip?: string | null;
}) {
  const { entry, chip } = props;
  return (
    <div className="flex max-h-60 max-w-xs flex-col gap-2 overflow-y-auto rounded-lg border border-zinc-600/90 bg-zinc-950/98 px-3 py-2.5 text-left shadow-xl ring-1 ring-black/40 backdrop-blur-md">
      <div>
        <div className="text-[13px] font-semibold leading-snug text-zinc-50">{entry.title}</div>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-zinc-500">
          <code className="rounded bg-zinc-900/90 px-1 py-px font-mono text-[10px] text-cyan-200/90">
            {entry.id}
          </code>
          <span className="text-zinc-500">·</span>
          <span>{CATEGORY_LABEL[entry.category]}</span>
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
        Click to add to the graph. Drag onto the canvas to place at a position.
      </div>
    </div>
  );
}

type NodePaletteProps = {
  borderColor: string;
  panelColor: string;
  entries: NodeCatalogEntry[];
  onAddNode: (entry: NodeCatalogEntry) => void;
  /** Spawn a number-constant linked to the Model, tagged with GLB extraction metadata. */
  onSpawnGlbExtract?: (args: {
    parentModelFlowNodeId: string;
    row: import("../gltf/studio-gltf-extract").StudioGltfExtractRow;
  }) => void;
  /** When set, section headers, filter chips, and rows pick up the same hues as the flow minimap. */
  categoryColors?: Record<NodeCatalogEntry["category"], string>;
  /** Secondary text from the workbench theme (helper / meta lines). */
  mutedTextColor?: string;
};

function LibraryEntryRow(props: {
  entry: NodeCatalogEntry;
  borderColor: string;
  onAddNode: (entry: NodeCatalogEntry) => void;
  chip?: string | null;
  categoryAccent?: string;
}) {
  const { entry, borderColor, onAddNode, chip, categoryAccent } = props;
  const density = usePaletteDensity();
  const dense = density === "dense";
  const preview = usePaletteEntryPreview(entry);
  const livePulse = preview.kind === "pulse" ? preview.streamMode : null;
  const hintBodyId = useId();
  const btnRef = useRef<HTMLButtonElement>(null);
  const showTimerRef = useRef<number | null>(null);
  const leaveDismissTimerRef = useRef<number | null>(null);
  const [hintOpen, setHintOpen] = useState(false);
  const [hintStyle, setHintStyle] = useState<CSSProperties | null>(null);

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

  return (
    <>
      <span id={hintBodyId} className="sr-only">
        {entry.description}
      </span>
      <div
        className="w-full"
        onMouseEnter={() => {
          clearLeaveDismissTimer();
          scheduleHint();
        }}
        onMouseLeave={armLeaveDismiss}
      >
        <button
          ref={btnRef}
          type="button"
          className={`group flex w-full cursor-grab items-center rounded-lg border text-left transition-colors hover:bg-zinc-800/45 active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/35 ${
            dense ? "gap-2 px-2 py-1.5" : "gap-2.5 px-2.5 py-2"
          }`}
          style={{ borderColor }}
          onClick={() => onAddNode(entry)}
          draggable={draggable}
          onDragStart={(e) => {
            dismissHint();
            onDragStart(e);
          }}
          aria-describedby={hintBodyId}
        >
          <span
            className={`flex shrink-0 items-center justify-center rounded-md border-l-[3px] border-l-transparent bg-zinc-900/80 ring-1 ring-zinc-700/60 group-hover:bg-zinc-800/90 ${
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
              className={dense ? "h-3 w-3" : undefined}
            />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5">
              <span
                className={`truncate font-medium leading-tight text-zinc-100 ${
                  dense ? "text-[12px]" : "text-[13px]"
                }`}
              >
                {entry.title}
              </span>
              {chip != null ? (
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
          </span>
          <span className="shrink-0">
            <PalettePreviewAffix preview={preview} density={density} />
          </span>
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
              <LibraryHintPanel entry={entry} chip={chip} />
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

export function NodePalette(props: NodePaletteProps) {
  const { borderColor, panelColor, entries, onAddNode, onSpawnGlbExtract, categoryColors, mutedTextColor } = props;
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<NodePaletteTabId>("nodes");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [density, setDensity] = useState<NodePaletteDensity>(() => readStoredPaletteDensity());

  const parentModelFlowNodeId = useFlowEditorStore((s) => resolveSingleModelSelectParentId(s));
  const modelNodes = useFlowEditorStore((s) => s.nodes);
  const glbFetchUrl = useMemo(() => {
    if (parentModelFlowNodeId == null) {
      return null;
    }
    const n = modelNodes.find((x) => x.id === parentModelFlowNodeId);
    if (n?.data.nodeId !== "model-select") {
      return null;
    }
    const u = n.data.defaultConfig["selectedModelUrl"];
    return typeof u === "string" && u.trim().length > 0 ? u.trim() : null;
  }, [parentModelFlowNodeId, modelNodes]);

  const glbExtraction = useStudioGltfExtraction(tab === "glb" ? glbFetchUrl : null);

  const glbRows = useMemo(
    () =>
      glbExtraction.result ?? {
        animations: [],
        parts: [],
        materials: [],
        morphs: [],
        lights: [],
        cameras: [],
      },
    [glbExtraction.result],
  );

  const glbPlacedRowKeys = useMemo(() => {
    if (parentModelFlowNodeId == null) {
      return new Set<string>();
    }
    const set = new Set<string>();
    for (const n of modelNodes) {
      const pid = readSourceModelNodeId(n.data.defaultConfig);
      if (pid !== parentModelFlowNodeId) {
        continue;
      }
      const tag = readGlbExtractTag(n.data.defaultConfig);
      if (tag == null) {
        continue;
      }
      set.add(studioGlbExtractRowKey(tag));
    }
    return set;
  }, [modelNodes, parentModelFlowNodeId]);

  useEffect(() => {
    writeStoredPaletteDensity(density);
  }, [density]);

  const dense = density === "dense";

  const entryAccent = (entry: NodeCatalogEntry) => categoryColors?.[entry.category];

  const paletteFilterActive =
    query.trim().length > 0 || (tab === "nodes" && categoryFilter !== "all");

  const showFilterSecondary =
    query.trim().length > 0 || (tab === "nodes" && categoryFilter !== "all");

  const resetPaletteFilters = useCallback(() => {
    setQuery("");
    setCategoryFilter("all");
  }, []);

  const inputSubgroupDot = categoryColors?.input ?? "#52525b";

  const standardNodes = useMemo(() => {
    const q = query.trim();
    const pruned = entries.filter((entry) => {
      if (entry.id === "sensor-input" || entry.id === "sine-wave") {
        return false;
      }
      if (q.length === 0) {
        return entry.defaultVisible === true;
      }
      return true;
    });
    return filterPaletteEntries(pruned, q);
  }, [entries, query]);

  const simulationNodes = useMemo(() => {
    const q = query.trim();
    const pruned = entries.filter((entry) => entry.id === "sine-wave");
    return filterPaletteEntries(pruned, q);
  }, [entries, query]);

  const activeList = tab === "simulation" ? simulationNodes : standardNodes;

  const headerListCount = tab === "glb" ? glbExtraction.totalRows : activeList.length;

  const categoryCounts = useMemo(() => {
    const m = new Map<NodeCatalogEntry["category"], number>();
    for (const e of standardNodes) {
      m.set(e.category, (m.get(e.category) ?? 0) + 1);
    }
    return m;
  }, [standardNodes]);

  const groupedByCategory = useMemo(() => {
    const m = new Map<NodeCatalogEntry["category"], NodeCatalogEntry[]>();
    for (const c of CATEGORY_ORDER) {
      m.set(c, []);
    }
    for (const e of activeList) {
      m.get(e.category)?.push(e);
    }
    return m;
  }, [activeList]);

  const inputNodes = groupedByCategory.get("input") ?? [];
  const inputBySubgroup = useMemo(() => {
    const map = new Map<PaletteInputSubgroup, NodeCatalogEntry[]>();
    for (const sg of PALETTE_INPUT_SUBGROUP_ORDER) {
      map.set(sg, []);
    }
    for (const entry of inputNodes) {
      const meta = getPaletteEntryMeta(entry);
      const sg = meta.inputSubgroup;
      if (sg != null) {
        map.get(sg)?.push(entry);
      }
    }
    return map;
  }, [inputNodes]);

  const renderInputSections = () => (
    <>
      {PALETTE_INPUT_SUBGROUP_ORDER.map((sg) => {
        const list = inputBySubgroup.get(sg) ?? [];
        if (list.length === 0) {
          return null;
        }
        return (
          <div key={sg} className={dense ? "space-y-1" : "space-y-1.5"}>
            <div
              className={`flex select-none items-center gap-1.5 border-b border-zinc-700/70 font-semibold uppercase tracking-wider text-zinc-500 ${
                dense ? "pb-0.5 text-[9px]" : "pb-1 text-[10px]"
              }`}
              style={{ borderColor }}
            >
              <span
                className="size-1.5 shrink-0 rounded-full ring-1 ring-white/10"
                style={{ backgroundColor: inputSubgroupDot }}
                aria-hidden
              />
              {getSubgroupLabel(sg)}
            </div>
            <div className={dense ? "space-y-0.5" : "space-y-1"}>
              {list.map((entry) => {
                const meta = getPaletteEntryMeta(entry);
                return (
                  <LibraryEntryRow
                    key={entry.id}
                    entry={entry}
                    borderColor={borderColor}
                    onAddNode={onAddNode}
                    chip={meta.chip}
                    categoryAccent={entryAccent(entry)}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </>
  );

  const renderCategoryBlock = (category: NodeCatalogEntry["category"]) => {
    const nodes = groupedByCategory.get(category) ?? [];
    if (nodes.length === 0) {
      return null;
    }
    if (category === "input") {
      if (inputNodes.length === 0) {
        return null;
      }
      const stripe = categoryColors?.input;
      return (
        <section key="input" className={dense ? "space-y-1.5" : "space-y-2"}>
          <h3
            className={`sticky top-0 z-10 -mx-2 mb-1 border-b border-zinc-800/80 px-2 font-semibold uppercase tracking-wide text-zinc-200 ${
              dense ? "py-1.5 text-[10px]" : "py-2 text-[11px]"
            }`}
            style={{
              backgroundColor: panelColor,
              ...(stripe != null ? { boxShadow: `inset 3px 0 0 0 ${stripe}` } : {}),
            }}
          >
            Input
          </h3>
          {renderInputSections()}
        </section>
      );
    }
    const stripe = categoryColors?.[category];
    return (
      <section key={category} className={dense ? "space-y-1.5" : "space-y-2"}>
        <h3
          className={`sticky top-0 z-10 -mx-2 mb-1 border-b border-zinc-800/80 px-2 font-semibold uppercase tracking-wide text-zinc-200 ${
            dense ? "py-1.5 text-[10px]" : "py-2 text-[11px]"
          }`}
          style={{
            backgroundColor: panelColor,
            ...(stripe != null ? { boxShadow: `inset 3px 0 0 0 ${stripe}` } : {}),
          }}
        >
          {CATEGORY_LABEL[category]}
        </h3>
        <div className={dense ? "space-y-0.5" : "space-y-1"}>
          {nodes.map((entry) => (
            <LibraryEntryRow
              key={entry.id}
              entry={entry}
              borderColor={borderColor}
              onAddNode={onAddNode}
              categoryAccent={entryAccent(entry)}
            />
          ))}
        </div>
      </section>
    );
  };

  const showCategoryRail = tab === "nodes";

  return (
    <section
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg ring-1 ring-zinc-800/80"
      style={{
        borderColor,
        backgroundColor: panelColor,
      }}
    >
      <div
        className={`shrink-0 border-b border-zinc-800/90 px-3 ${dense ? "pb-1.5 pt-2" : "pb-2 pt-3"}`}
        style={{ borderColor }}
      >
        <div className={`flex flex-wrap items-center gap-x-2 gap-y-1.5 ${dense ? "mb-2" : "mb-3"}`}>
          <h2 className="shrink-0 text-sm font-semibold tracking-tight text-zinc-100">Library</h2>
          <div className="min-w-0 flex-1" aria-hidden />
          <div
            className="flex shrink-0 items-center gap-0.5 rounded-md bg-zinc-950/50 p-0.5 ring-1 ring-zinc-800/80"
            role="group"
            aria-label="Library list density"
          >
            <button
              type="button"
              aria-pressed={density === "comfortable"}
              onClick={() => setDensity("comfortable")}
              className={`rounded px-2 py-0.5 text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/35 ${
                density === "comfortable"
                  ? "bg-zinc-800 text-zinc-100 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
              title="Comfortable spacing and type sizes"
            >
              Comfort
            </button>
            <button
              type="button"
              aria-pressed={density === "dense"}
              onClick={() => setDensity("dense")}
              className={`rounded px-2 py-0.5 text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/35 ${
                density === "dense"
                  ? "bg-zinc-800 text-zinc-100 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
              title="Dense list: smaller rows and live preview text"
            >
              Dense
            </button>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-0.5">
            <span
              className="rounded-full bg-zinc-800/80 px-2 py-0.5 text-[10px] font-medium tabular-nums text-zinc-400"
              title={
                tab === "glb"
                  ? paletteFilterActive
                    ? "GLB entries matching search"
                    : "Extracted GLB entries for the selected Model"
                  : paletteFilterActive
                    ? "Count of blocks matching the current list"
                    : "Blocks in this list"
              }
            >
              {headerListCount}
            </span>
            {showFilterSecondary ? (
              <span
                className="text-[9px] font-normal tabular-nums leading-none"
                style={mutedTextColor != null ? { color: mutedTextColor } : undefined}
              >
                Filtered
              </span>
            ) : null}
          </div>
        </div>

        <div
          role="tablist"
          aria-label="Library contents"
          className={`${dense ? "mb-2" : "mb-3"} flex rounded-lg bg-zinc-950/50 p-0.5 ring-1 ring-zinc-800/80`}
        >
          <button
            id="palette-tab-nodes"
            type="button"
            role="tab"
            aria-selected={tab === "nodes"}
            onClick={() => {
              setTab("nodes");
              setCategoryFilter("all");
            }}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/35 ${
              dense ? "px-2 py-1 text-[10px]" : "px-2 py-1.5 text-[11px]"
            } ${
              tab === "nodes" ? "bg-zinc-800 text-zinc-100 shadow-sm" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <LayoutGrid className={`shrink-0 opacity-80 ${dense ? "size-3" : "size-3.5"}`} aria-hidden />
            Nodes
          </button>
          <button
            id="palette-tab-simulation"
            type="button"
            role="tab"
            aria-selected={tab === "simulation"}
            onClick={() => {
              setTab("simulation");
              setCategoryFilter("all");
            }}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/35 ${
              dense ? "px-2 py-1 text-[10px]" : "px-2 py-1.5 text-[11px]"
            } ${
              tab === "simulation" ? "bg-zinc-800 text-zinc-100 shadow-sm" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Sparkles className={`shrink-0 opacity-80 ${dense ? "size-3" : "size-3.5"}`} aria-hidden />
            Simulation
          </button>
          <button
            id="palette-tab-glb"
            type="button"
            role="tab"
            aria-selected={tab === "glb"}
            onClick={() => {
              setTab("glb");
              setCategoryFilter("all");
            }}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/35 ${
              dense ? "px-2 py-1 text-[10px]" : "px-2 py-1.5 text-[11px]"
            } ${
              tab === "glb" ? "bg-zinc-800 text-zinc-100 shadow-sm" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Box className={`shrink-0 opacity-80 ${dense ? "size-3" : "size-3.5"}`} aria-hidden />
            GLB
          </button>
        </div>

        <div className="relative">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-500"
            aria-hidden
          />
          <input
            type="search"
            placeholder={
              tab === "glb"
                ? "Search clips, parts, materials, lights…"
                : "Search by name, sensor, or description…"
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                setQuery("");
              }
            }}
            className={`w-full rounded-lg border border-zinc-700/80 bg-zinc-950/60 pl-8 outline-none placeholder:text-zinc-600 focus:border-cyan-500/45 focus:ring-1 focus:ring-cyan-500/25 ${
              dense ? "py-1.5 text-[11px]" : "py-2 text-[12px]"
            } ${query.trim().length > 0 ? "pr-9" : "pr-2"}`}
            style={{ borderColor }}
            aria-label={tab === "glb" ? "Search GLB extraction list" : "Search library"}
          />
          {query.trim().length > 0 ? (
            <button
              type="button"
              className="absolute right-1.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-800/80 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/35"
              onClick={() => setQuery("")}
              aria-label="Clear search"
            >
              <X className="size-3.5 shrink-0" aria-hidden />
            </button>
          ) : null}
        </div>

        {showCategoryRail ? (
          <div
            className={`flex snap-x snap-mandatory gap-1 overflow-x-auto pb-0.5 scrollbar-hide ${dense ? "mt-2" : "mt-3"}`}
          >
            <button
              type="button"
              onClick={() => setCategoryFilter("all")}
              className={`snap-start shrink-0 rounded-full border font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/35 ${
                dense ? "px-2 py-0.5 text-[9px]" : "px-2.5 py-1 text-[10px]"
              } ${
                categoryFilter === "all"
                  ? "border-cyan-500/50 bg-cyan-950/40 text-cyan-100"
                  : "border-zinc-700/60 bg-zinc-900/40 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
              }`}
            >
              All
              <span className="ml-1 tabular-nums opacity-70">{standardNodes.length}</span>
            </button>
            {CATEGORY_ORDER.map((cat) => {
              const n = categoryCounts.get(cat) ?? 0;
              if (n === 0) {
                return null;
              }
              const dot = categoryColors?.[cat] ?? "#52525b";
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`inline-flex snap-start shrink-0 items-center gap-1.5 rounded-full border font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/35 ${
                    dense ? "px-2 py-0.5 text-[9px]" : "px-2.5 py-1 text-[10px]"
                  } ${
                    categoryFilter === cat
                      ? "border-cyan-500/50 bg-cyan-950/40 text-cyan-100"
                      : "border-zinc-700/60 bg-zinc-900/40 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                  }`}
                >
                  <span
                    className="size-1.5 shrink-0 rounded-full ring-1 ring-white/10"
                    style={{ backgroundColor: dot }}
                    aria-hidden
                  />
                  {CATEGORY_LABEL[cat]}
                  <span className="ml-0.5 tabular-nums opacity-70">{n}</span>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <PaletteLiveTickProvider>
        <PaletteDensityProvider value={density}>
          <div
            className={`min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 scrollbar-hide ${dense ? "pb-2 pt-0" : "pb-3 pt-0"}`}
            role="tabpanel"
            aria-labelledby={
              tab === "nodes"
                ? "palette-tab-nodes"
                : tab === "simulation"
                  ? "palette-tab-simulation"
                  : "palette-tab-glb"
            }
          >
          {tab === "glb" ? (
            <GlbExtractionTabPanel
              borderColor={borderColor}
              panelColor={panelColor}
              mutedTextColor={mutedTextColor}
              dense={dense}
              parentModelFlowNodeId={parentModelFlowNodeId}
              searchQuery={query}
              state={glbExtraction.state}
              totalRows={glbExtraction.totalRows}
              errorMessage={glbExtraction.errorMessage}
              rows={glbRows}
              placedRowKeys={glbPlacedRowKeys}
              onSpawnGlbExtract={onSpawnGlbExtract}
            />
          ) : activeList.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <Waves className="size-8 text-zinc-600" aria-hidden />
              <p className="max-w-56 text-[12px] text-zinc-500">No blocks match this search or filter.</p>
              <p
                className="text-[10px] text-zinc-600"
                style={mutedTextColor != null ? { color: mutedTextColor } : undefined}
              >
                Try another keyword or reset filters.
              </p>
              {paletteFilterActive ? (
                <button
                  type="button"
                  onClick={resetPaletteFilters}
                  className="rounded-lg border border-zinc-600/70 bg-zinc-900/60 px-3 py-1.5 text-[11px] font-medium text-zinc-200 transition-colors hover:border-cyan-500/40 hover:bg-zinc-800/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/35"
                  style={{ borderColor }}
                >
                  Reset filters
                </button>
              ) : null}
            </div>
          ) : tab === "simulation" ? (
            <div className={dense ? "space-y-1 pt-2" : "space-y-2 pt-3"}>
              {activeList.map((entry) => (
                <LibraryEntryRow
                  key={entry.id}
                  entry={entry}
                  borderColor={borderColor}
                  onAddNode={onAddNode}
                  categoryAccent={entryAccent(entry)}
                />
              ))}
            </div>
          ) : categoryFilter === "all" ? (
            <div className={dense ? "space-y-4 pt-2" : "space-y-6 pt-3"}>
              {CATEGORY_ORDER.map((c) => renderCategoryBlock(c))}
            </div>
          ) : categoryFilter === "input" ? (
            <div className={dense ? "space-y-1.5 pt-2" : "space-y-2 pt-3"}>{renderInputSections()}</div>
          ) : (
            <div className={dense ? "space-y-0.5 pt-2" : "space-y-1 pt-3"}>
              {(groupedByCategory.get(categoryFilter) ?? []).map((entry) => (
                <LibraryEntryRow
                  key={entry.id}
                  entry={entry}
                  borderColor={borderColor}
                  onAddNode={onAddNode}
                  categoryAccent={entryAccent(entry)}
                />
              ))}
            </div>
          )}
        </div>
        </PaletteDensityProvider>
      </PaletteLiveTickProvider>
    </section>
  );
}
