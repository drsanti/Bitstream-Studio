import { Palette } from "lucide-react";
import { TRNColorRingPicker } from "../../../../../ui/TRN";
import { useFlowEditorStore } from "../../store/flow-editor.store";
import { FlowCardScrubNumberField } from "../flow-node/FlowCardScrubNumberField";
import { ReadingPanel } from "../flow-node/readings/ReadingPanel";
import {
  MESH_MATERIAL_COLOR_HEX_KEY,
  MESH_MATERIAL_METALNESS_KEY,
  MESH_MATERIAL_OPACITY_KEY,
  MESH_MATERIAL_ROUGHNESS_KEY,
  meshMaterialKindForNodeId,
  meshMaterialKindLabel,
  type MeshMaterialKindV1,
} from "./mesh-material-config";

export type MeshMaterialNodePanelProps = {
  nodeId: string;
  catalogNodeId: string;
  defaultConfig: Record<string, unknown>;
};

function readNumber(dc: Record<string, unknown>, key: string, fallback: number): number {
  const raw = dc[key];
  return typeof raw === "number" && Number.isFinite(raw) ? raw : fallback;
}

function readHex(dc: Record<string, unknown>): string {
  const raw = dc[MESH_MATERIAL_COLOR_HEX_KEY];
  return typeof raw === "string" && raw.trim().length > 0 ? raw.trim() : "#ffffff";
}

/** Compact canvas body for **Basic Material** / **Standard Material**. */
export function MeshMaterialNodePanel(props: MeshMaterialNodePanelProps) {
  const { nodeId, catalogNodeId, defaultConfig } = props;
  const updateField = useFlowEditorStore((s) => s.updateNodeConfigFieldByNodeId);
  const kind: MeshMaterialKindV1 =
    meshMaterialKindForNodeId(catalogNodeId) ?? "standard";
  const hex = readHex(defaultConfig);
  const opacity = readNumber(defaultConfig, MESH_MATERIAL_OPACITY_KEY, 1);
  const roughness = readNumber(defaultConfig, MESH_MATERIAL_ROUGHNESS_KEY, 0.5);
  const metalness = readNumber(defaultConfig, MESH_MATERIAL_METALNESS_KEY, 0);

  return (
    <ReadingPanel className="nodrag space-y-2 px-2 pb-2 pt-1">
      <div className="flex items-center gap-1 text-[9px] text-zinc-500">
        <Palette className="h-2.5 w-2.5 shrink-0" aria-hidden />
        <span>{meshMaterialKindLabel(kind)} material</span>
      </div>
      <TRNColorRingPicker
        ariaLabel="Mesh material color"
        valueHex={hex}
        onValueHexChange={(nextHex) => {
          updateField(nodeId, MESH_MATERIAL_COLOR_HEX_KEY, nextHex.trim());
        }}
      />
      <FlowCardScrubNumberField
        ariaLabel="Material opacity"
        value={opacity}
        min={0}
        max={1}
        step={0.01}
        fractionDigits={2}
        onCommit={(next) => updateField(nodeId, MESH_MATERIAL_OPACITY_KEY, next)}
      />
      {kind === "standard" || kind === "physical" ? (
        <>
          <FlowCardScrubNumberField
            ariaLabel="Material roughness"
            value={roughness}
            min={0}
            max={1}
            step={0.01}
            fractionDigits={2}
            onCommit={(next) => updateField(nodeId, MESH_MATERIAL_ROUGHNESS_KEY, next)}
          />
          <FlowCardScrubNumberField
            ariaLabel="Material metalness"
            value={metalness}
            min={0}
            max={1}
            step={0.01}
            fractionDigits={2}
            onCommit={(next) => updateField(nodeId, MESH_MATERIAL_METALNESS_KEY, next)}
          />
        </>
      ) : null}
      <div className="flex flex-wrap items-center gap-1.5 text-[9px]">
        <span className="rounded bg-zinc-900/60 px-1 py-px text-zinc-500">{hex}</span>
        <span className="rounded bg-zinc-900/60 px-1 py-px text-zinc-500">
          α {opacity.toFixed(2)}
        </span>
        {kind === "standard" || kind === "physical" ? (
          <>
            <span className="rounded bg-zinc-900/60 px-1 py-px text-zinc-500">
              r {roughness.toFixed(2)}
            </span>
            <span className="rounded bg-zinc-900/60 px-1 py-px text-zinc-500">
              m {metalness.toFixed(2)}
            </span>
          </>
        ) : null}
      </div>
    </ReadingPanel>
  );
}
