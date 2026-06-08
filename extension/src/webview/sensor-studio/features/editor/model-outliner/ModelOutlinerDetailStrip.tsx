import { Box, Layers, MapPin, Move3d } from "lucide-react";
import type { StageViewportPickDetail } from "../../../core/viewport/studio-viewport-stage-multi-models";
import { TRNButton, TRNHintText } from "../../../../ui/TRN";
import { materialTextureSlotLabel } from "../gltf/studio-glb-material-texture";
import type {
  StudioGltfMaterialDetail,
  StudioGltfObjectDetail,
} from "../gltf/studio-gltf-extract";
import type { StudioGltfExtractRow } from "../gltf/studio-gltf-extract";
import { studioGlbExtractRowKey } from "../gltf/studio-gltf-extract";
import { InspectorCollapsibleSection } from "../components/inspector/InspectorCollapsibleSection";
import { formatStudioGltfVec3 } from "./model-outliner-object-detail";

export type ModelOutlinerModelSummary = {
  modelLabel: string;
  animationCount: number;
  partCount: number;
  materialCount: number;
  morphCount: number;
  lightCount: number;
  cameraCount: number;
};

export type ModelOutlinerDetailStripProps = {
  borderColor: string;
  modelSummary: ModelOutlinerModelSummary | null;
  selectedRow: StudioGltfExtractRow | null;
  stagePick: StageViewportPickDetail | null;
  objectDetail: StudioGltfObjectDetail | null;
  materialDetail: StudioGltfMaterialDetail | null;
  resolvedPath: string | null;
  placed: boolean;
  onSpawn?: () => void;
  spawnDisabled?: boolean;
};

function SummaryCount(props: { label: string; value: number }) {
  return (
    <div className="rounded border border-zinc-800/70 bg-zinc-950/40 px-2 py-1.5 text-center">
      <div className="text-[11px] font-medium text-zinc-100">{props.value}</div>
      <div className="text-[8px] uppercase tracking-wide text-zinc-500">{props.label}</div>
    </div>
  );
}

function formatHitPoint(pick: StageViewportPickDetail): string {
  const { x, y, z } = pick.hitPoint;
  return `${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)}`;
}

function DetailRow(props: { label: string; value: string }) {
  return (
    <div className="text-[10px] text-zinc-500">
      {props.label} <span className="text-zinc-300">{props.value}</span>
    </div>
  );
}

