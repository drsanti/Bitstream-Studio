import {
  coerceScene3DConfigV1,
  MAX_STUDIO_DIRECTIONALS,
  persistScene3DConfig,
  type Scene3DConfigV1,
  type StudioDirectionalLightV1,
} from "../../../../core/scene3d/scene3d-config";

export type FlowWireStudioLightType = "point" | "directional";

/** Serialized studio rig light on **`studioLight`** flow wires. */
export type FlowWireStudioLightV1 = {
  version: 1;
  lightType: FlowWireStudioLightType;
  intensity: number;
  colorHex: string;
  position: { x: number; y: number; z: number };
  /** When set, drive an embedded GLB light by object name instead of the studio rig. */
  glbLightName?: string;
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

function asHexColor(value: unknown, fallback: string): string {
  if (typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value)) {
    return value;
  }
  return fallback;
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
  return fallback;
}

export function rgbChannelsToHex(r: number, g: number, b: number): string {
  const clampByte = (n: number) =>
    Math.max(0, Math.min(255, Math.round(clampNumber(n, 0, 1) * 255)));
  const rr = clampByte(r).toString(16).padStart(2, "0");
  const gg = clampByte(g).toString(16).padStart(2, "0");
  const bb = clampByte(b).toString(16).padStart(2, "0");
  return `#${rr}${gg}${bb}`;
}

export function flowWireStudioLightFromEval(
  light: {
    intensity: number;
    r: number;
    g: number;
    b: number;
    x: number;
    y: number;
    z: number;
  },
  cfg: Record<string, unknown>,
): FlowWireStudioLightV1 {
  const lightTarget =
    typeof cfg.lightTarget === "string" && cfg.lightTarget.trim().length > 0
      ? cfg.lightTarget.trim()
      : typeof cfg.label === "string" && cfg.label.trim().length > 0
        ? cfg.label.trim()
        : undefined;
  return {
    version: 1,
    lightType: cfg.lightType === "directional" ? "directional" : "point",
    intensity: light.intensity,
    colorHex: rgbChannelsToHex(light.r, light.g, light.b),
    position: { x: light.x, y: light.y, z: light.z },
    glbLightName: lightTarget,
  };
}

export function coerceFlowWireStudioLightV1(raw: unknown): FlowWireStudioLightV1 {
  const d = {
    intensity: 1,
    colorHex: "#ffffff",
    position: { x: 0, y: 5, z: 0 },
  };
  if (raw == null || typeof raw !== "object") {
    return {
      version: 1,
      lightType: "point",
      intensity: d.intensity,
      colorHex: d.colorHex,
      position: d.position,
    };
  }
  const o = raw as Record<string, unknown>;
  const sid = o.glbLightName;
  return {
    version: 1,
    lightType: o.lightType === "directional" ? "directional" : "point",
    intensity: clampNumber(asFiniteNumber(o.intensity, d.intensity), 0, 20),
    colorHex: asHexColor(o.colorHex, d.colorHex),
    position: asVec3(o.position, d.position),
    glbLightName: typeof sid === "string" && sid.trim().length > 0 ? sid.trim() : undefined,
  };
}

export function mergeFlowWireStudioLightIntoScene3d(
  scene3d: Scene3DConfigV1,
  wire: FlowWireStudioLightV1 | null | undefined,
): Scene3DConfigV1 {
  if (wire == null || wire.glbLightName != null) {
    return scene3d;
  }
  const entry: StudioDirectionalLightV1 = {
    id: "flow-studio-light",
    colorHex: wire.colorHex,
    intensity: wire.intensity,
    position: wire.position,
  };
  const rest = scene3d.lights.directionals.filter((d) => d.id !== entry.id);
  const directionals = [entry, ...rest].slice(0, MAX_STUDIO_DIRECTIONALS);
  const next: Scene3DConfigV1 = {
    ...scene3d,
    lights: {
      ...scene3d.lights,
      directionals,
    },
  };
  return coerceScene3DConfigV1(persistScene3DConfig(next));
}

export function mergeFlowSceneSettingsExposureIntoScene3d(
  scene3d: Scene3DConfigV1,
  exposure: number | null | undefined,
): Scene3DConfigV1 {
  if (exposure == null || !Number.isFinite(exposure)) {
    return scene3d;
  }
  const next: Scene3DConfigV1 = {
    ...scene3d,
    renderer: {
      ...scene3d.renderer,
      toneMappingExposure: clampNumber(exposure, 0.05, 4),
    },
  };
  return coerceScene3DConfigV1(persistScene3DConfig(next));
}

export function isFlowWireStudioLightV1(v: unknown): v is FlowWireStudioLightV1 {
  return v != null && typeof v === "object" && (v as FlowWireStudioLightV1).version === 1;
}
