/** Scene graph clock sampled once per `tickSimulation` (node-animator parity). */
export const FLOW_SCENE_FPS = 30;

let lastTickMs = 0;
let snapshot = {
  seconds: 0,
  deltaSec: 1 / 60,
  fps: 60,
};

export function advanceFlowClock(nowMs = performance.now()): typeof snapshot {
  const deltaSec =
    lastTickMs === 0 ? 1 / 60 : Math.min(0.5, Math.max(1e-6, (nowMs - lastTickMs) / 1000));
  lastTickMs = nowMs;
  snapshot = {
    seconds: nowMs / 1000,
    deltaSec,
    fps: 1 / deltaSec,
  };
  return snapshot;
}

export function readFlowClockSnapshot(): typeof snapshot {
  return snapshot;
}

export function flowSecondsToFrames(seconds: number): number {
  return seconds * FLOW_SCENE_FPS;
}