function TransformAxisGrid(props: {
  rows: { label: string; x: number; y: number; z: number; suffix?: string }[];
  digits?: number;
}) {
  const digits = props.digits ?? 2;
  return (
    <div className="space-y-1">
      <div className="grid grid-cols-[3.25rem_repeat(3,minmax(0,1fr))] gap-x-1 text-[9px] uppercase tracking-wide text-zinc-600">
        <span aria-hidden />
        <span className="text-center">X</span>
        <span className="text-center">Y</span>
        <span className="text-center">Z</span>
      </div>
      {props.rows.map((row) => {
        const suffix = row.suffix ?? "";
        return (
          <div
            key={row.label}
            className="grid grid-cols-[3.25rem_repeat(3,minmax(0,1fr))] gap-x-1 text-[10px]"
          >
            <span className="text-zinc-500">{row.label}</span>
            <span className="truncate text-center text-zinc-200">
              {row.x.toFixed(digits)}
              {suffix}
            </span>
            <span className="truncate text-center text-zinc-200">
              {row.y.toFixed(digits)}
              {suffix}
            </span>
            <span className="truncate text-center text-zinc-200">
              {row.z.toFixed(digits)}
              {suffix}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function ModelOutlinerDetailStrip(props: ModelOutlinerDetailStripProps) {
  const {
    borderColor,
    modelSummary,
    selectedRow,
    stagePick,
    objectDetail,
    materialDetail,
    resolvedPath,
    placed,
    onSpawn,
    spawnDisabled,
  } = props;

  const headerLabel =
    selectedRow?.label ??
    (stagePick != null ? stagePick.objectPath.split("/").pop() ?? stagePick.objectPath : null);

  if (selectedRow == null && stagePick == null) {
    return (
      <div className="space-y-2 px-2 py-2">
        {modelSummary != null ? (
          <>
            <div className="truncate text-[11px] font-medium text-zinc-200">{modelSummary.modelLabel}</div>
            <div className="grid grid-cols-3 gap-1">
              <SummaryCount label="Anim" value={modelSummary.animationCount} />
              <SummaryCount label="Parts" value={modelSummary.partCount} />
              <SummaryCount label="Mat" value={modelSummary.materialCount} />
              <SummaryCount label="Morph" value={modelSummary.morphCount} />
              <SummaryCount label="Light" value={modelSummary.lightCount} />
              <SummaryCount label="Cam" value={modelSummary.cameraCount} />
            </div>
          </>
        ) : null}
        <TRNHintText tone="muted" className="text-[10px] leading-snug">
          Click a row to inspect it, use **+** or double-click to spawn, or pick an object in Stage.
          In **Folders** or filtered lists, focus the list and use **↑ ↓** to move, **Enter** to select.
          In **Hierarchy**, use **← →** to collapse/expand branches.
        </TRNHintText>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-2 py-2 scrollbar-hide">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-[11px] font-medium text-zinc-100">
            {headerLabel ?? "Selection"}
          </div>
          {selectedRow != null ? (
            <div className="mt-0.5 text-[9px] uppercase tracking-wide text-zinc-500">
              {selectedRow.kind}
            </div>
          ) : null}
        </div>
        {placed ? (
          <span className="shrink-0 rounded bg-emerald-950/70 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-emerald-200/90">
            Placed
          </span>
        ) : null}
      </div>

      {selectedRow != null ? (
        <InspectorCollapsibleSection
          title="Flow"
          icon={<Box className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
          defaultExpanded
          scopeBadge={null}
        >
          <div className="space-y-1">
            <DetailRow label="Ref" value={selectedRow.ref} />
            {selectedRow.kind === "animation" && selectedRow.durationS != null ? (
              <DetailRow label="Duration" value={`${selectedRow.durationS.toFixed(2)}s`} />
            ) : null}
            <DetailRow label="Key" value={studioGlbExtractRowKey(selectedRow)} />
            {onSpawn != null ? (
              <TRNButton
                type="button"
                size="compact"
                className="mt-1 w-full justify-center text-[10px]"
                disabled={spawnDisabled}
                hint="Spawn a linked flow node for this extract row."
                onClick={onSpawn}
              >
                Spawn linked node
              </TRNButton>
            ) : null}
          </div>
        </InspectorCollapsibleSection>
      ) : null}

      {resolvedPath != null && selectedRow == null ? (
        <InspectorCollapsibleSection
          title="Scene"
          icon={<MapPin className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
          defaultExpanded
          scopeBadge={null}
        >
          <DetailRow label="Path" value={resolvedPath} />
        </InspectorCollapsibleSection>
      ) : null}

      {objectDetail != null ? (
        <InspectorCollapsibleSection
          title="Transform"
          icon={<Move3d className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
          iconHint="Local transform from GLB introspection (read-only)."
          defaultExpanded
          scopeBadge={null}
        >
          <TransformAxisGrid
            rows={[
              {
                label: "Loc",
                ...objectDetail.transform.position,
              },
              {
                label: "Rot",
                ...objectDetail.transform.rotationDeg,
                suffix: "°",
              },
              {
                label: "Scl",
                ...objectDetail.transform.scale,
              },
            ]}
          />
          {objectDetail.materialSlotNames.length > 0 ? (
            <div className="mt-2 border-t border-zinc-800/60 pt-1.5">
              <DetailRow label="Materials" value={objectDetail.materialSlotNames.join(", ")} />
            </div>
          ) : null}
          {objectDetail.morphTargetNames.length > 0 ? (
            <DetailRow label="Morphs" value={objectDetail.morphTargetNames.join(", ")} />
          ) : null}
        </InspectorCollapsibleSection>
      ) : null}

      {materialDetail != null ? (
        <InspectorCollapsibleSection
          title="Material"
          icon={<Layers className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
          defaultExpanded={objectDetail == null}
          scopeBadge={null}
        >
          <div className="space-y-1">
            <DetailRow label="Name" value={materialDetail.name} />
            {materialDetail.metalness != null ? (
              <DetailRow label="Metalness" value={materialDetail.metalness.toFixed(2)} />
            ) : null}
            {materialDetail.roughness != null ? (
              <DetailRow label="Roughness" value={materialDetail.roughness.toFixed(2)} />
            ) : null}
            {materialDetail.occupiedTextureSlots.length > 0 ? (
              <DetailRow
                label="Textures"
                value={materialDetail.occupiedTextureSlots.map(materialTextureSlotLabel).join(", ")}
              />
            ) : null}
            {materialDetail.usedOnMeshPaths.length > 0 ? (
              <DetailRow
                label="Meshes"
                value={
                  materialDetail.usedOnMeshPaths.length > 2
                    ? `${materialDetail.usedOnMeshPaths.slice(0, 2).join(", ")} +${materialDetail.usedOnMeshPaths.length - 2}`
                    : materialDetail.usedOnMeshPaths.join(", ")
                }
              />
            ) : null}
          </div>
        </InspectorCollapsibleSection>
      ) : null}

      {stagePick != null ? (
        <InspectorCollapsibleSection
          title="Stage pick"
          icon={<MapPin className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
          defaultExpanded={selectedRow == null && objectDetail == null}
          scopeBadge={null}
        >
          <div className="space-y-1">
            <DetailRow label="Path" value={stagePick.objectPath} />
            <DetailRow label="Hit" value={formatHitPoint(stagePick)} />
          </div>
        </InspectorCollapsibleSection>
      ) : null}
    </div>
  );
}
