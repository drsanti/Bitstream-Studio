import { Plus } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { TRNHintText, TRNTooltip } from "../../../../../ui/TRN";
import { studioGlbExtractRowKey, type StudioGltfExtractRow } from "../../gltf/studio-gltf-extract";
import {
  modelOutlinerExtractRowClass,
  modelOutlinerLegacyExtractRowClass,
  resolveExtractRowIcon,
} from "../../model-outliner/model-outliner-tree-chrome";
import {
  extractListRowKey,
  flattenExtractListRows,
} from "../../model-outliner/model-outliner-extract-list-nav";
import { ModelOutlinerSearchHighlight } from "../../model-outliner/model-outliner-search-highlight";
import { setStudioGlbExtractDragData } from "./glb-extract-drag";
import type { GlbAnimationSetupCombinerMode } from "./glb-animation-setup-combiner";
import { GlbAnimationSetupPanel } from "./GlbAnimationSetupPanel";

function ExtractSpawnHintButton(props: {
  hint: string;
  className: string;
  borderColor: string;
  onClick: () => void;
  children: ReactNode;
}) {
  const { hint, className, borderColor, onClick, children } = props;
  return (
    <TRNTooltip
      placement="top"
      openDelayMs={450}
      triggerWrapper="span"
      triggerAriaLabel={hint}
      content={hint}
      trigger={
        <button type="button" className={className} style={{ borderColor }} onClick={onClick}>
          {children}
        </button>
      }
    />
  );
}

export type GlbExtractionTabPanelProps = {
  borderColor: string;
  panelColor: string;
  mutedTextColor?: string;
  dense: boolean;
  /** Model Outliner — hide the long row-action helper paragraph. */
  suppressRowHints?: boolean;
  /** Model Outliner — flat list rows without bordered cards. */
  compactRows?: boolean;
  /** Hide per-row kind badge when the type filter already scopes the list. */
  hideExtractKindBadge?: boolean;
  parentModelFlowNodeId: string | null;
  searchQuery: string;
  state: "idle" | "loading" | "ok" | "error";
  totalRows: number;
  errorMessage: string | null;
  rows: {
    animations: StudioGltfExtractRow[];
    parts: StudioGltfExtractRow[];
    materials: StudioGltfExtractRow[];
    morphs: StudioGltfExtractRow[];
    lights: StudioGltfExtractRow[];
    cameras: StudioGltfExtractRow[];
  };
  onSpawnGlbExtract?: (args: {
    parentModelFlowNodeId: string;
    row: StudioGltfExtractRow;
  }) => void;
  /** Parts only: spawn **Toggle GLB Part** event action linked to the Model. */
  onSpawnGlbEventPartExtract?: (args: {
    parentModelFlowNodeId: string;
    row: StudioGltfExtractRow;
  }) => void;
  /** Animations only: spawn **Trigger GLB Anim** event action linked to the Model. */
  onSpawnGlbEventAnimExtract?: (args: {
    parentModelFlowNodeId: string;
    row: StudioGltfExtractRow;
  }) => void;
  /** Animations only: spawn **Animation Clip** node linked to the Model. */
  onSpawnGlbAnimationClipExtract?: (args: {
    parentModelFlowNodeId: string;
    row: StudioGltfExtractRow;
  }) => void;
  /** Parts only: spawn **Part Spin** linked to the Model. */
  onSpawnGlbPartSpinExtract?: (args: {
    parentModelFlowNodeId: string;
    row: StudioGltfExtractRow;
  }) => void;
  /** Animations wizard: spawn clip(s) + Merge/Mix/Blend + Model Viewer. */
  onBuildGlbAnimationSetup?: (args: {
    parentModelFlowNodeId: string;
    clipRefs: string[];
    combinerMode: GlbAnimationSetupCombinerMode;
  }) => void;
  /** Materials only: spawn **GLB Material Texture** linked to the Model. */
  onSpawnGlbMaterialTextureExtract?: (args: {
    parentModelFlowNodeId: string;
    row: StudioGltfExtractRow;
  }) => void;
  /** Materials only: spawn **GLB Material Color** linked to the Model. */
  onSpawnGlbMaterialColorExtract?: (args: {
    parentModelFlowNodeId: string;
    row: StudioGltfExtractRow;
  }) => void;
  /** Row keys (`kind:ref`) already present as linked GLB placeholders on the flow graph. */
  placedRowKeys?: ReadonlySet<string>;
  /** Model Outliner — highlight the active row. */
  selectedRowKey?: string | null;
  /** Model Outliner — single-click selects instead of spawning. */
  selectOnClick?: boolean;
  onRowSelect?: (row: StudioGltfExtractRow) => void;
  /** Catalog-inline drag when no Model Source parent is bound yet. */
  inlineCatalogAssetId?: string | null;
  /** Model Outliner — unified spawn (parent or inline catalog). */
  onSpawnRow?: (row: StudioGltfExtractRow) => void;
};

