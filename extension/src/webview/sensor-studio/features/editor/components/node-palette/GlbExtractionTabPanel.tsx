import { useMemo, type ReactNode } from "react";
import { TRNHintText, TRNTooltip } from "../../../../../ui/TRN";
import { studioGlbExtractRowKey, type StudioGltfExtractRow } from "../../gltf/studio-gltf-extract";
import { setStudioGlbExtractDragData } from "./glb-extract-drag";

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
    parentModelFlowNodeId,
    searchQuery,
    state,
    totalRows,
    errorMessage,
    rows,
    onSpawnGlbExtract,
    onSpawnGlbEventPartExtract,
    onSpawnGlbEventAnimExtract,
    onSpawnGlbMaterialTextureExtract,
    onSpawnGlbMaterialColorExtract,
    placedRowKeys,
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

  const rowButtonClass = dense
    ? "flex w-full min-w-0 items-center justify-between gap-2 rounded border border-zinc-800/70 bg-zinc-950/40 px-2 py-1 text-left text-[10px] text-zinc-200 transition-colors hover:border-cyan-500/35 hover:bg-zinc-900/60"
    : "flex w-full min-w-0 items-center justify-between gap-2 rounded border border-zinc-800/70 bg-zinc-950/40 px-2 py-1.5 text-left text-[11px] text-zinc-200 transition-colors hover:border-cyan-500/35 hover:bg-zinc-900/60";

  const spawn = (row: StudioGltfExtractRow) => {
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

  return (
    <div className={dense ? "space-y-2 pt-2" : "space-y-3 pt-3"}>
      {parentModelFlowNodeId == null ? (
        <TRNHintText tone="muted" className={dense ? "text-[10px]" : "text-[11px]"}>
          Select exactly one <span className="font-medium text-zinc-300">Model Source</span> flow node on
          the canvas. This tab loads that model and lists clips, lights, cameras, and other
          extractable items.
        </TRNHintText>
      ) : state === "idle" ? (
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
          <TRNHintText tone="muted" className={dense ? "text-[10px] leading-snug" : "text-[11px]"}>
            Click a row to add a linked drive block tagged with this model reference, or drag onto
            the canvas. <span className="font-medium text-zinc-300">Materials</span> spawn{" "}
            <span className="font-medium text-zinc-300">Material Property</span> (PBR scalars); use{" "}
            <span className="font-medium text-cyan-200/90">Tex</span> for{" "}
            <span className="font-medium text-zinc-300">Material Texture</span> (map swap). For{" "}
            <span className="font-medium text-zinc-300">Parts</span>, use{" "}
            <span className="font-medium text-amber-200/90">Evt</span> for{" "}
            <span className="font-medium text-zinc-300">Toggle Model Part</span>; for{" "}
            <span className="font-medium text-zinc-300">Animations</span>, **Evt** adds{" "}
            <span className="font-medium text-zinc-300">Play Animation</span>. With a linked{" "}
            <span className="font-medium text-zinc-300">Model Viewer</span> (same model), live
            values drive morph, light, animation, part visibility (&gt; 0.5), material PBR +
            texture maps, and camera pose (strongest drive &gt; 0.5) in the preview.
          </TRNHintText>
          {searchQuery.trim().length > 0 && filteredTotal === 0 ? (
            <p className="text-center text-[11px] text-zinc-500">No model entries match this search.</p>
          ) : null}
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
                    const hasEventSpawn =
                      (row.kind === "part" && onSpawnGlbEventPartExtract != null) ||
                      (row.kind === "animation" && onSpawnGlbEventAnimExtract != null);
                    const hasTextureSpawn =
                      row.kind === "material" && onSpawnGlbMaterialTextureExtract != null;
                    const hasColorSpawn =
                      row.kind === "material" && onSpawnGlbMaterialColorExtract != null;
                    const hasSideSpawn = hasEventSpawn || hasTextureSpawn || hasColorSpawn;
                    return (
                      <div key={rowKey} className="min-w-0">
                        <div className="flex min-w-0 items-stretch gap-1">
                          <button
                            type="button"
                            draggable={parentModelFlowNodeId != null}
                            className={
                              rowButtonClass +
                              (placed ? " border-emerald-900/50 bg-emerald-950/15" : "") +
                              (hasSideSpawn ? " flex-1" : " w-full")
                            }
                            style={{ borderColor }}
                            onClick={() => {
                              spawn(row);
                            }}
                            onDragStart={(e) => {
                              if (parentModelFlowNodeId == null) {
                                return;
                              }
                              setStudioGlbExtractDragData(e.dataTransfer, {
                                v: 1,
                                parentModelFlowNodeId,
                                kind: row.kind,
                                glbRef: row.ref,
                                label: row.label,
                              });
                            }}
                          >
                            <span className="min-w-0 flex-1 truncate font-medium">{row.label}</span>
                            <span className="flex shrink-0 items-center gap-1">
                              {placed ? (
                                <span className="rounded bg-emerald-950/70 px-1 py-px text-[8px] font-semibold uppercase tracking-wide text-emerald-200/90">
                                  Placed
                                </span>
                              ) : null}
                              <span className="font-mono text-[9px] uppercase text-zinc-500">
                                {row.kind}
                              </span>
                            </span>
                          </button>
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
        </>
      ) : null}
    </div>
  );
}
