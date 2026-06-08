/** Sensor Studio runtime performance — local session prefs (not flow JSON). */

/** `0` = unlimited (no explicit cap). */
export type SensorStudioMaxFpsPreset = 0 | 10 | 15 | 24 | 30 | 60;

/** Reduced flow tick rate while dragging nodes or panning the canvas. */
export type FlowInteractionThrottleFpsPreset = 5 | 10 | 15;

export type FlowInteractionTickPolicy = "inherit" | "pause" | "throttle";

export type FlowInteractionTriggers = {
  nodeDrag: boolean;
  canvasPan: boolean;
};

export type SensorStudioPerformancePreferences = {
  /** Caps flow graph `tickSimulation` / 2D live refresh (flow, dashboard, telemetry coalesce). */
  flowSimulationMaxFps: SensorStudioMaxFpsPreset;
  /** Caps WebGL preview loops (`StudioSceneViewport` — Stage + in-node 3D previews). */
  stage3dMaxFps: SensorStudioMaxFpsPreset;
  /** Inspector live readout (~1×/sec) for actual fps vs caps. */
  showLivePerformanceStats: boolean;
  /** In-viewport corner overlay on Flow and Stage panes. */
  showPerformanceOverlay: boolean;
  /** Flow tick behavior while enabled canvas interactions are active. */
  flowInteractionTickPolicy: FlowInteractionTickPolicy;
  /** Used when `flowInteractionTickPolicy` is `throttle`. */
  flowInteractionThrottleFps: FlowInteractionThrottleFpsPreset;
  /** Which interactions apply `flowInteractionTickPolicy`. */
  flowInteractionTriggers: FlowInteractionTriggers;
};

export const SENSOR_STUDIO_MAX_FPS_PRESETS: readonly SensorStudioMaxFpsPreset[] = [
  0, 10, 15, 24, 30, 60,
] as const;

export const FLOW_INTERACTION_THROTTLE_FPS_PRESETS: readonly FlowInteractionThrottleFpsPreset[] =
  [5, 10, 15] as const;

export const DEFAULT_SENSOR_STUDIO_PERFORMANCE_PREFERENCES: SensorStudioPerformancePreferences =
  {
    flowSimulationMaxFps: 60,
    stage3dMaxFps: 60,
    showLivePerformanceStats: false,
    showPerformanceOverlay: false,
    flowInteractionTickPolicy: "pause",
    flowInteractionThrottleFps: 10,
    flowInteractionTriggers: {
      nodeDrag: true,
      canvasPan: true,
    },
  };

const STORAGE_KEY_V2 = "ternion.sensor-studio.performance.prefs.v2";
const STORAGE_KEY_V1 = "ternion.sensor-studio.performance.prefs.v1";
const FPS_PRESET_SET = new Set<number>(SENSOR_STUDIO_MAX_FPS_PRESETS);
const FLOW_INTERACTION_POLICY_SET = new Set<string>(["inherit", "pause", "throttle"]);
const FLOW_INTERACTION_THROTTLE_SET = new Set<number>(FLOW_INTERACTION_THROTTLE_FPS_PRESETS);

function coerceMaxFpsPreset(
  raw: unknown,
  fallback: SensorStudioMaxFpsPreset,
): SensorStudioMaxFpsPreset {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (FPS_PRESET_SET.has(n)) {
    return n as SensorStudioMaxFpsPreset;
  }
  return fallback;
}

function coerceFlowInteractionTickPolicy(
  raw: unknown,
  fallback: FlowInteractionTickPolicy,
): FlowInteractionTickPolicy {
  if (typeof raw === "string" && FLOW_INTERACTION_POLICY_SET.has(raw)) {
    return raw as FlowInteractionTickPolicy;
  }
  return fallback;
}

function coerceFlowInteractionThrottleFps(
  raw: unknown,
  fallback: FlowInteractionThrottleFpsPreset,
): FlowInteractionThrottleFpsPreset {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (FLOW_INTERACTION_THROTTLE_SET.has(n)) {
    return n as FlowInteractionThrottleFpsPreset;
  }
  return fallback;
}

function coerceFlowInteractionTriggers(
  raw: unknown,
  fallback: FlowInteractionTriggers,
): FlowInteractionTriggers {
  if (raw == null || typeof raw !== "object") {
    return { ...fallback };
  }
  const o = raw as Record<string, unknown>;
  return {
    nodeDrag: o.nodeDrag !== false,
    canvasPan: o.canvasPan !== false,
  };
}

