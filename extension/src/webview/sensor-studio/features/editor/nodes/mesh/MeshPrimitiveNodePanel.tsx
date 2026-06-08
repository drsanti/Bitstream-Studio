import { Box, Circle, Cone, Cylinder, LifeBuoy, Pill, Square } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useFlowEditorStore } from "../../store/flow-editor.store";
import { FlowCardScrubNumberField } from "../flow-node/FlowCardScrubNumberField";
import { ReadingPanel } from "../flow-node/readings/ReadingPanel";
import {
  MESH_BOX_DEPTH_KEY,
  MESH_BOX_HEIGHT_KEY,
  MESH_BOX_WIDTH_KEY,
  MESH_CAPSULE_CAP_SEGMENTS_KEY,
  MESH_CAPSULE_LENGTH_KEY,
  MESH_CAPSULE_RADIUS_KEY,
  MESH_CAPSULE_RADIAL_SEGMENTS_KEY,
  MESH_CONE_HEIGHT_KEY,
  MESH_CONE_RADIUS_KEY,
  MESH_CONE_RADIAL_SEGMENTS_KEY,
  MESH_CYLINDER_HEIGHT_KEY,
  MESH_CYLINDER_RADIUS_BOTTOM_KEY,
  MESH_CYLINDER_RADIUS_TOP_KEY,
  MESH_CYLINDER_RADIAL_SEGMENTS_KEY,
  MESH_PLANE_HEIGHT_KEY,
  MESH_PLANE_WIDTH_KEY,
  MESH_SPHERE_HEIGHT_SEGMENTS_KEY,
  MESH_SPHERE_RADIUS_KEY,
  MESH_SPHERE_WIDTH_SEGMENTS_KEY,
  MESH_TORUS_RADIUS_KEY,
  MESH_TORUS_RADIAL_SEGMENTS_KEY,
  MESH_TORUS_TUBE_KEY,
  MESH_TORUS_TUBULAR_SEGMENTS_KEY,
  meshPrimitiveKindForNodeId,
  meshPrimitiveKindLabel,
  type MeshPrimitiveKindV1,
} from "./mesh-primitive-config";

export type MeshPrimitiveNodePanelProps = {
  nodeId: string;
  catalogNodeId: string;
  defaultConfig: Record<string, unknown>;
};

const KIND_ICON: Record<MeshPrimitiveKindV1, LucideIcon> = {
  box: Box,
  sphere: Circle,
  plane: Square,
  cylinder: Cylinder,
  cone: Cone,
  torus: LifeBuoy,
  capsule: Pill,
};

function readNumber(dc: Record<string, unknown>, key: string, fallback: number): number {
  const raw = dc[key];
  return typeof raw === "number" && Number.isFinite(raw) ? raw : fallback;
}

