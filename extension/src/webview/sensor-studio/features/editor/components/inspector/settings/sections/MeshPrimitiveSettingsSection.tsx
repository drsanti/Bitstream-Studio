import { InspectorNumericScrubRow } from "../../InspectorNumericScrubRow";
import { InspectorPropertyRow } from "../../InspectorPropertyRow";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";
import { MeshPrimitiveTransformInspectorSection } from "./MeshPrimitiveTransformInspectorSection";
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
  MESH_TORUS_RADIUS_KEY,
  MESH_TORUS_RADIAL_SEGMENTS_KEY,
  MESH_TORUS_TUBE_KEY,
  MESH_TORUS_TUBULAR_SEGMENTS_KEY,
  MESH_SPHERE_RADIUS_KEY,
  MESH_SPHERE_WIDTH_SEGMENTS_KEY,
  meshPrimitiveKindForNodeId,
  meshPrimitiveKindLabel,
} from "../../../../nodes/mesh/mesh-primitive-config";

export function MeshPrimitiveSettingsSection(
  props: NodeInspectorSettingsSectionProps & {
    /** When false, geometry fields only (Stage object inspector supplies transform separately). */
    includeTransform?: boolean;
  },
) {
  const { selectedNode, onUpdateConfigField, includeTransform = true } = props;
  const meshFlowNodeId = selectedNode.id;
  const dc = selectedNode.data.defaultConfig;
  const kind = meshPrimitiveKindForNodeId(selectedNode.data.nodeId);

  if (kind == null) {
    return null;
  }

  return (
    <div className="space-y-2">
      <InspectorPropertyRow
        label="Geometry"
        description="Three.js primitive emitted on the Mesh output wire."
      >
        <div className="rounded-md border border-zinc-800/80 bg-zinc-950/40 px-2.5 py-1.5 text-[11px] text-zinc-300">
          {meshPrimitiveKindLabel(kind)}
        </div>
      </InspectorPropertyRow>
      {kind === "box" ? (
        <>
          <InspectorNumericScrubRow
            label="Width"
            description="Wired Width input overrides this value each tick."
            ariaLabel="Box width"
            value={typeof dc[MESH_BOX_WIDTH_KEY] === "number" ? dc[MESH_BOX_WIDTH_KEY] : 1}
            min={0.01}
            max={100}
            step={0.05}
            onCommit={(next) => onUpdateConfigField(MESH_BOX_WIDTH_KEY, next)}
          />
          <InspectorNumericScrubRow
            label="Height"
            description="Wired Height input overrides this value."
            ariaLabel="Box height"
            value={typeof dc[MESH_BOX_HEIGHT_KEY] === "number" ? dc[MESH_BOX_HEIGHT_KEY] : 1}
            min={0.01}
            max={100}
            step={0.05}
            onCommit={(next) => onUpdateConfigField(MESH_BOX_HEIGHT_KEY, next)}
          />
          <InspectorNumericScrubRow
            label="Depth"
            description="Wired Depth input overrides this value."
            ariaLabel="Box depth"
            value={typeof dc[MESH_BOX_DEPTH_KEY] === "number" ? dc[MESH_BOX_DEPTH_KEY] : 1}
            min={0.01}
            max={100}
            step={0.05}
            onCommit={(next) => onUpdateConfigField(MESH_BOX_DEPTH_KEY, next)}
          />
        </>
      ) : null}
      {kind === "sphere" ? (
        <>
          <InspectorNumericScrubRow
            label="Radius"
            description="Wired Radius input overrides this value."
            ariaLabel="Sphere radius"
            value={
              typeof dc[MESH_SPHERE_RADIUS_KEY] === "number" ? dc[MESH_SPHERE_RADIUS_KEY] : 0.5
            }
            min={0.01}
            max={50}
            step={0.05}
            onCommit={(next) => onUpdateConfigField(MESH_SPHERE_RADIUS_KEY, next)}
          />
          <InspectorNumericScrubRow
            label="Width segments"
            ariaLabel="Sphere width segments"
            value={
              typeof dc[MESH_SPHERE_WIDTH_SEGMENTS_KEY] === "number"
                ? dc[MESH_SPHERE_WIDTH_SEGMENTS_KEY]
                : 32
            }
            min={3}
            max={128}
            step={1}
            onCommit={(next) =>
              onUpdateConfigField(MESH_SPHERE_WIDTH_SEGMENTS_KEY, Math.round(next))
            }
          />
          <InspectorNumericScrubRow
            label="Height segments"
            ariaLabel="Sphere height segments"
            value={
              typeof dc[MESH_SPHERE_HEIGHT_SEGMENTS_KEY] === "number"
                ? dc[MESH_SPHERE_HEIGHT_SEGMENTS_KEY]
                : 16
            }
            min={3}
            max={128}
            step={1}
            onCommit={(next) =>
              onUpdateConfigField(MESH_SPHERE_HEIGHT_SEGMENTS_KEY, Math.round(next))
            }
          />
        </>
      ) : null}
      {kind === "plane" ? (
        <>
          <InspectorNumericScrubRow
            label="Width"
            description="Wired Width input overrides this value."
            ariaLabel="Plane width"
            value={typeof dc[MESH_PLANE_WIDTH_KEY] === "number" ? dc[MESH_PLANE_WIDTH_KEY] : 1}
            min={0.01}
            max={100}
            step={0.05}
            onCommit={(next) => onUpdateConfigField(MESH_PLANE_WIDTH_KEY, next)}
          />
          <InspectorNumericScrubRow
            label="Height"
            description="Wired Height input overrides this value."
            ariaLabel="Plane height"
            value={typeof dc[MESH_PLANE_HEIGHT_KEY] === "number" ? dc[MESH_PLANE_HEIGHT_KEY] : 1}
            min={0.01}
            max={100}
            step={0.05}
            onCommit={(next) => onUpdateConfigField(MESH_PLANE_HEIGHT_KEY, next)}
          />
        </>
      ) : null}
      {kind === "cylinder" ? (
        <>
          <InspectorNumericScrubRow
            label="Radius top"
            ariaLabel="Cylinder radius top"
            value={
              typeof dc[MESH_CYLINDER_RADIUS_TOP_KEY] === "number"
                ? dc[MESH_CYLINDER_RADIUS_TOP_KEY]
                : 0.5
            }
            min={0}
            max={50}
            step={0.05}
            onCommit={(next) => onUpdateConfigField(MESH_CYLINDER_RADIUS_TOP_KEY, next)}
          />
          <InspectorNumericScrubRow
            label="Radius bottom"
            ariaLabel="Cylinder radius bottom"
            value={
              typeof dc[MESH_CYLINDER_RADIUS_BOTTOM_KEY] === "number"
                ? dc[MESH_CYLINDER_RADIUS_BOTTOM_KEY]
                : 0.5
            }
            min={0}
            max={50}
            step={0.05}
            onCommit={(next) => onUpdateConfigField(MESH_CYLINDER_RADIUS_BOTTOM_KEY, next)}
          />
          <InspectorNumericScrubRow
            label="Height"
            ariaLabel="Cylinder height"
            value={
              typeof dc[MESH_CYLINDER_HEIGHT_KEY] === "number" ? dc[MESH_CYLINDER_HEIGHT_KEY] : 1
            }
            min={0.01}
            max={100}
            step={0.05}
            onCommit={(next) => onUpdateConfigField(MESH_CYLINDER_HEIGHT_KEY, next)}
          />
          <InspectorNumericScrubRow
            label="Radial segments"
            ariaLabel="Cylinder radial segments"
            value={
              typeof dc[MESH_CYLINDER_RADIAL_SEGMENTS_KEY] === "number"
                ? dc[MESH_CYLINDER_RADIAL_SEGMENTS_KEY]
                : 32
            }
            min={3}
            max={128}
            step={1}
            onCommit={(next) =>
              onUpdateConfigField(MESH_CYLINDER_RADIAL_SEGMENTS_KEY, Math.round(next))
            }
          />
        </>
      ) : null}
      {kind === "cone" ? (
        <>
          <InspectorNumericScrubRow
            label="Radius"
            ariaLabel="Cone radius"
            value={typeof dc[MESH_CONE_RADIUS_KEY] === "number" ? dc[MESH_CONE_RADIUS_KEY] : 0.5}
            min={0.01}
            max={50}
            step={0.05}
            onCommit={(next) => onUpdateConfigField(MESH_CONE_RADIUS_KEY, next)}
          />
          <InspectorNumericScrubRow
            label="Height"
            ariaLabel="Cone height"
            value={typeof dc[MESH_CONE_HEIGHT_KEY] === "number" ? dc[MESH_CONE_HEIGHT_KEY] : 1}
            min={0.01}
            max={100}
            step={0.05}
            onCommit={(next) => onUpdateConfigField(MESH_CONE_HEIGHT_KEY, next)}
          />
          <InspectorNumericScrubRow
            label="Radial segments"
            ariaLabel="Cone radial segments"
            value={
              typeof dc[MESH_CONE_RADIAL_SEGMENTS_KEY] === "number"
                ? dc[MESH_CONE_RADIAL_SEGMENTS_KEY]
                : 32
            }
            min={3}
            max={128}
            step={1}
            onCommit={(next) =>
              onUpdateConfigField(MESH_CONE_RADIAL_SEGMENTS_KEY, Math.round(next))
            }
          />
        </>
      ) : null}
      {kind === "torus" ? (
        <>
          <InspectorNumericScrubRow
            label="Radius"
            ariaLabel="Torus radius"
            value={typeof dc[MESH_TORUS_RADIUS_KEY] === "number" ? dc[MESH_TORUS_RADIUS_KEY] : 0.5}
            min={0.01}
            max={50}
            step={0.05}
            onCommit={(next) => onUpdateConfigField(MESH_TORUS_RADIUS_KEY, next)}
          />
          <InspectorNumericScrubRow
            label="Tube"
            ariaLabel="Torus tube"
            value={typeof dc[MESH_TORUS_TUBE_KEY] === "number" ? dc[MESH_TORUS_TUBE_KEY] : 0.2}
            min={0.01}
            max={20}
            step={0.05}
            onCommit={(next) => onUpdateConfigField(MESH_TORUS_TUBE_KEY, next)}
          />
          <InspectorNumericScrubRow
            label="Radial segments"
            ariaLabel="Torus radial segments"
            value={
              typeof dc[MESH_TORUS_RADIAL_SEGMENTS_KEY] === "number"
                ? dc[MESH_TORUS_RADIAL_SEGMENTS_KEY]
                : 16
            }
            min={3}
            max={128}
            step={1}
            onCommit={(next) =>
              onUpdateConfigField(MESH_TORUS_RADIAL_SEGMENTS_KEY, Math.round(next))
            }
          />
          <InspectorNumericScrubRow
            label="Tubular segments"
            ariaLabel="Torus tubular segments"
            value={
              typeof dc[MESH_TORUS_TUBULAR_SEGMENTS_KEY] === "number"
                ? dc[MESH_TORUS_TUBULAR_SEGMENTS_KEY]
                : 48
            }
            min={3}
            max={256}
            step={1}
            onCommit={(next) =>
              onUpdateConfigField(MESH_TORUS_TUBULAR_SEGMENTS_KEY, Math.round(next))
            }
          />
        </>
      ) : null}
      {kind === "capsule" ? (
        <>
          <InspectorNumericScrubRow
            label="Radius"
            ariaLabel="Capsule radius"
            value={
              typeof dc[MESH_CAPSULE_RADIUS_KEY] === "number" ? dc[MESH_CAPSULE_RADIUS_KEY] : 0.25
            }
            min={0.01}
            max={50}
            step={0.05}
            onCommit={(next) => onUpdateConfigField(MESH_CAPSULE_RADIUS_KEY, next)}
          />
          <InspectorNumericScrubRow
            label="Length"
            ariaLabel="Capsule length"
            value={
              typeof dc[MESH_CAPSULE_LENGTH_KEY] === "number" ? dc[MESH_CAPSULE_LENGTH_KEY] : 0.5
            }
            min={0.01}
            max={100}
            step={0.05}
            onCommit={(next) => onUpdateConfigField(MESH_CAPSULE_LENGTH_KEY, next)}
          />
          <InspectorNumericScrubRow
            label="Cap segments"
            ariaLabel="Capsule cap segments"
            value={
              typeof dc[MESH_CAPSULE_CAP_SEGMENTS_KEY] === "number"
                ? dc[MESH_CAPSULE_CAP_SEGMENTS_KEY]
                : 8
            }
            min={1}
            max={64}
            step={1}
            onCommit={(next) =>
              onUpdateConfigField(MESH_CAPSULE_CAP_SEGMENTS_KEY, Math.round(next))
            }
          />
          <InspectorNumericScrubRow
            label="Radial segments"
            ariaLabel="Capsule radial segments"
            value={
              typeof dc[MESH_CAPSULE_RADIAL_SEGMENTS_KEY] === "number"
                ? dc[MESH_CAPSULE_RADIAL_SEGMENTS_KEY]
                : 16
            }
            min={3}
            max={128}
            step={1}
            onCommit={(next) =>
              onUpdateConfigField(MESH_CAPSULE_RADIAL_SEGMENTS_KEY, Math.round(next))
            }
          />
        </>
      ) : null}
      {includeTransform ? (
        <MeshPrimitiveTransformInspectorSection
          meshFlowNodeId={meshFlowNodeId}
          showTopDivider
        />
      ) : null}
    </div>
  );
}
