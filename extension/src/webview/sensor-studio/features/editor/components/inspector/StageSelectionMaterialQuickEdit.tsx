import type { Edge } from "@xyflow/react";
import { Palette } from "lucide-react";
import { useMemo } from "react";
import { TRNColorRingPicker, TRNHintText } from "../../../../../ui/TRN";
import type { SceneObjectRefV1 } from "../../../../core/stage/scene-object-ref";
import { resolveStageSceneMaterialWriteTargetForSelection } from "../../../../core/stage/stage-scene-material-write";
import type { FlowGraphNode } from "../../store/flow-graph-types";
import { useFlowEditorStore } from "../../store/flow-editor.store";
import {
  MESH_MATERIAL_COLOR_HEX_KEY,
  MESH_MATERIAL_METALNESS_KEY,
  MESH_MATERIAL_OPACITY_KEY,
  MESH_MATERIAL_ROUGHNESS_KEY,
  meshMaterialKindLabel,
} from "../../nodes/material/mesh-material-config";
import { InspectorNumericScrubRow } from "./InspectorNumericScrubRow";

export type StageSelectionMaterialQuickEditProps = {
  selection: SceneObjectRefV1;
  nodes: readonly FlowGraphNode[];
  edges: readonly Edge[];
  /** When true, omit outer card chrome (nested in Stage object inspector). */
  embedded?: boolean;
};

function readNumber(dc: Record<string, unknown>, key: string, fallback: number): number {
  const raw = dc[key];
  return typeof raw === "number" && Number.isFinite(raw) ? raw : fallback;
}

function readHex(dc: Record<string, unknown>): string {
  const raw = dc[MESH_MATERIAL_COLOR_HEX_KEY];
  return typeof raw === "string" && /^#[0-9a-fA-F]{6}$/.test(raw.trim())
    ? raw.trim()
    : "#ffffff";
}

export function StageSelectionMaterialQuickEdit(props: StageSelectionMaterialQuickEditProps) {
  const { selection, nodes, edges, embedded = false } = props;
  const updateField = useFlowEditorStore((s) => s.updateNodeConfigFieldByNodeId);
  const selectStudioNodesByIds = useFlowEditorStore((s) => s.selectStudioNodesByIds);

  const target = useMemo(
    () =>
      selection.kind === "procedural"
        ? resolveStageSceneMaterialWriteTargetForSelection({
            selection,
            nodes,
            edges,
          })
        : null,
    [edges, nodes, selection],
  );

  const materialNode = useMemo(
    () =>
      target != null ? nodes.find((n) => n.id === target.materialNodeId) ?? null : null,
    [nodes, target],
  );

  if (target == null || materialNode == null || materialNode.type !== "studio") {
    return (
      <div className={embedded ? "" : "mt-2 rounded-md border border-zinc-800/80 bg-zinc-950/35 px-2 py-2"}>
        <TRNHintText>
          Wire a <span className="text-zinc-300">Mesh Material</span> node into the mesh{" "}
          <span className="text-zinc-300">Material</span> input to quick-edit color here.
        </TRNHintText>
      </div>
    );
  }

  const dc = materialNode.data.defaultConfig as Record<string, unknown>;
  const hex = readHex(dc);
  const opacity = readNumber(dc, MESH_MATERIAL_OPACITY_KEY, 1);
  const roughness = readNumber(dc, MESH_MATERIAL_ROUGHNESS_KEY, 0.5);
  const metalness = readNumber(dc, MESH_MATERIAL_METALNESS_KEY, 0);
  const showPbr = target.kind === "standard" || target.kind === "physical";

  return (
    <div
      className={
        embedded
          ? "space-y-2"
          : "mt-2 space-y-2 rounded-md border border-violet-800/45 bg-violet-950/20 px-2 py-2"
      }
    >
      <div className="flex items-center justify-between gap-2">
        {embedded ? (
          <p className="truncate text-[10px] text-zinc-500">
            {meshMaterialKindLabel(target.kind)} ·{" "}
            <button
              type="button"
              className="text-violet-300/90 underline-offset-2 hover:text-violet-200 hover:underline"
              onClick={() => selectStudioNodesByIds([target.materialNodeId])}
            >
              {target.label}
            </button>
          </p>
        ) : (
          <>
            <div className="flex min-w-0 items-center gap-1.5">
              <Palette size={12} className="shrink-0 text-violet-300/90" aria-hidden />
              <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-violet-200/90">
                Material
              </p>
            </div>
            <button
              type="button"
              className="shrink-0 truncate text-[10px] text-violet-300/80 underline-offset-2 hover:text-violet-200 hover:underline"
              onClick={() => selectStudioNodesByIds([target.materialNodeId])}
            >
              {target.label}
            </button>
          </>
        )}
      </div>
      {embedded ? null : (
        <p className="text-[10px] text-zinc-500">
          {meshMaterialKindLabel(target.kind)} · updates upstream material node
        </p>
      )}
      <TRNColorRingPicker
        ariaLabel="Stage selection mesh material color"
        valueHex={hex}
        onValueHexChange={(nextHex) => {
          updateField(target.materialNodeId, MESH_MATERIAL_COLOR_HEX_KEY, nextHex.trim());
        }}
      />
      <InspectorNumericScrubRow
        label="Opacity"
        ariaLabel="Stage selection mesh material opacity"
        value={opacity}
        min={0}
        max={1}
        step={0.01}
        onCommit={(next) =>
          updateField(target.materialNodeId, MESH_MATERIAL_OPACITY_KEY, next)
        }
      />
      {showPbr ? (
        <>
          <InspectorNumericScrubRow
            label="Roughness"
            ariaLabel="Stage selection mesh material roughness"
            value={roughness}
            min={0}
            max={1}
            step={0.01}
            onCommit={(next) =>
              updateField(target.materialNodeId, MESH_MATERIAL_ROUGHNESS_KEY, next)
            }
          />
          <InspectorNumericScrubRow
            label="Metalness"
            ariaLabel="Stage selection mesh material metalness"
            value={metalness}
            min={0}
            max={1}
            step={0.01}
            onCommit={(next) =>
              updateField(target.materialNodeId, MESH_MATERIAL_METALNESS_KEY, next)
            }
          />
        </>
      ) : null}
    </div>
  );
}