export function coerceSensorStudioPerformancePreferences(
  raw: unknown,
): SensorStudioPerformancePreferences {
  if (raw == null || typeof raw !== "object") {
    return { ...DEFAULT_SENSOR_STUDIO_PERFORMANCE_PREFERENCES };
  }
  const o = raw as Record<string, unknown>;
  const defaults = DEFAULT_SENSOR_STUDIO_PERFORMANCE_PREFERENCES;
  return {
    flowSimulationMaxFps: coerceMaxFpsPreset(
      o.flowSimulationMaxFps,
      defaults.flowSimulationMaxFps,
    ),
    stage3dMaxFps: coerceMaxFpsPreset(
      o.stage3dMaxFps,
      defaults.stage3dMaxFps,
    ),
    showLivePerformanceStats: o.showLivePerformanceStats === true,
    showPerformanceOverlay: o.showPerformanceOverlay === true,
    flowInteractionTickPolicy: coerceFlowInteractionTickPolicy(
      o.flowInteractionTickPolicy,
      defaults.flowInteractionTickPolicy,
    ),
    flowInteractionThrottleFps: coerceFlowInteractionThrottleFps(
      o.flowInteractionThrottleFps,
      defaults.flowInteractionThrottleFps,
    ),
    flowInteractionTriggers: coerceFlowInteractionTriggers(
      o.flowInteractionTriggers,
      defaults.flowInteractionTriggers,
    ),
  };
}

export function mergeSensorStudioPerformancePreferences(
  prev: SensorStudioPerformancePreferences,
  patch: Partial<SensorStudioPerformancePreferences>,
): SensorStudioPerformancePreferences {
  const merged = { ...prev, ...patch };
  if (patch.flowSimulationMaxFps != null) {
    merged.flowSimulationMaxFps = coerceMaxFpsPreset(
      patch.flowSimulationMaxFps,
      prev.flowSimulationMaxFps,
    );
  }
  if (patch.stage3dMaxFps != null) {
    merged.stage3dMaxFps = coerceMaxFpsPreset(patch.stage3dMaxFps, prev.stage3dMaxFps);
  }
  if (patch.flowInteractionTickPolicy != null) {
    merged.flowInteractionTickPolicy = coerceFlowInteractionTickPolicy(
      patch.flowInteractionTickPolicy,
      prev.flowInteractionTickPolicy,
    );
  }
  if (patch.flowInteractionThrottleFps != null) {
    merged.flowInteractionThrottleFps = coerceFlowInteractionThrottleFps(
      patch.flowInteractionThrottleFps,
      prev.flowInteractionThrottleFps,
    );
  }
  if (patch.flowInteractionTriggers != null) {
    merged.flowInteractionTriggers = coerceFlowInteractionTriggers(
      { ...prev.flowInteractionTriggers, ...patch.flowInteractionTriggers },
      prev.flowInteractionTriggers,
    );
  }
  return merged;
}

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

export function formatFlowInteractionTickPolicyLabel(
  policy: FlowInteractionTickPolicy,
): string {
  switch (policy) {
    case "inherit":
      return "Keep running";
    case "pause":
      return "Pause";
    case "throttle":
      return "Reduce rate";
    default:
      return policy;
  }
}

export function readStoredSensorStudioPerformancePreferences(): SensorStudioPerformancePreferences {
  const rawV2 = safeGet(STORAGE_KEY_V2);
  if (rawV2 != null) {
    try {
      return coerceSensorStudioPerformancePreferences(JSON.parse(rawV2));
    } catch {
      return { ...DEFAULT_SENSOR_STUDIO_PERFORMANCE_PREFERENCES };
    }
  }
  const rawV1 = safeGet(STORAGE_KEY_V1);
  if (rawV1 != null) {
    try {
      return coerceSensorStudioPerformancePreferences(JSON.parse(rawV1));
    } catch {
      return { ...DEFAULT_SENSOR_STUDIO_PERFORMANCE_PREFERENCES };
    }
  }
  return { ...DEFAULT_SENSOR_STUDIO_PERFORMANCE_PREFERENCES };
}

export function writeStoredSensorStudioPerformancePreferences(
  prefs: SensorStudioPerformancePreferences,
): void {
  safeSet(STORAGE_KEY_V2, JSON.stringify(prefs));
}

export function formatSensorStudioMaxFpsLabel(preset: SensorStudioMaxFpsPreset): string {
  return preset === 0 ? "Unlimited" : `${preset} fps`;
}

/** Minimum milliseconds between frames for a capped preset (`0` or unlimited → `0`). */
export function minFrameIntervalMs(maxFps: number): number {
  if (maxFps <= 0) {
    return 0;
  }
  return 1000 / maxFps;
}

export function shouldRunCappedFrame(
  nowMs: number,
  lastFrameMs: number,
  minIntervalMs: number,
): boolean {
  if (minIntervalMs <= 0) {
    return true;
  }
  return nowMs - lastFrameMs >= minIntervalMs;
}
