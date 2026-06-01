export type AnimationLabTimelineSnapshot = {
  timeS: number;
  version: number;
};

const EMPTY: AnimationLabTimelineSnapshot = { timeS: 0, version: 0 };

let snapshot: AnimationLabTimelineSnapshot = EMPTY;
const listeners = new Set<() => void>();

export function getAnimationLabTimelineSnapshot(): AnimationLabTimelineSnapshot {
  return snapshot;
}

export function subscribeAnimationLabTimeline(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Called from R3F `useFrame` — drives inspector playhead while transport runs. */
export function publishAnimationLabTimelineTimeS(timeS: number): void {
  const next = Number.isFinite(timeS) ? Math.max(0, timeS) : 0;
  if (Math.abs(snapshot.timeS - next) < 1 / 120 && snapshot.version > 0) {
    return;
  }
  snapshot = { timeS: next, version: snapshot.version + 1 };
  for (const listener of listeners) {
    listener();
  }
}

export function resetAnimationLabTimelineStore(): void {
  snapshot = EMPTY;
  for (const listener of listeners) {
    listener();
  }
}
