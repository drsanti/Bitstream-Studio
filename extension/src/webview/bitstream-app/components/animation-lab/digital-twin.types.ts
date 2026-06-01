/** Component / signal health for booth twin UI (aligned with Sensor Studio semantics). */
export type AnimationLabTwinHealth = "ok" | "caution" | "warning" | "error" | "offline";

export type AnimationLabTwinLocaleLabels = {
  th?: string;
};

export type AnimationLabTwinSignalDef = {
  key: string;
  label: string;
  /** Optional translations (e.g. `th` from metadata `labelTh`). */
  labelLocales?: AnimationLabTwinLocaleLabels;
  unit: string;
  warn?: number;
  alarm?: number;
  /** Default: higher value is worse above thresholds. */
  direction?: "above" | "below";
  /** BS2 studio source key (e.g. `bmi270.temperature`) when UART/sim telemetry is active. */
  liveSourceKey?: string;
};

export type AnimationLabTwinComponentDef = {
  id: string;
  label: string;
  /** Optional translations (e.g. `th` from metadata `labelTh`). */
  labelLocales?: AnimationLabTwinLocaleLabels;
  /** Sidebar grouping (e.g. Propulsion, Gimbal). */
  group?: string;
  /** GLB clip name — links playback selection to this component. */
  glbAnchor?: string;
  /** World-space offset (m) applied after anchor resolution for CSS3D tags. */
  anchorOffset?: [number, number, number];
  /** Twin signal key shown on the 3D card primary row (default: first signal). */
  cardPrimarySignalKey?: string;
  /** Leading card icon id (`gimbal`, `motor`, `camera`, …) — falls back to group / id heuristics. */
  cardIcon?: string;
  signals: AnimationLabTwinSignalDef[];
};

export type AnimationLabTwinDataSource = "simulated" | "mixed" | "live";

export type AnimationLabDigitalTwinDef = {
  assetId: string;
  label?: string;
  components: AnimationLabTwinComponentDef[];
};

export type AnimationLabTwinSignalLive = {
  key: string;
  value: number;
  health: AnimationLabTwinHealth;
  label: string;
  unit: string;
};

export type AnimationLabTwinComponentLive = {
  id: string;
  label: string;
  group?: string;
  glbAnchor?: string;
  health: AnimationLabTwinHealth;
  signals: AnimationLabTwinSignalLive[];
};

export type AnimationLabTwinMachineSummary = {
  health: AnimationLabTwinHealth;
  label: string;
  activeAlertCount: number;
  updatedAtMs: number;
};

/** Raised when a signal crosses caution / warning / error thresholds. */
export type AnimationLabTwinAlert = {
  id: string;
  atMs: number;
  clearedAtMs?: number;
  assetId: string;
  componentId: string;
  componentLabel: string;
  signalKey: string;
  signalLabel: string;
  health: AnimationLabTwinHealth;
  value: number;
  unit: string;
  message: string;
};

export type AnimationLabTwinTrendKey = `${string}::${string}`;

export type AnimationLabTwinExportReport = {
  schema: "bitstream.animation-lab.twin-report";
  version: 1;
  exportedAtMs: number;
  assetId: string;
  assetLabel?: string;
  dataSource: AnimationLabTwinDataSource;
  summary: AnimationLabTwinMachineSummary;
  components: AnimationLabTwinComponentLive[];
  alerts: AnimationLabTwinAlert[];
  trends: Record<AnimationLabTwinTrendKey, number[]>;
};
