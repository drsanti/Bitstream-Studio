import { useMemo } from "react";
import { TRNHintText } from "../../../../../ui/TRN";
import { studioGlbExtractRowKey, type StudioGltfExtractRow } from "../../gltf/studio-gltf-extract";
import { setStudioGlbExtractDragData } from "./glb-extract-drag";

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

  return (
    <div className={dense ? "space-y-2 pt-2" : "space-y-3 pt-3"}>
      {parentModelFlowNodeId == null ? (
        <TRNHintText tone="muted" className={dense ? "text-[10px]" : "text-[11px]"}>
          Select exactly one <span className="font-medium text-zinc-300">Model</span> flow node on
          the canvas. This tab loads that model&apos;s GLB and lists clips, lights, cameras, and other
          extractable items (same idea as node-animator&apos;s scene graph palette).
        </TRNHintText>
      ) : state === "idle" ? (
        <TRNHintText tone="muted" className={dense ? "text-[10px]" : "text-[11px]"}>
          The selected Model has no resolved URL yet. Pick a catalog GLB on the Model node first.
        </TRNHintText>
      ) : null}

      {parentModelFlowNodeId != null && state === "loading" ? (
        <div className="rounded border border-zinc-800/80 bg-zinc-950/50 px-2 py-3 text-center text-[11px] text-zinc-400">
          Loading GLB…
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
            Click a row to add a linked <span className="font-medium text-zinc-300">Number</span>{" "}
            block (placeholder value 0) tagged with this GLB reference, or drag onto the canvas.
            With a linked <span className="font-medium text-zinc-300">Model viewer</span> (same
            Model), live values drive{" "}
            <span className="font-medium text-zinc-300">morph</span>,{" "}
            <span className="font-medium text-zinc-300">light</span>,{" "}
            <span className="font-medium text-zinc-300">animation</span>,{" "}
            <span className="font-medium text-zinc-300">part</span> visibility (&gt; 0.5),{" "}
            <span className="font-medium text-zinc-300">material</span> emissive intensity, and{" "}
            <span className="font-medium text-zinc-300">camera</span> pose (strongest drive &gt;
            0.5) in the preview; dropping below 0.5 restores the saved studio camera.{" "}
            <span className="font-medium text-zinc-300">Hybrid</span> /{" "}
            <span className="font-medium text-zinc-300">Strip</span> rig removes embedded GLB
            cameras—use <span className="font-medium text-zinc-300">Keep</span> for camera drives.
          </TRNHintText>
          {searchQuery.trim().length > 0 && filteredTotal === 0 ? (
            <p className="text-center text-[11px] text-zinc-500">No GLB entries match this search.</p>
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
                  <span className="ml-1 tabular-nums text-zinc-500">{list.length}</span>
                </h3>
                <div className={dense ? "space-y-0.5" : "space-y-1"}>
                  {list.map((row) => {
                    const rowKey = studioGlbExtractRowKey(row);
                    const placed = placedRowKeys?.has(rowKey) ?? false;
                    return (
                      <div key={rowKey} className="min-w-0">
                        <button
                          type="button"
                          draggable={parentModelFlowNodeId != null}
                          className={
                            rowButtonClass +
                            (placed ? " border-emerald-900/50 bg-emerald-950/15" : "")
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
