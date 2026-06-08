import type { SensorStudioMaxFpsPreset } from "../../persistence/sensor-studio-performance-preferences";
import type { FlowInteractionActiveKind } from "./flow-interaction-tick-gate";

const WINDOW_MS = 1000;
const FLOW_HEAVY_TICK_MS = 25;
const FPS_UNDER_CAP_RATIO = 0.6;

type RollingWindow = {
  timesMs: number[];
  durationsMs: number[];
};

const flowTickWindow: RollingWindow = { timesMs: [], durationsMs: [] };
const render3dWindow: RollingWindow = { timesMs: [], durationsMs: [] };

let flowSceneLoopActive = false;
let stage3dLoopActive = false;
let webGlRenderLoopRefCount = 0;

function trimWindow(window: RollingWindow, nowMs: number): void {
  const cutoff = nowMs - WINDOW_MS;
  while (window.timesMs.length > 0 && window.timesMs[0]! < cutoff) {
    window.timesMs.shift();
    window.durationsMs.shift();
  }
}

function pushSample(window: RollingWindow, nowMs: number, durationMs: number): void {
  window.timesMs.push(nowMs);
  window.durationsMs.push(durationMs);
  trimWindow(window, nowMs);
}

function readWindowFps(window: RollingWindow, nowMs: number): number {
  trimWindow(window, nowMs);
  return window.timesMs.length;
}

function readWindowAvgMs(window: RollingWindow, nowMs: number): number | null {
  trimWindow(window, nowMs);
  if (window.durationsMs.length === 0) {
    return null;
  }
  const sum = window.durationsMs.reduce((acc, ms) => acc + ms, 0);
  return sum / window.durationsMs.length;
}

export function setFlowSceneLoopActive(active: boolean): void {
  flowSceneLoopActive = active;
}

export function isFlowSceneLoopActive(): boolean {
  return flowSceneLoopActive;
}

export function setStage3dRenderLoopActive(active: boolean): void {
  stage3dLoopActive = active;
}

export function acquireWebGlRenderLoopSlot(): void {
  webGlRenderLoopRefCount += 1;
  setStage3dRenderLoopActive(webGlRenderLoopRefCount > 0);
}

export function releaseWebGlRenderLoopSlot(): void {
  webGlRenderLoopRefCount = Math.max(0, webGlRenderLoopRefCount - 1);
  setStage3dRenderLoopActive(webGlRenderLoopRefCount > 0);
}

export function isStage3dRenderLoopActive(): boolean {
  return stage3dLoopActive;
}

export function recordFlowSimulationTick(durationMs: number, atMs = performance.now()): void {
  if (!Number.isFinite(durationMs) || durationMs < 0) {
    return;
  }
  pushSample(flowTickWindow, atMs, durationMs);
}

export function recordWebGlRenderFrame(durationMs: number, atMs = performance.now()): void {
  if (!Number.isFinite(durationMs) || durationMs < 0) {
    return;
  }
  pushSample(render3dWindow, atMs, durationMs);
}

export type SensorStudioLivePerformanceStats = {
  updatedAtMs: number;
  documentHidden: boolean;
  flowPaneVisible: boolean;
  dashboardPaneVisible: boolean;
  stagePaneVisible: boolean;
  flowSceneLoopActive: boolean;
  stage3dLoopActive: boolean;
  flowTickFps: number;
  flowTickAvgMs: number | null;
  render3dFps: number;
  render3dAvgMs: number | null;
  render3dActive: boolean;
  nodeCount: number;
  edgeCount: number;
  flowHeavy: boolean;
  /** Why the flow sim is flagged heavy — tick eval slow vs effective rate below cap. */
  flowHeavyReason: "slow-tick" | "below-cap" | null;
  /** Effective flow tick cap (includes canvas-interaction throttle). */
  flowTickEffectiveCap: number;
  flowInteractionEditing: boolean;
  flowInteractionPaused: boolean;
  flowInteractionActiveKind: FlowInteractionActiveKind;
};

export function buildLivePerformanceStats(args: {
  flowSimulationMaxFps: SensorStudioMaxFpsPreset;
  flowTickEffectiveCap?: number;
  flowInteractionEditing?: boolean;
  flowInteractionPaused?: boolean;
  flowInteractionActiveKind?: FlowInteractionActiveKind;
  nowMs?: number;
  documentHidden: boolean;
  flowPaneVisible: boolean;
  dashboardPaneVisible: boolean;
  stagePaneVisible: boolean;
  nodeCount: number;
  edgeCount: number;
}): SensorStudioLivePerformanceStats {
  const nowMs = args.nowMs ?? performance.now();
  const flowTickFps = readWindowFps(flowTickWindow, nowMs);
  const flowTickAvgMs = readWindowAvgMs(flowTickWindow, nowMs);
  const render3dFps = readWindowFps(render3dWindow, nowMs);
  const render3dAvgMs = readWindowAvgMs(render3dWindow, nowMs);
  const render3dActive = render3dFps > 0;
  const flowTickEffectiveCap =
    args.flowTickEffectiveCap ?? args.flowSimulationMaxFps;
  const flowInteractionEditing = args.flowInteractionEditing === true;
  const flowInteractionPaused = args.flowInteractionPaused === true;
  const flowInteractionActiveKind = args.flowInteractionActiveKind ?? null;

  const slowTick = flowTickAvgMs != null && flowTickAvgMs >= FLOW_HEAVY_TICK_MS;
  const belowCap =
    flowTickEffectiveCap > 0 &&
    flowTickFps < flowTickEffectiveCap * FPS_UNDER_CAP_RATIO;
  const flowHeavy = flowTickAvgMs != null && (slowTick || belowCap);
  const flowHeavyReason: SensorStudioLivePerformanceStats["flowHeavyReason"] =
    flowHeavy
      ? slowTick
        ? "slow-tick"
        : "below-cap"
      : null;

  return {
    updatedAtMs: nowMs,
    documentHidden: args.documentHidden,
    flowPaneVisible: args.flowPaneVisible,
    dashboardPaneVisible: args.dashboardPaneVisible,
    stagePaneVisible: args.stagePaneVisible,
    flowSceneLoopActive,
    stage3dLoopActive,
    flowTickFps,
    flowTickAvgMs,
    render3dFps,
    render3dAvgMs,
    render3dActive,
    nodeCount: args.nodeCount,
    edgeCount: args.edgeCount,
    flowHeavy,
    flowHeavyReason,
    flowTickEffectiveCap,
    flowInteractionEditing,
    flowInteractionPaused,
    flowInteractionActiveKind,
  };
}

/** @internal test helper */
export function resetPerformanceTelemetryForTests(): void {
  flowTickWindow.timesMs.length = 0;
  flowTickWindow.durationsMs.length = 0;
  render3dWindow.timesMs.length = 0;
  render3dWindow.durationsMs.length = 0;
  flowSceneLoopActive = false;
  stage3dLoopActive = false;
  webGlRenderLoopRefCount = 0;
}
