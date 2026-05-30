import { PROJECT4_TWIN_ENVIRONMENT_INTENSITY } from "../lib/project4-twin-environments";
import type { Project4GraphicsState, Project4TwinLightEntry } from "./project4-graphics.types";

export const PROJECT4_GRAPHICS_STORAGE_KEY = "ternion.project4.graphics.v1";

export const PROJECT4_GRAPHICS_MAX_LIGHTS = 16;

/** Matches former hardcoded lights in `Project4TwinViewport`. */
export const PROJECT4_GRAPHICS_DEFAULT_LIGHTS: readonly Project4TwinLightEntry[] = [
  {
    id: "default-ambient",
    kind: "ambient",
    color: "#ffffff",
    intensity: 0.62,
    position: [0, 0, 0],
    castShadow: false,
    helperVisible: false,
    groundColor: "#444444",
    distance: 0,
    decay: 2,
    angleDeg: 45,
    penumbra: 0.2,
  },
  {
    id: "default-dir-key",
    kind: "directional",
    color: "#ffffff",
    intensity: 1.05,
    position: [5, 9, 6],
    castShadow: true,
    helperVisible: false,
    groundColor: "#444444",
    distance: 0,
    decay: 2,
    angleDeg: 45,
    penumbra: 0.2,
  },
  {
    id: "default-dir-fill",
    kind: "directional",
    color: "#ffffff",
    intensity: 0.28,
    position: [-4, 3, -2],
    castShadow: false,
    helperVisible: false,
    groundColor: "#444444",
    distance: 0,
    decay: 2,
    angleDeg: 45,
    penumbra: 0.2,
  },
];

export const PROJECT4_GRAPHICS_DEFAULTS: Project4GraphicsState = {
  schemaVersion: 1,
  toneMappingKey: "acesFilmic",
  toneMappingExposure: 1,
  outputColorSpaceKey: "srgb",
  shadowsEnabled: true,
  environmentIntensity: PROJECT4_TWIN_ENVIRONMENT_INTENSITY,
  lights: PROJECT4_GRAPHICS_DEFAULT_LIGHTS.map((l) => ({ ...l })),
};