const SECTIONS: { key: keyof GlbExtractionTabPanelProps["rows"]; title: string }[] = [
  { key: "animations", title: "Animations" },
  { key: "parts", title: "Parts" },
  { key: "materials", title: "Materials" },
  { key: "morphs", title: "Morphs" },
  { key: "lights", title: "Lights" },
  { key: "cameras", title: "Cameras" },
];

function filterRows(rows: StudioGltfExtractRow[], q: string): StudioGltfExtractRow[] {
  const t = q.trim().toLowerCase();
  if (t.length === 0) {
    return rows;
  }
  return rows.filter(
    (r) =>
      r.label.toLowerCase().includes(t) ||
      r.ref.toLowerCase().includes(t) ||
      r.kind.toLowerCase().includes(t),
  );
}

export function GlbExtractionTabPanel(props: GlbExtractionTabPanelProps) {
  const {
    borderColor,
    panelColor,
    dense,
    suppressRowHints = false,
    compactRows = false,
    hideExtractKindBadge = false,
    parentModelFlowNodeId,
    searchQuery,
    state,
    totalRows,
    errorMessage,
    rows,
    onSpawnGlbExtract,
    onSpawnGlbEventPartExtract,
    onSpawnGlbEventAnimExtract,
    onSpawnGlbAnimationClipExtract,
    onSpawnGlbPartSpinExtract,
    onBuildGlbAnimationSetup,
    onSpawnGlbMaterialTextureExtract,
    onSpawnGlbMaterialColorExtract,
    placedRowKeys,
    selectedRowKey,
    selectOnClick = false,
    onRowSelect,
    inlineCatalogAssetId,
    onSpawnRow,
  } = props;

  const filtered = useMemo(() => {
    const q = searchQuery;
    return {
      animations: filterRows(rows.animations, q),
      parts: filterRows(rows.parts, q),
      materials: filterRows(rows.materials, q),
      morphs: filterRows(rows.morphs, q),
      lights: filterRows(rows.lights, q),
      cameras: filterRows(rows.cameras, q),
    };
  }, [rows, searchQuery]);

  const filteredTotal =
    filtered.animations.length +
    filtered.parts.length +
    filtered.materials.length +
    filtered.morphs.length +
    filtered.lights.length +
    filtered.cameras.length;

  const resolveExtractRowButtonClass = (selected: boolean, placed: boolean, hasSideSpawn: boolean) => {
    const width = hasSideSpawn ? " flex-1" : " w-full";
    if (compactRows) {
      return modelOutlinerExtractRowClass(selected, placed) + width;
    }
    return (
      modelOutlinerLegacyExtractRowClass(dense) +
      (placed ? " border-emerald-900/50 bg-emerald-950/15" : "") +
      (selected ? " border-cyan-700/50 bg-cyan-950/20" : "") +
      width
    );
  };

  const showKindBadge = !hideExtractKindBadge;

  const enableKeyboardNav = compactRows && selectOnClick && onRowSelect != null;
  const flatExtractRows = useMemo(() => flattenExtractListRows(filtered), [filtered]);
  const extractListRef = useRef<HTMLDivElement>(null);
  const extractRowButtonRefs = useRef(new Map<string, HTMLButtonElement>());
  const [focusExtractRowKey, setFocusExtractRowKey] = useState<string | null>(null);

  useEffect(() => {
    if (selectedRowKey != null) {
      setFocusExtractRowKey(selectedRowKey);
    }
  }, [selectedRowKey]);

  const scrollExtractRowIntoView = useCallback((rowKey: string) => {
    extractRowButtonRefs.current.get(rowKey)?.scrollIntoView({ block: "nearest" });
  }, []);

  const activateExtractRow = useCallback(
    (row: StudioGltfExtractRow) => {
      const rowKey = extractListRowKey(row);
      setFocusExtractRowKey(rowKey);
      onRowSelect?.(row);
      scrollExtractRowIntoView(rowKey);
    },
    [onRowSelect, scrollExtractRowIntoView],
  );

  const handleExtractListKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (!enableKeyboardNav || flatExtractRows.length === 0) {
        return;
      }
      if (!["ArrowDown", "ArrowUp", "Enter"].includes(event.key)) {
        return;
      }
      event.preventDefault();

      const currentKey =
        focusExtractRowKey ??
        selectedRowKey ??
        extractListRowKey(flatExtractRows[0]!);
      let index = flatExtractRows.findIndex((row) => extractListRowKey(row) === currentKey);
      if (index < 0) {
        index = 0;
      }

      if (event.key === "ArrowDown") {
        const next = flatExtractRows[Math.min(flatExtractRows.length - 1, index + 1)];
        if (next != null) {
          activateExtractRow(next);
        }
        return;
      }
      if (event.key === "ArrowUp") {
        const next = flatExtractRows[Math.max(0, index - 1)];
        if (next != null) {
          activateExtractRow(next);
        }
        return;
      }
      if (event.key === "Enter") {
        const current = flatExtractRows[index];
        if (current != null) {
          activateExtractRow(current);
        }
      }
    },
    [
      activateExtractRow,
      enableKeyboardNav,
      flatExtractRows,
      focusExtractRowKey,
      selectedRowKey,
    ],
  );

  const spawn = (row: StudioGltfExtractRow) => {
    if (onSpawnRow != null) {
      onSpawnRow(row);
      return;
    }
    if (parentModelFlowNodeId == null || onSpawnGlbExtract == null) {
      return;
    }
    onSpawnGlbExtract({ parentModelFlowNodeId, row });
  };

  const spawnEventPart = (row: StudioGltfExtractRow) => {
    if (parentModelFlowNodeId == null || onSpawnGlbEventPartExtract == null || row.kind !== "part") {
      return;
    }
    onSpawnGlbEventPartExtract({ parentModelFlowNodeId, row });
  };

  const spawnEventAnim = (row: StudioGltfExtractRow) => {
    if (parentModelFlowNodeId == null || onSpawnGlbEventAnimExtract == null || row.kind !== "animation") {
      return;
    }
    onSpawnGlbEventAnimExtract({ parentModelFlowNodeId, row });
  };

  const spawnAnimationClip = (row: StudioGltfExtractRow) => {
    if (
      parentModelFlowNodeId == null ||
      onSpawnGlbAnimationClipExtract == null ||
      row.kind !== "animation"
    ) {
      return;
    }
    onSpawnGlbAnimationClipExtract({ parentModelFlowNodeId, row });
  };

  const spawnPartSpin = (row: StudioGltfExtractRow) => {
    if (
      parentModelFlowNodeId == null ||
      onSpawnGlbPartSpinExtract == null ||
      row.kind !== "part"
    ) {
      return;
    }
    onSpawnGlbPartSpinExtract({ parentModelFlowNodeId, row });
  };

  const spawnMaterialTexture = (row: StudioGltfExtractRow) => {
    if (
      parentModelFlowNodeId == null ||
      onSpawnGlbMaterialTextureExtract == null ||
      row.kind !== "material"
    ) {
      return;
    }
    onSpawnGlbMaterialTextureExtract({ parentModelFlowNodeId, row });
  };

  const spawnMaterialColor = (row: StudioGltfExtractRow) => {
    if (
      parentModelFlowNodeId == null ||
      onSpawnGlbMaterialColorExtract == null ||
      row.kind !== "material"
    ) {
      return;
    }
    onSpawnGlbMaterialColorExtract({ parentModelFlowNodeId, row });
  };

  const textureSpawnButtonClass = dense
    ? "shrink-0 rounded border border-cyan-900/50 bg-cyan-950/25 px-1.5 py-1 text-[9px] font-semibold uppercase tracking-wide text-cyan-100/90 transition-colors hover:border-cyan-500/40 hover:bg-cyan-950/45"
    : "shrink-0 rounded border border-cyan-900/50 bg-cyan-950/25 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-100/90 transition-colors hover:border-cyan-500/40 hover:bg-cyan-950/45";

  const colorSpawnButtonClass = dense
    ? "shrink-0 rounded border border-violet-900/50 bg-violet-950/25 px-1.5 py-1 text-[9px] font-semibold uppercase tracking-wide text-violet-100/90 transition-colors hover:border-violet-500/40 hover:bg-violet-950/45"
    : "shrink-0 rounded border border-violet-900/50 bg-violet-950/25 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-violet-100/90 transition-colors hover:border-violet-500/40 hover:bg-violet-950/45";

  const eventSpawnButtonClass = dense
    ? "shrink-0 rounded border border-amber-900/50 bg-amber-950/25 px-1.5 py-1 text-[9px] font-semibold uppercase tracking-wide text-amber-100/90 transition-colors hover:border-amber-500/40 hover:bg-amber-950/45"
    : "shrink-0 rounded border border-amber-900/50 bg-amber-950/25 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-amber-100/90 transition-colors hover:border-amber-500/40 hover:bg-amber-950/45";

  const clipSpawnButtonClass = dense
    ? "shrink-0 rounded border border-emerald-900/50 bg-emerald-950/25 px-1.5 py-1 text-[9px] font-semibold uppercase tracking-wide text-emerald-100/90 transition-colors hover:border-emerald-500/40 hover:bg-emerald-950/45"
    : "shrink-0 rounded border border-emerald-900/50 bg-emerald-950/25 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-100/90 transition-colors hover:border-emerald-500/40 hover:bg-emerald-950/45";

  const spinSpawnButtonClass = dense
    ? "shrink-0 rounded border border-sky-900/50 bg-sky-950/25 px-1.5 py-1 text-[9px] font-semibold uppercase tracking-wide text-sky-100/90 transition-colors hover:border-sky-500/40 hover:bg-sky-950/45"
    : "shrink-0 rounded border border-sky-900/50 bg-sky-950/25 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-sky-100/90 transition-colors hover:border-sky-500/40 hover:bg-sky-950/45";

  return (
    <div className={dense ? "space-y-2 pt-2" : "space-y-3 pt-3"}>
      {parentModelFlowNodeId == null &&
      (inlineCatalogAssetId?.trim() ?? "").length === 0 &&
      state === "idle" ? (
        <TRNHintText tone="muted" className={dense ? "text-[10px]" : "text-[11px]"}>
          Choose <span className="font-medium text-zinc-300">Canvas Model Source</span> or{" "}
          <span className="font-medium text-zinc-300">Catalog model</span> in the scope dropdown above.
        </TRNHintText>
      ) : parentModelFlowNodeId == null && state === "idle" ? null : state === "idle" ? (
        <TRNHintText tone="muted" className={dense ? "text-[10px]" : "text-[11px]"}>
          The selected model has no resolved URL yet. Pick a catalog model on the Model Source node first.
        </TRNHintText>
      ) : null}

      {parentModelFlowNodeId != null && state === "loading" ? (
        <div className="rounded border border-zinc-800/80 bg-zinc-950/50 px-2 py-3 text-center text-[11px] text-zinc-400">
          Loading model…
        </div>
      ) : null}

      {state === "error" && errorMessage != null ? (
        <div className="rounded border border-rose-900/60 bg-rose-950/30 px-2 py-2 text-[11px] text-rose-200/90">
          {errorMessage}
        </div>
      ) : null}

      {state === "ok" && totalRows === 0 ? (
        <TRNHintText tone="muted" className={dense ? "text-[10px]" : "text-[11px]"}>
          No extractable entries matched the current heuristics (named lights/cameras, materials,
          morphs, animation clips, and parts whose names match rig keywords or{" "}
          <code className="font-mono text-zinc-400">userData.exposeNode</code>).
        </TRNHintText>
      ) : null}

      {state === "ok" && totalRows > 0 ? (
        <>
          {parentModelFlowNodeId != null &&
          onBuildGlbAnimationSetup != null &&
          rows.animations.length > 0 ? (
            <GlbAnimationSetupPanel
              key={`${parentModelFlowNodeId}:${rows.animations.length}`}
              dense={dense}
              borderColor={borderColor}
              animations={rows.animations}
              onBuildSetup={({ clipRefs, combinerMode }) => {
                onBuildGlbAnimationSetup({ parentModelFlowNodeId, clipRefs, combinerMode });
              }}
            />
          ) : null}
          {!suppressRowHints ? (
            <TRNHintText tone="muted" className={dense ? "text-[10px] leading-snug" : "text-[11px]"}>
              Click a row to add a linked drive block tagged with this model reference, or drag onto
              the canvas. <span className="font-medium text-zinc-300">Materials</span> spawn{" "}
              <span className="font-medium text-zinc-300">Material Property</span> (PBR scalars); use{" "}
              <span className="font-medium text-cyan-200/90">Tex</span> for{" "}
              <span className="font-medium text-zinc-300">Material Texture</span> (map swap). For{" "}
              <span className="font-medium text-zinc-300">Parts</span>, use{" "}
              <span className="font-medium text-sky-200/90">Spin</span> for continuous{" "}
              <span className="font-medium text-zinc-300">Part Spin</span>,{" "}
              <span className="font-medium text-amber-200/90">Evt</span> for{" "}
              <span className="font-medium text-zinc-300">Toggle Model Part</span>; for{" "}
              <span className="font-medium text-zinc-300">Animations</span>, **Clip** adds a continuous{" "}
              <span className="font-medium text-zinc-300">Animation Clip</span>, **Evt** adds{" "}
              <span className="font-medium text-zinc-300">Play Animation</span>, or use{" "}
              <span className="font-medium text-emerald-200/90">Build animation graph</span> for a
              wired setup. With a linked{" "}
              <span className="font-medium text-zinc-300">Model Viewer</span> (same model), live
              values drive morph, light, animation, part visibility (&gt; 0.5), material PBR +
              texture maps, and camera pose (strongest drive &gt; 0.5) in the preview.
            </TRNHintText>
          ) : null}
          {searchQuery.trim().length > 0 && filteredTotal === 0 ? (
            <p className="text-center text-[11px] text-zinc-500">No model entries match this search.</p>
          ) : null}
          {enableKeyboardNav ? (
            <div
              ref={extractListRef}
              tabIndex={0}
              role="listbox"
              aria-label="Model extract list"
              className="rounded outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/35"
              onKeyDown={handleExtractListKeyDown}
            >
              {SECTIONS.map((sec) => {
                const list = filtered[sec.key];
                if (list.length === 0) {
                  return null;
                }
                return (
                  <section key={sec.key} className={dense ? "space-y-1" : "space-y-1.5"}>
                    <h3
                      className={`sticky top-0 z-10 -mx-2 mb-1 border-b border-zinc-800/80 px-2 font-semibold uppercase tracking-wide text-zinc-200 ${
                        dense ? "py-1 text-[9px]" : "py-1.5 text-[10px]"
                      }`}
                      style={{ backgroundColor: panelColor, borderColor }}
                    >
                      {sec.title}
                      <span className="ml-1 text-zinc-500">{list.length}</span>
                    </h3>
                    <div className={dense ? "space-y-0.5" : "space-y-1"}>
                      {list.map((row) => {
                        const rowKey = studioGlbExtractRowKey(row);
                        const placed = placedRowKeys?.has(rowKey) ?? false;
                        const selected = selectedRowKey === rowKey;
                        const keyboardFocused =
                          focusExtractRowKey === rowKey && selectedRowKey !== rowKey;
                        const canDrag =
                          parentModelFlowNodeId != null ||
                          (inlineCatalogAssetId != null && inlineCatalogAssetId.trim().length > 0);
                        const hasEventSpawn =
                          (row.kind === "part" && onSpawnGlbEventPartExtract != null) ||
                          (row.kind === "part" && onSpawnGlbPartSpinExtract != null) ||
                          (row.kind === "animation" && onSpawnGlbEventAnimExtract != null);
                        const hasClipSpawn =
                          row.kind === "animation" && onSpawnGlbAnimationClipExtract != null;
                        const hasTextureSpawn =
                          row.kind === "material" && onSpawnGlbMaterialTextureExtract != null;
                        const hasColorSpawn =
                          row.kind === "material" && onSpawnGlbMaterialColorExtract != null;
                        const hasSideSpawn =
                          hasEventSpawn || hasClipSpawn || hasTextureSpawn || hasColorSpawn;
                        const RowIcon = resolveExtractRowIcon(row);
                        const showQuickSpawn = selectOnClick && onSpawnRow != null;
                        return (
                          <div key={rowKey} className="group/row min-w-0">
                            <div className="flex min-w-0 items-stretch gap-1">
                              <button
                                type="button"
                                draggable={canDrag}
                                className={
                                  resolveExtractRowButtonClass(selected, placed, hasSideSpawn) +
                                  (keyboardFocused ? " ring-1 ring-violet-500/40" : "")
                                }
                                style={compactRows ? undefined : { borderColor }}
                                ref={(el) => {
                                  if (el == null) {
                                    extractRowButtonRefs.current.delete(rowKey);
                                    return;
                                  }
                                  extractRowButtonRefs.current.set(rowKey, el);
                                }}
                                onClick={() => {
                                  onRowSelect?.(row);
                                }}
                                onDoubleClick={() => {
                                  spawn(row);
                                }}
                                onDragStart={(e) => {
                                  if (parentModelFlowNodeId != null) {
                                    setStudioGlbExtractDragData(e.dataTransfer, {
                                      v: 1,
                                      parentModelFlowNodeId,
                                      kind: row.kind,
                                      glbRef: row.ref,
                                      label: row.label,
                                    });
                                    return;
                                  }
                                  const inlineId = inlineCatalogAssetId?.trim() ?? "";
                                  if (inlineId.length === 0) {
                                    return;
                                  }
                                  setStudioGlbExtractDragData(e.dataTransfer, {
                                    v: 2,
                                    inlineCatalogAssetId: inlineId,
                                    kind: row.kind,
                                    glbRef: row.ref,
                                    label: row.label,
                                  });
                                }}
                              >
                                {compactRows ? (
                                  <RowIcon className="size-3 shrink-0 text-zinc-500" aria-hidden />
                                ) : null}
                                <span className="min-w-0 flex-1 truncate font-medium">
                                  <ModelOutlinerSearchHighlight text={row.label} query={searchQuery} />
                                </span>
                                <span className="flex shrink-0 items-center gap-1">
                                  {placed ? (
                                    compactRows ? (
                                      <span
                                        className="size-1.5 rounded-full bg-emerald-400/90"
                                        aria-label="Placed on canvas"
                                      />
                                    ) : (
                                      <span className="rounded bg-emerald-950/70 px-1 py-px text-[8px] font-semibold uppercase tracking-wide text-emerald-200/90">
                                        Placed
                                      </span>
                                    )
                                  ) : null}
                                  {showKindBadge ? (
                                    <span className="text-[8px] uppercase tracking-wide text-zinc-500">
                                      {row.kind}
                                    </span>
                                  ) : null}
                                </span>
                              </button>
                              {showQuickSpawn ? (
                                <TRNTooltip
                                  placement="left"
                                  openDelayMs={450}
                                  triggerWrapper="span"
                                  triggerAriaLabel={`Spawn linked node for ${row.label}`}
                                  content="Spawn linked flow node"
                                  trigger={
                                    <button
                                      type="button"
                                      className="flex size-5 shrink-0 items-center justify-center rounded text-zinc-500 opacity-0 transition-opacity hover:bg-zinc-800/70 hover:text-cyan-200 group-hover/row:opacity-100"
                                      onClick={() => {
                                        spawn(row);
                                      }}
                                    >
                                      <Plus className="size-3" aria-hidden />
                                    </button>
                                  }
                                />
                              ) : null}
                              {row.kind === "material" && onSpawnGlbMaterialTextureExtract != null ? (
                                <ExtractSpawnHintButton
                                  hint="Add Material Texture drive for this material"
                                  className={textureSpawnButtonClass}
                                  borderColor={borderColor}
                                  onClick={() => {
                                    spawnMaterialTexture(row);
                                  }}
                                >
                                  Tex
                                </ExtractSpawnHintButton>
                              ) : null}
                              {row.kind === "material" && onSpawnGlbMaterialColorExtract != null ? (
                                <ExtractSpawnHintButton
                                  hint="Add Material Color drive for this material"
                                  className={colorSpawnButtonClass}
                                  borderColor={borderColor}
                                  onClick={() => {
                                    spawnMaterialColor(row);
                                  }}
                                >
                                  Color
                                </ExtractSpawnHintButton>
                              ) : null}
                              {row.kind === "part" && onSpawnGlbPartSpinExtract != null ? (
                                <ExtractSpawnHintButton
                                  hint="Add Part Spin for this part"
                                  className={spinSpawnButtonClass}
                                  borderColor={borderColor}
                                  onClick={() => {
                                    spawnPartSpin(row);
                                  }}
                                >
                                  Spin
                                </ExtractSpawnHintButton>
                              ) : null}
                              {row.kind === "part" && onSpawnGlbEventPartExtract != null ? (
                                <ExtractSpawnHintButton
                                  hint="Add Toggle Model Part event action for this part"
                                  className={eventSpawnButtonClass}
                                  borderColor={borderColor}
                                  onClick={() => {
                                    spawnEventPart(row);
                                  }}
                                >
                                  Evt
                                </ExtractSpawnHintButton>
                              ) : null}
                              {row.kind === "animation" && onSpawnGlbAnimationClipExtract != null ? (
                                <ExtractSpawnHintButton
                                  hint="Add Animation Clip node for this action"
                                  className={clipSpawnButtonClass}
                                  borderColor={borderColor}
                                  onClick={() => {
                                    spawnAnimationClip(row);
                                  }}
                                >
                                  Clip
                                </ExtractSpawnHintButton>
                              ) : null}
                              {row.kind === "animation" && onSpawnGlbEventAnimExtract != null ? (
                                <ExtractSpawnHintButton
                                  hint="Add Play Animation event action for this clip"
                                  className={eventSpawnButtonClass}
                                  borderColor={borderColor}
                                  onClick={() => {
                                    spawnEventAnim(row);
                                  }}
                                >
                                  Evt
                                </ExtractSpawnHintButton>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          ) : (
            SECTIONS.map((sec) => {
            const list = filtered[sec.key];
            if (list.length === 0) {
              return null;
            }
            return (
              <section key={sec.key} className={dense ? "space-y-1" : "space-y-1.5"}>
                <h3
                  className={`sticky top-0 z-10 -mx-2 mb-1 border-b border-zinc-800/80 px-2 font-semibold uppercase tracking-wide text-zinc-200 ${
                    dense ? "py-1 text-[9px]" : "py-1.5 text-[10px]"
                  }`}
                  style={{ backgroundColor: panelColor, borderColor }}
                >
                  {sec.title}
                  <span className="ml-1 text-zinc-500">{list.length}</span>
                </h3>
                <div className={dense ? "space-y-0.5" : "space-y-1"}>
                  {list.map((row) => {
                    const rowKey = studioGlbExtractRowKey(row);
                    const placed = placedRowKeys?.has(rowKey) ?? false;
                    const selected = selectedRowKey === rowKey;
                    const canDrag =
                      parentModelFlowNodeId != null ||
                      (inlineCatalogAssetId != null && inlineCatalogAssetId.trim().length > 0);
                    const hasEventSpawn =
                      (row.kind === "part" && onSpawnGlbEventPartExtract != null) ||
                      (row.kind === "part" && onSpawnGlbPartSpinExtract != null) ||
                      (row.kind === "animation" && onSpawnGlbEventAnimExtract != null);
                    const hasClipSpawn =
                      row.kind === "animation" && onSpawnGlbAnimationClipExtract != null;
                    const hasTextureSpawn =
                      row.kind === "material" && onSpawnGlbMaterialTextureExtract != null;
                    const hasColorSpawn =
                      row.kind === "material" && onSpawnGlbMaterialColorExtract != null;
                    const hasSideSpawn =
                      hasEventSpawn || hasClipSpawn || hasTextureSpawn || hasColorSpawn;
                    const RowIcon = resolveExtractRowIcon(row);
                    const showQuickSpawn = selectOnClick && onSpawnRow != null;
                    return (
                      <div key={rowKey} className="group/row min-w-0">
                        <div className="flex min-w-0 items-stretch gap-1">
                          <button
                            type="button"
                            draggable={canDrag}
                            className={resolveExtractRowButtonClass(selected, placed, hasSideSpawn)}
                            style={compactRows ? undefined : { borderColor }}
                            onClick={() => {
                              if (selectOnClick) {
                                onRowSelect?.(row);
                                return;
                              }
                              spawn(row);
                            }}
                            onDoubleClick={() => {
                              if (selectOnClick) {
                                spawn(row);
                              }
                            }}
                            onDragStart={(e) => {
                              if (parentModelFlowNodeId != null) {
                                setStudioGlbExtractDragData(e.dataTransfer, {
                                  v: 1,
                                  parentModelFlowNodeId,
                                  kind: row.kind,
                                  glbRef: row.ref,
                                  label: row.label,
                                });
                                return;
                              }
                              const inlineId = inlineCatalogAssetId?.trim() ?? "";
                              if (inlineId.length === 0) {
                                return;
                              }
                              setStudioGlbExtractDragData(e.dataTransfer, {
                                v: 2,
                                inlineCatalogAssetId: inlineId,
                                kind: row.kind,
                                glbRef: row.ref,
                                label: row.label,
                              });
                            }}
                          >
                            {compactRows ? (
                              <RowIcon className="size-3 shrink-0 text-zinc-500" aria-hidden />
                            ) : null}
                            <span className="min-w-0 flex-1 truncate font-medium">
                              <ModelOutlinerSearchHighlight text={row.label} query={searchQuery} />
                            </span>
                            <span className="flex shrink-0 items-center gap-1">
                              {placed ? (
                                compactRows ? (
                                  <span
                                    className="size-1.5 rounded-full bg-emerald-400/90"
                                    aria-label="Placed on canvas"
                                  />
                                ) : (
                                  <span className="rounded bg-emerald-950/70 px-1 py-px text-[8px] font-semibold uppercase tracking-wide text-emerald-200/90">
                                    Placed
                                  </span>
                                )
                              ) : null}
                              {showKindBadge ? (
                                <span className="text-[8px] uppercase tracking-wide text-zinc-500">
                                  {row.kind}
                                </span>
                              ) : null}
                            </span>
                          </button>
                          {showQuickSpawn ? (
                            <TRNTooltip
                              placement="left"
                              openDelayMs={450}
                              triggerWrapper="span"
                              triggerAriaLabel={`Spawn linked node for ${row.label}`}
                              content="Spawn linked flow node"
                              trigger={
                                <button
                                  type="button"
                                  className="flex size-5 shrink-0 items-center justify-center rounded text-zinc-500 opacity-0 transition-opacity hover:bg-zinc-800/70 hover:text-cyan-200 group-hover/row:opacity-100"
                                  onClick={() => {
                                    spawn(row);
                                  }}
                                >
                                  <Plus className="size-3" aria-hidden />
                                </button>
                              }
                            />
                          ) : null}
                          {row.kind === "material" && onSpawnGlbMaterialTextureExtract != null ? (
                            <ExtractSpawnHintButton
                              hint="Add Material Texture drive for this material"
                              className={textureSpawnButtonClass}
                              borderColor={borderColor}
                              onClick={() => {
                                spawnMaterialTexture(row);
                              }}
                            >
                              Tex
                            </ExtractSpawnHintButton>
                          ) : null}
                          {row.kind === "material" && onSpawnGlbMaterialColorExtract != null ? (
                            <ExtractSpawnHintButton
                              hint="Add Material Color drive for this material"
                              className={colorSpawnButtonClass}
                              borderColor={borderColor}
                              onClick={() => {
                                spawnMaterialColor(row);
                              }}
                            >
                              Clr
                            </ExtractSpawnHintButton>
                          ) : null}
                          {row.kind === "part" && onSpawnGlbPartSpinExtract != null ? (
                            <ExtractSpawnHintButton
                              hint="Add Part Spin drive for continuous local rotation"
                              className={spinSpawnButtonClass}
                              borderColor={borderColor}
                              onClick={() => {
                                spawnPartSpin(row);
                              }}
                            >
                              Spin
                            </ExtractSpawnHintButton>
                          ) : null}
                          {row.kind === "part" && onSpawnGlbEventPartExtract != null ? (
                            <ExtractSpawnHintButton
                              hint="Add Toggle Model Part event action for this part"
                              className={eventSpawnButtonClass}
                              borderColor={borderColor}
                              onClick={() => {
                                spawnEventPart(row);
                              }}
                            >
                              Evt
                            </ExtractSpawnHintButton>
                          ) : null}
                          {row.kind === "animation" && onSpawnGlbAnimationClipExtract != null ? (
                            <ExtractSpawnHintButton
                              hint="Add Animation Clip node for this action"
                              className={clipSpawnButtonClass}
                              borderColor={borderColor}
                              onClick={() => {
                                spawnAnimationClip(row);
                              }}
                            >
                              Clip
                            </ExtractSpawnHintButton>
                          ) : null}
                          {row.kind === "animation" && onSpawnGlbEventAnimExtract != null ? (
                            <ExtractSpawnHintButton
                              hint="Add Play Animation event action for this clip"
                              className={eventSpawnButtonClass}
                              borderColor={borderColor}
                              onClick={() => {
                                spawnEventAnim(row);
                              }}
                            >
                              Evt
                            </ExtractSpawnHintButton>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })
        )}
        </>
      ) : null}
    </div>
  );
}