/** Compact canvas body for procedural mesh primitive nodes. */
export function MeshPrimitiveNodePanel(props: MeshPrimitiveNodePanelProps) {
  const { nodeId, catalogNodeId, defaultConfig } = props;
  const updateField = useFlowEditorStore((s) => s.updateNodeConfigFieldByNodeId);
  const kind = meshPrimitiveKindForNodeId(catalogNodeId) ?? "box";
  const Icon = KIND_ICON[kind];

  return (
    <ReadingPanel className="nodrag space-y-2 px-2 pb-2 pt-1">
      <div className="flex items-center gap-1 text-[9px] text-zinc-500">
        <Icon className="h-2.5 w-2.5 shrink-0" aria-hidden />
        <span>{meshPrimitiveKindLabel(kind)} mesh</span>
      </div>
      {kind === "box" ? (
        <>
          <FlowCardScrubNumberField
            ariaLabel="Box width"
            value={readNumber(defaultConfig, MESH_BOX_WIDTH_KEY, 1)}
            min={0.01}
            max={100}
            step={0.05}
            fractionDigits={2}
            onCommit={(next) => updateField(nodeId, MESH_BOX_WIDTH_KEY, next)}
          />
          <FlowCardScrubNumberField
            ariaLabel="Box height"
            value={readNumber(defaultConfig, MESH_BOX_HEIGHT_KEY, 1)}
            min={0.01}
            max={100}
            step={0.05}
            fractionDigits={2}
            onCommit={(next) => updateField(nodeId, MESH_BOX_HEIGHT_KEY, next)}
          />
          <FlowCardScrubNumberField
            ariaLabel="Box depth"
            value={readNumber(defaultConfig, MESH_BOX_DEPTH_KEY, 1)}
            min={0.01}
            max={100}
            step={0.05}
            fractionDigits={2}
            onCommit={(next) => updateField(nodeId, MESH_BOX_DEPTH_KEY, next)}
          />
        </>
      ) : null}
      {kind === "sphere" ? (
        <>
          <FlowCardScrubNumberField
            ariaLabel="Sphere radius"
            value={readNumber(defaultConfig, MESH_SPHERE_RADIUS_KEY, 0.5)}
            min={0.01}
            max={50}
            step={0.05}
            fractionDigits={2}
            onCommit={(next) => updateField(nodeId, MESH_SPHERE_RADIUS_KEY, next)}
          />
          <FlowCardScrubNumberField
            ariaLabel="Sphere width segments"
            value={readNumber(defaultConfig, MESH_SPHERE_WIDTH_SEGMENTS_KEY, 32)}
            min={3}
            max={128}
            step={1}
            fractionDigits={0}
            onCommit={(next) =>
              updateField(nodeId, MESH_SPHERE_WIDTH_SEGMENTS_KEY, Math.round(next))
            }
          />
          <FlowCardScrubNumberField
            ariaLabel="Sphere height segments"
            value={readNumber(defaultConfig, MESH_SPHERE_HEIGHT_SEGMENTS_KEY, 16)}
            min={3}
            max={128}
            step={1}
            fractionDigits={0}
            onCommit={(next) =>
              updateField(nodeId, MESH_SPHERE_HEIGHT_SEGMENTS_KEY, Math.round(next))
            }
          />
        </>
      ) : null}
      {kind === "plane" ? (
        <>
          <FlowCardScrubNumberField
            ariaLabel="Plane width"
            value={readNumber(defaultConfig, MESH_PLANE_WIDTH_KEY, 1)}
            min={0.01}
            max={100}
            step={0.05}
            fractionDigits={2}
            onCommit={(next) => updateField(nodeId, MESH_PLANE_WIDTH_KEY, next)}
          />
          <FlowCardScrubNumberField
            ariaLabel="Plane height"
            value={readNumber(defaultConfig, MESH_PLANE_HEIGHT_KEY, 1)}
            min={0.01}
            max={100}
            step={0.05}
            fractionDigits={2}
            onCommit={(next) => updateField(nodeId, MESH_PLANE_HEIGHT_KEY, next)}
          />
        </>
      ) : null}
      {kind === "cylinder" ? (
        <>
          <FlowCardScrubNumberField
            ariaLabel="Cylinder radius top"
            value={readNumber(defaultConfig, MESH_CYLINDER_RADIUS_TOP_KEY, 0.5)}
            min={0}
            max={50}
            step={0.05}
            fractionDigits={2}
            onCommit={(next) => updateField(nodeId, MESH_CYLINDER_RADIUS_TOP_KEY, next)}
          />
          <FlowCardScrubNumberField
            ariaLabel="Cylinder radius bottom"
            value={readNumber(defaultConfig, MESH_CYLINDER_RADIUS_BOTTOM_KEY, 0.5)}
            min={0}
            max={50}
            step={0.05}
            fractionDigits={2}
            onCommit={(next) => updateField(nodeId, MESH_CYLINDER_RADIUS_BOTTOM_KEY, next)}
          />
          <FlowCardScrubNumberField
            ariaLabel="Cylinder height"
            value={readNumber(defaultConfig, MESH_CYLINDER_HEIGHT_KEY, 1)}
            min={0.01}
            max={100}
            step={0.05}
            fractionDigits={2}
            onCommit={(next) => updateField(nodeId, MESH_CYLINDER_HEIGHT_KEY, next)}
          />
        </>
      ) : null}
      {kind === "cone" ? (
        <>
          <FlowCardScrubNumberField
            ariaLabel="Cone radius"
            value={readNumber(defaultConfig, MESH_CONE_RADIUS_KEY, 0.5)}
            min={0.01}
            max={50}
            step={0.05}
            fractionDigits={2}
            onCommit={(next) => updateField(nodeId, MESH_CONE_RADIUS_KEY, next)}
          />
          <FlowCardScrubNumberField
            ariaLabel="Cone height"
            value={readNumber(defaultConfig, MESH_CONE_HEIGHT_KEY, 1)}
            min={0.01}
            max={100}
            step={0.05}
            fractionDigits={2}
            onCommit={(next) => updateField(nodeId, MESH_CONE_HEIGHT_KEY, next)}
          />
        </>
      ) : null}
      {kind === "torus" ? (
        <>
          <FlowCardScrubNumberField
            ariaLabel="Torus radius"
            value={readNumber(defaultConfig, MESH_TORUS_RADIUS_KEY, 0.5)}
            min={0.01}
            max={50}
            step={0.05}
            fractionDigits={2}
            onCommit={(next) => updateField(nodeId, MESH_TORUS_RADIUS_KEY, next)}
          />
          <FlowCardScrubNumberField
            ariaLabel="Torus tube"
            value={readNumber(defaultConfig, MESH_TORUS_TUBE_KEY, 0.2)}
            min={0.01}
            max={20}
            step={0.05}
            fractionDigits={2}
            onCommit={(next) => updateField(nodeId, MESH_TORUS_TUBE_KEY, next)}
          />
        </>
      ) : null}
      {kind === "capsule" ? (
        <>
          <FlowCardScrubNumberField
            ariaLabel="Capsule radius"
            value={readNumber(defaultConfig, MESH_CAPSULE_RADIUS_KEY, 0.25)}
            min={0.01}
            max={50}
            step={0.05}
            fractionDigits={2}
            onCommit={(next) => updateField(nodeId, MESH_CAPSULE_RADIUS_KEY, next)}
          />
          <FlowCardScrubNumberField
            ariaLabel="Capsule length"
            value={readNumber(defaultConfig, MESH_CAPSULE_LENGTH_KEY, 0.5)}
            min={0.01}
            max={100}
            step={0.05}
            fractionDigits={2}
            onCommit={(next) => updateField(nodeId, MESH_CAPSULE_LENGTH_KEY, next)}
          />
        </>
      ) : null}
    </ReadingPanel>
  );
}
