import {
  coerceScene3DConfigV1,
  defaultScene3DConfig,
  persistScene3DConfig,
  type Scene3DConfigV1,
} from "../../../../core/scene3d/scene3d-config";

/** Serialized camera + orbit framing carried on **`camera`** flow wires (subset of `scene3d.camera` + key `controls`). */
export type FlowWireCameraV1 = {
  version: 1;
  fovDeg: number;
  frameMargin: number;
  frameDirection: { x: number; y: number; z: number };
  nearDivisor: number;
  farMultiplier: number;
  transform: {
    position: { x: number; y: number; z: number };
    target: { x: number; y: number; z: number };
  };
  controls: {
    minDistance: number;
    maxDistance: number | null;
    minPolarAngleDeg: number;
    maxPolarAngleDeg: number;
  };
};

function asFiniteNumber(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function asVec3(
  v: unknown,
  fallback: { x: number; y: number; z: number },
): { x: number; y: number; z: number } {
  if (v != null && typeof v === "object" && "x" in v && "y" in v && "z" in v) {
    const o = v as Record<string, unknown>;
    return {
      x: asFiniteNumber(o.x, fallback.x),
      y: asFiniteNumber(o.y, fallback.y),
      z: asFiniteNumber(o.z, fallback.z),
    };
  }
  return { ...fallback };
}

/** Positive finite number or `null` when raw is `null` (unlimited zoom-out). */
function asPositiveFiniteOrNull(v: unknown, fallback: number | null): number | null {
  if (v === null) {
    return null;
  }
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n) || n <= 0) {
    return fallback;
  }
  return n;
}

export function defaultFlowWireCameraV1(): FlowWireCameraV1 {
  const s = defaultScene3DConfig();
  const c = s.camera;
  const ctrl = s.controls;
  return {
    version: 1,
    fovDeg: c.fovDeg,
    frameMargin: c.frameMargin,
    frameDirection: { ...c.frameDirection },
    nearDivisor: c.nearDivisor,
    farMultiplier: c.farMultiplier,
    transform: {
      position: { ...c.transform.position },
      target: { ...c.transform.target },
    },
    controls: {
      minDistance: ctrl.minDistance,
      maxDistance: ctrl.maxDistance,
      minPolarAngleDeg: ctrl.minPolarAngleDeg,
      maxPolarAngleDeg: ctrl.maxPolarAngleDeg,
    },
  };
}

export function coerceFlowWireCameraV1(raw: unknown): FlowWireCameraV1 {
  const d = defaultFlowWireCameraV1();
  if (raw == null || typeof raw !== "object") {
    return d;
  }
  const o = raw as Record<string, unknown>;
  const tRaw = (o.transform ?? {}) as Record<string, unknown>;
  const cRaw = (o.controls ?? {}) as Record<string, unknown>;

  let minPol = clampNumber(
    Math.round(asFiniteNumber(cRaw.minPolarAngleDeg, d.controls.minPolarAngleDeg)),
    0,
    180,
  );
  let maxPol = clampNumber(
    Math.round(asFiniteNumber(cRaw.maxPolarAngleDeg, d.controls.maxPolarAngleDeg)),
    0,
    180,
  );
  if (minPol > maxPol) {
    const swap = minPol;
    minPol = maxPol;
    maxPol = swap;
  }

  const maxDist =
    cRaw.maxDistance === null
      ? null
      : cRaw.maxDistance === undefined
        ? d.controls.maxDistance
        : asPositiveFiniteOrNull(cRaw.maxDistance, d.controls.maxDistance);

  return {
    version: 1,
    fovDeg: clampNumber(Math.round(asFiniteNumber(o.fovDeg, d.fovDeg)), 10, 120),
    frameMargin: clampNumber(asFiniteNumber(o.frameMargin, d.frameMargin), 0.9, 3),
    frameDirection: asVec3(o.frameDirection, d.frameDirection),
    nearDivisor: clampNumber(Math.round(asFiniteNumber(o.nearDivisor, d.nearDivisor)), 20, 2000),
    farMultiplier: clampNumber(
      Math.round(asFiniteNumber(o.farMultiplier, d.farMultiplier)),
      10,
      5000,
    ),
    transform: {
      position: asVec3(tRaw.position, d.transform.position),
      target: asVec3(tRaw.target, d.transform.target),
    },
    controls: {
      minDistance: clampNumber(
        asFiniteNumber(cRaw.minDistance, d.controls.minDistance),
        0,
        1e6,
      ),
      maxDistance: maxDist,
      minPolarAngleDeg: minPol,
      maxPolarAngleDeg: maxPol,
    },
  };
}

export function flowWireCameraFromNodeDefaultConfig(dc: Record<string, unknown>): FlowWireCameraV1 {
  return coerceFlowWireCameraV1({ version: 1, ...dc });
}

export function mergeFlowWireCameraIntoScene3d(
  scene3d: Scene3DConfigV1,
  wire: FlowWireCameraV1 | null | undefined,
): Scene3DConfigV1 {
  if (wire == null) {
    return scene3d;
  }
  const next: Scene3DConfigV1 = {
    ...scene3d,
    camera: {
      ...scene3d.camera,
      fovDeg: wire.fovDeg,
      frameMargin: wire.frameMargin,
      frameDirection: { ...wire.frameDirection },
      nearDivisor: wire.nearDivisor,
      farMultiplier: wire.farMultiplier,
      transform: {
        position: { ...wire.transform.position },
        target: { ...wire.transform.target },
      },
    },
    controls: {
      ...scene3d.controls,
      minDistance: wire.controls.minDistance,
      maxDistance: wire.controls.maxDistance,
      minPolarAngleDeg: wire.controls.minPolarAngleDeg,
      maxPolarAngleDeg: wire.controls.maxPolarAngleDeg,
    },
  };
  return coerceScene3DConfigV1(persistScene3DConfig(next));
}

export function isFlowWireCameraV1(v: unknown): v is FlowWireCameraV1 {
  return (
    v != null &&
    typeof v === "object" &&
    (v as FlowWireCameraV1).version === 1 &&
    typeof (v as Record<string, unknown>).fovDeg === "number" &&
    (v as Record<string, unknown>).transform != null &&
    typeof (v as Record<string, unknown>).transform === "object"
  );
}
