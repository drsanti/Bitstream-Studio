export type Project4ToneMappingKey =
  | "none"
  | "linear"
  | "reinhard"
  | "cineon"
  | "acesFilmic";

export type Project4OutputColorSpaceKey = "srgb" | "linear";

export type Project4TwinLightKind = "ambient" | "directional" | "point" | "spot" | "hemisphere";

export type Project4TwinLightEntry = {
  id: string;
  kind: Project4TwinLightKind;
  color: string;
  intensity: number;
  position: [number, number, number];
  castShadow: boolean;
  helperVisible: boolean;
  /** Hemisphere only — ground tint. */
  groundColor: string;
  /** Point / spot — 0 = infinite (Three.js default). */
  distance: number;
  decay: number;
  /** Spot outer cone (degrees). */
  angleDeg: number;
  penumbra: number;
};

export type Project4GraphicsState = {
  schemaVersion: 1;
  toneMappingKey: Project4ToneMappingKey;
  toneMappingExposure: number;
  outputColorSpaceKey: Project4OutputColorSpaceKey;
  shadowsEnabled: boolean;
  environmentIntensity: number;
  lights: Project4TwinLightEntry[];
};

export type Project4GraphicsStore = Project4GraphicsState & {
  patchProject4Graphics: (partial: Partial<Project4GraphicsState>) => void;
  resetProject4Graphics: () => void;
};
