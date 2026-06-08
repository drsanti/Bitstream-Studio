import type { FlowWireVec3 } from "../../../../core/live/flow-wire-types";
import { flowVec3ToGlbMaterialColorRgb } from "../../gltf/studio-glb-material-color";
import {
  coerceFlowWireMaterialV1,
  flowWireMaterialColorFromHex,
  flowWireMaterialRgbToHex,
  type FlowWireMaterialV1,
  type MeshMaterialKindV1,
} from "./flow-wire-material";

export const MESH_MATERIAL_COLOR_HEX_KEY = "meshMaterialColorHex" as const;
export const MESH_MATERIAL_OPACITY_KEY = "meshMaterialOpacity" as const;
export const MESH_MATERIAL_ROUGHNESS_KEY = "meshMaterialRoughness" as const;
export const MESH_MATERIAL_METALNESS_KEY = "meshMaterialMetalness" as const;
export const MESH_MATERIAL_WIREFRAME_KEY = "meshMaterialWireframe" as const;
export const MESH_MATERIAL_MAP_URL_KEY = "meshMaterialMapUrl" as const;
export const MESH_MATERIAL_MAP_ASSET_ID_KEY = "meshMaterialMapAssetId" as const;
export const MESH_MATERIAL_CLEARCOAT_KEY = "meshMaterialClearcoat" as const;
export const MESH_MATERIAL_CLEARCOAT_ROUGHNESS_KEY = "meshMaterialClearcoatRoughness" as const;
export const MESH_MATERIAL_TRANSMISSION_KEY = "meshMaterialTransmission" as const;

export const MESH_MATERIAL_KIND_BY_NODE_ID: Readonly<Record<string, MeshMaterialKindV1>> = {
  "mesh-material-basic": "basic",
  "mesh-material-standard": "standard",
  "mesh-material-physical": "physical",
  "mesh-material-toon": "toon",
  "mesh-material-normal": "normal",
};

export const MESH_MATERIAL_NODE_IDS: ReadonlySet<string> = new Set(
  Object.keys(MESH_MATERIAL_KIND_BY_NODE_ID),
);

export function isMeshMaterialNodeId(nodeId: string): boolean {
  return MESH_MATERIAL_NODE_IDS.has(nodeId);
}

export function meshMaterialKindForNodeId(nodeId: string): MeshMaterialKindV1 | null {
  return MESH_MATERIAL_KIND_BY_NODE_ID[nodeId] ?? null;
}

export function meshMaterialKindLabel(kind: MeshMaterialKindV1): string {
  if (kind === "basic") {
    return "Basic";
  }
  if (kind === "standard") {
    return "Standard";
  }
  if (kind === "physical") {
    return "Physical";
  }
  if (kind === "toon") {
    return "Toon";
  }
  return "Normal";
}

function clampUnit(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(1, Math.max(0, value));
}

function readHex(config: Record<string, unknown>, fallback = "#ffffff"): string {
  const raw = config[MESH_MATERIAL_COLOR_HEX_KEY];
  if (typeof raw === "string" && /^#[0-9a-fA-F]{6}$/.test(raw.trim())) {
    return raw.trim();
  }
  return fallback;
}

function readOpacity(config: Record<string, unknown>): number {
  const raw = config[MESH_MATERIAL_OPACITY_KEY];
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return clampUnit(raw);
  }
  return 1;
}

function readRoughness(config: Record<string, unknown>): number {
  const raw = config[MESH_MATERIAL_ROUGHNESS_KEY];
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return clampUnit(raw);
  }
  return 0.5;
}

function readMetalness(config: Record<string, unknown>): number {
  const raw = config[MESH_MATERIAL_METALNESS_KEY];
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return clampUnit(raw);
  }
  return 0;
}

function readWireframe(config: Record<string, unknown>): boolean {
  return config[MESH_MATERIAL_WIREFRAME_KEY] === true;
}

function readClearcoat(config: Record<string, unknown>): number {
  const raw = config[MESH_MATERIAL_CLEARCOAT_KEY];
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return clampUnit(raw);
  }
  return 0;
}

function readClearcoatRoughness(config: Record<string, unknown>): number {
  const raw = config[MESH_MATERIAL_CLEARCOAT_ROUGHNESS_KEY];
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return clampUnit(raw);
  }
  return 0;
}

