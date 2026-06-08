import type { FlowWireVec3 } from "../../../../core/live/flow-wire-types";
import {
  flowVec3ToGlbMaterialColorRgb,
  glbMaterialColorRgbToHex,
  hexToGlbMaterialColorRgb,
  type GlbMaterialColorRgb,
} from "../../gltf/studio-glb-material-color";

/** Three.js mesh material family carried on **`material`** flow wires. */
export type MeshMaterialKindV1 =
  | "basic"
  | "standard"
  | "physical"
  | "toon"
  | "normal";

/** Serializable mesh material recipe for procedural geometry (Phase 1+). */
export type FlowWireMaterialV1 = {
  version: 1;
  kind: MeshMaterialKindV1;
  colorHex: string;
  opacity: number;
  wireframe?: boolean;
  roughness?: number;
  metalness?: number;
  emissiveHex?: string;
  clearcoat?: number;
  clearcoatRoughness?: number;
  transmission?: number;
  mapUrl?: string;
};

export function isMeshMaterialKindV1(value: unknown): value is MeshMaterialKindV1 {
  return (
    value === "basic" ||
    value === "standard" ||
    value === "physical" ||
    value === "toon" ||
    value === "normal"
  );
}

function clampUnit(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(1, Math.max(0, value));
}

function asHexColor(value: unknown, fallback: string): string {
  if (typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value.trim())) {
    return value.trim();
  }
  return fallback;
}

function asFiniteNumber(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function coerceFlowWireMaterialV1(raw: unknown): FlowWireMaterialV1 | null {
  if (raw == null || typeof raw !== "object") {
    return null;
  }
  const o = raw as Record<string, unknown>;
  if (o.version !== 1) {
    return null;
  }
  const kind = o.kind;
  if (!isMeshMaterialKindV1(kind)) {
    return null;
  }
  const base: FlowWireMaterialV1 = {
    version: 1,
    kind,
    colorHex: asHexColor(o.colorHex, "#ffffff"),
    opacity: clampUnit(asFiniteNumber(o.opacity, 1)),
  };
  if (kind === "basic" || kind === "toon" || kind === "normal") {
    if (typeof o.wireframe === "boolean") {
      base.wireframe = o.wireframe;
    }
  }
  if (kind === "standard" || kind === "physical") {
    base.roughness = clampUnit(asFiniteNumber(o.roughness, 0.5));
    base.metalness = clampUnit(asFiniteNumber(o.metalness, 0));
    const emissive = o.emissiveHex;
    if (typeof emissive === "string" && emissive.trim().length > 0) {
      base.emissiveHex = asHexColor(emissive, "#000000");
    }
  }
  if (kind === "physical") {
    base.clearcoat = clampUnit(asFiniteNumber(o.clearcoat, 0));
    base.clearcoatRoughness = clampUnit(asFiniteNumber(o.clearcoatRoughness, 0));
    base.transmission = clampUnit(asFiniteNumber(o.transmission, 0));
  }
  const mapUrl = o.mapUrl;
  if (typeof mapUrl === "string" && mapUrl.trim().length > 0) {
    base.mapUrl = mapUrl.trim();
  }
  return base;
}

export function isFlowWireMaterialV1(value: unknown): value is FlowWireMaterialV1 {
  return coerceFlowWireMaterialV1(value) != null;
}

export function flowWireMaterialRgbToHex(rgb: GlbMaterialColorRgb): string {
  return glbMaterialColorRgbToHex(rgb);
}

export function flowWireMaterialColorFromVec3(vec: FlowWireVec3): string {
  return glbMaterialColorRgbToHex(flowVec3ToGlbMaterialColorRgb(vec));
}

export function flowWireMaterialColorFromHex(hex: string): GlbMaterialColorRgb {
  return hexToGlbMaterialColorRgb(hex);
}
