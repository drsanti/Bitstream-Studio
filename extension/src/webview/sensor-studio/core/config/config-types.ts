export type VersionedConfig<TPayload> = {
  configVersion: number;
  updatedAt: string;
  payload: TPayload;
};

export type ThemeConfigPayload = {
  color: {
    background: {
      canvas: string;
      panel: string;
    };
    border: {
      default: string;
    };
    text: {
      primary: string;
      secondary: string;
    };
    status: {
      ok: string;
      warning: string;
      error: string;
      info: string;
    };
  };
};

export type DataTypeColorsPayload = {
  number: string;
  boolean: string;
  string: string;
  event: string;
  vector3: string;
  quaternion: string;
  environment: string;
  camera: string;
  glbAnimation: string;
};

/** Blueprint-style output pins defined in catalog (config-first). */
export type NodeCatalogOutputPort = {
  id: string;
  portType:
    | "number"
    | "boolean"
    | "string"
    | "event"
    | "vector3"
    | "quaternion"
    | "environment"
    | "camera"
    | "glbAnimation";
  label: string;
};

export type NodeCatalogEntry = {
  id: string;
  category: "input" | "transform" | "logic" | "output" | "utility" | "generator";
  title: string;
  description: string;
  icon: string;
  defaultVisible: boolean;
  defaultConfig: Record<string, unknown>;
  /** Multi-input node (e.g. oscilloscope): target handle id per entry. */
  inputPorts?: NodeCatalogOutputPort[];
  /** Multi-output node: one pin per entry (id becomes React Flow handle id). */
  outputPorts?: NodeCatalogOutputPort[];
};

export type NodeCatalogPayload = {
  nodes: NodeCatalogEntry[];
};

/** See `node-palette/node-palette-layout.ts` (kept as string union in payload for Zod). */
export type NodePaletteLayoutMode = "classic" | "sectioned" | "two-line" | "accordion";

export type RuntimeDefaultsPayload = {
  tickRateHz: number;
  maxBufferedSamples: number;
  defaultSmoothingAlpha: number;
  defaultThresholdValue: number;
  maxHistoryPoints: number;
  /** Node palette UI: classic list, sectioned by sensor, two-line, or accordion. */
  nodePaletteLayout: NodePaletteLayoutMode;
};

export type FeatureFlagsPayload = {
  enableSparklineNode: boolean;
  enableDebugValueNode: boolean;
  enableInspectorAdvancedPanel: boolean;
  enableRuntimeTraceOverlay: boolean;
};

export type ThemeConfig = VersionedConfig<ThemeConfigPayload>;
export type DataTypeColorsConfig = VersionedConfig<DataTypeColorsPayload>;
export type NodeCatalogConfig = VersionedConfig<NodeCatalogPayload>;
export type RuntimeDefaultsConfig = VersionedConfig<RuntimeDefaultsPayload>;
export type FeatureFlagsConfig = VersionedConfig<FeatureFlagsPayload>;

export type ConfigDomain =
  | "theme"
  | "dataTypeColors"
  | "nodeCatalog"
  | "runtimeDefaults"
  | "featureFlags";