function readTransmission(config: Record<string, unknown>): number {
  const raw = config[MESH_MATERIAL_TRANSMISSION_KEY];
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return clampUnit(raw);
  }
  return 0;
}

function readMapUrl(config: Record<string, unknown>): string | undefined {
  const raw = config[MESH_MATERIAL_MAP_URL_KEY];
  if (typeof raw === "string" && raw.trim().length > 0) {
    return raw.trim();
  }
  return undefined;
}

export type MeshMaterialWiredInputs = {
  color?: FlowWireVec3;
  opacity?: number;
  roughness?: number;
  metalness?: number;
  clearcoat?: number;
  clearcoatRoughness?: number;
  transmission?: number;
};

export function flowWireMaterialFromMeshMaterialEval(args: {
  kind: MeshMaterialKindV1;
  defaultConfig: Record<string, unknown>;
  wired?: MeshMaterialWiredInputs;
}): FlowWireMaterialV1 {
  const { kind, defaultConfig, wired } = args;
  const dc = defaultConfig;
  const colorHex =
    wired?.color != null
      ? flowWireMaterialRgbToHex(flowVec3ToGlbMaterialColorRgb(wired.color))
      : readHex(dc);
  const opacity =
    wired?.opacity != null && Number.isFinite(wired.opacity)
      ? clampUnit(wired.opacity)
      : readOpacity(dc);
  const mapUrl = readMapUrl(dc);

  if (kind === "basic" || kind === "toon" || kind === "normal") {
    return {
      version: 1,
      kind,
      colorHex,
      opacity,
      wireframe: readWireframe(dc),
      ...(mapUrl != null ? { mapUrl } : {}),
    };
  }

  const roughness =
    wired?.roughness != null && Number.isFinite(wired.roughness)
      ? clampUnit(wired.roughness)
      : readRoughness(dc);
  const metalness =
    wired?.metalness != null && Number.isFinite(wired.metalness)
      ? clampUnit(wired.metalness)
      : readMetalness(dc);

  if (kind === "standard") {
    return {
      version: 1,
      kind: "standard",
      colorHex,
      opacity,
      roughness,
      metalness,
      ...(mapUrl != null ? { mapUrl } : {}),
    };
  }

  const clearcoat =
    wired?.clearcoat != null && Number.isFinite(wired.clearcoat)
      ? clampUnit(wired.clearcoat)
      : readClearcoat(dc);
  const clearcoatRoughness =
    wired?.clearcoatRoughness != null && Number.isFinite(wired.clearcoatRoughness)
      ? clampUnit(wired.clearcoatRoughness)
      : readClearcoatRoughness(dc);
  const transmission =
    wired?.transmission != null && Number.isFinite(wired.transmission)
      ? clampUnit(wired.transmission)
      : readTransmission(dc);

  return {
    version: 1,
    kind: "physical",
    colorHex,
    opacity,
    roughness,
    metalness,
    clearcoat,
    clearcoatRoughness,
    transmission,
    ...(mapUrl != null ? { mapUrl } : {}),
  };
}

export function resolveMaterialWireSocketLabel(wire: FlowWireMaterialV1 | null | undefined): string {
  if (wire == null) {
    return "";
  }
  const coerced = coerceFlowWireMaterialV1(wire);
  if (coerced == null) {
    return "";
  }
  const kind = meshMaterialKindLabel(coerced.kind);
  const swatch = coerced.colorHex.toLowerCase();
  if (coerced.kind === "standard" || coerced.kind === "physical") {
    const r = Math.round((coerced.roughness ?? 0.5) * 100);
    const m = Math.round((coerced.metalness ?? 0) * 100);
    if (coerced.kind === "physical") {
      const cc = Math.round((coerced.clearcoat ?? 0) * 100);
      return `${kind} · ${swatch} · r${r} m${m} cc${cc}`;
    }
    return `${kind} · ${swatch} · r${r} m${m}`;
  }
  if (coerced.wireframe === true) {
    return `${kind} · ${swatch} · wire`;
  }
  return `${kind} · ${swatch}`;
}

export function defaultMeshMaterialColorHex(): string {
  return "#ffffff";
}

export function readMeshMaterialColorRgbFromConfig(
  config: Record<string, unknown> | null | undefined,
): { r: number; g: number; b: number } {
  if (config == null) {
    return flowWireMaterialColorFromHex(defaultMeshMaterialColorHex());
  }
  return flowWireMaterialColorFromHex(readHex(config));
}
