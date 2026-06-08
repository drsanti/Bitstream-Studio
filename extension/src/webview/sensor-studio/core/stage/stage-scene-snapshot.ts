import type { Scene3DConfigV1 } from "../scene3d/scene3d-config";
import {
  STAGE_DEFAULT_SHOW_GRID,
  stageSceneOutputDefaultScene3d,
} from "./stage-scene-defaults";
import type { FlowWireAnimationV1 } from "../../features/editor/nodes/animation/flow-wire-animation";
import type { FlowWireCameraV1 } from "../../features/editor/nodes/camera-view/flow-wire-camera";
import type { FlowWireEnvironmentV1 } from "../../features/editor/nodes/environment/flow-wire-environment";
import type { FlowWirePhysicsSceneV1 } from "../../features/editor/nodes/physics/flow-wire-physics-scene";
import type { StagePhysicsColliderV1 } from "./stage-physics-colliders";
import type { FlowWireTransformV1 } from "../../features/editor/nodes/transform/flow-wire-transform";
import type { StageMeshEntryV1 } from "./stage-mesh-entry";

export type { StageMeshEntryV1 } from "./stage-mesh-entry";

/** One GLB instance committed to the Stage from the graph. */
export type StageSceneModelEntryV1 = {
  /** Flow node id that supplied the model URL (for debugging / selection). */
  sourceNodeId: string;
  label: string;
  modelUrl: string;
  /** From **model-select** `selectedStudioAssetId` when present — keeps GLB resolution aligned with the wire. */
  studioAssetId?: string;
  transformWire?: FlowWireTransformV1 | null;
};

/** Evaluated scene committed by **Scene Output** → consumed by the Stage pane (Domain B). */
export type StageSceneSnapshotV1 = {
  version: 1;
  /** React Flow id of the Scene Output node driving this snapshot. */
  sceneOutputNodeId: string | null;
  updatedAtMs: number;
  showGrid: boolean;
  models: StageSceneModelEntryV1[];
  /** Procedural meshes wired into Scene Output **Meshes** (Phase 3+). */
  meshes: StageMeshEntryV1[];
  environmentWire: FlowWireEnvironmentV1 | null;
  cameraWire: FlowWireCameraV1 | null;
  animationWire: FlowWireAnimationV1 | null;
  transformWire: FlowWireTransformV1 | null;
  physicsWire: FlowWirePhysicsSceneV1 | null;
  physicsColliders: StagePhysicsColliderV1[];
  /** Primary merged scene for the Stage viewport (first model + global wires). */
  scene3d: Scene3DConfigV1;
};

/** Idle Stage store shape — uses Stage defaults, not {@link defaultScene3DConfig} / Model Viewer. */
export const EMPTY_STAGE_SCENE_SNAPSHOT: StageSceneSnapshotV1 = {
  version: 1,
  sceneOutputNodeId: null,
  updatedAtMs: 0,
  showGrid: STAGE_DEFAULT_SHOW_GRID,
  models: [],
  meshes: [],
  environmentWire: null,
  cameraWire: null,
  animationWire: null,
  transformWire: null,
  physicsWire: null,
  physicsColliders: [],
  scene3d: stageSceneOutputDefaultScene3d(),
};
