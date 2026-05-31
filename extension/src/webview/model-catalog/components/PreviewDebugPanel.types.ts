export type PoseNumbers = {
  px: number;
  py: number;
  pz: number;
  qx: number;
  qy: number;
  qz: number;
  qw: number;
  exDeg: number;
  eyDeg: number;
  ezDeg: number;
  fov: number;
  near: number;
  far: number;
  aspect: number;
  tx: number;
  ty: number;
  tz: number;
};

export interface CameraDebugSnapshot {
  target: PoseNumbers;
  current: PoseNumbers;
  /** Euclidean distance — used for OK/Fail threshold. */
  posDiff: number;
  /** Signed per-axis delta: current − target (scene units). */
  posDiffAxis: Vec3Snapshot;
  quatDiffDeg: number;
  posOk: boolean;
  quatOk: boolean;
  /** Before first OrbitControls interaction: OK/Fail vs load pose. After: drift (DIFF). */
  poseCheckMode: 'load' | 'drift';
  canvasW: number;
  canvasH: number;
  canvasAspect: number;
}

export type Vec3Snapshot = {
  x: number;
  y: number;
  z: number;
};

export type ObjectTransformSnapshot = {
  position: Vec3Snapshot;
  rotationDeg: Vec3Snapshot;
  scale: Vec3Snapshot;
};

/** Live position / rotation / scale for the clicked mesh in world and local space. */
export type SelectedObjectTransformSnapshot = {
  world: ObjectTransformSnapshot;
  local: ObjectTransformSnapshot;
};

export type ObjectTransformSpace = 'world' | 'local';

export interface PreviewDebugPanelProps {
  cameraDebug: CameraDebugSnapshot | null;
  selectedObjectName: string | null;
  referenceObjectName: string | null;
  selectedObjectTransform: SelectedObjectTransformSnapshot | null;
  selectionHighlightMode: string;
  modelDisplayMode: string;
  lastHitPoint: { x: number; y: number; z: number } | null;
}
